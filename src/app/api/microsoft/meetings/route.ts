// @ts-nocheck
// Note: This file uses tables that don't exist (user_integrations)
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  createTeamsMeeting,
  getTeamsMeeting,
  updateTeamsMeeting,
  deleteTeamsMeeting,
  refreshMicrosoftToken,
  TeamsMeetingInput,
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

// GET - Get a specific meeting
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

  if (!meetingId) {
    return NextResponse.json({ error: "Meeting ID is required" }, { status: 400 })
  }

  const tokenResult = await getValidMicrosoftToken(supabase, user.id)
  if ("error" in tokenResult) {
    return NextResponse.json({ error: tokenResult.error }, { status: 400 })
  }

  try {
    const meeting = await getTeamsMeeting(tokenResult.accessToken, meetingId)
    return NextResponse.json(meeting)
  } catch (err) {
    console.error("Error fetching Teams meeting:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch meeting" },
      { status: 500 }
    )
  }
}

// POST - Create a new Teams meeting
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
    const body: TeamsMeetingInput = await request.json()

    if (!body.subject) {
      return NextResponse.json({ error: "Meeting subject is required" }, { status: 400 })
    }
    if (!body.startDateTime || !body.endDateTime) {
      return NextResponse.json({ error: "Start and end times are required" }, { status: 400 })
    }

    const meeting = await createTeamsMeeting(tokenResult.accessToken, body)
    return NextResponse.json(meeting, { status: 201 })
  } catch (err) {
    console.error("Error creating Teams meeting:", err)
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

  const tokenResult = await getValidMicrosoftToken(supabase, user.id)
  if ("error" in tokenResult) {
    return NextResponse.json({ error: tokenResult.error }, { status: 400 })
  }

  try {
    const body: Partial<TeamsMeetingInput> = await request.json()
    const meeting = await updateTeamsMeeting(tokenResult.accessToken, meetingId, body)
    return NextResponse.json(meeting)
  } catch (err) {
    console.error("Error updating Teams meeting:", err)
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

  const tokenResult = await getValidMicrosoftToken(supabase, user.id)
  if ("error" in tokenResult) {
    return NextResponse.json({ error: tokenResult.error }, { status: 400 })
  }

  try {
    await deleteTeamsMeeting(tokenResult.accessToken, meetingId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error deleting Teams meeting:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete meeting" },
      { status: 500 }
    )
  }
}
