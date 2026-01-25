// @ts-nocheck
/**
 * Organization-Level OAuth Connect Endpoint
 *
 * This endpoint initiates OAuth flow using the organization's configured credentials
 * (stored in organization_integrations) rather than app-level environment variables.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { decryptCredentials } from "@/lib/encryption"

// Helper to get base URL from request headers
function getBaseUrl(request: NextRequest): string {
  // Check for forwarded protocol (when behind reverse proxy like Vercel)
  const forwardedProto = request.headers.get("x-forwarded-proto")
  const protocol = forwardedProto || (request.nextUrl.protocol.replace(":", ""))

  // Get host from headers
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.host

  return `${protocol}://${host}`
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const provider = searchParams.get("provider")
  const redirectTo = searchParams.get("redirect") || "/org/settings/integrations"

  if (!provider || !["google", "zoom", "microsoft"].includes(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 })
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

  // Get organization's credentials
  const serviceClient = createServiceClient()
  const { data: integration, error } = await serviceClient
    .from("organization_integrations")
    .select("credentials_encrypted, is_configured")
    .eq("org_id", profile.org_id)
    .eq("provider", provider)
    .single()

  if (error || !integration?.credentials_encrypted) {
    return NextResponse.json(
      { error: `${provider} credentials not configured. Please add credentials first.` },
      { status: 400 }
    )
  }

  let credentials: Record<string, string>
  try {
    credentials = decryptCredentials(integration.credentials_encrypted)
  } catch (err) {
    console.error("Error decrypting credentials:", err)
    return NextResponse.json({ error: "Failed to read credentials" }, { status: 500 })
  }

  const baseUrl = getBaseUrl(request)
  const callbackUrl = `${baseUrl}/api/org/integrations/callback`

  // Generate state with org info
  const state = Buffer.from(
    JSON.stringify({
      orgId: profile.org_id,
      userId: user.id,
      provider,
      redirectTo,
    })
  ).toString("base64")

  let authUrl: string

  if (provider === "google") {
    const scopes = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ]
    authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(credentials.client_id)}` +
      `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes.join(" "))}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${encodeURIComponent(state)}`
  } else if (provider === "zoom") {
    authUrl = `https://zoom.us/oauth/authorize?` +
      `client_id=${encodeURIComponent(credentials.client_id)}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
      `&state=${encodeURIComponent(state)}`
  } else if (provider === "microsoft") {
    const tenantId = credentials.tenant_id || "common"
    const scopes = [
      "https://graph.microsoft.com/Calendars.ReadWrite",
      "https://graph.microsoft.com/OnlineMeetings.ReadWrite",
      "offline_access",
    ]
    authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${encodeURIComponent(credentials.client_id)}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
      `&scope=${encodeURIComponent(scopes.join(" "))}` +
      `&response_mode=query` +
      `&state=${encodeURIComponent(state)}`
  } else {
    return NextResponse.json({ error: "Provider not supported" }, { status: 400 })
  }

  return NextResponse.redirect(authUrl)
}
