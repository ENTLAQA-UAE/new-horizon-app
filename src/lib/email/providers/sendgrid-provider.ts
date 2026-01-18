/**
 * SendGrid Email Provider
 */

import sgMail from '@sendgrid/mail'
import type {
  EmailProvider,
  EmailProviderConfig,
  SendEmailOptions,
  SendEmailResult,
  EmailAddress,
} from './types'

export class SendGridProvider implements EmailProvider {
  readonly name = 'sendgrid' as const
  private config: EmailProviderConfig

  constructor(config: EmailProviderConfig) {
    if (!config.sendgridApiKey) {
      throw new Error('SendGrid API key is required')
    }
    this.config = config
    sgMail.setApiKey(config.sendgridApiKey)
  }

  private formatAddress(addr: EmailAddress | string): { email: string; name?: string } {
    if (typeof addr === 'string') return { email: addr }
    return { email: addr.email, name: addr.name }
  }

  private formatAddresses(
    addrs: EmailAddress | EmailAddress[] | string | string[]
  ): { email: string; name?: string }[] {
    const list = Array.isArray(addrs) ? addrs : [addrs]
    return list.map((a) => this.formatAddress(a))
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const from = options.from
        ? this.formatAddress(options.from)
        : { email: this.config.fromEmail, name: this.config.fromName }

      const msg: sgMail.MailDataRequired = {
        from,
        to: this.formatAddresses(options.to),
        subject: options.subject,
        html: options.html || undefined,
        text: options.text || undefined,
        replyTo: options.replyTo || this.config.replyTo,
        cc: options.cc?.map((e) => ({ email: e })),
        bcc: options.bcc?.map((e) => ({ email: e })),
        attachments: options.attachments?.map((a) => ({
          filename: a.filename,
          content:
            typeof a.content === 'string'
              ? a.content
              : a.content.toString('base64'),
          type: a.contentType,
          disposition: a.cid ? 'inline' : 'attachment',
          contentId: a.cid,
        })),
        trackingSettings: {
          clickTracking: {
            enable: options.trackClicks ?? this.config.trackClicks ?? true,
          },
          openTracking: {
            enable: options.trackOpens ?? this.config.trackOpens ?? true,
          },
        },
        customArgs: options.metadata,
      }

      const [response] = await sgMail.send(msg)

      return {
        success: true,
        messageId: response.headers['x-message-id'] as string,
        provider: 'sendgrid',
      }
    } catch (err: unknown) {
      const error = err as { response?: { body?: { errors?: Array<{ message: string }> } }; message?: string }
      const errorMsg =
        error.response?.body?.errors?.[0]?.message ||
        error.message ||
        'SendGrid send failed'

      return {
        success: false,
        error: errorMsg,
        provider: 'sendgrid',
      }
    }
  }

  async sendBulk(options: SendEmailOptions[]): Promise<SendEmailResult[]> {
    try {
      const messages: sgMail.MailDataRequired[] = options.map((opt) => {
        const from = opt.from
          ? this.formatAddress(opt.from)
          : { email: this.config.fromEmail, name: this.config.fromName }

        return {
          from,
          to: this.formatAddresses(opt.to),
          subject: opt.subject,
          html: opt.html || undefined,
          text: opt.text || undefined,
          replyTo: opt.replyTo || this.config.replyTo,
          trackingSettings: {
            clickTracking: { enable: opt.trackClicks ?? this.config.trackClicks ?? true },
            openTracking: { enable: opt.trackOpens ?? this.config.trackOpens ?? true },
          },
        }
      })

      const responses = await sgMail.send(messages)
      const responseArray = Array.isArray(responses) ? responses : [responses]

      return responseArray.map((response) => ({
        success: true,
        messageId: Array.isArray(response)
          ? (response[0]?.headers?.['x-message-id'] as string)
          : (response?.headers?.['x-message-id'] as string),
        provider: 'sendgrid' as const,
      }))
    } catch (err: unknown) {
      const error = err as { message?: string }
      return options.map(() => ({
        success: false,
        error: error.message || 'SendGrid bulk send failed',
        provider: 'sendgrid' as const,
      }))
    }
  }

  async verify(): Promise<{ success: boolean; error?: string }> {
    try {
      // SendGrid doesn't have a direct verify endpoint
      // We'll try to send a request to get API key scopes
      const response = await fetch('https://api.sendgrid.com/v3/scopes', {
        headers: {
          Authorization: `Bearer ${this.config.sendgridApiKey}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        return {
          success: false,
          error: data.errors?.[0]?.message || 'Invalid API key',
        }
      }

      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'SendGrid verification failed',
      }
    }
  }

  getTrackingPixel(trackingToken: string): string {
    // SendGrid handles its own tracking, but we can add custom tracking too
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    return `<img src="${baseUrl}/api/email/track/open?t=${trackingToken}" width="1" height="1" style="display:none;" alt="" />`
  }

  wrapLinksForTracking(html: string, trackingToken: string): string {
    // SendGrid handles click tracking automatically when enabled
    // We can still add our own tracking if needed
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    return html.replace(/href="(https?:\/\/[^"]+)"/g, (match, url) => {
      const encodedUrl = encodeURIComponent(url)
      return `href="${baseUrl}/api/email/track/click?t=${trackingToken}&url=${encodedUrl}"`
    })
  }
}
