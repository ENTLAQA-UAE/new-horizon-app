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

    // Determine channels to use
    const channels: string[] = settings?.channels || event.default_channels || ["email", "system"]
    const shouldSendEmail = options.forceEmail || channels.includes("email")
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
