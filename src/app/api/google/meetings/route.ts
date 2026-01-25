// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { google } from "googleapis"
import { decryptCredentials } from "@/lib/encryption"

interface GoogleMeetingInput {
  topic: string
  start_time: string
  duration: number // in minutes
  timezone?: string
  attendees?: { email: string; name?: string }[]
}

// Helper to get Google OAuth client with org credentials
async function getGoogleClient(orgId: string) {
  const serviceClient = createServiceClient()

  // Get org's Google integration with credentials
  const { data: integration, error } = await serviceClient
    .from("organization_integrations")
    .select("credentials_encrypted, provider_metadata, is_enabled, is_verified")
    .eq("org_id", orgId)
    .eq("provider", "google")
    .single()

  if (error || !integration) {
    return { error: "Google integration not configured for this organization" }
  }

  if (!integration.is_enabled) {
    return { error: "Google integration is disabled" }
  }

  // Check if we have OAuth tokens stored in provider_metadata
  const metadata = integration.provider_metadata as Record<string, any> || {}

  if (!metadata.access_token) {
    // Try to get credentials and check for refresh token
    let credentials: Record<string, string> | null = null

    if (integration.credentials_encrypted) {
      try {
        credentials = decryptCredentials(integration.credentials_encrypted)
      } catch (err) {
        console.error("Error decrypting Google credentials:", err)
      }
    }

    if (credentials && metadata.refresh_token) {
      // We have credentials and refresh token, try to get new access token
      try {
        const oauth2Client = new google.auth.OAuth2(
          credentials.client_id,
          credentials.client_secret
        )

        oauth2Client.setCredentials({
          refresh_token: metadata.refresh_token,
        })

        const { credentials: newTokens } = await oauth2Client.refreshAccessToken()

        // Update stored tokens
        await serviceClient
          .from("organization_integrations")
          .update({
            provider_metadata: {
              ...metadata,
              access_token: newTokens.access_token,
              expiry_date: newTokens.expiry_date,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("org_id", orgId)
          .eq("provider", "google")

        const calendar = google.calendar({ version: "v3", auth: oauth2Client })
        return { calendar }
      } catch (err) {
        console.error("Error refreshing Google token:", err)
        return { error: "Google token expired. Please reconnect Google in Settings → Integrations." }
      }
    }

    return { error: "Google account not connected. Please complete OAuth setup in Settings → Integrations." }
  }

  // We have access token, create client
  let credentials: Record<string, string> | null = null

  if (integration.credentials_encrypted) {
    try {
      credentials = decryptCredentials(integration.credentials_encrypted)
    } catch (err) {
      console.error("Error decrypting Google credentials:", err)
      return { error: "Failed to decrypt Google credentials" }
    }
  }

  if (!credentials) {
    return { error: "Google credentials not configured" }
  }

  const oauth2Client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret
  )

  // Check if token is expired
  const expiryDate = metadata.expiry_date
  const now = Date.now()

  if (expiryDate && expiryDate <= now && metadata.refresh_token) {
    // Token expired, refresh it
    try {
      oauth2Client.setCredentials({
        refresh_token: metadata.refresh_token,
      })

      const { credentials: newTokens } = await oauth2Client.refreshAccessToken()

      // Update stored tokens
      await serviceClient
        .from("organization_integrations")
        .update({
          provider_metadata: {
            ...metadata,
            access_token: newTokens.access_token,
            expiry_date: newTokens.expiry_date,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("org_id", orgId)
        .eq("provider", "google")

      const calendar = google.calendar({ version: "v3", auth: oauth2Client })
      return { calendar }
    } catch (err) {
      console.error("Error refreshing Google token:", err)
      return { error: "Google token expired. Please reconnect Google in Settings → Integrations." }
    }
  }

  oauth2Client.setCredentials({
    access_token: metadata.access_token,
    refresh_token: metadata.refresh_token,
  })

  const calendar = google.calendar({ version: "v3", auth: oauth2Client })
  return { calendar }
}

// POST - Create a new Google Meet meeting (via Calendar event)
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

  const clientResult = await getGoogleClient(profile.org_id)

  if ("error" in clientResult) {
    return NextResponse.json({ error: clientResult.error }, { status: 400 })
  }

  try {
    const body: GoogleMeetingInput = await request.json()

    if (!body.topic) {
      return NextResponse.json({ error: "Meeting topic is required" }, { status: 400 })
    }

    // Calculate end time
    const startTime = new Date(body.start_time)
    const endTime = new Date(startTime.getTime() + (body.duration || 60) * 60 * 1000)

    // Create calendar event with Google Meet
    const event = {
      summary: body.topic,
      description: "Interview scheduled via Jadarat ATS",
      start: {
        dateTime: startTime.toISOString(),
        timeZone: body.timezone || "Asia/Riyadh",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: body.timezone || "Asia/Riyadh",
      },
      attendees: body.attendees?.map((a) => ({
        email: a.email,
        displayName: a.name,
      })),
      conferenceData: {
        createRequest: {
          requestId: `interview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 }, // 1 hour before
          { method: "popup", minutes: 15 }, // 15 minutes before
        ],
      },
    }

    const response = await clientResult.calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: "all",
    })

    return NextResponse.json({
      id: response.data.id,
      join_url: response.data.hangoutLink,
      html_link: response.data.htmlLink,
      status: response.data.status,
    }, { status: 201 })
  } catch (err) {
    console.error("Error creating Google Meet:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create meeting" },
      { status: 500 }
    )
  }
}
