import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params

    // Use regular client for auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Role check
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    const role = userRole?.role
    const allowedRoles = ["super_admin", "hr_manager", "recruiter", "hiring_manager", "interviewer"]
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Use service client to bypass RLS
    const serviceClient = createServiceClient()

    // First get the interviews for this application
    const { data: interviews } = await serviceClient
      .from("interviews")
      .select("id")
      .eq("application_id", applicationId)

    if (!interviews || interviews.length === 0) {
      return NextResponse.json({ scorecards: [] })
    }

    const interviewIds = interviews.map(i => i.id)

    // Fetch scorecards for these interviews
    const { data: scorecards, error } = await serviceClient
      .from("interview_scorecards")
      .select(`
        *,
        scorecard_templates (
          id,
          name,
          name_ar
        ),
        interviews (
          id,
          title,
          scheduled_at
        )
      `)
      .in("interview_id", interviewIds)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching scorecards:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!scorecards || scorecards.length === 0) {
      return NextResponse.json({ scorecards: [] })
    }

    // Get unique interviewer IDs
    const interviewerIds = [...new Set(scorecards.map(s => s.interviewer_id))]

    // Fetch profiles for all interviewers
    const { data: profiles } = await serviceClient
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", interviewerIds)

    // Create a map of user_id to profile
    const profileMap = new Map(
      (profiles || []).map(p => [p.id, { first_name: p.first_name, last_name: p.last_name, avatar_url: p.avatar_url }])
    )

    // Attach profiles to scorecards
    const scorecardsWithProfiles = scorecards.map(scorecard => ({
      ...scorecard,
      profiles: profileMap.get(scorecard.interviewer_id) || null
    }))

    return NextResponse.json({ scorecards: scorecardsWithProfiles })
  } catch (error) {
    console.error("Error in scorecards GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
