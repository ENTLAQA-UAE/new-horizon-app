import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  createZoomMeeting,
  getZoomMeeting,
  updateZoomMeeting,
  deleteZoomMeeting,
  listZoomMeetings,
  refreshZoomToken,
  ZoomMeetingInput,
} from "@/lib/zoom/zoom"

// Helper to get valid Zoom access token
async function getValidZoomToken(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: integration, error } = await supabase
    .from("user_integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "zoom")
    .single()

  if (error || !integration) {
    return { error: "Zoom not connected. Please connect your Zoom account first." }
  }

  // Check if token is expired
  const expiresAt = new Date(integration.expires_at)
  const now = new Date()

  if (expiresAt <= now) {
    // Token expired, refresh it
    try {
      const newTokens = await refreshZoomToken(integration.refresh_token)
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
      console.error("Error refreshing Zoom token:", refreshError)
      return { error: "Zoom token expired. Please reconnect your Zoom account." }
    }
  }

  return { accessToken: integration.access_token }
}

// GET - List meetings or get a specific meeting
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const meetingId = searchParams.get("meetingId")
  const type = searchParams.get("type") as "scheduled" | "live" | "upcoming" | null

  const tokenResult = await getValidZoomToken(supabase, user.id)
  if ("error" in tokenResult) {
    return NextResponse.json({ error: tokenResult.error }, { status: 400 })
  }

  try {
    if (meetingId) {
      const meeting = await getZoomMeeting(tokenResult.accessToken, meetingId)
      return NextResponse.json(meeting)
    } else {
      const meetings = await listZoomMeetings(tokenResult.accessToken, type || "upcoming")
      return NextResponse.json(meetings)
    }
  } catch (err) {
    console.error("Error fetching Zoom meetings:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch meetings" },
      { status: 500 }
    )
  }
}

// POST - Create a new meeting
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tokenResult = await getValidZoomToken(supabase, user.id)
  if ("error" in tokenResult) {
    return NextResponse.json({ error: tokenResult.error }, { status: 400 })
  }

  try {
    const body: ZoomMeetingInput = await request.json()

    if (!body.topic) {
      return NextResponse.json({ error: "Meeting topic is required" }, { status: 400 })
    }

    const meeting = await createZoomMeeting(tokenResult.accessToken, body)
    return NextResponse.json(meeting, { status: 201 })
  } catch (err) {
    console.error("Error creating Zoom meeting:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create meeting" },
      { status: 500 }
    )
  }
}

// PATCH - Update a meeting
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const meetingId = searchParams.get("meetingId")

  if (!meetingId) {
    return NextResponse.json({ error: "Meeting ID is required" }, { status: 400 })
  }

  const tokenResult = await getValidZoomToken(supabase, user.id)
  if ("error" in tokenResult) {
    return NextResponse.json({ error: tokenResult.error }, { status: 400 })
  }

  try {
    const body: Partial<ZoomMeetingInput> = await request.json()
    await updateZoomMeeting(tokenResult.accessToken, meetingId, body)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error updating Zoom meeting:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update meeting" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a meeting
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const meetingId = searchParams.get("meetingId")

  if (!meetingId) {
    return NextResponse.json({ error: "Meeting ID is required" }, { status: 400 })
  }

  const tokenResult = await getValidZoomToken(supabase, user.id)
  if ("error" in tokenResult) {
    return NextResponse.json({ error: tokenResult.error }, { status: 400 })
  }

  try {
    await deleteZoomMeeting(tokenResult.accessToken, meetingId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error deleting Zoom meeting:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete meeting" },
      { status: 500 }
    )
  }
}
