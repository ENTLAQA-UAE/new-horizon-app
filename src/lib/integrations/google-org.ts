/**
 * Google Integration with Organization-Level Credentials
 *
 * Each organization provides their own Google OAuth App credentials.
 * Supports Google Meet and Google Calendar.
 */

import { SupabaseClient } from "@supabase/supabase-js"
import { getOrgCredentials, markIntegrationVerified } from "./org-integrations"

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"

// Scopes for Calendar and Meet
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ")

// Types
export interface GoogleCredentials {
  client_id: string
  client_secret: string
}

export interface CalendarEventInput {
  summary: string
  description?: string
  location?: string
  startTime: Date
  endTime: Date
  attendees?: { email: string; name?: string }[]
  conferenceData?: boolean // Add Google Meet link
}

export interface CalendarEvent {
  id: string
  htmlLink: string
  hangoutLink?: string
  status: string
  summary: string
  start: { dateTime: string }
  end: { dateTime: string }
}

/**
 * Get Google credentials for an organization
 */
async function getGoogleCredentials(
  supabase: SupabaseClient,
  orgId: string
): Promise<GoogleCredentials | null> {
  const credentials = await getOrgCredentials(supabase, orgId, "google")
  if (!credentials) return null

  return {
    client_id: credentials.client_id,
    client_secret: credentials.client_secret,
  }
}

/**
 * Generate OAuth URL for Google (org-specific)
 */
export async function getGoogleOAuthUrl(
  supabase: SupabaseClient,
  orgId: string,
  redirectUri: string,
  state: string
): Promise<string | null> {
  const credentials = await getGoogleCredentials(supabase, orgId)
  if (!credentials) return null

  const params = new URLSearchParams({
    client_id: credentials.client_id,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    state,
    prompt: "consent",
  })

  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

/**
 * Exchange authorization code for tokens (org-specific)
 */
export async function exchangeGoogleCode(
  supabase: SupabaseClient,
  orgId: string,
  code: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
  const credentials = await getGoogleCredentials(supabase, orgId)
  if (!credentials) return null

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  })

  if (!response.ok) {
    console.error("Google token exchange failed:", await response.text())
    return null
  }

  return response.json()
}

/**
 * Refresh Google access token (org-specific)
 */
export async function refreshGoogleToken(
  supabase: SupabaseClient,
  orgId: string,
  refreshToken: string
): Promise<{ access_token: string; expires_in: number } | null> {
  const credentials = await getGoogleCredentials(supabase, orgId)
  if (!credentials) return null

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })

  if (!response.ok) {
    console.error("Google token refresh failed:", await response.text())
    return null
  }

  return response.json()
}

/**
 * Create calendar event with optional Google Meet
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  event: CalendarEventInput
): Promise<CalendarEvent> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const eventBody: Record<string, unknown> = {
    summary: event.summary,
    description: event.description,
    location: event.location,
    start: {
      dateTime: event.startTime.toISOString(),
      timeZone,
    },
    end: {
      dateTime: event.endTime.toISOString(),
      timeZone,
    },
    attendees: event.attendees?.map((a) => ({
      email: a.email,
      displayName: a.name,
    })),
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 30 },
      ],
    },
  }

  // Add Google Meet if requested
  if (event.conferenceData) {
    eventBody.conferenceData = {
      createRequest: {
        requestId: `interview-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    }
  }

  const url = `${GOOGLE_CALENDAR_API}/calendars/primary/events${event.conferenceData ? "?conferenceDataVersion=1" : ""}&sendUpdates=all`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(eventBody),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Google Calendar API error: ${error.error?.message || response.statusText}`)
  }

  return response.json()
}

/**
 * Delete calendar event
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}?sendUpdates=all`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to delete Google Calendar event: ${response.statusText}`)
  }
}

/**
 * Test Google credentials
 */
export async function testGoogleCredentials(
  supabase: SupabaseClient,
  orgId: string,
  accessToken: string,
  userId: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return { success: false, error: "Invalid credentials or token" }
    }

    const user = await response.json()

    await markIntegrationVerified(supabase, orgId, "google", userId, {
      email: user.email,
      name: user.name,
      picture: user.picture,
      google_id: user.id,
    })

    return { success: true, email: user.email }
  } catch (err) {
    return { success: false, error: "Failed to verify Google credentials" }
  }
}

/**
 * Create interview calendar event with Google Meet
 */
export async function createInterviewGoogleMeeting(
  accessToken: string,
  options: {
    candidateName: string
    candidateEmail: string
    jobTitle: string
    interviewerName: string
    interviewerEmail: string
    startTime: Date
    endTime: Date
    description?: string
  }
): Promise<CalendarEvent> {
  return createGoogleCalendarEvent(accessToken, {
    summary: `Interview: ${options.candidateName} - ${options.jobTitle}`,
    description: options.description ||
      `Interview with ${options.candidateName} for ${options.jobTitle}.\nInterviewer: ${options.interviewerName}`,
    startTime: options.startTime,
    endTime: options.endTime,
    attendees: [
      { email: options.candidateEmail, name: options.candidateName },
      { email: options.interviewerEmail, name: options.interviewerName },
    ],
    conferenceData: true,
  })
}
