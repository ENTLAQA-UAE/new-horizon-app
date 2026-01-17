/**
 * Microsoft Graph API Integration
 * Handles OAuth authentication, Teams meetings, and Outlook Calendar via Microsoft Graph API
 */

// Microsoft OAuth configuration
const MS_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID!
const MS_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET!
const MS_TENANT_ID = process.env.MICROSOFT_TENANT_ID || "common" // 'common' for multi-tenant
const MS_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI ||
  `${process.env.NEXT_PUBLIC_APP_URL}/api/microsoft/callback`

const MS_AUTH_URL = `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/authorize`
const MS_TOKEN_URL = `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`
const GRAPH_API_BASE = "https://graph.microsoft.com/v1.0"

// Scopes for Teams meetings and Calendar
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
export interface MicrosoftTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
  id_token?: string
}

export interface MicrosoftUser {
  id: string
  displayName: string
  givenName: string
  surname: string
  mail: string
  userPrincipalName: string
  jobTitle?: string
  officeLocation?: string
}

export interface TeamsMeetingInput {
  subject: string
  startDateTime: string // ISO 8601
  endDateTime: string // ISO 8601
  participants?: {
    attendees: {
      emailAddress: { address: string; name?: string }
      type: "required" | "optional"
    }[]
  }
  lobbyBypassSettings?: {
    scope: "everyone" | "organization" | "organizationAndFederated" | "organizer" | "invited"
  }
  isEntryExitAnnounced?: boolean
  allowedPresenters?: "everyone" | "organization" | "roleIsPresenter" | "organizer"
}

export interface TeamsMeeting {
  id: string
  creationDateTime: string
  startDateTime: string
  endDateTime: string
  subject: string
  joinUrl: string
  joinWebUrl: string
  meetingCode?: string
  videoTeleconferenceId?: string
  participants?: {
    organizer: {
      identity: {
        user: { id: string; displayName: string }
      }
    }
    attendees: {
      identity: {
        user: { id: string; displayName: string }
      }
    }[]
  }
  lobbyBypassSettings?: {
    scope: string
  }
}

export interface CalendarEventInput {
  subject: string
  body?: {
    contentType: "text" | "html"
    content: string
  }
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  location?: {
    displayName: string
  }
  attendees?: {
    emailAddress: { address: string; name?: string }
    type: "required" | "optional" | "resource"
  }[]
  isOnlineMeeting?: boolean
  onlineMeetingProvider?: "teamsForBusiness" | "skypeForBusiness" | "skypeForConsumer"
  reminderMinutesBeforeStart?: number
}

export interface CalendarEvent {
  id: string
  subject: string
  bodyPreview: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  location?: {
    displayName: string
  }
  organizer: {
    emailAddress: { address: string; name: string }
  }
  attendees?: {
    emailAddress: { address: string; name?: string }
    type: string
    status: { response: string; time: string }
  }[]
  webLink: string
  onlineMeeting?: {
    joinUrl: string
  }
  isOnlineMeeting: boolean
}

/**
 * Generate OAuth authorization URL for Microsoft
 */
export function getMicrosoftAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: MS_CLIENT_ID,
    response_type: "code",
    redirect_uri: MS_REDIRECT_URI,
    response_mode: "query",
    scope: SCOPES,
    state,
    prompt: "consent",
  })

  return `${MS_AUTH_URL}?${params.toString()}`
}

/**
 * Exchange authorization code for access tokens
 */
export async function getMicrosoftTokensFromCode(code: string): Promise<MicrosoftTokens> {
  const response = await fetch(MS_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: MS_CLIENT_ID,
      client_secret: MS_CLIENT_SECRET,
      code,
      redirect_uri: MS_REDIRECT_URI,
      grant_type: "authorization_code",
      scope: SCOPES,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Microsoft OAuth error: ${error.error_description || error.error || "Unknown error"}`)
  }

  return response.json()
}

/**
 * Refresh access token using refresh token
 */
export async function refreshMicrosoftToken(refreshToken: string): Promise<MicrosoftTokens> {
  const response = await fetch(MS_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: MS_CLIENT_ID,
      client_secret: MS_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: SCOPES,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Microsoft token refresh error: ${error.error_description || error.error || "Unknown error"}`)
  }

  return response.json()
}

/**
 * Make authenticated request to Microsoft Graph API
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
    const error = await response.json().catch(() => ({ message: "Unknown error" }))
    throw new Error(`Graph API error: ${error.error?.message || error.message || response.statusText}`)
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
export async function getMicrosoftUser(accessToken: string): Promise<MicrosoftUser> {
  return graphApiRequest<MicrosoftUser>(accessToken, "/me")
}

// =============================================================================
// TEAMS MEETINGS
// =============================================================================

/**
 * Create a Teams online meeting
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
      lobbyBypassSettings: meeting.lobbyBypassSettings || {
        scope: "organization",
      },
      isEntryExitAnnounced: meeting.isEntryExitAnnounced ?? true,
      allowedPresenters: meeting.allowedPresenters || "everyone",
    }),
  })
}

/**
 * Get Teams meeting details
 */
export async function getTeamsMeeting(
  accessToken: string,
  meetingId: string
): Promise<TeamsMeeting> {
  return graphApiRequest<TeamsMeeting>(accessToken, `/me/onlineMeetings/${meetingId}`)
}

/**
 * Update a Teams meeting
 */
