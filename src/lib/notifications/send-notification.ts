/**
 * Unified Notification Sender Service
 *
 * Handles sending notifications across all channels (email, in-app, SMS)
 * based on organization notification settings.
 *
 * Features:
 * - Checks org notification settings for the event
 * - Loads templates with variable replacement
 * - Sends to configured channels (email, system, sms)
 * - Includes org branding (logo, colors)
 * - Logs all notifications
 */

import { SupabaseClient } from "@supabase/supabase-js"
import { createNotification, createBulkNotifications, NotificationType } from "./notification-service"
import { sendOrgEmail } from "@/lib/email/providers"

// Notification event codes
export type NotificationEventCode =
  // User Management
  | "user_invited"
  | "user_joined"
  | "password_reset"
  | "role_changed"
  // Recruitment
  | "new_application"
  | "application_received"
  | "candidate_stage_moved"
  | "candidate_disqualified"
  | "candidate_rejection"
  // Interviews
  | "interview_scheduled"
  | "interview_reminder"
  | "interview_cancelled"
  | "interview_rescheduled"
  | "scorecard_submitted"
  | "scorecard_reminder"
  // Offers
  | "offer_created"
  | "offer_sent"
  | "offer_accepted"
  | "offer_rejected"
  | "offer_expired"
  // Jobs
  | "job_published"
  | "job_closed"
  | "job_expiring"
  | "requisition_created"
  | "requisition_approved"
  | "requisition_rejected"

export interface NotificationRecipient {
  userId?: string // For in-app notifications
  email?: string // For email notifications
  name?: string // Recipient name for personalization
  phone?: string // For SMS notifications
}

export interface NotificationVariables {
  // Organization
  org_name?: string
  org_logo?: string
  primary_color?: string

  // User/Receiver
  receiver_name?: string
  user_name?: string
  user_email?: string

  // Candidate
  candidate_name?: string
  candidate_email?: string

  // Job
  job_title?: string
  job_id?: string
  department?: string
  location?: string

  // Interview
  interview_date?: string
  interview_time?: string
  interview_type?: string
  interviewer_name?: string
  meeting_link?: string
  interview_id?: string

  // Offer
  salary?: string
  start_date?: string
  offer_url?: string
  expiry_date?: string

  // Actions
  invitation_url?: string
  reset_url?: string
  portal_url?: string
  action_url?: string

  // Misc
  role?: string
  inviter_name?: string
  stage_name?: string
  reason?: string
  score?: string

  // Custom variables
  [key: string]: string | undefined
}

export interface SendNotificationOptions {
  eventCode: NotificationEventCode
  orgId: string
  recipients: NotificationRecipient[]
  variables: NotificationVariables
  // Override default channels
  forceEmail?: boolean
  forceInApp?: boolean
  // For logging
  candidateId?: string
  applicationId?: string
  interviewId?: string
  jobId?: string
}

export interface SendNotificationResult {
  success: boolean
  emailSent: boolean
  inAppSent: boolean
  smsSent: boolean
  errors: string[]
}

/**
 * Send notification based on org settings
 */
export async function sendNotification(
  supabase: SupabaseClient,
  options: SendNotificationOptions
): Promise<SendNotificationResult> {
  const result: SendNotificationResult = {
    success: false,
    emailSent: false,
    inAppSent: false,
    smsSent: false,
    errors: [],
  }

  try {
    // 1. Get organization details for branding
    const { data: org } = await supabase
      .from("organizations")
      .select("name, logo_url, primary_color")
      .eq("id", options.orgId)
      .single()

    // 2. Get notification event
    const { data: event } = await supabase
      .from("notification_events")
      .select("id, code, name, default_channels")
      .eq("code", options.eventCode)
      .single()

    if (!event) {
      result.errors.push(`Notification event not found: ${options.eventCode}`)
      return result
    }

    // 3. Get org notification settings
    const { data: settings } = await supabase
      .from("org_notification_settings")
      .select("enabled, channels")
      .eq("org_id", options.orgId)
      .eq("event_id", event.id)
      .single()

    // Check if notification is enabled (default to true if no settings)
    const isEnabled = settings?.enabled ?? true
    if (!isEnabled && !options.forceEmail && !options.forceInApp) {
      result.success = true // Not an error, just disabled
      return result
    }

    // Determine channels to use (channel names: 'mail', 'system', 'sms')
    const channels: string[] = settings?.channels || event.default_channels || ["mail", "system"]
    const shouldSendEmail = options.forceEmail || channels.includes("mail")
    const shouldSendInApp = options.forceInApp || channels.includes("system")
    const shouldSendSms = channels.includes("sms")

    // 4. Prepare variables with org branding
    const variables: NotificationVariables = {
      org_name: org?.name || "Organization",
      org_logo: org?.logo_url || "",
      primary_color: org?.primary_color || "#667eea",
      ...options.variables,
    }

    // 5. Send email notifications
    if (shouldSendEmail) {
      const emailResult = await sendEmailNotification(
        supabase,
        options.orgId,
        event.id,
        options.eventCode,
        options.recipients.filter((r) => r.email),
        variables,
        {
          candidateId: options.candidateId,
          applicationId: options.applicationId,
          interviewId: options.interviewId,
        }
      )
      result.emailSent = emailResult.success
      if (!emailResult.success && emailResult.error) {
        result.errors.push(emailResult.error)
      }
    }

    // 6. Send in-app notifications
    if (shouldSendInApp) {
      const inAppResult = await sendInAppNotification(
        supabase,
        options.eventCode,
        options.recipients.filter((r) => r.userId),
        variables,
        options
      )
      result.inAppSent = inAppResult.success
      if (!inAppResult.success && inAppResult.error) {
        result.errors.push(inAppResult.error)
      }
    }

    // 7. Log the notification
    await logNotification(supabase, {
      orgId: options.orgId,
      eventId: event.id,
      recipientCount: options.recipients.length,
      channels: {
        email: result.emailSent,
        inApp: result.inAppSent,
        sms: result.smsSent,
      },
      candidateId: options.candidateId,
      applicationId: options.applicationId,
      interviewId: options.interviewId,
    })

    result.success = result.errors.length === 0
    return result
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : "Unknown error")
    return result
  }
}

