import { SupabaseClient } from "@supabase/supabase-js"

export type NotificationType =
  | "application_received"
  | "application_status_changed"
  | "interview_scheduled"
  | "interview_reminder"
  | "candidate_scored"
  | "offer_sent"
  | "team_mention"
  | "job_published"
  | "job_closed"
  | "system"

export interface NotificationPayload {
  type: NotificationType
  title: string
  message: string
  link?: string
  data?: Record<string, unknown>
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  data: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}

export async function createNotification(
  supabase: SupabaseClient,
  userId: string,
  payload: NotificationPayload
): Promise<Notification | null> {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link || null,
      data: payload.data || null,
      is_read: false,
    })
    .select()
    .single()

  if (error) {
    console.error("[createNotification] Failed to create notification:", {
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      userId,
      type: payload.type,
      title: payload.title,
    })
    throw new Error(`Failed to create notification: ${error.message}`)
  }

  return data
}

export async function createBulkNotifications(
  supabase: SupabaseClient,
  userIds: string[],
  payload: NotificationPayload
): Promise<void> {
  const notifications = userIds.map((userId) => ({
    user_id: userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    link: payload.link || null,
    data: payload.data || null,
    is_read: false,
  }))

  const { error } = await supabase.from("notifications").insert(notifications)

  if (error) {
    console.error("[createBulkNotifications] Failed to create bulk notifications:", {
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      userCount: userIds.length,
      type: payload.type,
      title: payload.title,
    })
    throw new Error(`Failed to create bulk notifications: ${error.message}`)
  }
}

export async function getUserNotifications(
  supabase: SupabaseClient,
  userId: string,
  limit = 50,
  unreadOnly = false
): Promise<Notification[]> {
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (unreadOnly) {
    query = query.eq("is_read", false)
  }

  const { data, error } = await query

  if (error) {
    console.error("Failed to fetch notifications:", error)
    return []
  }

  return data || []
}

export async function markNotificationAsRead(
  supabase: SupabaseClient,
  notificationId: string
): Promise<void> {
  await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)
}

export async function markAllNotificationsAsRead(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("is_read", false)
}

export async function getUnreadCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)

  if (error) {
    console.error("Failed to get unread count:", error)
    return 0
  }

  return count || 0
}

// Pre-built notification helpers
export const notifications = {
  async applicationReceived(
    supabase: SupabaseClient,
    recruiterId: string,
    candidateName: string,
    jobTitle: string,
    applicationId: string
  ) {
    return createNotification(supabase, recruiterId, {
      type: "application_received",
      title: "New Application",
      message: `${candidateName} applied for ${jobTitle}`,
      link: `/org/applications?id=${applicationId}`,
      data: { applicationId },
    })
  },

  async interviewScheduled(
    supabase: SupabaseClient,
    userId: string,
    candidateName: string,
    jobTitle: string,
    interviewDate: string,
    interviewId: string
  ) {
    return createNotification(supabase, userId, {
      type: "interview_scheduled",
      title: "Interview Scheduled",
      message: `Interview with ${candidateName} for ${jobTitle} on ${new Date(interviewDate).toLocaleDateString()}`,
      link: `/org/interviews?id=${interviewId}`,
      data: { interviewId, interviewDate },
    })
  },

  async interviewReminder(
    supabase: SupabaseClient,
    userId: string,
    candidateName: string,
    jobTitle: string,
    interviewTime: string,
    interviewId: string
  ) {
    return createNotification(supabase, userId, {
      type: "interview_reminder",
      title: "Interview Reminder",
      message: `Reminder: Interview with ${candidateName} for ${jobTitle} at ${interviewTime}`,
      link: `/org/interviews?id=${interviewId}`,
      data: { interviewId },
    })
  },

  async candidateScored(
    supabase: SupabaseClient,
    userId: string,
    candidateName: string,
    jobTitle: string,
    score: number,
    applicationId: string
  ) {
    return createNotification(supabase, userId, {
      type: "candidate_scored",
      title: "AI Score Ready",
      message: `${candidateName} scored ${score}% match for ${jobTitle}`,
      link: `/org/applications?id=${applicationId}`,
      data: { applicationId, score },
    })
  },

  async statusChanged(
    supabase: SupabaseClient,
    userId: string,
    candidateName: string,
    jobTitle: string,
    newStatus: string,
    applicationId: string
  ) {
    return createNotification(supabase, userId, {
      type: "application_status_changed",
      title: "Status Updated",
      message: `${candidateName}'s application for ${jobTitle} moved to ${newStatus}`,
      link: `/org/applications?id=${applicationId}`,
      data: { applicationId, status: newStatus },
    })
  },

  async jobPublished(
    supabase: SupabaseClient,
    teamUserIds: string[],
    jobTitle: string,
    jobId: string
  ) {
    return createBulkNotifications(supabase, teamUserIds, {
      type: "job_published",
      title: "Job Published",
      message: `${jobTitle} is now live and accepting applications`,
      link: `/org/jobs?id=${jobId}`,
      data: { jobId },
    })
  },
}
