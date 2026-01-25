// @ts-nocheck
/**
 * Organization-Level OAuth Callback Endpoint
 *
 * Handles OAuth callbacks for all providers (Google, Zoom, Microsoft)
 * and stores tokens in organization_integrations.provider_metadata
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { decryptCredentials } from "@/lib/encryption"

interface StateData {
  orgId: string
  userId: string
  provider: string
  redirectTo: string
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const stateParam = searchParams.get("state")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  if (error) {
    console.error("OAuth error:", error, errorDescription)
    return NextResponse.redirect(
      `${baseUrl}/org/settings/integrations?error=oauth_failed&message=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      `${baseUrl}/org/settings/integrations?error=missing_code`
    )
  }

  // Decode state
  let stateData: StateData
  try {
    stateData = JSON.parse(Buffer.from(stateParam, "base64").toString())
  } catch {
    return NextResponse.redirect(
      `${baseUrl}/org/settings/integrations?error=invalid_state`
    )
  }

  const { orgId, userId, provider, redirectTo } = stateData

  // Verify user session
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    return NextResponse.redirect(`${baseUrl}/login`)
  }

  // Get organization's credentials
  const serviceClient = createServiceClient()
  const { data: integration, error: fetchError } = await serviceClient
    .from("organization_integrations")
    .select("credentials_encrypted, provider_metadata")
    .eq("org_id", orgId)
    .eq("provider", provider)
    .single()

  if (fetchError || !integration?.credentials_encrypted) {
    return NextResponse.redirect(
      `${baseUrl}/org/settings/integrations?error=credentials_not_found`
    )
  }

  let credentials: Record<string, string>
  try {
    credentials = decryptCredentials(integration.credentials_encrypted)
  } catch {
    return NextResponse.redirect(
      `${baseUrl}/org/settings/integrations?error=decrypt_failed`
    )
  }

  const callbackUrl = `${baseUrl}/api/org/integrations/callback`

  try {
    let tokens: { access_token: string; refresh_token?: string; expires_in?: number; email?: string }

    if (provider === "google") {
      tokens = await exchangeGoogleCode(code, credentials, callbackUrl)
    } else if (provider === "zoom") {
      tokens = await exchangeZoomCode(code, credentials, callbackUrl)
    } else if (provider === "microsoft") {
      tokens = await exchangeMicrosoftCode(code, credentials, callbackUrl)
    } else {
      throw new Error("Unknown provider")
    }

    // Calculate expiry date
    const expiryDate = tokens.expires_in
      ? Date.now() + tokens.expires_in * 1000
      : null

    // Store tokens in provider_metadata
    const existingMetadata = (integration.provider_metadata as Record<string, any>) || {}
    const newMetadata = {
      ...existingMetadata,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || existingMetadata.refresh_token,
      expiry_date: expiryDate,
      email: tokens.email || existingMetadata.email,
      connected_at: new Date().toISOString(),
      connected_by: userId,
    }

    // Update integration with tokens and mark as verified
    const { error: updateError } = await serviceClient
      .from("organization_integrations")
      .update({
        provider_metadata: newMetadata,
        is_verified: true,
        is_enabled: true,
        verified_at: new Date().toISOString(),
        verified_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("org_id", orgId)
      .eq("provider", provider)

    if (updateError) {
      console.error("Error storing tokens:", updateError)
      return NextResponse.redirect(
        `${baseUrl}/org/settings/integrations?error=storage_failed`
      )
    }

    return NextResponse.redirect(
      `${baseUrl}${redirectTo}?success=${provider}_connected`
    )
  } catch (err) {
    console.error("OAuth token exchange error:", err)
    return NextResponse.redirect(
      `${baseUrl}/org/settings/integrations?error=token_exchange_failed&message=${encodeURIComponent(err instanceof Error ? err.message : "Unknown error")}`
    )
  }
}

async function exchangeGoogleCode(
  code: string,
  credentials: Record<string, string>,
  redirectUri: string
) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google token exchange failed: ${error}`)
  }

  const data = await response.json()

  // Get user email
  let email: string | undefined
  try {
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${data.access_token}` },
      }
    )
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json()
      email = userInfo.email
    }
  } catch {
    // Email fetch is optional
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    email,
  }
}

async function exchangeZoomCode(
  code: string,
  credentials: Record<string, string>,
  redirectUri: string
) {
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
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Zoom token exchange failed: ${error}`)
  }

  const data = await response.json()

  // Get user email
  let email: string | undefined
  try {
    const userResponse = await fetch("https://api.zoom.us/v2/users/me", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    })
    if (userResponse.ok) {
      const userInfo = await userResponse.json()
      email = userInfo.email
    }
  } catch {
    // Email fetch is optional
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    email,
  }
}

async function exchangeMicrosoftCode(
  code: string,
  credentials: Record<string, string>,
  redirectUri: string
) {
  const tenantId = credentials.tenant_id || "common"

  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        scope: "https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/OnlineMeetings.ReadWrite offline_access",
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Microsoft token exchange failed: ${error}`)
  }

  const data = await response.json()

  // Get user email
  let email: string | undefined
  try {
    const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    })
    if (userResponse.ok) {
      const userInfo = await userResponse.json()
      email = userInfo.mail || userInfo.userPrincipalName
    }
  } catch {
    // Email fetch is optional
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    email,
  }
}
