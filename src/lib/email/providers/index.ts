/**
 * Email Provider Factory
 *
 * Creates the appropriate email provider based on organization configuration
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { decryptCredentials } from '@/lib/encryption'
import { ResendProvider } from './resend-provider'
import { SMTPProvider } from './smtp-provider'
import { SendGridProvider } from './sendgrid-provider'
import { MailgunProvider } from './mailgun-provider'
import type {
  EmailProvider,
  EmailProviderConfig,
  EmailProviderType,
  SendEmailOptions,
  SendEmailResult,
} from './types'

export * from './types'
export { ResendProvider } from './resend-provider'
export { SMTPProvider } from './smtp-provider'
export { SendGridProvider } from './sendgrid-provider'
export { MailgunProvider } from './mailgun-provider'

/**
 * Create an email provider instance from config
 */
export function createEmailProvider(config: EmailProviderConfig): EmailProvider {
  switch (config.provider) {
    case 'resend':
      return new ResendProvider(config)
    case 'smtp':
      return new SMTPProvider(config)
    case 'sendgrid':
      return new SendGridProvider(config)
    case 'mailgun':
      return new MailgunProvider(config)
    default:
      throw new Error(`Unknown email provider: ${config.provider}`)
  }
}

/**
 * Get email provider for an organization
 */
export async function getEmailProvider(
  supabase: SupabaseClient,
  orgId: string
): Promise<EmailProvider | null> {
  const { data: config, error } = await supabase
    .from('organization_email_config')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_enabled', true)
    .single()

  if (error || !config) {
    console.error('Email config not found or not enabled for org:', orgId)
    return null
  }

  try {
    const providerConfig = await buildProviderConfig(config)
    if (!providerConfig) return null

    return createEmailProvider(providerConfig)
  } catch (err) {
    console.error('Error creating email provider:', err)
    return null
  }
}

/**
 * Sanitize email address - remove angle brackets and extract clean email
 */
function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return ''
  const match = email.match(/<([^>]+)>/) || email.match(/([^\s<>]+@[^\s<>]+)/)
  return match ? match[1].trim() : email.trim()
}

/**
 * Build provider configuration from database record
 */
async function buildProviderConfig(config: Record<string, unknown>): Promise<EmailProviderConfig | null> {
  const provider = config.email_provider as EmailProviderType

  // Sanitize email addresses to ensure clean format
  const fromEmail = sanitizeEmail(config.from_email as string)
  const replyTo = config.reply_to_email ? sanitizeEmail(config.reply_to_email as string) : undefined

  if (!fromEmail) {
    console.error('No from_email configured')
    return null
  }

  const baseConfig: EmailProviderConfig = {
    provider,
    fromEmail,
    fromName: (config.from_name as string) || undefined,
    replyTo,
    // Default to false to avoid broken tracking URLs when NEXT_PUBLIC_APP_URL is not set
    trackOpens: config.track_opens as boolean ?? false,
    trackClicks: config.track_clicks as boolean ?? false,
  }

  try {
    switch (provider) {
      case 'resend': {
        if (!config.api_key_encrypted) return null
        const credentials = decryptCredentials(config.api_key_encrypted as string)
        return {
          ...baseConfig,
          resendApiKey: credentials.api_key,
        }
      }

      case 'smtp': {
        let smtpPassword: string | undefined
        if (config.smtp_password_encrypted) {
          const credentials = decryptCredentials(config.smtp_password_encrypted as string)
          smtpPassword = credentials.password
        }
        return {
          ...baseConfig,
          smtpHost: config.smtp_host as string,
          smtpPort: config.smtp_port as number,
          smtpUsername: config.smtp_username as string,
          smtpPassword,
          smtpEncryption: config.smtp_encryption as 'tls' | 'ssl' | 'none',
        }
      }

      case 'sendgrid': {
        if (!config.sendgrid_api_key_encrypted) return null
        const credentials = decryptCredentials(config.sendgrid_api_key_encrypted as string)
        return {
          ...baseConfig,
          sendgridApiKey: credentials.api_key,
        }
      }

      case 'mailgun': {
        if (!config.mailgun_api_key_encrypted || !config.mailgun_domain) return null
        const credentials = decryptCredentials(config.mailgun_api_key_encrypted as string)
        return {
          ...baseConfig,
          mailgunApiKey: credentials.api_key,
          mailgunDomain: config.mailgun_domain as string,
          mailgunRegion: (config.mailgun_region as 'us' | 'eu') || 'us',
        }
      }

      default:
        console.error('Unknown email provider:', provider)
        return null
    }
  } catch (err) {
    console.error('Error building provider config:', err)
    return null
  }
}

