import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateSignedUrl } from "@/lib/bunny"

/**
 * Generate a signed Bunny CDN URL for accessing a document or resume.
 * Requires authentication and org membership.
 * Accepts a storage path and returns a time-limited signed URL (5 min).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user belongs to an organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Not a member of any organization" }, { status: 403 })
    }

    // Role check - only ATS roles can access signed URLs
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

    const body = await request.json()
    const { storagePath } = body

    if (!storagePath || typeof storagePath !== "string") {
      return NextResponse.json({ error: "Missing storagePath" }, { status: 400 })
    }

    // Security: ensure the storage path belongs to the user's organization
    if (!storagePath.startsWith(`${profile.org_id}/`)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Generate a signed URL valid for 5 minutes
    const signedUrl = generateSignedUrl(storagePath, 300)

    return NextResponse.json({ signedUrl })
  } catch (error) {
    console.error("Error generating signed URL:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
