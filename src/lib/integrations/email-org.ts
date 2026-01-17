/**
 * Per-Organization Email Service using Resend
 *
 * Each organization configures their own Resend API key.
 * Emails are sent from the organization's configured sender.
 */

import { SupabaseClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { decryptCredentials } from "@/lib/encryption"

// Types
export interface EmailConfig {
  apiKey: string
  fromEmail: string
  fromName: string
  replyTo?: string
  trackOpens: boolean
  trackClicks: boolean
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  replyTo?: string
  cc?: string[]
  bcc?: string[]
  attachments?: {
    filename: string
    content: Buffer | string
    contentType?: string
  }[]
  tags?: { name: string; value: string }[]
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface EmailLogEntry {
  orgId: string
  toEmail: string
  toName?: string
  fromEmail: string
  subject: string
  templateId?: string
  status: "pending" | "sent" | "delivered" | "failed"
  provider: "resend"
  providerMessageId?: string
  errorMessage?: string
  candidateId?: string
  applicationId?: string
  interviewId?: string
}

/**
 * Get email configuration for an organization
 */
export async function getOrgEmailConfig(
  supabase: SupabaseClient,
  orgId: string
): Promise<EmailConfig | null> {
  const { data: config, error } = await supabase
    .from("organization_email_config")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_enabled", true)
    .single()

  if (error || !config || !config.api_key_encrypted) {
    return null
  }

  try {
    const credentials = decryptCredentials(config.api_key_encrypted)

    return {
      apiKey: credentials.api_key,
      fromEmail: config.from_email,
      fromName: config.from_name,
      replyTo: config.reply_to_email,
      trackOpens: config.track_opens ?? true,
      trackClicks: config.track_clicks ?? true,
    }
  } catch (err) {
    console.error("Error decrypting email API key:", err)
    return null
  }
}

/**
 * Send email using organization's Resend configuration
 */
export async function sendOrgEmail(
  supabase: SupabaseClient,
  orgId: string,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  const config = await getOrgEmailConfig(supabase, orgId)

  if (!config) {
    return {
      success: false,
      error: "Email not configured for this organization",
    }
  }

  const resend = new Resend(config.apiKey)

  try {
    const toAddresses = Array.isArray(options.to) ? options.to : [options.to]

    const { data, error } = await resend.emails.send({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: toAddresses,
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo || config.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        content_type: a.contentType,
      })),
      tags: options.tags,
    })

    if (error) {
      // Log the failed email
      await logEmail(supabase, {
        orgId,
        toEmail: toAddresses[0],
        fromEmail: config.fromEmail,
        subject: options.subject,
        status: "failed",
        provider: "resend",
        errorMessage: error.message,
      })

      return {
        success: false,
        error: error.message,
      }
    }

    // Log the successful email
    await logEmail(supabase, {
      orgId,
      toEmail: toAddresses[0],
      fromEmail: config.fromEmail,
      subject: options.subject,
      status: "sent",
      provider: "resend",
      providerMessageId: data?.id,
    })

    return {
      success: true,
      messageId: data?.id,
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Log email to database
 */
async function logEmail(
  supabase: SupabaseClient,
  entry: EmailLogEntry
): Promise<void> {
  try {
    await supabase.from("organization_email_logs").insert({
      org_id: entry.orgId,
      to_email: entry.toEmail,
      to_name: entry.toName,
      from_email: entry.fromEmail,
      subject: entry.subject,
      template_id: entry.templateId,
      status: entry.status,
      provider: entry.provider,
      provider_message_id: entry.providerMessageId,
      error_message: entry.errorMessage,
      candidate_id: entry.candidateId,
      application_id: entry.applicationId,
      interview_id: entry.interviewId,
      sent_at: entry.status === "sent" ? new Date().toISOString() : null,
    })
  } catch (err) {
    console.error("Error logging email:", err)
  }
}

/**
 * Test Resend API key
 */
export async function testResendApiKey(
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = new Resend(apiKey)

    // Try to get domains to verify the API key works
    const { error } = await resend.domains.list()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Invalid API key",
    }
  }
}

/**
 * Send interview invitation email
 */
