/**
 * Domain Verification Service
 *
 * Handles DNS record verification for email domains
 * Supports DKIM, SPF, and DMARC verification
 */

import { promises as dns } from 'dns'
import { SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export interface DomainRecord {
  type: 'DKIM' | 'SPF' | 'DMARC' | 'MX' | 'TXT'
  name: string
  value: string
  priority?: number
}

export interface VerificationResult {
  domain: string
  verified: boolean
  records: Array<{
    type: string
    name: string
    expected: string
    actual?: string
    verified: boolean
    error?: string
  }>
}

/**
 * Generate a unique DKIM selector for an organization
 */
export function generateDKIMSelector(orgId: string): string {
  const hash = crypto.createHash('md5').update(orgId).digest('hex').slice(0, 8)
  return `kawadir-${hash}`
}

/**
 * Generate verification token for domain ownership
 */
export function generateVerificationToken(orgId: string, domain: string): string {
  const data = `${orgId}-${domain}-${process.env.ENCRYPTION_KEY || 'secret'}`
  return crypto.createHash('sha256').update(data).digest('hex').slice(0, 32)
}

/**
 * Get required DNS records for email verification
 */
export function getRequiredDNSRecords(
  domain: string,
  orgId: string,
  provider: 'resend' | 'sendgrid' | 'mailgun' | 'smtp' = 'resend'
): DomainRecord[] {
  const records: DomainRecord[] = []
  const selector = generateDKIMSelector(orgId)
  const verificationToken = generateVerificationToken(orgId, domain)

  // Domain verification TXT record
  records.push({
    type: 'TXT',
    name: `_kawadir-verify.${domain}`,
    value: `kawadir-verification=${verificationToken}`,
  })

  // SPF record
  let spfInclude = 'include:_spf.resend.com'
  if (provider === 'sendgrid') {
    spfInclude = 'include:sendgrid.net'
  } else if (provider === 'mailgun') {
    spfInclude = 'include:mailgun.org'
  }

  records.push({
    type: 'SPF',
    name: domain,
    value: `v=spf1 ${spfInclude} ~all`,
  })

  // DKIM record (provider-specific)
  if (provider === 'resend') {
    records.push({
      type: 'DKIM',
      name: `${selector}._domainkey.${domain}`,
      value: `v=DKIM1; k=rsa; p=<public_key_from_resend>`,
    })
  } else if (provider === 'sendgrid') {
    records.push({
      type: 'DKIM',
      name: `s1._domainkey.${domain}`,
      value: `<cname_from_sendgrid>`,
    })
    records.push({
      type: 'DKIM',
      name: `s2._domainkey.${domain}`,
      value: `<cname_from_sendgrid>`,
    })
  } else if (provider === 'mailgun') {
    records.push({
      type: 'DKIM',
      name: `smtp._domainkey.${domain}`,
      value: `<dkim_value_from_mailgun>`,
    })
  }

  // DMARC record
  records.push({
    type: 'DMARC',
    name: `_dmarc.${domain}`,
    value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}`,
  })

  return records
}

/**
 * Verify a specific DNS record
 */
async function verifyDNSRecord(
  recordName: string,
  expectedValue: string,
  recordType: 'TXT' | 'CNAME' | 'MX'
): Promise<{ verified: boolean; actual?: string; error?: string }> {
  try {
    let records: string[] = []

    switch (recordType) {
      case 'TXT':
        const txtRecords = await dns.resolveTxt(recordName)
        records = txtRecords.map((r) => r.join(''))
        break
      case 'CNAME':
        const cnameRecords = await dns.resolveCname(recordName)
        records = cnameRecords
        break
      case 'MX':
        const mxRecords = await dns.resolveMx(recordName)
        records = mxRecords.map((r) => r.exchange)
        break
    }

    // Check if any record contains the expected value
    const matchingRecord = records.find(
      (r) =>
        r.toLowerCase().includes(expectedValue.toLowerCase()) ||
        expectedValue.toLowerCase().includes(r.toLowerCase())
    )

    if (matchingRecord) {
      return { verified: true, actual: matchingRecord }
    }

    return {
      verified: false,
      actual: records.length > 0 ? records[0] : undefined,
      error: records.length === 0 ? 'No records found' : 'Value mismatch',
    }
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string }
    if (error.code === 'ENODATA' || error.code === 'ENOTFOUND') {
      return { verified: false, error: 'Record not found' }
    }
    return { verified: false, error: error.message || 'DNS lookup failed' }
  }
}

/**
 * Verify domain verification token
 */
async function verifyDomainOwnership(
  domain: string,
  expectedToken: string
): Promise<{ verified: boolean; error?: string }> {
  try {
    const recordName = `_kawadir-verify.${domain}`
    const txtRecords = await dns.resolveTxt(recordName)
    const records = txtRecords.map((r) => r.join(''))

    const expectedValue = `kawadir-verification=${expectedToken}`
    const found = records.some((r) => r.includes(expectedValue))

    if (found) {
      return { verified: true }
    }

    return {
      verified: false,
      error: 'Verification token not found in DNS records',
    }
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string }
    if (error.code === 'ENODATA' || error.code === 'ENOTFOUND') {
      return { verified: false, error: 'Verification record not found' }
    }
    return { verified: false, error: error.message || 'DNS lookup failed' }
  }
}

/**
 * Verify SPF record
 */
async function verifySPF(
  domain: string,
  provider: string
): Promise<{ verified: boolean; actual?: string; error?: string }> {
  try {
    const txtRecords = await dns.resolveTxt(domain)
    const records = txtRecords.map((r) => r.join(''))

    // Find SPF record
    const spfRecord = records.find((r) => r.startsWith('v=spf1'))

    if (!spfRecord) {
      return { verified: false, error: 'No SPF record found' }
    }

    // Check for provider include
    let includeValue = '_spf.resend.com'
    if (provider === 'sendgrid') {
      includeValue = 'sendgrid.net'
    } else if (provider === 'mailgun') {
      includeValue = 'mailgun.org'
    }

    if (spfRecord.includes(includeValue)) {
      return { verified: true, actual: spfRecord }
    }

    return {
      verified: false,
      actual: spfRecord,
      error: `SPF record doesn't include ${includeValue}`,
    }
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string }
    if (error.code === 'ENODATA' || error.code === 'ENOTFOUND') {
      return { verified: false, error: 'No SPF record found' }
    }
    return { verified: false, error: error.message || 'DNS lookup failed' }
  }
}

