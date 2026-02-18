/**
 * Email Config Transform Layer
 *
 * Single source of truth for transforming DB rows (snake_case)
 * into typed camelCase interfaces used by all components.
 * Both SSR pages and API routes use these transforms.
 */

export type EmailProvider = "resend" | "smtp" | "sendgrid" | "mailgun"

export interface EmailConfigView {
  id?: string
  orgId: string
  emailProvider: EmailProvider
  apiKeyEncrypted?: string
  sendgridApiKeyEncrypted?: string
  mailgunApiKeyEncrypted?: string
  fromEmail: string
  fromName: string
  replyToEmail?: string
  smtpHost?: string
  smtpPort?: number
  smtpUsername?: string
  smtpPasswordEncrypted?: string
  smtpEncryption?: string
  mailgunDomain?: string
  mailgunRegion?: string
  imapEnabled?: boolean
  imapHost?: string
  imapPort?: number
  imapUsername?: string
  imapEncryption?: string
  imapMailbox?: string
  trackOpens?: boolean
  trackClicks?: boolean
  domain?: string
  domainVerified?: boolean
  spfVerified?: boolean
  dkimVerified?: boolean
  dmarcVerified?: boolean
  isEnabled?: boolean
  isVerified?: boolean
  isConfigured?: boolean
}

export interface DomainRecordView {
  id: string
  recordType: string
  recordName: string
  recordValue: string
  isVerified: boolean
  lastCheckedAt?: string
}

/**
 * Transform a raw DB row from organization_email_config into a typed EmailConfigView.
 * Used by both SSR page.tsx and API routes to ensure identical output.
 */
export function toEmailConfigView(row: Record<string, unknown>): EmailConfigView {
  return {
    id: row.id as string | undefined,
    orgId: (row.org_id as string) || "",
    emailProvider: (row.email_provider as EmailProvider) || "resend",
    apiKeyEncrypted: row.api_key_encrypted as string | undefined,
    sendgridApiKeyEncrypted: row.sendgrid_api_key_encrypted as string | undefined,
    mailgunApiKeyEncrypted: row.mailgun_api_key_encrypted as string | undefined,
    fromEmail: (row.from_email as string) || "",
    fromName: (row.from_name as string) || "",
    replyToEmail: row.reply_to_email as string | undefined,
    smtpHost: row.smtp_host as string | undefined,
    smtpPort: row.smtp_port as number | undefined,
    smtpUsername: row.smtp_username as string | undefined,
    smtpPasswordEncrypted: row.smtp_password_encrypted as string | undefined,
    smtpEncryption: row.smtp_encryption as string | undefined,
    mailgunDomain: row.mailgun_domain as string | undefined,
    mailgunRegion: row.mailgun_region as string | undefined,
    imapEnabled: row.imap_enabled as boolean | undefined,
    imapHost: row.imap_host as string | undefined,
    imapPort: row.imap_port as number | undefined,
    imapUsername: row.imap_username as string | undefined,
    imapEncryption: row.imap_encryption as string | undefined,
    imapMailbox: row.imap_mailbox as string | undefined,
    trackOpens: row.track_opens as boolean | undefined,
    trackClicks: row.track_clicks as boolean | undefined,
    domain: row.domain as string | undefined,
    domainVerified: row.domain_verified as boolean | undefined,
    spfVerified: row.spf_verified as boolean | undefined,
    dkimVerified: row.dkim_verified as boolean | undefined,
    dmarcVerified: row.dmarc_verified as boolean | undefined,
    isEnabled: row.is_enabled as boolean | undefined,
    isVerified: row.is_verified as boolean | undefined,
    isConfigured: row.is_configured as boolean | undefined,
  }
}

/**
 * Transform a raw DB row from email_domain_records into a typed DomainRecordView.
 */
export function toDomainRecordView(row: Record<string, unknown>): DomainRecordView {
  return {
    id: (row.id as string) || "",
    recordType: (row.record_type as string) || "",
    recordName: (row.record_name as string) || "",
    recordValue: (row.record_value as string) || "",
    isVerified: (row.is_verified as boolean) ?? false,
    lastCheckedAt: row.last_checked_at as string | undefined,
  }
}
