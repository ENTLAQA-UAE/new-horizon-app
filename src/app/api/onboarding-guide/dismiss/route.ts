import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/onboarding-guide/dismiss
 * Dismiss the onboarding guide permanently for this user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get org_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 })
    }

    const { error } = await supabase
      .from("onboarding_guide_dismissals")
      .upsert(
        {
          user_id: user.id,
          org_id: profile.org_id,
          dismissed: true,
          dismissed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,org_id" }
      )

    if (error) {
      console.error("Error dismissing onboarding guide:", error)
      return NextResponse.json({ error: "Failed to dismiss guide" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error dismissing onboarding guide:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
