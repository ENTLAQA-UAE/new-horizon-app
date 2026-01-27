import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's profile for org_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.json({ error: "No organization" }, { status: 403 })
    }

    // Role check - hr_manager, recruiter, hiring_manager, interviewer can access
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

    const { data: interviews, error } = await supabase
      .from("interviews")
      .select("*")
      .eq("application_id", applicationId)
      .order("scheduled_at", { ascending: false })

    if (error) {
      console.error("Error fetching interviews:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ interviews: interviews || [] })
  } catch (error) {
    console.error("Error in interviews GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
