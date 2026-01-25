// @ts-nocheck
/**
 * Microsoft Teams Meetings API
 * Uses organization-level credentials from organization_integrations
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { decryptCredentials } from "@/lib/encryption"

interface TeamsMeetingInput {
  subject: string
  startDateTime: string
  endDateTime: string
  isOnlineMeeting?: boolean
  attendees?: { email: string; name?: string }[]
}

// Helper to get valid Microsoft access token using org credentials
async function getOrgMicrosoftToken(orgId: string) {
  const serviceClient = createServiceClient()

  const { data: integration, error } = await serviceClient
    .from("organization_integrations")
    .select("credentials_encrypted, provider_metadata, is_enabled, is_verified")
    .eq("org_id", orgId)
    .eq("provider", "microsoft")
    .single()

  if (error || !integration) {
    return { error: "Microsoft Teams integration not configured for this organization" }
  }

  if (!integration.is_enabled) {
    return { error: "Microsoft Teams integration is disabled" }
  }

  const metadata = (integration.provider_metadata as Record<string, any>) || {}

  if (!metadata.access_token) {
    return { error: "Microsoft account not connected. Please complete OAuth setup in Settings → Integrations." }
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
        console.error("Error decrypting Microsoft credentials:", err)
        return { error: "Failed to decrypt Microsoft credentials" }
      }
    }

    if (!credentials) {
      return { error: "Microsoft credentials not configured" }
    }

    try {
      const tenantId = credentials.tenant_id || "common"

      const response = await fetch(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: credentials.client_id,
            client_secret: credentials.client_secret,
            refresh_token: metadata.refresh_token,
            grant_type: "refresh_token",
            scope: "https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/OnlineMeetings.ReadWrite offline_access",
          }),
        }
      )

      if (!response.ok) {
        return { error: "Microsoft token expired. Please reconnect Microsoft in Settings → Integrations." }
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
        .eq("provider", "microsoft")

      return { accessToken: newTokens.access_token }
    } catch (err) {
      console.error("Error refreshing Microsoft token:", err)
      return { error: "Microsoft token expired. Please reconnect Microsoft in Settings → Integrations." }
    }
  }

  return { accessToken: metadata.access_token }
}

// POST - Create a new Teams meeting (via calendar event)
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

  const tokenResult = await getOrgMicrosoftToken(profile.org_id)

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

    // Create calendar event with online meeting
    const eventBody = {
      subject: body.subject,
      start: {
        dateTime: body.startDateTime,
        timeZone: "Asia/Riyadh",
      },
      end: {
        dateTime: body.endDateTime,
        timeZone: "Asia/Riyadh",
      },
      isOnlineMeeting: body.isOnlineMeeting !== false,
      onlineMeetingProvider: "teamsForBusiness",
      attendees: body.attendees?.map((a) => ({
        emailAddress: {
          address: a.email,
          name: a.name,
        },
        type: "required",
      })) || [],
    }

    const response = await fetch("https://graph.microsoft.com/v1.0/me/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenResult.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Microsoft Graph API error:", errorData)
      return NextResponse.json(
        { error: errorData.error?.message || "Failed to create Teams meeting" },
        { status: response.status }
      )
    }

    const event = await response.json()

    return NextResponse.json({
      id: event.id,
      webLink: event.webLink,
      onlineMeeting: event.onlineMeeting,
      subject: event.subject,
    }, { status: 201 })
  } catch (err) {
    console.error("Error creating Teams meeting:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create meeting" },
      { status: 500 }
    )
  }
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

  // Get user's org_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) {
    return NextResponse.json({ error: "User not associated with an organization" }, { status: 400 })
  }

  const tokenResult = await getOrgMicrosoftToken(profile.org_id)

  if ("error" in tokenResult) {
    return NextResponse.json({ error: tokenResult.error }, { status: 400 })
  }

  const searchParams = request.nextUrl.searchParams
  const meetingId = searchParams.get("meetingId")

  if (!meetingId) {
    return NextResponse.json({ error: "Meeting ID is required" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/events/${meetingId}`,
      {
        headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
      }
    )

    if (!response.ok) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    const event = await response.json()
    return NextResponse.json(event)
  } catch (err) {
    console.error("Error fetching Teams meeting:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch meeting" },
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

  // Get user's org_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) {
    return NextResponse.json({ error: "User not associated with an organization" }, { status: 400 })
  }

  const tokenResult = await getOrgMicrosoftToken(profile.org_id)

  if ("error" in tokenResult) {
    return NextResponse.json({ error: tokenResult.error }, { status: 400 })
  }

  const searchParams = request.nextUrl.searchParams
  const meetingId = searchParams.get("meetingId")

  if (!meetingId) {
    return NextResponse.json({ error: "Meeting ID is required" }, { status: 400 })
  }

  try {
    const body: Partial<TeamsMeetingInput> = await request.json()

    const updateBody: Record<string, any> = {}
    if (body.subject) updateBody.subject = body.subject
    if (body.startDateTime) {
      updateBody.start = { dateTime: body.startDateTime, timeZone: "Asia/Riyadh" }
    }
    if (body.endDateTime) {
      updateBody.end = { dateTime: body.endDateTime, timeZone: "Asia/Riyadh" }
    }

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/events/${meetingId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${tokenResult.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateBody),
      }
    )

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to update meeting" }, { status: 500 })
    }

    const event = await response.json()
    return NextResponse.json(event)
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

  // Get user's org_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) {
    return NextResponse.json({ error: "User not associated with an organization" }, { status: 400 })
  }

  const tokenResult = await getOrgMicrosoftToken(profile.org_id)

  if ("error" in tokenResult) {
    return NextResponse.json({ error: tokenResult.error }, { status: 400 })
  }

  const searchParams = request.nextUrl.searchParams
  const meetingId = searchParams.get("meetingId")

  if (!meetingId) {
    return NextResponse.json({ error: "Meeting ID is required" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/events/${meetingId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
      }
    )

    if (!response.ok && response.status !== 204) {
      return NextResponse.json({ error: "Failed to delete meeting" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error deleting Teams meeting:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete meeting" },
      { status: 500 }
    )
  }
}
