/**
 * Mailgun Email Provider
 */

import Mailgun from 'mailgun.js'
import formData from 'form-data'
import type {
  EmailProvider,
  EmailProviderConfig,
  SendEmailOptions,
  SendEmailResult,
  EmailAddress,
} from './types'

// Type for Mailgun client
type MailgunClient = ReturnType<InstanceType<typeof Mailgun>['client']>

export class MailgunProvider implements EmailProvider {
  readonly name = 'mailgun' as const
  private client: MailgunClient
  private config: EmailProviderConfig
  private domain: string

  constructor(config: EmailProviderConfig) {
    if (!config.mailgunApiKey) {
      throw new Error('Mailgun API key is required')
    }
    if (!config.mailgunDomain) {
      throw new Error('Mailgun domain is required')
    }

    this.config = config
    this.domain = config.mailgunDomain

    const mailgun = new Mailgun(formData)
    const url = config.mailgunRegion === 'eu'
      ? 'https://api.eu.mailgun.net'
      : 'https://api.mailgun.net'

    this.client = mailgun.client({
      username: 'api',
      key: config.mailgunApiKey,
      url,
    })
  }

  private formatAddress(addr: EmailAddress | string): string {
    if (typeof addr === 'string') return addr
    return addr.name ? `${addr.name} <${addr.email}>` : addr.email
  }

  private formatAddresses(addrs: EmailAddress | EmailAddress[] | string | string[]): string[] {
    const list = Array.isArray(addrs) ? addrs : [addrs]
    return list.map((a) => this.formatAddress(a))
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const from = options.from
        ? this.formatAddress(options.from)
        : `${this.config.fromName} <${this.config.fromEmail}>`

      const messageData: Record<string, unknown> = {
        from,
        to: this.formatAddresses(options.to),
        subject: options.subject,
        html: options.html,
        text: options.text,
        'h:Reply-To': options.replyTo || this.config.replyTo,
        'o:tracking': options.trackOpens ?? this.config.trackOpens ?? true,
        'o:tracking-clicks': options.trackClicks ?? this.config.trackClicks ?? true,
      }

      if (options.cc?.length) {
        messageData.cc = options.cc.join(', ')
      }

      if (options.bcc?.length) {
        messageData.bcc = options.bcc.join(', ')
      }

      // Add custom headers
      if (options.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
          messageData[`h:${key}`] = value
        }
      }

      // Add metadata as custom variables
      if (options.metadata) {
        for (const [key, value] of Object.entries(options.metadata)) {
          messageData[`v:${key}`] = value
        }
      }

      // Add tags
      if (options.tags?.length) {
        messageData['o:tag'] = options.tags.map((t) => t.value)
      }

      const result = await this.client.messages.create(this.domain, messageData)

      return {
        success: true,
        messageId: result.id,
        provider: 'mailgun',
      }
    } catch (err: unknown) {
      const error = err as { message?: string; details?: string }
      return {
        success: false,
        error: error.message || error.details || 'Mailgun send failed',
        provider: 'mailgun',
      }
    }
  }

  async sendBulk(options: SendEmailOptions[]): Promise<SendEmailResult[]> {
    // Mailgun supports recipient variables for bulk sending
    // For simplicity, we'll send individually
    const results: SendEmailResult[] = []

    for (const opt of options) {
      const result = await this.send(opt)
      results.push(result)
    }

    return results
  }

  async verify(): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify by getting domain info
      await this.client.domains.get(this.domain)
      return { success: true }
    } catch (err: unknown) {
      const error = err as { message?: string; details?: string }
      return {
        success: false,
        error: error.message || error.details || 'Mailgun verification failed',
      }
    }
  }

  getTrackingPixel(trackingToken: string): string {
    // Mailgun handles its own tracking, but we can add custom tracking too
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    return `<img src="${baseUrl}/api/email/track/open?t=${trackingToken}" width="1" height="1" style="display:none;" alt="" />`
  }

  wrapLinksForTracking(html: string, trackingToken: string): string {
    // Mailgun handles click tracking automatically
    // We can still add our own tracking if needed
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    return html.replace(/href="(https?:\/\/[^"]+)"/g, (match, url) => {
      const encodedUrl = encodeURIComponent(url)
      return `href="${baseUrl}/api/email/track/click?t=${trackingToken}&url=${encodedUrl}"`
    })
  }

  /**
   * Get domain verification records from Mailgun
   */
  async getDomainRecords(): Promise<{
    sending: Array<{ type: string; name: string; value: string }>
    receiving: Array<{ type: string; name: string; value: string; priority?: number }>
  }> {
    try {
      const domain = await this.client.domains.get(this.domain)
      return {
        sending: domain.sending_dns_records || [],
        receiving: domain.receiving_dns_records || [],
      }
    } catch {
      return { sending: [], receiving: [] }
    }
  }
}
