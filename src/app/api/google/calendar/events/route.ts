import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getCalendarClient,
  createCalendarEvent,
  listUpcomingEvents,
  CalendarEventInput,
} from "@/lib/google/calendar"

// Get upcoming events
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user's Google Calendar integration
  const { data: integration } = await supabase
    .from("user_integrations")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", "google_calendar")
    .single()

  if (!integration) {
    return NextResponse.json(
      { error: "Google Calendar not connected" },
      { status: 400 }
    )
  }

  try {
    const calendar = getCalendarClient(
      integration.access_token,
      integration.refresh_token
    )

    const events = await listUpcomingEvents(calendar, 20)

    return NextResponse.json({
      events: events.map((event) => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        location: event.location,
        htmlLink: event.htmlLink,
        hangoutLink: event.hangoutLink,
        attendees: event.attendees?.map((a) => ({
          email: a.email,
          name: a.displayName,
          status: a.responseStatus,
        })),
      })),
    })
  } catch (error) {
    console.error("Error fetching calendar events:", error)
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    )
  }
}

// Create a new event
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user's Google Calendar integration
  const { data: integration } = await supabase
    .from("user_integrations")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", "google_calendar")
    .single()

  if (!integration) {
    return NextResponse.json(
      { error: "Google Calendar not connected" },
      { status: 400 }
    )
  }

  try {
    const body = await request.json()

    const eventInput: CalendarEventInput = {
      summary: body.summary,
      description: body.description,
      location: body.location,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      attendees: body.attendees,
      conferenceData: body.addMeetLink ?? true,
      timeZone: body.timeZone,
    }

    const calendar = getCalendarClient(
      integration.access_token,
      integration.refresh_token
    )

    const result = await createCalendarEvent(calendar, eventInput)

    // If this is for an interview, update the interview record
    if (body.interviewId) {
      await supabase
        .from("interviews")
        .update({
          calendar_event_id: result.id,
          calendar_event_link: result.htmlLink,
          video_meeting_link: result.hangoutLink,
        })
        .eq("id", body.interviewId)
    }

    return NextResponse.json({
      success: true,
      event: result,
    })
  } catch (error) {
    console.error("Error creating calendar event:", error)
    return NextResponse.json(
      { error: "Failed to create calendar event" },
      { status: 500 }
    )
  }
}
