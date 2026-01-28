import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  createCalendarEvent,
  getCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  listCalendarEvents,
  createCalendarEventWithTeamsMeeting,
  refreshMicrosoftToken,
  CalendarEventInput,
} from "@/lib/microsoft/graph"

// Helper to get valid Microsoft access token
async function getValidMicrosoftToken(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: integration, error } = await supabase
    .from("user_integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "microsoft")
    .single()

  if (error || !integration) {
    return { error: "Microsoft not connected. Please connect your Microsoft account first." }
  }

  // Check if token is expired
  const expiresAt = new Date(integration.expires_at)
  const now = new Date()

  if (expiresAt <= now) {
    // Token expired, refresh it
    try {
      const newTokens = await refreshMicrosoftToken(integration.refresh_token)
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

      return { accessToken: newTokens.access_token }
    } catch (refreshError) {
      console.error("Error refreshing Microsoft token:", refreshError)
      return { error: "Microsoft token expired. Please reconnect your Microsoft account." }
    }
  }

  return { accessToken: integration.access_token }
}

// GET - List calendar events or get a specific event
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const eventId = searchParams.get("eventId")
  const startDateTime = searchParams.get("startDateTime")
  const endDateTime = searchParams.get("endDateTime")
  const top = searchParams.get("top")

  const tokenResult = await getValidMicrosoftToken(supabase, user.id)
  if ("error" in tokenResult) {
    return NextResponse.json({ error: tokenResult.error }, { status: 400 })
  }

  try {
    if (eventId) {
      const event = await getCalendarEvent(tokenResult.accessToken, eventId)
      return NextResponse.json(event)
    } else {
      const events = await listCalendarEvents(tokenResult.accessToken, {
        startDateTime: startDateTime || undefined,
        endDateTime: endDateTime || undefined,
        top: top ? parseInt(top, 10) : 50,
        orderBy: "start/dateTime",
      })
      return NextResponse.json(events)
    }
  } catch (err) {
    console.error("Error fetching calendar events:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch events" },
      { status: 500 }
    )
  }
}

// POST - Create a new calendar event
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tokenResult = await getValidMicrosoftToken(supabase, user.id)
  if ("error" in tokenResult) {
    return NextResponse.json({ error: tokenResult.error }, { status: 400 })
  }

  try {
    const body = await request.json()

    // Check if this should include a Teams meeting
    if (body.includeTeamsMeeting) {
      // Use the helper that creates event with Teams meeting
      const event = await createCalendarEventWithTeamsMeeting(tokenResult.accessToken, {
        subject: body.subject,
        body: body.body?.content,
        startTime: new Date(body.start.dateTime),
        endTime: new Date(body.end.dateTime),
        attendees: body.attendees?.map((a: { emailAddress: { address: string; name?: string } }) => ({
          email: a.emailAddress.address,
          name: a.emailAddress.name,
        })) || [],
        location: body.location?.displayName,
        timeZone: body.start.timeZone,
      })
      return NextResponse.json(event, { status: 201 })
    }

    // Standard calendar event without Teams
    const eventInput: CalendarEventInput = {
      subject: body.subject,
      body: body.body,
      start: body.start,
      end: body.end,
      location: body.location,
      attendees: body.attendees,
      isOnlineMeeting: body.isOnlineMeeting || false,
      onlineMeetingProvider: body.onlineMeetingProvider,
      reminderMinutesBeforeStart: body.reminderMinutesBeforeStart || 15,
    }

    if (!eventInput.subject) {
      return NextResponse.json({ error: "Event subject is required" }, { status: 400 })
    }
    if (!eventInput.start || !eventInput.end) {
      return NextResponse.json({ error: "Start and end times are required" }, { status: 400 })
    }

    const event = await createCalendarEvent(tokenResult.accessToken, eventInput)
    return NextResponse.json(event, { status: 201 })
  } catch (err) {
    console.error("Error creating calendar event:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create event" },
      { status: 500 }
    )
  }
}

// PATCH - Update a calendar event
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const eventId = searchParams.get("eventId")

  if (!eventId) {
    return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
  }

  const tokenResult = await getValidMicrosoftToken(supabase, user.id)
  if ("error" in tokenResult) {
    return NextResponse.json({ error: tokenResult.error }, { status: 400 })
  }

  try {
    const body: Partial<CalendarEventInput> = await request.json()
    const event = await updateCalendarEvent(tokenResult.accessToken, eventId, body)
    return NextResponse.json(event)
  } catch (err) {
    console.error("Error updating calendar event:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update event" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a calendar event
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const eventId = searchParams.get("eventId")

  if (!eventId) {
    return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
  }

  const tokenResult = await getValidMicrosoftToken(supabase, user.id)
  if ("error" in tokenResult) {
    return NextResponse.json({ error: tokenResult.error }, { status: 400 })
  }

  try {
    await deleteCalendarEvent(tokenResult.accessToken, eventId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error deleting calendar event:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete event" },
      { status: 500 }
    )
  }
}
