/**
 * Email Provider Types and Interfaces
 */

export type EmailProviderType = 'resend' | 'smtp' | 'sendgrid' | 'mailgun'

export interface EmailAddress {
  email: string
  name?: string
}

export interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType?: string
  cid?: string // Content-ID for inline attachments
}

export interface SendEmailOptions {
  to: EmailAddress | EmailAddress[] | string | string[]
  subject: string
  html?: string
  text?: string
  from?: EmailAddress | string
  replyTo?: string
  cc?: string[]
  bcc?: string[]
  attachments?: EmailAttachment[]
  tags?: { name: string; value: string }[]
  headers?: Record<string, string>
  trackOpens?: boolean
  trackClicks?: boolean
  // For tracking
  metadata?: Record<string, string>
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
  errorCode?: string
  provider: EmailProviderType
}

export interface EmailProviderConfig {
  provider: EmailProviderType
  fromEmail: string
  fromName: string
  replyTo?: string
  trackOpens?: boolean
  trackClicks?: boolean

  // Resend
  resendApiKey?: string

  // SMTP
  smtpHost?: string
  smtpPort?: number
  smtpUsername?: string
  smtpPassword?: string
  smtpEncryption?: 'tls' | 'ssl' | 'none'

  // SendGrid
  sendgridApiKey?: string

  // Mailgun
  mailgunApiKey?: string
  mailgunDomain?: string
  mailgunRegion?: 'us' | 'eu'
}

export interface EmailProvider {
  /**
   * Provider name
   */
  readonly name: EmailProviderType

  /**
   * Send a single email
   */
  send(options: SendEmailOptions): Promise<SendEmailResult>

  /**
   * Send multiple emails (bulk send)
   */
  sendBulk?(options: SendEmailOptions[]): Promise<SendEmailResult[]>

  /**
   * Verify provider configuration/credentials
   */
  verify(): Promise<{ success: boolean; error?: string }>

  /**
   * Get provider-specific tracking pixel HTML
   */
  getTrackingPixel?(trackingToken: string): string

  /**
   * Wrap links for click tracking
   */
  wrapLinksForTracking?(html: string, trackingToken: string): string
}

export interface DomainVerificationRecord {
  type: 'DKIM' | 'SPF' | 'DMARC' | 'MX' | 'TXT'
  name: string
  value: string
  ttl?: number
  priority?: number // For MX records
}

export interface DomainVerificationResult {
  domain: string
  verified: boolean
  records: {
    type: string
    name: string
    expected: string
    actual?: string
    verified: boolean
    error?: string
  }[]
}
