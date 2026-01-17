/**
 * Zoom Integration with Organization-Level Credentials
 *
 * Each organization provides their own Zoom OAuth App credentials.
 * Credentials are fetched from the database, not environment variables.
 */

import { SupabaseClient } from "@supabase/supabase-js"
import { getOrgCredentials, markIntegrationVerified } from "./org-integrations"

const ZOOM_AUTH_URL = "https://zoom.us/oauth/authorize"
const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token"
const ZOOM_API_BASE = "https://api.zoom.us/v2"

// Types
export interface ZoomCredentials {
  client_id: string
  client_secret: string
  webhook_secret?: string
}

export interface ZoomMeetingInput {
  topic: string
  type?: 1 | 2 | 3 | 8
  start_time?: string
  duration?: number
  timezone?: string
  password?: string
  agenda?: string
  settings?: {
    host_video?: boolean
    participant_video?: boolean
    join_before_host?: boolean
    mute_upon_entry?: boolean
    waiting_room?: boolean
    auto_recording?: "local" | "cloud" | "none"
  }
}

export interface ZoomMeeting {
  id: number
  uuid: string
  host_id: string
  host_email: string
  topic: string
  type: number
  status: string
  start_time: string
  duration: number
  timezone: string
  created_at: string
  start_url: string
  join_url: string
  password?: string
}

/**
 * Get Zoom credentials for an organization
 */
async function getZoomCredentials(
  supabase: SupabaseClient,
  orgId: string
): Promise<ZoomCredentials | null> {
  const credentials = await getOrgCredentials(supabase, orgId, "zoom")
  if (!credentials) return null

  return {
    client_id: credentials.client_id,
    client_secret: credentials.client_secret,
    webhook_secret: credentials.webhook_secret,
  }
}

/**
 * Generate OAuth URL for Zoom (org-specific)
 */
export async function getZoomOAuthUrl(
  supabase: SupabaseClient,
  orgId: string,
  redirectUri: string,
  state: string
): Promise<string | null> {
  const credentials = await getZoomCredentials(supabase, orgId)
  if (!credentials) return null

  const params = new URLSearchParams({
    response_type: "code",
    client_id: credentials.client_id,
    redirect_uri: redirectUri,
    state,
  })

  return `${ZOOM_AUTH_URL}?${params.toString()}`
}

/**
 * Exchange authorization code for tokens (org-specific)
 */
export async function exchangeZoomCode(
  supabase: SupabaseClient,
  orgId: string,
  code: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
  const credentials = await getZoomCredentials(supabase, orgId)
  if (!credentials) return null

  const basicAuth = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString("base64")

  const response = await fetch(ZOOM_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    console.error("Zoom token exchange failed:", await response.text())
    return null
  }

  return response.json()
}

/**
 * Refresh Zoom access token (org-specific)
 */
export async function refreshZoomToken(
  supabase: SupabaseClient,
  orgId: string,
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
  const credentials = await getZoomCredentials(supabase, orgId)
  if (!credentials) return null

  const basicAuth = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString("base64")

  const response = await fetch(ZOOM_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    console.error("Zoom token refresh failed:", await response.text())
    return null
  }

  return response.json()
}

/**
 * Create a Zoom meeting using org's access token
 */
export async function createZoomMeeting(
  accessToken: string,
  meeting: ZoomMeetingInput
): Promise<ZoomMeeting> {
  const response = await fetch(`${ZOOM_API_BASE}/users/me/meetings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      topic: meeting.topic,
      type: meeting.type || 2,
      start_time: meeting.start_time,
      duration: meeting.duration || 60,
      timezone: meeting.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      agenda: meeting.agenda,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        mute_upon_entry: true,
        waiting_room: false,
        auto_recording: "none",
        ...meeting.settings,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Zoom API error: ${error.message || response.statusText}`)
  }

  return response.json()
}

/**
 * Delete a Zoom meeting
 */
export async function deleteZoomMeeting(
  accessToken: string,
  meetingId: string | number
): Promise<void> {
  const response = await fetch(`${ZOOM_API_BASE}/meetings/${meetingId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to delete Zoom meeting: ${response.statusText}`)
  }
}

/**
 * Test Zoom credentials by fetching user info
 */
export async function testZoomCredentials(
  supabase: SupabaseClient,
  orgId: string,
  accessToken: string,
  userId: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    const response = await fetch(`${ZOOM_API_BASE}/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return { success: false, error: "Invalid credentials or token" }
    }

    const user = await response.json()

    // Mark as verified and store metadata
    await markIntegrationVerified(supabase, orgId, "zoom", userId, {
      email: user.email,
      account_id: user.account_id,
      first_name: user.first_name,
      last_name: user.last_name,
    })

    return { success: true, email: user.email }
  } catch (err) {
    return { success: false, error: "Failed to verify Zoom credentials" }
  }
}

/**
 * Create interview meeting with Zoom (org-level)
 */
export async function createInterviewZoomMeeting(
  accessToken: string,
  options: {
    candidateName: string
    jobTitle: string
    interviewerName: string
    startTime: Date
    durationMinutes: number
    agenda?: string
  }
): Promise<ZoomMeeting> {
  return createZoomMeeting(accessToken, {
    topic: `Interview: ${options.candidateName} - ${options.jobTitle}`,
    type: 2,
    start_time: options.startTime.toISOString(),
    duration: options.durationMinutes,
    agenda: options.agenda || `Interview with ${options.candidateName} for ${options.jobTitle}.\nInterviewer: ${options.interviewerName}`,
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: true,
      mute_upon_entry: false,
      waiting_room: true,
      auto_recording: "cloud",
    },
  })
}
