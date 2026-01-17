/**
 * Zoom Integration Library
 * Handles OAuth authentication and meeting management via Zoom API
 */

// Zoom OAuth configuration
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID!
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET!
const ZOOM_REDIRECT_URI = process.env.ZOOM_REDIRECT_URI ||
  `${process.env.NEXT_PUBLIC_APP_URL}/api/zoom/callback`

const ZOOM_AUTH_URL = "https://zoom.us/oauth/authorize"
const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token"
const ZOOM_API_BASE = "https://api.zoom.us/v2"

// Types
export interface ZoomTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

export interface ZoomUser {
  id: string
  first_name: string
  last_name: string
  email: string
  type: number
  role_name: string
  pmi: number
  timezone: string
  dept: string
  pic_url: string
}

export interface ZoomMeetingInput {
  topic: string
  type?: 1 | 2 | 3 | 8 // 1=instant, 2=scheduled, 3=recurring no fixed time, 8=recurring fixed time
  start_time?: string // ISO 8601 format
  duration?: number // in minutes
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
    alternative_hosts?: string
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
  h323_password?: string
  pstn_password?: string
  encrypted_password?: string
  settings: {
    host_video: boolean
    participant_video: boolean
    join_before_host: boolean
    mute_upon_entry: boolean
    waiting_room: boolean
    auto_recording: string
  }
}

/**
 * Generate OAuth authorization URL for Zoom
 */
export function getZoomAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: ZOOM_CLIENT_ID,
    redirect_uri: ZOOM_REDIRECT_URI,
    state,
  })

  return `${ZOOM_AUTH_URL}?${params.toString()}`
}

/**
 * Exchange authorization code for access tokens
 */
export async function getZoomTokensFromCode(code: string): Promise<ZoomTokens> {
  const basicAuth = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64")

  const response = await fetch(ZOOM_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: ZOOM_REDIRECT_URI,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Zoom OAuth error: ${error.reason || error.message || "Unknown error"}`)
  }

  return response.json()
}

/**
 * Refresh access token using refresh token
 */
export async function refreshZoomToken(refreshToken: string): Promise<ZoomTokens> {
  const basicAuth = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64")

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
    const error = await response.json()
    throw new Error(`Zoom token refresh error: ${error.reason || error.message || "Unknown error"}`)
  }

  return response.json()
}

/**
 * Make authenticated request to Zoom API
 */
async function zoomApiRequest<T>(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${ZOOM_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }))
    throw new Error(`Zoom API error: ${error.message || response.statusText}`)
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

/**
 * Get current user info
 */
export async function getZoomUser(accessToken: string): Promise<ZoomUser> {
  return zoomApiRequest<ZoomUser>(accessToken, "/users/me")
}

/**
 * Create a Zoom meeting
 */
export async function createZoomMeeting(
  accessToken: string,
  meeting: ZoomMeetingInput
): Promise<ZoomMeeting> {
  const body: ZoomMeetingInput = {
    topic: meeting.topic,
    type: meeting.type || 2, // Default to scheduled meeting
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
  }

  if (meeting.password) {
    body.password = meeting.password
  }

  return zoomApiRequest<ZoomMeeting>(accessToken, "/users/me/meetings", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

/**
 * Get meeting details
 */
export async function getZoomMeeting(
  accessToken: string,
  meetingId: string | number
): Promise<ZoomMeeting> {
  return zoomApiRequest<ZoomMeeting>(accessToken, `/meetings/${meetingId}`)
}

/**
 * Update a Zoom meeting
 */
export async function updateZoomMeeting(
  accessToken: string,
  meetingId: string | number,
  updates: Partial<ZoomMeetingInput>
): Promise<void> {
  await zoomApiRequest(accessToken, `/meetings/${meetingId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  })
}

/**
 * Delete a Zoom meeting
 */
export async function deleteZoomMeeting(
  accessToken: string,
  meetingId: string | number
): Promise<void> {
  await zoomApiRequest(accessToken, `/meetings/${meetingId}`, {
    method: "DELETE",
  })
}

/**
 * List user's scheduled meetings
 */
export async function listZoomMeetings(
  accessToken: string,
  type: "scheduled" | "live" | "upcoming" = "upcoming",
  pageSize: number = 30
): Promise<{ meetings: ZoomMeeting[]; total_records: number }> {
  return zoomApiRequest(
    accessToken,
    `/users/me/meetings?type=${type}&page_size=${pageSize}`
  )
}

/**
 * Create meeting for interview
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
    agenda: options.agenda || `Interview with ${options.candidateName} for ${options.jobTitle} position.\nInterviewer: ${options.interviewerName}`,
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

// Webhook verification
export function verifyZoomWebhook(
  payload: string,
  signature: string,
  timestamp: string
): boolean {
  const crypto = require("crypto")
  const message = `v0:${timestamp}:${payload}`
  const hashForVerify = crypto
    .createHmac("sha256", process.env.ZOOM_WEBHOOK_SECRET_TOKEN || "")
    .update(message)
    .digest("hex")
  const expectedSignature = `v0=${hashForVerify}`
  return signature === expectedSignature
}

// Webhook event types
export type ZoomWebhookEvent =
  | "meeting.created"
  | "meeting.updated"
  | "meeting.deleted"
  | "meeting.started"
  | "meeting.ended"
  | "meeting.participant_joined"
  | "meeting.participant_left"
  | "recording.completed"