/**
 * Send email notification using templates
 */
async function sendEmailNotification(
  supabase: SupabaseClient,
  orgId: string,
  eventId: string,
  eventCode: string,
  recipients: NotificationRecipient[],
  variables: NotificationVariables,
  logOptions: { candidateId?: string; applicationId?: string; interviewId?: string }
): Promise<{ success: boolean; error?: string }> {
  if (recipients.length === 0) {
    return { success: true } // No recipients, not an error
  }

  try {
    // Get template (org custom or default)
    const { data: orgTemplate } = await supabase
      .from("org_email_templates")
      .select("subject, body_html")
      .eq("org_id", orgId)
      .eq("event_id", eventId)
      .single()

    let template = orgTemplate

    if (!template) {
      // Fall back to default template
      const { data: defaultTemplate } = await supabase
        .from("default_email_templates")
        .select("subject, body_html")
        .eq("event_id", eventId)
        .single()

      template = defaultTemplate
    }

    // If no template found, use fallback templates for critical events
    if (!template) {
      template = getFallbackEmailTemplate(eventCode, variables)
    }

    if (!template) {
      return { success: false, error: `No email template found for event: ${eventCode}` }
    }

    // Replace variables in template
    const subject = replaceVariables(template.subject, variables)
    const html = replaceVariables(template.body_html, variables)

    // Send to each recipient
    for (const recipient of recipients) {
      if (!recipient.email) continue

      // Replace recipient-specific variables
      const personalizedHtml = html.replace(/\{\{receiver_name\}\}/g, recipient.name || "there")
      const personalizedSubject = subject.replace(/\{\{receiver_name\}\}/g, recipient.name || "there")

      await sendOrgEmail(supabase, orgId, {
        to: recipient.email,
        subject: personalizedSubject,
        html: personalizedHtml,
      }, {
        candidateId: logOptions.candidateId,
        applicationId: logOptions.applicationId,
        interviewId: logOptions.interviewId,
      })
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send email",
    }
  }
}

/**
 * Send in-app notification
 */
async function sendInAppNotification(
  supabase: SupabaseClient,
  eventCode: NotificationEventCode,
  recipients: NotificationRecipient[],
  variables: NotificationVariables,
  options: SendNotificationOptions
): Promise<{ success: boolean; error?: string }> {
  if (recipients.length === 0) {
    return { success: true }
  }

  try {
    // Map event code to notification type and generate title/message
    const { type, title, message, link } = getInAppNotificationContent(eventCode, variables, options)

    const userIds = recipients.filter((r) => r.userId).map((r) => r.userId!)

    if (userIds.length === 1) {
      await createNotification(supabase, userIds[0], {
        type,
        title,
        message,
        link,
        data: {
          eventCode,
          candidateId: options.candidateId,
          applicationId: options.applicationId,
          interviewId: options.interviewId,
          jobId: options.jobId,
        },
      })
    } else if (userIds.length > 1) {
      await createBulkNotifications(supabase, userIds, {
        type,
        title,
        message,
        link,
        data: {
          eventCode,
          candidateId: options.candidateId,
          applicationId: options.applicationId,
          interviewId: options.interviewId,
          jobId: options.jobId,
        },
      })
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send in-app notification",
    }
  }
}

/**
 * Get in-app notification content based on event code
 */
