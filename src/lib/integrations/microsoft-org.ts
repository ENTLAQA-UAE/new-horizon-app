/**
 * Microsoft Integration with Organization-Level Credentials
 *
 * Each organization provides their own Azure AD App credentials.
 * Supports Teams meetings and Outlook Calendar.
 */

import { SupabaseClient } from "@supabase/supabase-js"
import { getOrgCredentials, markIntegrationVerified } from "./org-integrations"

const GRAPH_API_BASE = "https://graph.microsoft.com/v1.0"

// Scopes for Teams and Calendar
const SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "User.Read",
  "Calendars.ReadWrite",
  "OnlineMeetings.ReadWrite",
].join(" ")

// Types
export interface MicrosoftCredentials {
  client_id: string
  client_secret: string
  tenant_id: string
}

export interface TeamsMeetingInput {
  subject: string
  startDateTime: string
  endDateTime: string
  participants?: {
    attendees: {
      emailAddress: { address: string; name?: string }
      type: "required" | "optional"
    }[]
  }
}

export interface TeamsMeeting {
  id: string
  creationDateTime: string
  startDateTime: string
  endDateTime: string
  subject: string
  joinUrl: string
  joinWebUrl: string
}

export interface CalendarEventInput {
  subject: string
  body?: { contentType: "text" | "html"; content: string }
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
  attendees?: { emailAddress: { address: string; name?: string }; type: "required" | "optional" }[]
  isOnlineMeeting?: boolean
  onlineMeetingProvider?: "teamsForBusiness"
}

export interface CalendarEvent {
  id: string
  subject: string
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
  webLink: string
  onlineMeeting?: { joinUrl: string }
}

/**
 * Get Microsoft credentials for an organization
 */
async function getMicrosoftCredentials(
  supabase: SupabaseClient,
  orgId: string
): Promise<MicrosoftCredentials | null> {
  const credentials = await getOrgCredentials(supabase, orgId, "microsoft")
  if (!credentials) return null

  return {
    client_id: credentials.client_id,
    client_secret: credentials.client_secret,
    tenant_id: credentials.tenant_id || "common",
  }
}

/**
 * Generate OAuth URL for Microsoft (org-specific)
 */
export async function getMicrosoftOAuthUrl(
  supabase: SupabaseClient,
  orgId: string,
  redirectUri: string,
  state: string
): Promise<string | null> {
  const credentials = await getMicrosoftCredentials(supabase, orgId)
  if (!credentials) return null

  const authUrl = `https://login.microsoftonline.com/${credentials.tenant_id}/oauth2/v2.0/authorize`

  const params = new URLSearchParams({
    client_id: credentials.client_id,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: SCOPES,
    state,
    prompt: "consent",
  })

  return `${authUrl}?${params.toString()}`
}

/**
 * Exchange authorization code for tokens (org-specific)
 */
export async function exchangeMicrosoftCode(
  supabase: SupabaseClient,
  orgId: string,
  code: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
  const credentials = await getMicrosoftCredentials(supabase, orgId)
  if (!credentials) return null

  const tokenUrl = `https://login.microsoftonline.com/${credentials.tenant_id}/oauth2/v2.0/token`

  const response = await fetch(tokenUrl, {
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
      scope: SCOPES,
    }),
  })

  if (!response.ok) {
    console.error("Microsoft token exchange failed:", await response.text())
    return null
  }

  return response.json()
}

/**
 * Refresh Microsoft access token (org-specific)
 */
export async function refreshMicrosoftToken(
  supabase: SupabaseClient,
  orgId: string,
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
  const credentials = await getMicrosoftCredentials(supabase, orgId)
  if (!credentials) return null

  const tokenUrl = `https://login.microsoftonline.com/${credentials.tenant_id}/oauth2/v2.0/token`

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: SCOPES,
    }),
  })

  if (!response.ok) {
    console.error("Microsoft token refresh failed:", await response.text())
    return null
  }

  return response.json()
}

/**
 * Make Graph API request
 */
