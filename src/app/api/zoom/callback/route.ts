import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getZoomTokensFromCode, getZoomUser } from "@/lib/zoom/zoom"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

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
      `${baseUrl}${redirectTo}?error=zoom_auth_failed&message=${encodeURIComponent(error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}${redirectTo}?error=zoom_no_code`
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
    const tokens = await getZoomTokensFromCode(code)

    // Get Zoom user info for metadata
    const zoomUser = await getZoomUser(tokens.access_token)

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    // Store tokens in user_integrations table
    const { error: upsertError } = await supabase
      .from("user_integrations")
      .upsert({
        user_id: user.id,
        provider: "zoom",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt.toISOString(),
        metadata: {
          zoom_user_id: zoomUser.id,
          email: zoomUser.email,
          first_name: zoomUser.first_name,
          last_name: zoomUser.last_name,
          pmi: zoomUser.pmi,
          timezone: zoomUser.timezone,
        },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,provider",
      })

    if (upsertError) {
      console.error("Error storing Zoom tokens:", upsertError)
      return NextResponse.redirect(
        `${baseUrl}${redirectTo}?error=zoom_token_storage_failed`
      )
    }

    return NextResponse.redirect(
      `${baseUrl}${redirectTo}?success=zoom_connected`
    )
  } catch (err) {
    console.error("Zoom OAuth callback error:", err)
    return NextResponse.redirect(
      `${baseUrl}${redirectTo}?error=zoom_oauth_failed`
    )
  }
}
