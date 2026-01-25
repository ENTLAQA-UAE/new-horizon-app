// @ts-nocheck
/**
 * Zoom Meetings API
 * Uses organization-level credentials from organization_integrations
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { decryptCredentials } from "@/lib/encryption"

interface ZoomMeetingInput {
  topic: string
  start_time: string
  duration: number
  timezone?: string
  agenda?: string
}

// Helper to get valid Zoom access token using org credentials
async function getOrgZoomToken(orgId: string) {
  const serviceClient = createServiceClient()

  const { data: integration, error } = await serviceClient
    .from("organization_integrations")
    .select("credentials_encrypted, provider_metadata, is_enabled, is_verified")
    .eq("org_id", orgId)
    .eq("provider", "zoom")
    .single()

  if (error || !integration) {
    return { error: "Zoom integration not configured for this organization" }
  }

  if (!integration.is_enabled) {
    return { error: "Zoom integration is disabled" }
  }

  const metadata = (integration.provider_metadata as Record<string, any>) || {}

  if (!metadata.access_token) {
    return { error: "Zoom account not connected. Please complete OAuth setup in Settings → Integrations." }
  }

  // Check if token is expired
  const expiryDate = metadata.expiry_date
  const now = Date.now()

  if (expiryDate && expiryDate <= now && metadata.refresh_token) {
    // Token expired, refresh it
    let credentials: Record<string, string> | null = null

    if (integration.credentials_encrypted) {
      try {
        credentials = decryptCredentials(integration.credentials_encrypted)
      } catch (err) {
        console.error("Error decrypting Zoom credentials:", err)
        return { error: "Failed to decrypt Zoom credentials" }
      }
    }

    if (!credentials) {
      return { error: "Zoom credentials not configured" }
    }

    try {
      const basicAuth = Buffer.from(
        `${credentials.client_id}:${credentials.client_secret}`
      ).toString("base64")

      const response = await fetch("https://zoom.us/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: metadata.refresh_token,
        }),
      })

      if (!response.ok) {
        return { error: "Zoom token expired. Please reconnect Zoom in Settings → Integrations." }
      }

      const newTokens = await response.json()
      const newExpiryDate = Date.now() + newTokens.expires_in * 1000

      // Update stored tokens
      await serviceClient
        .from("organization_integrations")
        .update({
          provider_metadata: {
            ...metadata,
            access_token: newTokens.access_token,
            refresh_token: newTokens.refresh_token || metadata.refresh_token,
            expiry_date: newExpiryDate,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("org_id", orgId)
        .eq("provider", "zoom")

      return { accessToken: newTokens.access_token }
    } catch (err) {
      console.error("Error refreshing Zoom token:", err)
      return { error: "Zoom token expired. Please reconnect Zoom in Settings → Integrations." }
    }
  }

  return { accessToken: metadata.access_token }
}

// POST - Create a new Zoom meeting
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user's org_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) {
    return NextResponse.json({ error: "User not associated with an organization" }, { status: 400 })
  }

  const tokenResult = await getOrgZoomToken(profile.org_id)

  if ("error" in tokenResult) {
    return NextResponse.json({ error: tokenResult.error }, { status: 400 })
  }

  try {
    const body: ZoomMeetingInput = await request.json()

    if (!body.topic) {
      return NextResponse.json({ error: "Meeting topic is required" }, { status: 400 })
    }

    // Create Zoom meeting
    const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenResult.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: body.topic,
        type: 2, // Scheduled meeting
        start_time: body.start_time,
        duration: body.duration,
        timezone: body.timezone || "Asia/Riyadh",
        agenda: body.agenda || "",
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          mute_upon_entry: false,
          waiting_room: false,
          auto_recording: "none",
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Zoom API error:", errorData)
      return NextResponse.json(
        { error: errorData.message || "Failed to create Zoom meeting" },
        { status: response.status }
      )
    }

    const meeting = await response.json()

    return NextResponse.json({
      id: meeting.id,
      join_url: meeting.join_url,
      start_url: meeting.start_url,
      password: meeting.password,
      topic: meeting.topic,
    }, { status: 201 })
  } catch (err) {
    console.error("Error creating Zoom meeting:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create meeting" },
      { status: 500 }
    )
  }
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

  // Get user's org_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) {
    return NextResponse.json({ error: "User not associated with an organization" }, { status: 400 })
  }

  const tokenResult = await getOrgZoomToken(profile.org_id)

  if ("error" in tokenResult) {
    return NextResponse.json({ error: tokenResult.error }, { status: 400 })
  }

  const searchParams = request.nextUrl.searchParams
  const meetingId = searchParams.get("meetingId")

  try {
    if (meetingId) {
      const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
        headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
      })

      if (!response.ok) {
        return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
      }

      const meeting = await response.json()
      return NextResponse.json(meeting)
    } else {
      const response = await fetch(
        "https://api.zoom.us/v2/users/me/meetings?type=upcoming&page_size=30",
        {
          headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
        }
      )

      if (!response.ok) {
        return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 })
      }

      const data = await response.json()
      return NextResponse.json(data.meetings || [])
    }
  } catch (err) {
    console.error("Error fetching Zoom meetings:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch meetings" },
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

  // Get user's org_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) {
    return NextResponse.json({ error: "User not associated with an organization" }, { status: 400 })
  }

  const tokenResult = await getOrgZoomToken(profile.org_id)

  if ("error" in tokenResult) {
    return NextResponse.json({ error: tokenResult.error }, { status: 400 })
  }

  const searchParams = request.nextUrl.searchParams
  const meetingId = searchParams.get("meetingId")

  if (!meetingId) {
    return NextResponse.json({ error: "Meeting ID is required" }, { status: 400 })
  }

  try {
    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
    })

    if (!response.ok && response.status !== 204) {
      return NextResponse.json({ error: "Failed to delete meeting" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error deleting Zoom meeting:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete meeting" },
      { status: 500 }
    )
  }
}
