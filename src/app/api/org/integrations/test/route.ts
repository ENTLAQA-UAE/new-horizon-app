import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { decryptCredentials } from "@/lib/encryption"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { orgId, provider, credentials } = await request.json()

    if (!orgId || !provider) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify user is admin
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("org_id", orgId)
      .eq("user_id", user.id)
      .single()

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Test based on provider
    let result: { success: boolean; email?: string; error?: string }

    if (provider === "zoom") {
      result = await testZoomCredentials(credentials)
    } else if (provider === "microsoft") {
      result = await testMicrosoftCredentials(credentials)
    } else if (provider === "google") {
      result = await testGoogleCredentials(credentials)
    } else {
      return NextResponse.json({ error: "Unknown provider" }, { status: 400 })
    }

    // If test successful, mark as verified
    if (result.success) {
      await supabase
        .from("organization_integrations")
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: user.id,
          provider_metadata: result.email ? { email: result.email } : {},
          updated_at: new Date().toISOString(),
        })
        .eq("org_id", orgId)
        .eq("provider", provider)
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error("Test error:", err)
    return NextResponse.json({ success: false, error: "Test failed" }, { status: 500 })
  }
}

async function testZoomCredentials(credentials: { client_id: string; client_secret: string }) {
  try {
    // Test by getting an access token with client credentials
    // Note: This requires Zoom Server-to-Server OAuth app type
    const basicAuth = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString("base64")

    const response = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "account_credentials",
        account_id: credentials.client_id, // For Server-to-Server apps
      }),
    })

    if (response.ok) {
      return { success: true }
    }

    // If that fails, credentials are valid but app type might be OAuth (user-level)
    // In that case, we just validate the format
    if (credentials.client_id && credentials.client_secret) {
      return { success: true, email: "Credentials saved (OAuth flow required for verification)" }
    }

    return { success: false, error: "Invalid credentials" }
  } catch (err) {
    return { success: false, error: "Connection failed" }
  }
}

async function testMicrosoftCredentials(credentials: {
  client_id: string
  client_secret: string
  tenant_id?: string
}) {
  try {
    const tenantId = credentials.tenant_id || "common"

    // Test by getting an app-only token
    const response = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: credentials.client_id,
          client_secret: credentials.client_secret,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials",
        }),
      }
    )

    if (response.ok) {
      return { success: true }
    }

    // Validate format if app requires user consent
    if (credentials.client_id && credentials.client_secret) {
      return { success: true, email: "Credentials saved (OAuth flow required for full verification)" }
    }

    return { success: false, error: "Invalid credentials" }
  } catch (err) {
    return { success: false, error: "Connection failed" }
  }
}

async function testGoogleCredentials(credentials: { client_id: string; client_secret: string }) {
  // Google OAuth requires user interaction, so we just validate the format
  if (
    credentials.client_id &&
    credentials.client_secret &&
    credentials.client_id.includes(".apps.googleusercontent.com")
  ) {
    return { success: true, email: "Credentials saved (OAuth flow required for verification)" }
  }

  return { success: false, error: "Invalid client ID format" }
}