async function graphApiRequest<T>(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${GRAPH_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Graph API error: ${error.error?.message || response.statusText}`)
  }

  if (response.status === 204) return {} as T
  return response.json()
}

/**
 * Create Teams meeting
 */
export async function createTeamsMeeting(
  accessToken: string,
  meeting: TeamsMeetingInput
): Promise<TeamsMeeting> {
  return graphApiRequest<TeamsMeeting>(accessToken, "/me/onlineMeetings", {
    method: "POST",
    body: JSON.stringify({
      subject: meeting.subject,
      startDateTime: meeting.startDateTime,
      endDateTime: meeting.endDateTime,
      participants: meeting.participants,
      lobbyBypassSettings: { scope: "organization" },
      allowedPresenters: "everyone",
    }),
  })
}

/**
 * Delete Teams meeting
 */
export async function deleteTeamsMeeting(
  accessToken: string,
  meetingId: string
): Promise<void> {
  await graphApiRequest(accessToken, `/me/onlineMeetings/${meetingId}`, {
    method: "DELETE",
  })
}

/**
 * Create calendar event with optional Teams meeting
 */
export async function createCalendarEvent(
  accessToken: string,
  event: CalendarEventInput
): Promise<CalendarEvent> {
  return graphApiRequest<CalendarEvent>(accessToken, "/me/events", {
    method: "POST",
    body: JSON.stringify(event),
  })
}

/**
 * Delete calendar event
 */
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  await graphApiRequest(accessToken, `/me/events/${eventId}`, {
    method: "DELETE",
  })
}

/**
 * Test Microsoft credentials
 */
export async function testMicrosoftCredentials(
  supabase: SupabaseClient,
  orgId: string,
  accessToken: string,
  userId: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    const user = await graphApiRequest<{
      id: string
      displayName: string
      mail: string
      userPrincipalName: string
    }>(accessToken, "/me")

    await markIntegrationVerified(supabase, orgId, "microsoft", userId, {
      email: user.mail || user.userPrincipalName,
      display_name: user.displayName,
      microsoft_id: user.id,
    })

    return { success: true, email: user.mail || user.userPrincipalName }
  } catch (err) {
    return { success: false, error: "Failed to verify Microsoft credentials" }
  }
}

/**
 * Create interview Teams meeting
 */
export async function createInterviewTeamsMeeting(
  accessToken: string,
  options: {
    candidateName: string
    candidateEmail: string
    jobTitle: string
    interviewerEmail: string
    startTime: Date
    endTime: Date
  }
): Promise<TeamsMeeting> {
  return createTeamsMeeting(accessToken, {
    subject: `Interview: ${options.candidateName} - ${options.jobTitle}`,
    startDateTime: options.startTime.toISOString(),
    endDateTime: options.endTime.toISOString(),
    participants: {
      attendees: [
        { emailAddress: { address: options.candidateEmail }, type: "required" },
        { emailAddress: { address: options.interviewerEmail }, type: "required" },
      ],
    },
  })
}

/**
 * Create calendar event with Teams meeting for interview
 */
export async function createInterviewCalendarEvent(
  accessToken: string,
  options: {
    candidateName: string
    candidateEmail: string
    jobTitle: string
    interviewerEmail: string
    startTime: Date
    endTime: Date
    description?: string
  }
): Promise<CalendarEvent> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  return createCalendarEvent(accessToken, {
    subject: `Interview: ${options.candidateName} - ${options.jobTitle}`,
    body: options.description
      ? { contentType: "html", content: options.description }
      : undefined,
    start: { dateTime: options.startTime.toISOString(), timeZone },
    end: { dateTime: options.endTime.toISOString(), timeZone },
    attendees: [
      { emailAddress: { address: options.candidateEmail, name: options.candidateName }, type: "required" },
      { emailAddress: { address: options.interviewerEmail }, type: "required" },
    ],
    isOnlineMeeting: true,
    onlineMeetingProvider: "teamsForBusiness",
  })
}