function getInAppNotificationContent(
  eventCode: NotificationEventCode,
  variables: NotificationVariables,
  options: SendNotificationOptions
): {
  type: NotificationType
  title: string
  message: string
  link?: string
} {
  const candidateName = variables.candidate_name || "A candidate"
  const jobTitle = variables.job_title || "a position"
  const orgName = variables.org_name || "Organization"

  const contentMap: Record<NotificationEventCode, { type: NotificationType; title: string; message: string; link?: string }> = {
    // User Management
    user_invited: {
      type: "system",
      title: "Team Invitation",
      message: `You've been invited to join ${orgName}`,
      link: variables.invitation_url,
    },
    user_joined: {
      type: "system",
      title: "New Team Member",
      message: `${variables.user_name || "A new member"} has joined the team`,
    },
    password_reset: {
      type: "system",
      title: "Password Reset",
      message: "A password reset was requested for your account",
    },
    role_changed: {
      type: "system",
      title: "Role Updated",
      message: `Your role has been changed to ${variables.role || "a new role"}`,
    },

    // Recruitment
    new_application: {
      type: "application_received",
      title: "New Application",
      message: `${candidateName} applied for ${jobTitle}`,
      link: options.applicationId ? `/org/applications?id=${options.applicationId}` : "/org/applications",
    },
    application_received: {
      type: "application_received",
      title: "Application Received",
      message: `Your application for ${jobTitle} has been received`,
      link: variables.portal_url,
    },
    candidate_stage_moved: {
      type: "application_status_changed",
      title: "Application Update",
      message: `Your application for ${jobTitle} has moved to ${variables.stage_name || "a new stage"}`,
      link: variables.portal_url,
    },
    candidate_disqualified: {
      type: "application_status_changed",
      title: "Application Update",
      message: `Update on your application for ${jobTitle}`,
      link: variables.portal_url,
    },
    candidate_rejection: {
      type: "application_status_changed",
      title: "Application Update",
      message: `Update on your application for ${jobTitle} at ${orgName}`,
      link: variables.portal_url,
    },

    // Interviews
    interview_scheduled: {
      type: "interview_scheduled",
      title: "Interview Scheduled",
      message: `Interview for ${jobTitle} on ${variables.interview_date || "upcoming date"}`,
      link: options.interviewId ? `/org/interviews?id=${options.interviewId}` : variables.meeting_link,
    },
    interview_reminder: {
      type: "interview_reminder",
      title: "Interview Reminder",
      message: `Reminder: Interview for ${jobTitle} ${variables.interview_time ? `at ${variables.interview_time}` : "coming up soon"}`,
      link: variables.meeting_link || (options.interviewId ? `/org/interviews?id=${options.interviewId}` : undefined),
    },
    interview_cancelled: {
      type: "interview_scheduled",
      title: "Interview Cancelled",
      message: `Interview for ${jobTitle} has been cancelled`,
    },
    interview_rescheduled: {
      type: "interview_scheduled",
      title: "Interview Rescheduled",
      message: `Interview for ${jobTitle} has been rescheduled to ${variables.interview_date || "a new date"}`,
      link: variables.meeting_link,
    },
    scorecard_submitted: {
      type: "candidate_scored",
      title: "Scorecard Submitted",
      message: `${variables.interviewer_name || "An interviewer"} submitted a scorecard for ${candidateName}`,
      link: options.applicationId ? `/org/applications?id=${options.applicationId}` : "/org/applications",
    },
    scorecard_reminder: {
      type: "interview_reminder",
      title: "Scorecard Reminder",
      message: `Please submit your scorecard for ${candidateName}'s interview`,
      link: options.interviewId ? `/org/interviews?id=${options.interviewId}` : "/org/interviews",
    },

    // Offers
    offer_created: {
      type: "offer_sent",
      title: "Offer Created",
      message: `An offer has been created for ${candidateName} - ${jobTitle}`,
      link: options.applicationId ? `/org/applications?id=${options.applicationId}` : "/org/applications",
    },
    offer_sent: {
      type: "offer_sent",
      title: "Job Offer",
      message: `You've received a job offer for ${jobTitle} at ${orgName}`,
      link: variables.offer_url || variables.portal_url,
    },
    offer_accepted: {
      type: "offer_sent",
      title: "Offer Accepted",
      message: `${candidateName} has accepted the offer for ${jobTitle}`,
      link: options.applicationId ? `/org/applications?id=${options.applicationId}` : "/org/applications",
    },
    offer_rejected: {
      type: "offer_sent",
      title: "Offer Declined",
      message: `${candidateName} has declined the offer for ${jobTitle}`,
      link: options.applicationId ? `/org/applications?id=${options.applicationId}` : "/org/applications",
    },
    offer_expired: {
      type: "offer_sent",
      title: "Offer Expired",
      message: `The offer for ${jobTitle} has expired`,
      link: options.applicationId ? `/org/applications?id=${options.applicationId}` : "/org/applications",
    },

    // Jobs
    job_published: {
      type: "job_published",
      title: "Job Published",
      message: `${jobTitle} is now live and accepting applications`,
      link: options.jobId ? `/org/jobs?id=${options.jobId}` : "/org/jobs",
    },
    job_closed: {
      type: "job_closed",
      title: "Job Closed",
      message: `${jobTitle} has been closed`,
      link: options.jobId ? `/org/jobs?id=${options.jobId}` : "/org/jobs",
    },
    job_expiring: {
      type: "job_closed",
      title: "Job Expiring Soon",
      message: `${jobTitle} will expire on ${variables.expiry_date || "soon"}`,
      link: options.jobId ? `/org/jobs?id=${options.jobId}` : "/org/jobs",
    },
    requisition_created: {
      type: "system",
      title: "New Requisition",
      message: `A new requisition for ${jobTitle} has been created`,
      link: "/org/requisitions",
    },
    requisition_approved: {
      type: "system",
      title: "Requisition Approved",
      message: `Your requisition for ${jobTitle} has been approved`,
      link: "/org/requisitions",
    },
    requisition_rejected: {
      type: "system",
      title: "Requisition Rejected",
      message: `Your requisition for ${jobTitle} has been rejected`,
      link: "/org/requisitions",
    },
  }

  return contentMap[eventCode] || {
    type: "system",
    title: "Notification",
    message: "You have a new notification",
  }
}

