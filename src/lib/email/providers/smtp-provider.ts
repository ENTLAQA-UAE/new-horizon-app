/**
 * SMTP Email Provider using Nodemailer
 */

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'
import type {
  EmailProvider,
  EmailProviderConfig,
  SendEmailOptions,
  SendEmailResult,
  EmailAddress,
} from './types'

export class SMTPProvider implements EmailProvider {
  readonly name = 'smtp' as const
  private transporter: Transporter<SMTPTransport.SentMessageInfo>
  private config: EmailProviderConfig

  constructor(config: EmailProviderConfig) {
    if (!config.smtpHost) {
      throw new Error('SMTP host is required')
    }

    this.config = config

    const secure = config.smtpEncryption === 'ssl'
    const port = config.smtpPort || (secure ? 465 : 587)

    this.transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port,
      secure,
      auth: config.smtpUsername
        ? {
            user: config.smtpUsername,
            pass: config.smtpPassword,
          }
        : undefined,
      tls:
        config.smtpEncryption === 'tls'
          ? {
              rejectUnauthorized: false,
            }
          : undefined,
    })
  }

  private formatAddress(addr: EmailAddress | string): string {
    if (typeof addr === 'string') return addr
    return addr.name ? `${addr.name} <${addr.email}>` : addr.email
  }

  private formatAddresses(addrs: EmailAddress | EmailAddress[] | string | string[]): string {
    const list = Array.isArray(addrs) ? addrs : [addrs]
    return list.map((a) => this.formatAddress(a)).join(', ')
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const from = options.from
        ? this.formatAddress(options.from)
        : `${this.config.fromName} <${this.config.fromEmail}>`

      const info = await this.transporter.sendMail({
        from,
        to: this.formatAddresses(options.to),
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo || this.config.replyTo,
        cc: options.cc?.join(', '),
        bcc: options.bcc?.join(', '),
        attachments: options.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
          cid: a.cid,
        })),
        headers: options.headers,
      })

      return {
        success: true,
        messageId: info.messageId,
        provider: 'smtp',
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'SMTP send failed',
        provider: 'smtp',
      }
    }
  }

  async sendBulk(options: SendEmailOptions[]): Promise<SendEmailResult[]> {
    // SMTP doesn't have native bulk support, send sequentially
    const results: SendEmailResult[] = []

    for (const opt of options) {
      const result = await this.send(opt)
      results.push(result)
    }

    return results
  }

  async verify(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.transporter.verify()
      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'SMTP verification failed',
      }
    }
  }

  getTrackingPixel(trackingToken: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    return `<img src="${baseUrl}/api/email/track/open?t=${trackingToken}" width="1" height="1" style="display:none;" alt="" />`
  }

  wrapLinksForTracking(html: string, trackingToken: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    return html.replace(/href="(https?:\/\/[^"]+)"/g, (match, url) => {
      const encodedUrl = encodeURIComponent(url)
      return `href="${baseUrl}/api/email/track/click?t=${trackingToken}&url=${encodedUrl}"`
    })
  }

  /**
   * Close the transporter connection
   */
  close(): void {
    this.transporter.close()
  }
}
