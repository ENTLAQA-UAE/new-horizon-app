// @ts-nocheck
// Note: This file uses tables that don't exist (organization_email_config)
/**
 * Domain Verification API
 *
 * GET - Get required DNS records and current verification status
 * POST - Set domain and generate verification records
 * PUT - Verify domain DNS records
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserAuthInfo } from '@/lib/auth'
import {
  getRequiredDNSRecords,
  verifyDomain,
  saveDomainRecords,
  updateVerificationStatus,
  getDomainVerificationStatus,
  generateVerificationToken,
} from '@/lib/email/domain-verification'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authInfo = await getUserAuthInfo(supabase, user.id)
    if (!authInfo?.orgId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Check if user is org admin
    if (authInfo.role !== 'org_admin' && authInfo.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const status = await getDomainVerificationStatus(supabase, authInfo.orgId)
    return NextResponse.json(status)
  } catch (err) {
    console.error('Get domain status error:', err)
    return NextResponse.json(
      { error: 'Failed to get domain status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authInfo = await getUserAuthInfo(supabase, user.id)
    if (!authInfo?.orgId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    if (authInfo.role !== 'org_admin' && authInfo.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { domain } = body

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
    }

    // Get email config to determine provider
    const { data: config } = await supabase
      .from('organization_email_config')
      .select('email_provider')
      .eq('org_id', authInfo.orgId)
      .single()

    const provider = (config?.email_provider as 'resend' | 'sendgrid' | 'mailgun' | 'smtp') || 'resend'

    // Generate required DNS records
    const records = getRequiredDNSRecords(domain, authInfo.orgId, provider)

    // Save domain to config
    await supabase
      .from('organization_email_config')
      .update({
        domain,
        domain_verified: false,
        domain_verification_token: generateVerificationToken(authInfo.orgId, domain),
      })
      .eq('org_id', authInfo.orgId)

    // Save DNS records
    await saveDomainRecords(supabase, authInfo.orgId, domain, records)

    return NextResponse.json({
      domain,
      records: records.map((r) => ({
        type: r.type,
        name: r.name,
        value: r.value,
      })),
      message: 'Add these DNS records to your domain, then verify.',
    })
  } catch (err) {
    console.error('Set domain error:', err)
    return NextResponse.json(
      { error: 'Failed to set domain' },
      { status: 500 }
    )
  }
}

export async function PUT() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authInfo = await getUserAuthInfo(supabase, user.id)
    if (!authInfo?.orgId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    if (authInfo.role !== 'org_admin' && authInfo.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current domain from config
    const { data: config } = await supabase
      .from('organization_email_config')
      .select('domain, email_provider')
      .eq('org_id', authInfo.orgId)
      .single()

    if (!config?.domain) {
      return NextResponse.json({ error: 'No domain configured' }, { status: 400 })
    }

    const provider = (config.email_provider as 'resend' | 'sendgrid' | 'mailgun' | 'smtp') || 'resend'

    // Verify domain
    const result = await verifyDomain(config.domain, authInfo.orgId, provider)

    // Update verification status
    await updateVerificationStatus(supabase, authInfo.orgId, config.domain, result)

    return NextResponse.json({
      domain: result.domain,
      verified: result.verified,
      records: result.records,
    })
  } catch (err) {
    console.error('Verify domain error:', err)
    return NextResponse.json(
      { error: 'Failed to verify domain' },
      { status: 500 }
    )
  }
}