/**
 * Verify DMARC record
 */
async function verifyDMARC(
  domain: string
): Promise<{ verified: boolean; actual?: string; error?: string }> {
  try {
    const recordName = `_dmarc.${domain}`
    const txtRecords = await dns.resolveTxt(recordName)
    const records = txtRecords.map((r) => r.join(''))

    const dmarcRecord = records.find((r) => r.startsWith('v=DMARC1'))

    if (dmarcRecord) {
      return { verified: true, actual: dmarcRecord }
    }

    return { verified: false, error: 'DMARC record not found or invalid' }
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string }
    if (error.code === 'ENODATA' || error.code === 'ENOTFOUND') {
      return { verified: false, error: 'DMARC record not found' }
    }
    return { verified: false, error: error.message || 'DNS lookup failed' }
  }
}

/**
 * Full domain verification
 */
export async function verifyDomain(
  domain: string,
  orgId: string,
  provider: 'resend' | 'sendgrid' | 'mailgun' | 'smtp' = 'resend'
): Promise<VerificationResult> {
  const result: VerificationResult = {
    domain,
    verified: false,
    records: [],
  }

  // Verify domain ownership
  const verificationToken = generateVerificationToken(orgId, domain)
  const ownershipResult = await verifyDomainOwnership(domain, verificationToken)
  result.records.push({
    type: 'TXT',
    name: `_kawadir-verify.${domain}`,
    expected: `kawadir-verification=${verificationToken}`,
    actual: ownershipResult.verified ? `kawadir-verification=${verificationToken}` : undefined,
    verified: ownershipResult.verified,
    error: ownershipResult.error,
  })

  // Verify SPF
  const spfResult = await verifySPF(domain, provider)
  result.records.push({
    type: 'SPF',
    name: domain,
    expected: `v=spf1 include:... ~all`,
    actual: spfResult.actual,
    verified: spfResult.verified,
    error: spfResult.error,
  })

  // Verify DMARC
  const dmarcResult = await verifyDMARC(domain)
  result.records.push({
    type: 'DMARC',
    name: `_dmarc.${domain}`,
    expected: `v=DMARC1; p=...`,
    actual: dmarcResult.actual,
    verified: dmarcResult.verified,
    error: dmarcResult.error,
  })

  // Domain is verified if ownership and SPF are verified
  result.verified = ownershipResult.verified && spfResult.verified

  return result
}

