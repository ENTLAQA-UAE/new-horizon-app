import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getMicrosoftTokensFromCode, getMicrosoftUser } from "@/lib/microsoft/graph"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  // Use request origin to get the correct URL (works in both dev and production)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  // Parse state to get redirect path
  let redirectTo = "/org/settings"
  if (state) {
    try {
      const decodedState = JSON.parse(Buffer.from(state, "base64").toString())
      redirectTo = decodedState.redirectTo || "/org/settings"
    } catch {
      // Keep default redirect
    }
  }

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}${redirectTo}?error=microsoft_auth_failed&message=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}${redirectTo}?error=microsoft_no_code`
    )
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(`${baseUrl}/login`)
    }

    // Exchange code for tokens
    const tokens = await getMicrosoftTokensFromCode(code)

    // Get Microsoft user info for metadata
    const msUser = await getMicrosoftUser(tokens.access_token)

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    // Store tokens in user_integrations table
    // We store both Teams and Calendar access under 'microsoft' provider
    const { error: upsertError } = await supabase
      .from("user_integrations")
      .upsert({
        user_id: user.id,
        provider: "microsoft",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt.toISOString(),
        metadata: {
          microsoft_user_id: msUser.id,
          email: msUser.mail || msUser.userPrincipalName,
          display_name: msUser.displayName,
          given_name: msUser.givenName,
          surname: msUser.surname,
          job_title: msUser.jobTitle,
          scopes: tokens.scope,
        },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,provider",
      })

    if (upsertError) {
      console.error("Error storing Microsoft tokens:", upsertError)
      return NextResponse.redirect(
        `${baseUrl}${redirectTo}?error=microsoft_token_storage_failed`
      )
    }

    return NextResponse.redirect(
      `${baseUrl}${redirectTo}?success=microsoft_connected`
    )
  } catch (err) {
    console.error("Microsoft OAuth callback error:", err)
    return NextResponse.redirect(
      `${baseUrl}${redirectTo}?error=microsoft_oauth_failed`
    )
  }
}