export async function updateTeamsMeeting(
  accessToken: string,
  meetingId: string,
  updates: Partial<TeamsMeetingInput>
): Promise<TeamsMeeting> {
  return graphApiRequest<TeamsMeeting>(accessToken, `/me/onlineMeetings/${meetingId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  })
}

/**
 * Delete a Teams meeting
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
 * Create Teams meeting for interview
 */
export async function createInterviewTeamsMeeting(
  accessToken: string,
  options: {
    candidateName: string
    candidateEmail: string
    jobTitle: string
    interviewerName: string
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
        {
          emailAddress: { address: options.candidateEmail, name: options.candidateName },
          type: "required",
        },
        {
          emailAddress: { address: options.interviewerEmail, name: options.interviewerName },
          type: "required",
        },
      ],
    },
    lobbyBypassSettings: {
      scope: "invited", // Only invited participants can bypass lobby
    },
    allowedPresenters: "everyone",
  })
}

// =============================================================================
// OUTLOOK CALENDAR
// =============================================================================

/**
 * Create a calendar event
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
 * Get calendar event details
 */
export async function getCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<CalendarEvent> {
  return graphApiRequest<CalendarEvent>(accessToken, `/me/events/${eventId}`)
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  updates: Partial<CalendarEventInput>
): Promise<CalendarEvent> {
  return graphApiRequest<CalendarEvent>(accessToken, `/me/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  })
}

/**
 * Delete a calendar event
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
 * List calendar events
 */
export async function listCalendarEvents(
  accessToken: string,
  options?: {
    startDateTime?: string
    endDateTime?: string
    top?: number
    orderBy?: string
  }
): Promise<{ value: CalendarEvent[] }> {
  const params = new URLSearchParams()

  if (options?.startDateTime && options?.endDateTime) {
    params.set(
      "$filter",
      `start/dateTime ge '${options.startDateTime}' and end/dateTime le '${options.endDateTime}'`
    )
  }
  if (options?.top) {
    params.set("$top", String(options.top))
  }
  if (options?.orderBy) {
    params.set("$orderby", options.orderBy)
  }

  const query = params.toString() ? `?${params.toString()}` : ""
  return graphApiRequest(accessToken, `/me/events${query}`)
}

/**
 * Create calendar event with Teams meeting
 */
export async function createCalendarEventWithTeamsMeeting(
  accessToken: string,
  options: {
    subject: string
    body?: string
    startTime: Date
    endTime: Date
    attendees: { email: string; name?: string }[]
    location?: string
    timeZone?: string
  }
): Promise<CalendarEvent> {
  const timeZone = options.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone

  return createCalendarEvent(accessToken, {
    subject: options.subject,
    body: options.body
      ? {
          contentType: "html",
          content: options.body,
        }
      : undefined,
    start: {
      dateTime: options.startTime.toISOString(),
      timeZone,
    },
    end: {
      dateTime: options.endTime.toISOString(),
      timeZone,
    },
    location: options.location
      ? { displayName: options.location }
      : undefined,
    attendees: options.attendees.map((a) => ({
      emailAddress: { address: a.email, name: a.name },
      type: "required" as const,
    })),
    isOnlineMeeting: true,
    onlineMeetingProvider: "teamsForBusiness",
    reminderMinutesBeforeStart: 15,
  })
}

/**
 * Get free/busy schedule
 */
export async function getSchedule(
  accessToken: string,
  schedules: string[], // email addresses
  startTime: Date,
  endTime: Date,
  timeZone?: string
): Promise<{
  value: {
    scheduleId: string
    availabilityView: string
    scheduleItems: {
      status: string
      start: { dateTime: string; timeZone: string }
      end: { dateTime: string; timeZone: string }
    }[]
    workingHours: {
      daysOfWeek: string[]
      startTime: string
      endTime: string
      timeZone: { name: string }
    }
  }[]
}> {
  const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone

  return graphApiRequest(accessToken, "/me/calendar/getSchedule", {
    method: "POST",
    body: JSON.stringify({
      schedules,
      startTime: {
        dateTime: startTime.toISOString(),
        timeZone: tz,
      },
      endTime: {
        dateTime: endTime.toISOString(),
        timeZone: tz,
      },
      availabilityViewInterval: 30, // 30-minute slots
    }),
  })
}

/**
 * Find meeting times (scheduling assistant)
 */
export async function findMeetingTimes(
  accessToken: string,
  options: {
    attendees: { email: string; type?: "required" | "optional" }[]
    durationMinutes: number
    timeConstraint: {
      startTime: Date
      endTime: Date
    }
    maxCandidates?: number
    isOrganizerOptional?: boolean
  }
): Promise<{
  meetingTimeSuggestions: {
    confidence: number
    organizerAvailability: string
    attendeeAvailability: { availability: string; attendee: { emailAddress: { address: string } } }[]
    meetingTimeSlot: {
      start: { dateTime: string; timeZone: string }
      end: { dateTime: string; timeZone: string }
    }
  }[]
}> {
  return graphApiRequest(accessToken, "/me/findMeetingTimes", {
    method: "POST",
    body: JSON.stringify({
      attendees: options.attendees.map((a) => ({
        emailAddress: { address: a.email },
        type: a.type || "required",
      })),
      meetingDuration: `PT${options.durationMinutes}M`,
      timeConstraint: {
        timeslots: [
          {
            start: {
              dateTime: options.timeConstraint.startTime.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
              dateTime: options.timeConstraint.endTime.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
          },
        ],
      },
      maxCandidates: options.maxCandidates || 10,
      isOrganizerOptional: options.isOrganizerOptional || false,
    }),
  })
}
