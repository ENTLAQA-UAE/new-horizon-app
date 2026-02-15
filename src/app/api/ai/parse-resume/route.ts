import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { parseResume } from "@/lib/ai/resume-parser"
import { aiLimiter, getRateLimitKey, rateLimitResponse } from "@/lib/rate-limit"

/**
 * @deprecated This endpoint uses global AI configuration.
 * Will be migrated to use organization-level AI configuration.
 * New endpoints should use /api/org/ai/* routes.
 */
export async function POST(request: NextRequest) {
  const rlKey = getRateLimitKey(request)
  const rl = aiLimiter.check(`ai-resume:${rlKey}`)
  if (!rl.success) return rateLimitResponse(rl)

  console.warn("[DEPRECATED] /api/ai/parse-resume uses global AI config. Migrate to org-level AI config.")
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
    const allowedRoles = ["super_admin", "hr_manager", "recruiter"]
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { resumeText } = body

    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        { error: "Resume text is required" },
        { status: 400 }
      )
    }

    // Parse the resume using AI
    const parsedData = await parseResume(resumeText)

    return NextResponse.json({
      success: true,
      data: parsedData,
    })
  } catch (error) {
    console.error("Resume parsing error:", error)
    return NextResponse.json(
      {
        error: "Failed to parse resume",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
