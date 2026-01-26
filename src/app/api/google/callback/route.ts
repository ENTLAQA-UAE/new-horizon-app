// @ts-nocheck
// Note: This file uses tables that don't exist (user_integrations)
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getTokensFromCode } from "@/lib/google/calendar"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  // Use request origin to get the correct URL (works in both dev and production)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/org/settings?error=calendar_auth_failed&message=${encodeURIComponent(error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/org/settings?error=no_code`
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
    const tokens = await getTokensFromCode(code)

    // Store tokens in user_integrations table
    const { error: upsertError } = await supabase
      .from("user_integrations")
      .upsert({
        user_id: user.id,
        provider: "google_calendar",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,provider",
      })

    if (upsertError) {
      console.error("Error storing tokens:", upsertError)
      return NextResponse.redirect(
        `${baseUrl}/org/settings?error=token_storage_failed`
      )
    }

    // Redirect back to the original page or settings
    const redirectTo = state || "/org/settings"
    return NextResponse.redirect(
      `${baseUrl}${redirectTo}?success=calendar_connected`
    )
  } catch (err) {
    console.error("Google OAuth callback error:", err)
    return NextResponse.redirect(
      `${baseUrl}/org/settings?error=oauth_failed`
    )
  }
}