/**
 * Send email using organization's configured provider
 */
export async function sendOrgEmail(
  supabase: SupabaseClient,
  orgId: string,
  options: SendEmailOptions,
  logOptions?: {
    candidateId?: string
    applicationId?: string
    interviewId?: string
    templateId?: string
  }
): Promise<SendEmailResult> {
  const provider = await getEmailProvider(supabase, orgId)

  if (!provider) {
    return {
      success: false,
      error: 'Email not configured for this organization',
      provider: 'resend', // Default
    }
  }

  // Check suppression list
  const toEmail = Array.isArray(options.to)
    ? typeof options.to[0] === 'string'
      ? options.to[0]
      : options.to[0].email
    : typeof options.to === 'string'
      ? options.to
      : options.to.email

  const { data: suppressed } = await supabase
    .from('email_suppression_list')
    .select('id')
    .eq('org_id', orgId)
    .eq('email_address', toEmail.toLowerCase())
    .eq('is_active', true)
    .single()

  if (suppressed) {
    return {
      success: false,
      error: 'Email address is suppressed',
      provider: provider.name,
    }
  }

  // Generate tracking token
  const trackingToken = crypto.randomUUID()

  // Add tracking if enabled
  let html = options.html
  if (html) {
    const { data: config } = await supabase
      .from('organization_email_config')
      .select('track_opens, track_clicks')
      .eq('org_id', orgId)
      .single()

    // Only apply tracking if NEXT_PUBLIC_APP_URL is set (needed for absolute URLs)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (appUrl) {
      if (config?.track_opens && provider.getTrackingPixel) {
        html = html + provider.getTrackingPixel(trackingToken)
      }

      if (config?.track_clicks && provider.wrapLinksForTracking) {
        html = provider.wrapLinksForTracking(html, trackingToken)
      }
    }
  }

  // Send email
  const result = await provider.send({ ...options, html })

  // Log the email
  try {
    await supabase.from('organization_email_logs').insert({
      org_id: orgId,
      to_email: toEmail,
      from_email: options.from
        ? typeof options.from === 'string'
          ? options.from
          : options.from.email
        : undefined,
      subject: options.subject,
      template_id: logOptions?.templateId,
      status: result.success ? 'sent' : 'failed',
      provider: provider.name,
      provider_message_id: result.messageId,
      error_message: result.error,
      candidate_id: logOptions?.candidateId,
      application_id: logOptions?.applicationId,
      interview_id: logOptions?.interviewId,
      tracking_token: trackingToken,
      body_html: html,
      sent_at: result.success ? new Date().toISOString() : null,
    })
  } catch (err) {
    console.error('Error logging email:', err)
  }

  return result
}

/**
 * Test provider configuration
 */
export async function testEmailProvider(
  provider: EmailProviderType,
  config: Partial<EmailProviderConfig>
): Promise<{ success: boolean; error?: string }> {
  try {
    const fullConfig: EmailProviderConfig = {
      provider,
      fromEmail: config.fromEmail || 'test@example.com',
      fromName: config.fromName || 'Test',
      ...config,
    }

    const emailProvider = createEmailProvider(fullConfig)
    return await emailProvider.verify()
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Verification failed',
    }
  }
}

/**
 * Get available email providers with their configuration requirements
 */
export function getAvailableProviders(): Array<{
  id: EmailProviderType
  name: string
  description: string
  requiredFields: string[]
}> {
  return [
    {
      id: 'resend',
      name: 'Resend',
      description: 'Modern email API for developers. Simple setup with great deliverability.',
      requiredFields: ['api_key'],
    },
    {
      id: 'smtp',
      name: 'SMTP',
      description: 'Use your own SMTP server or any SMTP-compatible service.',
      requiredFields: ['smtp_host', 'smtp_port', 'smtp_username', 'smtp_password'],
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      description: 'Enterprise email platform by Twilio with advanced analytics.',
      requiredFields: ['api_key'],
    },
    {
      id: 'mailgun',
      name: 'Mailgun',
      description: 'Powerful email API for transactional and marketing emails.',
      requiredFields: ['api_key', 'domain'],
    },
  ]
}
