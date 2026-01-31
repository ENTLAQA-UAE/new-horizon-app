import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/onboarding-guide
 * Fetch the current user's onboarding guide progress and dismissal state
 */
export async function GET(request: NextRequest) {
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

    // Fetch progress and dismissal in parallel
    const [progressResult, dismissalResult] = await Promise.all([
      supabase
        .from("onboarding_guide_progress")
        .select("step_key, completed, completed_at")
        .eq("user_id", user.id)
        .eq("org_id", profile.org_id),
      supabase
        .from("onboarding_guide_dismissals")
        .select("dismissed")
        .eq("user_id", user.id)
        .eq("org_id", profile.org_id)
        .maybeSingle(),
    ])

    const progress = progressResult.data || []
    const dismissed = dismissalResult.data?.dismissed || false

    // Build a map of step_key -> completed
    const stepsCompleted: Record<string, boolean> = {}
    for (const row of progress) {
      stepsCompleted[row.step_key] = row.completed
    }

    return NextResponse.json({
      stepsCompleted,
      dismissed,
    })
  } catch (err) {
    console.error("Error fetching onboarding guide:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/onboarding-guide
 * Update a step's completion status
 * Body: { stepKey: string, role: string, completed: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { stepKey, role, completed } = await request.json()

    if (!stepKey || !role) {
      return NextResponse.json({ error: "stepKey and role are required" }, { status: 400 })
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
      .from("onboarding_guide_progress")
      .upsert(
        {
          user_id: user.id,
          org_id: profile.org_id,
          role,
          step_key: stepKey,
          completed: completed ?? true,
          completed_at: completed ? new Date().toISOString() : null,
        },
        { onConflict: "user_id,org_id,role,step_key" }
      )

    if (error) {
      console.error("Error updating onboarding step:", error)
      return NextResponse.json({ error: "Failed to update step" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error updating onboarding guide:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
