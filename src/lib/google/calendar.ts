import { google, calendar_v3 } from "googleapis"

// OAuth2 client configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`
)

// Generate authorization URL for Google Calendar access
export function getAuthUrl(state: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    state,
    prompt: "consent",
  })
}

// Exchange authorization code for tokens
export async function getTokensFromCode(code: string): Promise<{
  access_token: string
  refresh_token?: string
  expiry_date?: number
}> {
  const { tokens } = await oauth2Client.getToken(code)
  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token || undefined,
    expiry_date: tokens.expiry_date || undefined,
  }
}

// Create an authenticated calendar client
export function getCalendarClient(accessToken: string, refreshToken?: string): calendar_v3.Calendar {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  return google.calendar({ version: "v3", auth })
}

export interface CalendarEventInput {
  summary: string
  description?: string
  location?: string
  startTime: Date
  endTime: Date
  attendees?: { email: string; name?: string }[]
  conferenceData?: boolean // If true, adds Google Meet link
  timeZone?: string // IANA timezone string (e.g., 'Asia/Riyadh')
}

export interface CalendarEventResult {
  id: string
  htmlLink: string
  hangoutLink?: string
  status: string
}

// Create a calendar event
export async function createCalendarEvent(
  calendar: calendar_v3.Calendar,
  event: CalendarEventInput
): Promise<CalendarEventResult> {
  const timeZone = event.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Riyadh"

  const eventBody: calendar_v3.Schema$Event = {
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
        { method: "email", minutes: 24 * 60 }, // 1 day before
        { method: "popup", minutes: 30 }, // 30 minutes before
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

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: eventBody,
    conferenceDataVersion: event.conferenceData ? 1 : 0,
    sendUpdates: "all", // Send email invites to attendees
  })

  return {
    id: response.data.id!,
    htmlLink: response.data.htmlLink!,
    hangoutLink: response.data.hangoutLink || undefined,
    status: response.data.status!,
  }
}

// Update a calendar event
export async function updateCalendarEvent(
  calendar: calendar_v3.Calendar,
  eventId: string,
  event: Partial<CalendarEventInput>
): Promise<CalendarEventResult> {
  const eventBody: calendar_v3.Schema$Event = {}

  if (event.summary) eventBody.summary = event.summary
  if (event.description) eventBody.description = event.description
  if (event.location) eventBody.location = event.location
  if (event.startTime) {
    eventBody.start = {
      dateTime: event.startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
  }
  if (event.endTime) {
    eventBody.end = {
      dateTime: event.endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
  }
  if (event.attendees) {
    eventBody.attendees = event.attendees.map((a) => ({
      email: a.email,
      displayName: a.name,
    }))
  }

  const response = await calendar.events.patch({
    calendarId: "primary",
    eventId,
    requestBody: eventBody,
    sendUpdates: "all",
  })

  return {
    id: response.data.id!,
    htmlLink: response.data.htmlLink!,
    hangoutLink: response.data.hangoutLink || undefined,
    status: response.data.status!,
  }
}

// Delete a calendar event
export async function deleteCalendarEvent(
  calendar: calendar_v3.Calendar,
  eventId: string
): Promise<void> {
  await calendar.events.delete({
    calendarId: "primary",
    eventId,
    sendUpdates: "all",
  })
}

// List upcoming events
export async function listUpcomingEvents(
  calendar: calendar_v3.Calendar,
  maxResults: number = 10
): Promise<calendar_v3.Schema$Event[]> {
  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
  })

  return response.data.items || []
}

// Check availability
export async function checkAvailability(
  calendar: calendar_v3.Calendar,
  startTime: Date,
  endTime: Date
): Promise<{ busy: boolean; conflicts: calendar_v3.Schema$Event[] }> {
  const events = await calendar.events.list({
    calendarId: "primary",
    timeMin: startTime.toISOString(),
    timeMax: endTime.toISOString(),
    singleEvents: true,
  })

  const conflicts = events.data.items || []

  return {
    busy: conflicts.length > 0,
    conflicts,
  }
}

// Get free/busy slots for a date range
export async function getFreeBusy(
  calendar: calendar_v3.Calendar,
  startTime: Date,
  endTime: Date,
  calendars: string[] = ["primary"]
): Promise<{ timeMin: string; timeMax: string }[]> {
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      items: calendars.map((id) => ({ id })),
    },
  })

  const busySlots: { timeMin: string; timeMax: string }[] = []

  for (const calendarId of calendars) {
    const calendarBusy = response.data.calendars?.[calendarId]?.busy || []
    for (const slot of calendarBusy) {
      if (slot.start && slot.end) {
        busySlots.push({
          timeMin: slot.start,
          timeMax: slot.end,
        })
      }
    }
  }

  return busySlots
}