export async function sendInterviewInvitation(
  supabase: SupabaseClient,
  orgId: string,
  options: {
    candidateEmail: string
    candidateName: string
    jobTitle: string
    interviewDate: Date
    interviewTime: string
    meetingLink: string
    interviewerName: string
    additionalNotes?: string
  }
): Promise<SendEmailResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Interview Invitation</h2>
      <p>Dear ${options.candidateName},</p>
      <p>We are pleased to invite you for an interview for the position of <strong>${options.jobTitle}</strong>.</p>

      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Date:</strong> ${options.interviewDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        <p><strong>Time:</strong> ${options.interviewTime}</p>
        <p><strong>Interviewer:</strong> ${options.interviewerName}</p>
        <p><strong>Meeting Link:</strong> <a href="${options.meetingLink}">${options.meetingLink}</a></p>
      </div>

      ${options.additionalNotes ? `<p><strong>Additional Notes:</strong> ${options.additionalNotes}</p>` : ""}

      <p>Please confirm your attendance by replying to this email.</p>

      <p>Best regards,<br>The Hiring Team</p>
    </div>
  `

  return sendOrgEmail(supabase, orgId, {
    to: options.candidateEmail,
    subject: `Interview Invitation: ${options.jobTitle}`,
    html,
  })
}

/**
 * Send application received confirmation
 */
export async function sendApplicationConfirmation(
  supabase: SupabaseClient,
  orgId: string,
  options: {
    candidateEmail: string
    candidateName: string
    jobTitle: string
    companyName: string
  }
): Promise<SendEmailResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Application Received</h2>
      <p>Dear ${options.candidateName},</p>
      <p>Thank you for applying for the position of <strong>${options.jobTitle}</strong> at ${options.companyName}.</p>
      <p>We have received your application and our team will review it shortly. If your qualifications match our requirements, we will contact you to schedule an interview.</p>
      <p>Thank you for your interest in joining our team!</p>
      <p>Best regards,<br>The ${options.companyName} Hiring Team</p>
    </div>
  `

  return sendOrgEmail(supabase, orgId, {
    to: options.candidateEmail,
    subject: `Application Received: ${options.jobTitle}`,
    html,
  })
}

/**
 * Send offer letter email
 */
export async function sendOfferLetter(
  supabase: SupabaseClient,
  orgId: string,
  options: {
    candidateEmail: string
    candidateName: string
    jobTitle: string
    companyName: string
    salary: string
    startDate: string
    offerLetterUrl?: string
  }
): Promise<SendEmailResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Job Offer: ${options.jobTitle}</h2>
      <p>Dear ${options.candidateName},</p>
      <p>We are delighted to extend an offer for the position of <strong>${options.jobTitle}</strong> at ${options.companyName}.</p>

      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Position:</strong> ${options.jobTitle}</p>
        <p><strong>Salary:</strong> ${options.salary}</p>
        <p><strong>Start Date:</strong> ${options.startDate}</p>
      </div>

      ${options.offerLetterUrl ? `<p>Please review and sign your offer letter: <a href="${options.offerLetterUrl}">View Offer Letter</a></p>` : ""}

      <p>Please respond to this offer within 5 business days.</p>

      <p>We are excited about the possibility of you joining our team!</p>

      <p>Best regards,<br>The ${options.companyName} Team</p>
    </div>
  `

  return sendOrgEmail(supabase, orgId, {
    to: options.candidateEmail,
    subject: `Job Offer: ${options.jobTitle} at ${options.companyName}`,
    html,
  })
}

/**
 * Send rejection email
 */
export async function sendRejectionEmail(
  supabase: SupabaseClient,
  orgId: string,
  options: {
    candidateEmail: string
    candidateName: string
    jobTitle: string
    companyName: string
    personalizedMessage?: string
  }
): Promise<SendEmailResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Application Update</h2>
      <p>Dear ${options.candidateName},</p>
      <p>Thank you for your interest in the <strong>${options.jobTitle}</strong> position at ${options.companyName} and for taking the time to apply.</p>
      <p>After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs.</p>
      ${options.personalizedMessage ? `<p>${options.personalizedMessage}</p>` : ""}
      <p>We encourage you to apply for future positions that match your skills and experience. We wish you the best in your job search.</p>
      <p>Best regards,<br>The ${options.companyName} Hiring Team</p>
    </div>
  `

  return sendOrgEmail(supabase, orgId, {
    to: options.candidateEmail,
    subject: `Application Update: ${options.jobTitle}`,
    html,
  })
}
