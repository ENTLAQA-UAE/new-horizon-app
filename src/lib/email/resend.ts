import { Resend } from "resend"

// Lazy initialization to avoid build errors
let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set")
    }
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
  cc?: string[]
  bcc?: string[]
  tags?: { name: string; value: string }[]
}

export interface SendEmailResult {
  success: boolean
  id?: string
  error?: string
}

const DEFAULT_FROM = process.env.EMAIL_FROM || "Jadarat ATS <noreply@jadarat.app>"

export async function sendEmail(options: EmailOptions): Promise<SendEmailResult> {
  try {
    const { data, error } = await getResendClient().emails.send({
      from: options.from || DEFAULT_FROM,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      tags: options.tags,
    })

    if (error) {
      console.error("Resend error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error("Email send error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    }
  }
}

export async function sendBulkEmails(
  emails: EmailOptions[]
): Promise<SendEmailResult[]> {
  const results = await Promise.allSettled(
    emails.map((email) => sendEmail(email))
  )

  return results.map((result) =>
    result.status === "fulfilled"
      ? result.value
      : { success: false, error: "Failed to send" }
  )
}

// Template-based email sending
export async function sendTemplatedEmail(options: {
  to: string
  templateSlug: string
  variables: Record<string, string>
  template: {
    subject: string
    body_html: string
  }
  language?: "en" | "ar"
}): Promise<SendEmailResult> {
  let subject = options.template.subject
  let body = options.template.body_html

  // Replace variables
  Object.entries(options.variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g")
    subject = subject.replace(regex, value)
    body = body.replace(regex, value)
  })

  return sendEmail({
    to: options.to,
    subject,
    html: body,
    tags: [{ name: "template", value: options.templateSlug }],
  })
}

// Pre-built email functions for common scenarios
export const emails = {
  async applicationReceived(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    companyName: string
  ) {
    return sendEmail({
      to: candidateEmail,
      subject: `Application Received - ${jobTitle} at ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a;">Thank You for Your Application</h1>
          <p>Dear ${candidateName},</p>
          <p>We have received your application for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
          <p>Our team will review your application and get back to you soon.</p>
          <p>Best regards,<br>The ${companyName} Team</p>
        </div>
      `,
    })
  },

  async interviewInvitation(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    interviewDate: string,
    interviewTime: string,
    interviewLocation: string,
    companyName: string
  ) {
    return sendEmail({
      to: candidateEmail,
      subject: `Interview Invitation - ${jobTitle} at ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a;">Interview Invitation</h1>
          <p>Dear ${candidateName},</p>
          <p>We are pleased to invite you for an interview for the <strong>${jobTitle}</strong> position.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Date:</strong> ${interviewDate}</p>
            <p><strong>Time:</strong> ${interviewTime}</p>
            <p><strong>Location:</strong> ${interviewLocation}</p>
          </div>
          <p>Please confirm your attendance by replying to this email.</p>
          <p>Best regards,<br>The ${companyName} Team</p>
        </div>
      `,
    })
  },

  async interviewReminder(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    interviewDate: string,
    interviewTime: string,
    interviewLocation: string
  ) {
    return sendEmail({
      to: candidateEmail,
      subject: `Interview Reminder - ${jobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a;">Interview Reminder</h1>
          <p>Dear ${candidateName},</p>
          <p>This is a reminder that your interview for <strong>${jobTitle}</strong> is scheduled for tomorrow.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Date:</strong> ${interviewDate}</p>
            <p><strong>Time:</strong> ${interviewTime}</p>
            <p><strong>Location:</strong> ${interviewLocation}</p>
          </div>
          <p>We look forward to meeting you!</p>
        </div>
      `,
    })
  },

  async statusUpdate(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    newStatus: string,
    message: string
  ) {
    return sendEmail({
      to: candidateEmail,
      subject: `Application Update - ${jobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a;">Application Status Update</h1>
          <p>Dear ${candidateName},</p>
          <p>Your application status for <strong>${jobTitle}</strong> has been updated to: <strong>${newStatus}</strong></p>
          ${message ? `<p>${message}</p>` : ""}
        </div>
      `,
    })
  },
}
