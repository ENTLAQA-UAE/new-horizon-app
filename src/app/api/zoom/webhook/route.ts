import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { verifyZoomWebhook, ZoomWebhookEvent } from "@/lib/zoom/zoom"

// Zoom sends webhook verification challenge
interface ZoomValidationEvent {
  event: "endpoint.url_validation"
  payload: {
    plainToken: string
  }
}

interface ZoomMeetingEvent {
  event: ZoomWebhookEvent
  event_ts: number
  payload: {
    account_id: string
    object: {
      id: string | number
      uuid: string
      host_id: string
      topic: string
      type: number
      start_time: string
      duration: number
      timezone: string
      participant?: {
        user_id: string
        user_name: string
        email: string
        join_time: string
        leave_time?: string
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    // Handle Zoom URL validation (for webhook registration)
    if (body.event === "endpoint.url_validation") {
      const validationEvent = body as ZoomValidationEvent
      const crypto = require("crypto")
      const hashForValidate = crypto
        .createHmac("sha256", process.env.ZOOM_WEBHOOK_SECRET_TOKEN || "")
        .update(validationEvent.payload.plainToken)
        .digest("hex")

      return NextResponse.json({
        plainToken: validationEvent.payload.plainToken,
        encryptedToken: hashForValidate,
      })
    }

    // Verify webhook signature for other events
    const signature = request.headers.get("x-zm-signature") || ""
    const timestamp = request.headers.get("x-zm-request-timestamp") || ""

    if (process.env.ZOOM_WEBHOOK_SECRET_TOKEN) {
      const isValid = verifyZoomWebhook(rawBody, signature, timestamp)
      if (!isValid) {
        console.warn("Invalid Zoom webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const event = body as ZoomMeetingEvent
    const supabase = createServiceClient()

    // Log the webhook event
    await supabase.from("integration_webhooks").insert({
      provider: "zoom",
      event_type: event.event,
      payload: body,
      processed: false,
    })

    // Process different event types
    switch (event.event) {
      case "meeting.started":
        await handleMeetingStarted(supabase, event)
        break

      case "meeting.ended":
        await handleMeetingEnded(supabase, event)
        break

      case "meeting.participant_joined":
        await handleParticipantJoined(supabase, event)
        break

      case "meeting.participant_left":
        await handleParticipantLeft(supabase, event)
        break

      case "recording.completed":
        await handleRecordingCompleted(supabase, event)
        break

      default:
        console.log(`Unhandled Zoom event: ${event.event}`)
    }

    // Mark webhook as processed
    await supabase
      .from("integration_webhooks")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("provider", "zoom")
      .eq("payload->event_ts", event.event_ts)

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("Zoom webhook error:", err)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}

async function handleMeetingStarted(
  supabase: ReturnType<typeof createServiceClient>,
  event: ZoomMeetingEvent
) {
  const meetingId = String(event.payload.object.id)

  // Update interview status if this meeting is linked to an interview
  await supabase
    .from("interviews")
    .update({
      status: "in_progress",
      actual_start_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("zoom_meeting_id", meetingId)

  console.log(`Meeting started: ${meetingId}`)
}

async function handleMeetingEnded(
  supabase: ReturnType<typeof createServiceClient>,
  event: ZoomMeetingEvent
) {
  const meetingId = String(event.payload.object.id)

  // Update interview status
  const { data: interview } = await supabase
    .from("interviews")
    .update({
      status: "completed",
      actual_end_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("zoom_meeting_id", meetingId)
    .select()
    .single()

  if (interview) {
    // Calculate actual duration
    const startTime = new Date(interview.actual_start_time || interview.scheduled_at)
    const endTime = new Date()
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

    await supabase
      .from("interviews")
      .update({ actual_duration_minutes: durationMinutes })
      .eq("id", interview.id)
  }

  console.log(`Meeting ended: ${meetingId}`)
}

async function handleParticipantJoined(
  supabase: ReturnType<typeof createServiceClient>,
  event: ZoomMeetingEvent
) {
  const meetingId = String(event.payload.object.id)
  const participant = event.payload.object.participant

  if (!participant) return

  // Log participant join (could be used for attendance tracking)
  console.log(`Participant joined meeting ${meetingId}: ${participant.user_name} (${participant.email})`)

  // Could update interview_participants table if needed
}

async function handleParticipantLeft(
  supabase: ReturnType<typeof createServiceClient>,
  event: ZoomMeetingEvent
) {
  const meetingId = String(event.payload.object.id)
  const participant = event.payload.object.participant

  if (!participant) return

  console.log(`Participant left meeting ${meetingId}: ${participant.user_name}`)
}

async function handleRecordingCompleted(
  supabase: ReturnType<typeof createServiceClient>,
  event: ZoomMeetingEvent
) {
  const meetingId = String(event.payload.object.id)

  // Store recording info in interview metadata
  await supabase
    .from("interviews")
    .update({
      metadata: supabase.sql`COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('recording_available', true, 'recording_event_ts', ${event.event_ts})`,
      updated_at: new Date().toISOString(),
    })
    .eq("zoom_meeting_id", meetingId)

  console.log(`Recording completed for meeting: ${meetingId}`)
}