/**
 * Replace template variables
 */
function replaceVariables(template: string, variables: NotificationVariables): string {
  let result = template

  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined) {
      // Replace both {{var}} and {var} formats
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value)
      result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value)
    }
  }

  return result
}

/**
 * Get fallback email template for critical notifications
 */
function getFallbackEmailTemplate(
  eventCode: string,
  variables: NotificationVariables
): { subject: string; body_html: string } | null {
  const orgName = variables.org_name || "Our Organization"
  const logoUrl = variables.org_logo
  const primaryColor = variables.primary_color || "#667eea"

  // Common email wrapper
  const wrapEmail = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f5f7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header with logo -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${orgName}" style="max-height: 48px; max-width: 200px;">` : `<h2 style="margin: 0; color: ${primaryColor}; font-size: 24px;">${orgName}</h2>`}
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                This email was sent by ${orgName}.<br>
                If you didn't expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  const templates: Record<string, { subject: string; body_html: string }> = {
    user_invited: {
      subject: `You're invited to join ${orgName}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          You're Invited!
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hi {{receiver_name}},
        </p>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          <strong>{{inviter_name}}</strong> has invited you to join <strong>${orgName}</strong> as a <strong>{{role}}</strong>.
        </p>
        <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Click the button below to accept this invitation and set up your account.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px;">
          <tr>
            <td style="background-color: ${primaryColor}; border-radius: 8px;">
              <a href="{{invitation_url}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                Accept Invitation
              </a>
            </td>
          </tr>
        </table>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          This invitation will expire in 7 days. If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="{{invitation_url}}" style="color: ${primaryColor}; word-break: break-all;">{{invitation_url}}</a>
        </p>
      `, `You're invited to join ${orgName}`),
    },

    password_reset: {
      subject: `Reset your password for ${orgName}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Reset Your Password
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hi {{receiver_name}},
        </p>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          We received a request to reset your password for your ${orgName} account.
        </p>
        <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Click the button below to create a new password.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px;">
          <tr>
            <td style="background-color: ${primaryColor}; border-radius: 8px;">
              <a href="{{reset_url}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                Reset Password
              </a>
            </td>
          </tr>
        </table>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          If you didn't request this, you can safely ignore this email. The link expires in 1 hour.
        </p>
      `, `Reset your password for ${orgName}`),
    },

    application_received: {
      subject: `Application received for {{job_title}} at ${orgName}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Application Received
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hi {{candidate_name}},
        </p>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Thank you for applying for the <strong>{{job_title}}</strong> position at <strong>${orgName}</strong>.
        </p>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          We have received your application and our team will review it shortly. If your qualifications match our requirements, we will be in touch regarding next steps.
        </p>
        <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Thank you for your interest in joining our team!
        </p>
      `, `Application received for {{job_title}}`),
    },

    interview_scheduled: {
      subject: `Interview scheduled for {{job_title}} at ${orgName}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Interview Scheduled
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hi {{candidate_name}},
        </p>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Great news! We would like to invite you to an interview for the <strong>{{job_title}}</strong> position.
        </p>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; color: #111827; font-weight: 600;">Interview Details:</p>
          <p style="margin: 0 0 4px; color: #4b5563;">📅 Date: <strong>{{interview_date}}</strong></p>
          <p style="margin: 0 0 4px; color: #4b5563;">🕐 Time: <strong>{{interview_time}}</strong></p>
          <p style="margin: 0 0 4px; color: #4b5563;">📍 Type: <strong>{{interview_type}}</strong></p>
          ${variables.meeting_link ? `<p style="margin: 0; color: #4b5563;">🔗 Meeting Link: <a href="{{meeting_link}}" style="color: ${primaryColor};">Join Meeting</a></p>` : ""}
        </div>
        <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
          We look forward to speaking with you!
        </p>
      `, `Interview scheduled for {{job_title}}`),
    },

    offer_sent: {
      subject: `Job offer from ${orgName} for {{job_title}}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Congratulations! 🎉
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hi {{candidate_name}},
        </p>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          We are pleased to extend an offer for the <strong>{{job_title}}</strong> position at <strong>${orgName}</strong>.
        </p>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; color: #111827; font-weight: 600;">Offer Details:</p>
          <p style="margin: 0 0 4px; color: #4b5563;">💼 Position: <strong>{{job_title}}</strong></p>
          ${variables.salary ? `<p style="margin: 0 0 4px; color: #4b5563;">💰 Compensation: <strong>{{salary}}</strong></p>` : ""}
          ${variables.start_date ? `<p style="margin: 0; color: #4b5563;">📅 Start Date: <strong>{{start_date}}</strong></p>` : ""}
        </div>
        <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Please review the offer details and let us know your decision.
        </p>
        ${variables.offer_url ? `
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px;">
          <tr>
            <td style="background-color: ${primaryColor}; border-radius: 8px;">
              <a href="{{offer_url}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                View Full Offer
              </a>
            </td>
          </tr>
        </table>
        ` : ""}
      `, `Job offer from ${orgName}`),
    },

    new_application: {
      subject: `New application for {{job_title}}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          New Application Received
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          A new application has been submitted for the <strong>{{job_title}}</strong> position.
        </p>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; color: #111827; font-weight: 600;">Candidate:</p>
          <p style="margin: 0 0 4px; color: #4b5563;">👤 Name: <strong>{{candidate_name}}</strong></p>
          <p style="margin: 0; color: #4b5563;">📧 Email: <strong>{{candidate_email}}</strong></p>
        </div>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
          <tr>
            <td style="background-color: ${primaryColor}; border-radius: 8px;">
              <a href="{{action_url}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                Review Application
              </a>
            </td>
          </tr>
        </table>
      `, `New application for {{job_title}}`),
    },

    candidate_rejection: {
      subject: `Update on your application for {{job_title}} at ${orgName}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Application Update
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hi {{candidate_name}},
        </p>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Thank you for your interest in the <strong>{{job_title}}</strong> position at <strong>${orgName}</strong> and for taking the time to apply.
        </p>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.
        </p>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          We appreciate your interest in our organization and encourage you to apply for future positions that match your experience.
        </p>
        <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
          We wish you the best in your job search.
        </p>
      `, `Update on your application at ${orgName}`),
    },

    interview_cancelled: {
      subject: `Interview cancelled for {{job_title}} at ${orgName}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Interview Cancelled
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hi {{candidate_name}},
        </p>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          We regret to inform you that your scheduled interview for the <strong>{{job_title}}</strong> position has been cancelled.
        </p>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Our team will be in touch with you shortly regarding next steps or to reschedule.
        </p>
        <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
          We apologize for any inconvenience this may cause.
        </p>
      `, `Interview cancelled for {{job_title}}`),
    },

    // User Management
    user_joined: {
      subject: `Welcome to ${orgName}!`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Welcome to the Team!
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hi {{receiver_name}},
        </p>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Your account has been successfully created and you're now part of <strong>${orgName}</strong>.
        </p>
        <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          You can now access the platform and start collaborating with your team.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
          <tr>
            <td style="background-color: ${primaryColor}; border-radius: 8px;">
              <a href="{{action_url}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                Go to Dashboard
              </a>
            </td>
          </tr>
        </table>
      `, `Welcome to ${orgName}!`),
    },

    role_changed: {
      subject: `Your role at ${orgName} has been updated`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Role Updated
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hi {{receiver_name}},
        </p>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Your role at <strong>${orgName}</strong> has been updated to <strong>{{role}}</strong>.
        </p>
        <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
          This change may affect your permissions and access to certain features. If you have any questions, please contact your administrator.
        </p>
      `, `Your role has been updated`),
    },

    // Candidate Stage Notifications
    candidate_stage_moved: {
      subject: `Update on your application for {{job_title}} at ${orgName}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Application Update
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hi {{candidate_name}},
        </p>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          We wanted to let you know that your application for the <strong>{{job_title}}</strong> position at <strong>${orgName}</strong> has progressed to the next stage: <strong>{{stage_name}}</strong>.
        </p>
        <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Our team will be in touch with you soon regarding next steps. Thank you for your patience!
        </p>
      `, `Application update for {{job_title}}`),
    },

    candidate_disqualified: {
      subject: `Update on your application for {{job_title}} at ${orgName}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Application Update
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hi {{candidate_name}},
        </p>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Thank you for your interest in the <strong>{{job_title}}</strong> position at <strong>${orgName}</strong>.
        </p>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          After reviewing your application, we've decided not to move forward at this time. We encourage you to apply for other positions that match your skills and experience.
        </p>
        <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
          We wish you the best in your job search.
        </p>
      `, `Application update at ${orgName}`),
    },

    // Interview Notifications
    interview_reminder: {
      subject: `Reminder: Interview for {{job_title}} tomorrow`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Interview Reminder
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hi {{candidate_name}},
        </p>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          This is a friendly reminder about your upcoming interview for the <strong>{{job_title}}</strong> position.
        </p>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; color: #111827; font-weight: 600;">Interview Details:</p>
          <p style="margin: 0 0 4px; color: #4b5563;">📅 Date: <strong>{{interview_date}}</strong></p>
          <p style="margin: 0 0 4px; color: #4b5563;">🕐 Time: <strong>{{interview_time}}</strong></p>
          <p style="margin: 0; color: #4b5563;">📍 Type: <strong>{{interview_type}}</strong></p>
        </div>
        ${variables.meeting_link ? `
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px;">
          <tr>
            <td style="background-color: ${primaryColor}; border-radius: 8px;">
              <a href="{{meeting_link}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                Join Meeting
              </a>
            </td>
          </tr>
        </table>
        ` : ""}
        <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
          We look forward to speaking with you!
        </p>
      `, `Interview reminder for {{job_title}}`),
    },

    interview_rescheduled: {
      subject: `Interview rescheduled for {{job_title}} at ${orgName}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Interview Rescheduled
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hi {{candidate_name}},
        </p>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Your interview for the <strong>{{job_title}}</strong> position has been rescheduled.
        </p>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; color: #111827; font-weight: 600;">New Interview Details:</p>
          <p style="margin: 0 0 4px; color: #4b5563;">📅 Date: <strong>{{interview_date}}</strong></p>
          <p style="margin: 0 0 4px; color: #4b5563;">🕐 Time: <strong>{{interview_time}}</strong></p>
          <p style="margin: 0; color: #4b5563;">📍 Type: <strong>{{interview_type}}</strong></p>
        </div>
        <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
          We apologize for any inconvenience. We look forward to speaking with you!
        </p>
      `, `Interview rescheduled for {{job_title}}`),
    },

    scorecard_submitted: {
      subject: `Scorecard submitted for {{candidate_name}}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Scorecard Submitted
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          <strong>{{interviewer_name}}</strong> has submitted a scorecard for <strong>{{candidate_name}}</strong>.
        </p>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 4px; color: #4b5563;">👤 Candidate: <strong>{{candidate_name}}</strong></p>
          <p style="margin: 0 0 4px; color: #4b5563;">💼 Position: <strong>{{job_title}}</strong></p>
          <p style="margin: 0; color: #4b5563;">⭐ Score: <strong>{{score}}</strong></p>
        </div>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
          <tr>
            <td style="background-color: ${primaryColor}; border-radius: 8px;">
              <a href="{{action_url}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                View Scorecard
              </a>
            </td>
          </tr>
        </table>
      `, `Scorecard submitted for {{candidate_name}}`),
    },

    scorecard_reminder: {
      subject: `Reminder: Submit scorecard for {{candidate_name}}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Scorecard Reminder
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hi {{receiver_name}},
        </p>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Please remember to submit your scorecard for <strong>{{candidate_name}}</strong>'s interview for the <strong>{{job_title}}</strong> position.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
          <tr>
            <td style="background-color: ${primaryColor}; border-radius: 8px;">
              <a href="{{action_url}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                Submit Scorecard
              </a>
            </td>
          </tr>
        </table>
      `, `Scorecard reminder for {{candidate_name}}`),
    },

    // Offer Notifications
    offer_created: {
      subject: `New offer created for {{candidate_name}}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Offer Created
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          A new offer has been created for <strong>{{candidate_name}}</strong> for the <strong>{{job_title}}</strong> position.
        </p>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 4px; color: #4b5563;">👤 Candidate: <strong>{{candidate_name}}</strong></p>
          <p style="margin: 0 0 4px; color: #4b5563;">💼 Position: <strong>{{job_title}}</strong></p>
          ${variables.salary ? `<p style="margin: 0; color: #4b5563;">💰 Salary: <strong>{{salary}}</strong></p>` : ""}
        </div>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
          <tr>
            <td style="background-color: ${primaryColor}; border-radius: 8px;">
              <a href="{{action_url}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                Review Offer
              </a>
            </td>
          </tr>
        </table>
      `, `Offer created for {{candidate_name}}`),
    },

    offer_accepted: {
      subject: `Great news! {{candidate_name}} accepted the offer for {{job_title}}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Offer Accepted! 🎉
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Great news! <strong>{{candidate_name}}</strong> has accepted the offer for the <strong>{{job_title}}</strong> position.
        </p>
        <div style="background-color: #dcfce7; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 4px; color: #166534;">✅ Offer Status: <strong>Accepted</strong></p>
          <p style="margin: 0 0 4px; color: #166534;">👤 Candidate: <strong>{{candidate_name}}</strong></p>
          <p style="margin: 0; color: #166534;">💼 Position: <strong>{{job_title}}</strong></p>
        </div>
        <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Please proceed with the onboarding process.
        </p>
      `, `Offer accepted by {{candidate_name}}`),
    },

    offer_rejected: {
      subject: `{{candidate_name}} declined the offer for {{job_title}}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Offer Declined
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Unfortunately, <strong>{{candidate_name}}</strong> has declined the offer for the <strong>{{job_title}}</strong> position.
        </p>
        <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 4px; color: #991b1b;">❌ Offer Status: <strong>Declined</strong></p>
          <p style="margin: 0 0 4px; color: #991b1b;">👤 Candidate: <strong>{{candidate_name}}</strong></p>
          <p style="margin: 0; color: #991b1b;">💼 Position: <strong>{{job_title}}</strong></p>
        </div>
        <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
          You may want to consider other candidates for this position.
        </p>
      `, `Offer declined by {{candidate_name}}`),
    },

    offer_expired: {
      subject: `Offer expired for {{job_title}}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Offer Expired
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          The offer for <strong>{{candidate_name}}</strong> for the <strong>{{job_title}}</strong> position has expired.
        </p>
        <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 4px; color: #92400e;">⏰ Offer Status: <strong>Expired</strong></p>
          <p style="margin: 0 0 4px; color: #92400e;">👤 Candidate: <strong>{{candidate_name}}</strong></p>
          <p style="margin: 0; color: #92400e;">💼 Position: <strong>{{job_title}}</strong></p>
        </div>
        <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
          You can extend the offer or consider other candidates.
        </p>
      `, `Offer expired for {{job_title}}`),
    },

    // Job Notifications
    job_published: {
      subject: `New job published: {{job_title}}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          New Job Published
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          A new job has been published and is now accepting applications.
        </p>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 4px; color: #111827; font-weight: 600;">💼 {{job_title}}</p>
          ${variables.department ? `<p style="margin: 0 0 4px; color: #4b5563;">🏢 Department: {{department}}</p>` : ""}
          ${variables.location ? `<p style="margin: 0; color: #4b5563;">📍 Location: {{location}}</p>` : ""}
        </div>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
          <tr>
            <td style="background-color: ${primaryColor}; border-radius: 8px;">
              <a href="{{action_url}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                View Job
              </a>
            </td>
          </tr>
        </table>
      `, `New job published: {{job_title}}`),
    },

    job_closed: {
      subject: `Job closed: {{job_title}}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Job Closed
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          The <strong>{{job_title}}</strong> position has been closed and is no longer accepting applications.
        </p>
        <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Any pending applications will need to be processed or archived.
        </p>
      `, `Job closed: {{job_title}}`),
    },

    job_expiring: {
      subject: `Job expiring soon: {{job_title}}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Job Expiring Soon
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          The <strong>{{job_title}}</strong> position will expire on <strong>{{expiry_date}}</strong>.
        </p>
        <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          If you'd like to keep this job open, please extend the posting before it expires.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
          <tr>
            <td style="background-color: ${primaryColor}; border-radius: 8px;">
              <a href="{{action_url}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                Manage Job
              </a>
            </td>
          </tr>
        </table>
      `, `Job expiring: {{job_title}}`),
    },

    // Requisition Notifications
    requisition_created: {
      subject: `New requisition created: {{job_title}}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          New Requisition Created
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          A new requisition has been created for the <strong>{{job_title}}</strong> position.
        </p>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 4px; color: #4b5563;">💼 Position: <strong>{{job_title}}</strong></p>
          ${variables.department ? `<p style="margin: 0; color: #4b5563;">🏢 Department: <strong>{{department}}</strong></p>` : ""}
        </div>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
          <tr>
            <td style="background-color: ${primaryColor}; border-radius: 8px;">
              <a href="{{action_url}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                Review Requisition
              </a>
            </td>
          </tr>
        </table>
      `, `New requisition: {{job_title}}`),
    },

    requisition_approved: {
      subject: `Requisition approved: {{job_title}}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Requisition Approved ✅
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Your requisition for the <strong>{{job_title}}</strong> position has been approved.
        </p>
        <div style="background-color: #dcfce7; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0; color: #166534;">✅ Status: <strong>Approved</strong></p>
        </div>
        <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          You can now proceed to publish the job posting.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
          <tr>
            <td style="background-color: ${primaryColor}; border-radius: 8px;">
              <a href="{{action_url}}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                Create Job Posting
              </a>
            </td>
          </tr>
        </table>
      `, `Requisition approved: {{job_title}}`),
    },

    requisition_rejected: {
      subject: `Requisition rejected: {{job_title}}`,
      body_html: wrapEmail(`
        <h1 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
          Requisition Not Approved
        </h1>
        <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Your requisition for the <strong>{{job_title}}</strong> position has not been approved.
        </p>
        <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0; color: #991b1b;">❌ Status: <strong>Rejected</strong></p>
          ${variables.reason ? `<p style="margin: 8px 0 0; color: #991b1b;">Reason: {{reason}}</p>` : ""}
        </div>
        <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Please contact your manager for more details or to discuss next steps.
        </p>
      `, `Requisition rejected: {{job_title}}`),
    },
  }

  return templates[eventCode] || null
}

/**
 * Log notification to database
 */
async function logNotification(
  supabase: SupabaseClient,
  data: {
    orgId: string
    eventId: string
    recipientCount: number
    channels: { email: boolean; inApp: boolean; sms: boolean }
    candidateId?: string
    applicationId?: string
    interviewId?: string
  }
): Promise<void> {
  try {
    await supabase.from("notification_log").insert({
      org_id: data.orgId,
      event_id: data.eventId,
      recipient_count: data.recipientCount,
      channels: data.channels,
      candidate_id: data.candidateId,
      application_id: data.applicationId,
      interview_id: data.interviewId,
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error("Error logging notification:", err)
  }
}

// Export convenient helpers for common notifications
export const notify = {
  /**
   * Notify recruiters about new application
   */
  async newApplication(
    supabase: SupabaseClient,
    orgId: string,
    recruiterIds: string[],
    data: {
      candidateName: string
      candidateEmail: string
      jobTitle: string
      applicationId: string
      jobId: string
    }
  ) {
    return sendNotification(supabase, {
      eventCode: "new_application",
      orgId,
      recipients: recruiterIds.map((id) => ({ userId: id })),
      variables: {
        candidate_name: data.candidateName,
        candidate_email: data.candidateEmail,
        job_title: data.jobTitle,
      },
      applicationId: data.applicationId,
      jobId: data.jobId,
    })
  },

  /**
   * Send application confirmation to candidate
   */
  async applicationReceived(
    supabase: SupabaseClient,
    orgId: string,
    data: {
      candidateName: string
      candidateEmail: string
      jobTitle: string
      applicationId: string
      portalUrl?: string
    }
  ) {
    return sendNotification(supabase, {
      eventCode: "application_received",
      orgId,
      recipients: [{ email: data.candidateEmail, name: data.candidateName }],
      variables: {
        candidate_name: data.candidateName,
        receiver_name: data.candidateName,
        job_title: data.jobTitle,
        portal_url: data.portalUrl,
      },
      applicationId: data.applicationId,
    })
  },

  /**
   * Send interview invitation to candidate
   */
  async interviewScheduled(
    supabase: SupabaseClient,
    orgId: string,
    data: {
      candidateName: string
      candidateEmail: string
      jobTitle: string
      interviewDate: string
      interviewTime: string
      interviewType: string
      interviewerName: string
      meetingLink?: string
      interviewId: string
      applicationId: string
      // Also notify interviewers
      interviewerIds?: string[]
    }
  ) {
    const recipients: NotificationRecipient[] = [
      { email: data.candidateEmail, name: data.candidateName },
    ]

    // Add interviewers for in-app notification
    if (data.interviewerIds) {
      data.interviewerIds.forEach((id) => {
        recipients.push({ userId: id })
      })
    }

    return sendNotification(supabase, {
      eventCode: "interview_scheduled",
      orgId,
      recipients,
      variables: {
        candidate_name: data.candidateName,
        receiver_name: data.candidateName,
        job_title: data.jobTitle,
        interview_date: data.interviewDate,
        interview_time: data.interviewTime,
        interview_type: data.interviewType,
        interviewer_name: data.interviewerName,
        meeting_link: data.meetingLink,
      },
      interviewId: data.interviewId,
      applicationId: data.applicationId,
    })
  },

  /**
   * Send offer to candidate
   */
  async offerSent(
    supabase: SupabaseClient,
    orgId: string,
    data: {
      candidateName: string
      candidateEmail: string
      jobTitle: string
      salary: string
      startDate: string
      offerUrl?: string
      applicationId: string
      // Notify hiring team
      teamUserIds?: string[]
    }
  ) {
    const recipients: NotificationRecipient[] = [
      { email: data.candidateEmail, name: data.candidateName },
    ]

    if (data.teamUserIds) {
      data.teamUserIds.forEach((id) => {
        recipients.push({ userId: id })
      })
    }

    return sendNotification(supabase, {
      eventCode: "offer_sent",
      orgId,
      recipients,
      variables: {
        candidate_name: data.candidateName,
        receiver_name: data.candidateName,
        job_title: data.jobTitle,
        salary: data.salary,
        start_date: data.startDate,
        offer_url: data.offerUrl,
      },
      applicationId: data.applicationId,
    })
  },

  /**
   * Send rejection email to candidate
   */
  async candidateRejection(
    supabase: SupabaseClient,
    orgId: string,
    data: {
      candidateName: string
      candidateEmail: string
      jobTitle: string
      reason?: string
      applicationId: string
    }
  ) {
    return sendNotification(supabase, {
      eventCode: "candidate_rejection",
      orgId,
      recipients: [{ email: data.candidateEmail, name: data.candidateName }],
      variables: {
        candidate_name: data.candidateName,
        receiver_name: data.candidateName,
        job_title: data.jobTitle,
        reason: data.reason,
      },
      applicationId: data.applicationId,
    })
  },

  /**
   * Notify team about job published
   */
  async jobPublished(
    supabase: SupabaseClient,
    orgId: string,
    data: {
      jobTitle: string
      jobId: string
      teamUserIds: string[]
    }
  ) {
    return sendNotification(supabase, {
      eventCode: "job_published",
      orgId,
      recipients: data.teamUserIds.map((id) => ({ userId: id })),
      variables: {
        job_title: data.jobTitle,
      },
      jobId: data.jobId,
    })
  },
}
