/**
 * Unified Integration Service
 * Provides a consistent interface for all video conferencing integrations
 */

import { createClient } from "@/lib/supabase/server"
import {
  createInterviewZoomMeeting,
  refreshZoomToken,
  deleteZoomMeeting,
} from "@/lib/zoom/zoom"
import {
  createInterviewTeamsMeeting,
  refreshMicrosoftToken,
  deleteTeamsMeeting,
  createCalendarEventWithTeamsMeeting,
} from "@/lib/microsoft/graph"
import {
  getCalendarClient,
  createCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/google/calendar"

export type MeetingProvider = "zoom" | "teams" | "google_meet" | "in_person" | "phone"

export interface MeetingResult {
  provider: MeetingProvider
  meetingId: string
  joinUrl: string
  startUrl?: string
  password?: string
}

export interface InterviewMeetingOptions {
  candidateName: string
  candidateEmail: string
  jobTitle: string
  interviewerName: string
  interviewerEmail: string
  startTime: Date
  endTime: Date
  agenda?: string
}

/**
 * Get valid access token for a provider, refreshing if needed
 */
async function getValidToken(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  provider: "zoom" | "microsoft" | "google_calendar"
): Promise<{ accessToken: string; refreshToken?: string } | { error: string }> {
  const { data: integration, error } = await supabase
    .from("user_integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", provider)
    .single()

  if (error || !integration) {
    return { error: `${provider} not connected. Please connect your account first.` }
  }

  const expiresAt = new Date(integration.expires_at)
  const now = new Date()

  // Token still valid
  if (expiresAt > now) {
    return {
      accessToken: integration.access_token,
      refreshToken: integration.refresh_token,
    }
  }

  // Token expired, refresh it
  try {
    let newTokens: { access_token: string; refresh_token: string; expires_in: number }

    if (provider === "zoom") {
      newTokens = await refreshZoomToken(integration.refresh_token)
    } else if (provider === "microsoft") {
      newTokens = await refreshMicrosoftToken(integration.refresh_token)
    } else {
      // Google uses googleapis which handles refresh automatically
      return {
        accessToken: integration.access_token,
        refreshToken: integration.refresh_token,
      }
    }

    const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000)

    await supabase
      .from("user_integrations")
      .update({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", integration.id)

    return {
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token,
    }
  } catch (err) {
    console.error(`Error refreshing ${provider} token:`, err)
    return { error: `${provider} token expired. Please reconnect your account.` }
  }
}

/**
 * Create a meeting for an interview using the specified provider
 */
export async function createInterviewMeeting(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  provider: MeetingProvider,
  options: InterviewMeetingOptions
): Promise<MeetingResult | { error: string }> {
  if (provider === "in_person" || provider === "phone") {
    return {
      provider,
      meetingId: "",
      joinUrl: "",
    }
  }

  if (provider === "zoom") {
    const tokenResult = await getValidToken(supabase, userId, "zoom")
    if ("error" in tokenResult) return tokenResult

    const meeting = await createInterviewZoomMeeting(tokenResult.accessToken, {
      candidateName: options.candidateName,
      jobTitle: options.jobTitle,
      interviewerName: options.interviewerName,
      startTime: options.startTime,
      durationMinutes: Math.round((options.endTime.getTime() - options.startTime.getTime()) / 60000),
      agenda: options.agenda,
    })

    return {
      provider: "zoom",
      meetingId: String(meeting.id),
      joinUrl: meeting.join_url,
      startUrl: meeting.start_url,
      password: meeting.password,
    }
  }

  if (provider === "teams") {
    const tokenResult = await getValidToken(supabase, userId, "microsoft")
    if ("error" in tokenResult) return tokenResult

    const meeting = await createInterviewTeamsMeeting(tokenResult.accessToken, {
      candidateName: options.candidateName,
      candidateEmail: options.candidateEmail,
      jobTitle: options.jobTitle,
      interviewerName: options.interviewerName,
      interviewerEmail: options.interviewerEmail,
      startTime: options.startTime,
      endTime: options.endTime,
    })

    return {
      provider: "teams",
      meetingId: meeting.id,
      joinUrl: meeting.joinWebUrl,
    }
  }

  if (provider === "google_meet") {
    const tokenResult = await getValidToken(supabase, userId, "google_calendar")
    if ("error" in tokenResult) return tokenResult

    const calendar = getCalendarClient(tokenResult.accessToken, tokenResult.refreshToken)
    const event = await createCalendarEvent(calendar, {
      summary: `Interview: ${options.candidateName} - ${options.jobTitle}`,
      description: options.agenda || `Interview with ${options.candidateName} for ${options.jobTitle} position.`,
      startTime: options.startTime,
      endTime: options.endTime,
      attendees: [
        { email: options.candidateEmail, name: options.candidateName },
        { email: options.interviewerEmail, name: options.interviewerName },
      ],
      conferenceData: true,
    })

    return {
      provider: "google_meet",
      meetingId: event.id,
      joinUrl: event.hangoutLink || event.htmlLink,
    }
  }

  return { error: "Unsupported meeting provider" }
}

/**
 * Delete a meeting from the provider
 */
export async function deleteInterviewMeeting(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  provider: MeetingProvider,
  meetingId: string
): Promise<{ success: boolean } | { error: string }> {
  if (provider === "in_person" || provider === "phone" || !meetingId) {
    return { success: true }
  }

  if (provider === "zoom") {
    const tokenResult = await getValidToken(supabase, userId, "zoom")
    if ("error" in tokenResult) return tokenResult

    await deleteZoomMeeting(tokenResult.accessToken, meetingId)
    return { success: true }
  }

  if (provider === "teams") {
    const tokenResult = await getValidToken(supabase, userId, "microsoft")
    if ("error" in tokenResult) return tokenResult

    await deleteTeamsMeeting(tokenResult.accessToken, meetingId)
    return { success: true }
  }

  if (provider === "google_meet") {
    const tokenResult = await getValidToken(supabase, userId, "google_calendar")
    if ("error" in tokenResult) return tokenResult

    const calendar = getCalendarClient(tokenResult.accessToken, tokenResult.refreshToken)
    await deleteCalendarEvent(calendar, meetingId)
    return { success: true }
  }

  return { error: "Unsupported meeting provider" }
}

/**
 * Get user's connected integrations
 */
export async function getUserIntegrations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from("user_integrations")
    .select("provider, metadata, created_at, updated_at, expires_at")
    .eq("user_id", userId)

  if (error) {
    console.error("Error fetching user integrations:", error)
    return []
  }

  return data.map((integration) => ({
    provider: integration.provider,
    connected: true,
    metadata: integration.metadata,
    connectedAt: integration.created_at,
    expiresAt: integration.expires_at,
  }))
}

/**
 * Disconnect an integration
 */
export async function disconnectIntegration(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  provider: string
): Promise<{ success: boolean } | { error: string }> {
  const { error } = await supabase
    .from("user_integrations")
    .delete()
    .eq("user_id", userId)
    .eq("provider", provider)

  if (error) {
    console.error("Error disconnecting integration:", error)
    return { error: "Failed to disconnect integration" }
  }

  return { success: true }
}
