import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getZoomAuthUrl } from "@/lib/zoom/zoom"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get the redirect path from query params
  const searchParams = request.nextUrl.searchParams
  const redirectTo = searchParams.get("redirect") || "/org/settings"

  // Generate OAuth URL with state parameter containing user info and redirect
  const state = JSON.stringify({ userId: user.id, redirectTo })
  const encodedState = Buffer.from(state).toString("base64")
  const authUrl = getZoomAuthUrl(encodedState)

  return NextResponse.redirect(authUrl)
}
