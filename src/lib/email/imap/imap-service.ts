/**
 * IMAP Email Sync Service
 *
 * Handles syncing emails from organization's IMAP server
 * and matching them to candidates
 */

import Imap from 'imap-simple'
import { simpleParser, ParsedMail } from 'mailparser'
import { SupabaseClient } from '@supabase/supabase-js'
import { decryptCredentials } from '@/lib/encryption'

export interface IMAPConfig {
  host: string
  port: number
  username: string
  password: string
  encryption: 'ssl' | 'tls' | 'none'
  mailbox: string
}

export interface SyncedEmail {
  messageId: string
  imapUid: number
  fromEmail: string
  fromName?: string
  toEmail: string
  ccEmails?: string[]
  subject?: string
  bodyText?: string
  bodyHtml?: string
  inReplyTo?: string
  emailDate: Date
  attachments: Array<{
    filename: string
    contentType: string
    size: number
  }>
}

export interface SyncResult {
  success: boolean
  syncedCount: number
  matchedCount: number
  errors: string[]
  lastUid: number
}

/**
 * Get IMAP configuration for an organization
 */
export async function getOrgIMAPConfig(
  supabase: SupabaseClient,
  orgId: string
): Promise<IMAPConfig | null> {
  const { data: config, error } = await supabase
    .from('organization_email_config')
    .select('*')
    .eq('org_id', orgId)
    .eq('imap_enabled', true)
    .single()

  if (error || !config || !config.imap_host || !config.imap_password_encrypted) {
    return null
  }

  try {
    const credentials = decryptCredentials(config.imap_password_encrypted)

    return {
      host: config.imap_host,
      port: config.imap_port || 993,
      username: config.imap_username,
      password: credentials.password,
      encryption: config.imap_encryption || 'ssl',
      mailbox: config.imap_mailbox || 'INBOX',
    }
  } catch (err) {
    console.error('Error decrypting IMAP credentials:', err)
    return null
  }
}

/**
 * Create IMAP connection
 */
async function createConnection(config: IMAPConfig): Promise<Imap.ImapSimple> {
  const imapConfig: Imap.ImapSimpleOptions = {
    imap: {
      user: config.username,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.encryption === 'ssl' || config.encryption === 'tls',
      tlsOptions: {
        rejectUnauthorized: false,
      },
      authTimeout: 30000,
    },
  }

  return await Imap.connect(imapConfig)
}

/**
 * Parse email from IMAP message
 */
async function parseEmail(message: Imap.Message): Promise<SyncedEmail | null> {
  try {
    const all = message.parts.find((part) => part.which === '')
    if (!all) return null

    const parsed: ParsedMail = await simpleParser(all.body)

    const fromAddress = parsed.from?.value?.[0]
    const toAddress = parsed.to
      ? Array.isArray(parsed.to)
        ? parsed.to[0]?.value?.[0]
        : parsed.to.value?.[0]
      : undefined

    if (!fromAddress?.address || !toAddress?.address) return null

    const ccEmails = parsed.cc
      ? Array.isArray(parsed.cc)
        ? parsed.cc.flatMap((c) => c.value.map((v) => v.address).filter(Boolean) as string[])
        : parsed.cc.value.map((v) => v.address).filter(Boolean) as string[]
      : undefined

    const attachments = parsed.attachments?.map((att) => ({
      filename: att.filename || 'attachment',
      contentType: att.contentType,
      size: att.size,
    })) || []

    return {
      messageId: parsed.messageId || `${Date.now()}-${Math.random()}`,
      imapUid: message.attributes.uid,
      fromEmail: fromAddress.address,
      fromName: fromAddress.name,
      toEmail: toAddress.address,
      ccEmails,
      subject: parsed.subject,
      bodyText: parsed.text,
      bodyHtml: parsed.html || undefined,
      inReplyTo: parsed.inReplyTo,
      emailDate: parsed.date || new Date(),
      attachments,
    }
  } catch (err) {
    console.error('Error parsing email:', err)
    return null
  }
}

/**
 * Match email to candidate by email address
 */
