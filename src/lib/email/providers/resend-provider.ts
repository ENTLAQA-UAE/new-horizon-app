/**
 * Resend Email Provider
 */

import { Resend } from 'resend'
import type {
  EmailProvider,
  EmailProviderConfig,
  SendEmailOptions,
  SendEmailResult,
  EmailAddress,
} from './types'

export class ResendProvider implements EmailProvider {
  readonly name = 'resend' as const
  private client: Resend
  private config: EmailProviderConfig

  constructor(config: EmailProviderConfig) {
    if (!config.resendApiKey) {
      throw new Error('Resend API key is required')
    }
    this.config = config
    this.client = new Resend(config.resendApiKey)
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

      const { data, error } = await this.client.emails.send({
        from,
        to: this.formatAddresses(options.to),
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo || this.config.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          content_type: a.contentType,
        })),
        tags: options.tags,
        headers: options.headers,
      })

      if (error) {
        return {
          success: false,
          error: error.message,
          provider: 'resend',
        }
      }

      return {
        success: true,
        messageId: data?.id,
        provider: 'resend',
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        provider: 'resend',
      }
    }
  }

  async sendBulk(options: SendEmailOptions[]): Promise<SendEmailResult[]> {
    // Resend supports batch sending
    const results: SendEmailResult[] = []

    try {
      const emails = options.map((opt) => ({
        from: opt.from
          ? this.formatAddress(opt.from)
          : `${this.config.fromName} <${this.config.fromEmail}>`,
        to: this.formatAddresses(opt.to),
        subject: opt.subject,
        html: opt.html,
        text: opt.text,
        reply_to: opt.replyTo || this.config.replyTo,
      }))

      const { data, error } = await this.client.batch.send(emails)

      if (error) {
        // Return error for all
        return options.map(() => ({
          success: false,
          error: error.message,
          provider: 'resend' as const,
        }))
      }

      // Map results
      return (
        data?.data?.map((result) => ({
          success: true,
          messageId: result.id,
          provider: 'resend' as const,
        })) || []
      )
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      return options.map(() => ({
        success: false,
        error: errorMsg,
        provider: 'resend' as const,
      }))
    }
  }

  async verify(): Promise<{ success: boolean; error?: string }> {
    try {
      // Try to list domains to verify the API key
      const { error } = await this.client.domains.list()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Invalid API key',
      }
    }
  }

  getTrackingPixel(trackingToken: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    return `<img src="${baseUrl}/api/email/track/open?t=${trackingToken}" width="1" height="1" style="display:none;" alt="" />`
  }

  wrapLinksForTracking(html: string, trackingToken: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    // Replace all href links with tracking links
    return html.replace(
      /href="(https?:\/\/[^"]+)"/g,
      (match, url) => {
        const encodedUrl = encodeURIComponent(url)
        return `href="${baseUrl}/api/email/track/click?t=${trackingToken}&url=${encodedUrl}"`
      }
    )
  }
}
