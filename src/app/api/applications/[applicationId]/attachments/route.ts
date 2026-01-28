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

    // Role check - hr_manager, recruiter, hiring_manager can access
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    const role = userRole?.role
    const allowedRoles = ["super_admin", "hr_manager", "recruiter", "hiring_manager"]
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { data: attachments, error } = await supabase
      .from("application_attachments")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false })

    if (error) {
      // Table might not exist yet, return empty array
      if (error.code === "42P01") {
        return NextResponse.json({ attachments: [] })
      }
      console.error("Error fetching attachments:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ attachments: attachments || [] })
  } catch (error) {
    console.error("Error in attachments GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