async function matchToCandidate(
  supabase: SupabaseClient,
  orgId: string,
  email: string
): Promise<{ candidateId?: string; applicationId?: string; confidence: number }> {
  // Try exact match on candidate email
  const { data: candidate } = await supabase
    .from('candidates')
    .select('id')
    .eq('org_id', orgId)
    .ilike('email', email)
    .single()

  if (candidate) {
    // Check if there's an active application
    const { data: application } = await supabase
      .from('applications')
      .select('id')
      .eq('candidate_id', candidate.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return {
      candidateId: candidate.id,
      applicationId: application?.id,
      confidence: 1.0,
    }
  }

  return { confidence: 0 }
}

/**
 * Generate thread ID from email headers
 */
function generateThreadId(email: SyncedEmail): string {
  // Use In-Reply-To header if available
  if (email.inReplyTo) {
    return email.inReplyTo.replace(/[<>]/g, '')
  }
  // Otherwise use Message-ID
  return email.messageId.replace(/[<>]/g, '')
}

/**
 * Sync emails from IMAP for an organization
 */
export async function syncOrgEmails(
  supabase: SupabaseClient,
  orgId: string,
  options?: {
    limit?: number
    sinceUid?: number
  }
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    syncedCount: 0,
    matchedCount: 0,
    errors: [],
    lastUid: options?.sinceUid || 0,
  }

  const config = await getOrgIMAPConfig(supabase, orgId)
  if (!config) {
    result.errors.push('IMAP not configured or not enabled')
    return result
  }

  let connection: Imap.ImapSimple | null = null

  try {
    connection = await createConnection(config)
    await connection.openBox(config.mailbox)

    // Build search criteria
    const searchCriteria: string[][] = [['ALL']]
    if (options?.sinceUid) {
      searchCriteria.push(['UID', `${options.sinceUid}:*`])
    }

    // Fetch messages
    const fetchOptions: Imap.FetchOptions = {
      bodies: [''],
      markSeen: false,
    }

    const messages = await connection.search(searchCriteria, fetchOptions)

    // Limit if specified
    const messagesToProcess = options?.limit
      ? messages.slice(0, options.limit)
      : messages

    for (const message of messagesToProcess) {
      try {
        const parsed = await parseEmail(message)
        if (!parsed) continue

        // Skip if already synced
        const { data: existing } = await supabase
          .from('synced_emails')
          .select('id')
          .eq('org_id', orgId)
          .eq('message_id', parsed.messageId)
          .single()

        if (existing) {
          result.lastUid = Math.max(result.lastUid, parsed.imapUid)
          continue
        }

        // Match to candidate
        const match = await matchToCandidate(supabase, orgId, parsed.fromEmail)

        // Determine direction (inbound = from candidate, outbound = to candidate)
        const direction = match.candidateId ? 'inbound' : 'outbound'

        // If outbound, try to match the recipient
        let candidateId = match.candidateId
        let applicationId = match.applicationId
        let confidence = match.confidence

        if (!candidateId && direction === 'outbound') {
          const toMatch = await matchToCandidate(supabase, orgId, parsed.toEmail)
          candidateId = toMatch.candidateId
          applicationId = toMatch.applicationId
          confidence = toMatch.confidence
        }

        // Generate thread ID
        const threadId = generateThreadId(parsed)

        // Store synced email
        const { error: insertError } = await supabase.from('synced_emails').insert({
          org_id: orgId,
          message_id: parsed.messageId,
          imap_uid: parsed.imapUid,
          from_email: parsed.fromEmail,
          from_name: parsed.fromName,
          to_email: parsed.toEmail,
          cc_emails: parsed.ccEmails,
          subject: parsed.subject,
          body_text: parsed.bodyText,
          body_html: parsed.bodyHtml,
          attachments: parsed.attachments,
          in_reply_to: parsed.inReplyTo,
          thread_id: threadId,
          candidate_id: candidateId,
          application_id: applicationId,
          matched_at: candidateId ? new Date().toISOString() : null,
          match_confidence: confidence,
          direction,
          email_date: parsed.emailDate.toISOString(),
        })

        if (insertError) {
          result.errors.push(`Failed to store email ${parsed.messageId}: ${insertError.message}`)
        } else {
          result.syncedCount++
          if (candidateId) result.matchedCount++
        }

        result.lastUid = Math.max(result.lastUid, parsed.imapUid)
      } catch (err) {
        result.errors.push(
          `Error processing message: ${err instanceof Error ? err.message : 'Unknown error'}`
        )
      }
    }

    // Update last sync info
    await supabase
      .from('organization_email_config')
      .update({
        imap_last_sync_at: new Date().toISOString(),
        imap_last_uid: result.lastUid,
      })
      .eq('org_id', orgId)

    result.success = true
  } catch (err) {
    result.errors.push(
      `IMAP connection error: ${err instanceof Error ? err.message : 'Unknown error'}`
    )
  } finally {
    if (connection) {
      try {
        connection.end()
      } catch {
        // Ignore close errors
      }
    }
  }

  return result
}

/**
 * Test IMAP connection
 */
export async function testIMAPConnection(
  config: IMAPConfig
): Promise<{ success: boolean; error?: string; mailboxes?: string[] }> {
  let connection: Imap.ImapSimple | null = null

  try {
    connection = await createConnection(config)
    const boxes = await connection.getBoxes()

    // Extract mailbox names
    const mailboxes = Object.keys(boxes)

    return { success: true, mailboxes }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Connection failed',
    }
  } finally {
    if (connection) {
      try {
        connection.end()
      } catch {
        // Ignore close errors
      }
    }
  }
}

/**
 * Get email thread for a candidate
 */
export async function getCandidateEmailThread(
  supabase: SupabaseClient,
  orgId: string,
  candidateId: string
): Promise<SyncedEmail[]> {
  const { data: emails, error } = await supabase
    .from('synced_emails')
    .select('*')
    .eq('org_id', orgId)
    .eq('candidate_id', candidateId)
    .order('email_date', { ascending: true })

  if (error || !emails) return []

  return emails.map((e) => ({
    messageId: e.message_id,
    imapUid: e.imap_uid,
    fromEmail: e.from_email,
    fromName: e.from_name,
    toEmail: e.to_email,
    ccEmails: e.cc_emails,
    subject: e.subject,
    bodyText: e.body_text,
    bodyHtml: e.body_html,
    inReplyTo: e.in_reply_to,
    emailDate: new Date(e.email_date),
    attachments: e.attachments || [],
  }))
}

/**
 * Manually match an email to a candidate
 */
export async function matchEmailToCandidate(
  supabase: SupabaseClient,
  emailId: string,
  candidateId: string,
  applicationId?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('synced_emails')
    .update({
      candidate_id: candidateId,
      application_id: applicationId,
      matched_at: new Date().toISOString(),
      match_confidence: 1.0, // Manual match = 100% confidence
    })
    .eq('id', emailId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