/**
 * Save domain verification records to database
 */
export async function saveDomainRecords(
  supabase: SupabaseClient,
  orgId: string,
  domain: string,
  records: DomainRecord[]
): Promise<void> {
  // Delete existing records for this domain
  await supabase
    .from('email_domain_records')
    .delete()
    .eq('org_id', orgId)
    .eq('domain', domain)

  // Insert new records
  const recordsToInsert = records.map((record) => ({
    org_id: orgId,
    domain,
    record_type: record.type,
    record_name: record.name,
    record_value: record.value,
    is_auto_generated: true,
  }))

  await supabase.from('email_domain_records').insert(recordsToInsert)
}

/**
 * Update verification status in database
 */
export async function updateVerificationStatus(
  supabase: SupabaseClient,
  orgId: string,
  domain: string,
  result: VerificationResult
): Promise<void> {
  // Update email config
  const spfVerified = result.records.find((r) => r.type === 'SPF')?.verified || false
  const dmarcVerified = result.records.find((r) => r.type === 'DMARC')?.verified || false

  await supabase
    .from('organization_email_config')
    .update({
      domain_verified: result.verified,
      domain_verified_at: result.verified ? new Date().toISOString() : null,
      spf_verified: spfVerified,
      dmarc_verified: dmarcVerified,
    })
    .eq('org_id', orgId)

  // Update individual record statuses
  for (const record of result.records) {
    await supabase
      .from('email_domain_records')
      .update({
        is_verified: record.verified,
        last_checked_at: new Date().toISOString(),
        last_verified_at: record.verified ? new Date().toISOString() : null,
        verification_error: record.error,
      })
      .eq('org_id', orgId)
      .eq('domain', domain)
      .eq('record_type', record.type)
  }
}

/**
 * Get domain verification status
 */
export async function getDomainVerificationStatus(
  supabase: SupabaseClient,
  orgId: string
): Promise<{
  domain?: string
  verified: boolean
  records: Array<{
    type: string
    name: string
    value: string
    verified: boolean
    lastChecked?: string
  }>
}> {
  const { data: config } = await supabase
    .from('organization_email_config')
    .select('domain, domain_verified')
    .eq('org_id', orgId)
    .single()

  if (!config?.domain) {
    return { verified: false, records: [] }
  }

  const { data: records } = await supabase
    .from('email_domain_records')
    .select('*')
    .eq('org_id', orgId)
    .eq('domain', config.domain)

  return {
    domain: config.domain,
    verified: config.domain_verified || false,
    records:
      records?.map((r) => ({
        type: r.record_type,
        name: r.record_name,
        value: r.record_value,
        verified: r.is_verified || false,
        lastChecked: r.last_checked_at,
      })) || [],
  }
}
