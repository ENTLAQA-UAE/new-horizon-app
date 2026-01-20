import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * Server-side endpoint to get the current authenticated user
 * This bypasses client-side caching issues by verifying directly with Supabase
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Get user directly from server - this is always fresh
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { user: null, error: authError?.message || "Not authenticated" },
        { status: 401 }
      )
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, avatar_url, org_id")
      .eq("id", user.id)
      .single()

    // Get user's roles
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)

    const roleList = roles?.map(r => r.role) || []

    // Determine the primary role
    let primaryRole = "recruiter"
    if (roleList.includes("super_admin")) {
      primaryRole = "super_admin"
    } else if (roleList.includes("org_admin")) {
      primaryRole = "org_admin"
    } else if (roleList.includes("hr_manager")) {
      primaryRole = "hr_manager"
    } else if (roleList.includes("recruiter")) {
      primaryRole = "recruiter"
    } else if (roleList.includes("hiring_manager")) {
      primaryRole = "hiring_manager"
    } else if (roleList.includes("interviewer")) {
      primaryRole = "interviewer"
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        avatarUrl: profile?.avatar_url,
        orgId: profile?.org_id,
        role: primaryRole,
        roles: roleList,
      },
      error: null,
    })
  } catch (error) {
    console.error("Auth API error:", error)
    return NextResponse.json(
      { user: null, error: "Server error" },
      { status: 500 }
    )
  }
}
