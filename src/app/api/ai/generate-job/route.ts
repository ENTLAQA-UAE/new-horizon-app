import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateJobDescription, generateInterviewQuestions } from "@/lib/ai/job-generator"

export async function POST(request: NextRequest) {
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
    const { action } = body

    if (action === "generate-description") {
      const {
        title,
        department,
        location,
        employmentType,
        experienceLevel,
        industry,
        companyDescription,
        additionalContext,
      } = body

      if (!title || !employmentType || !experienceLevel) {
        return NextResponse.json(
          { error: "Title, employment type, and experience level are required" },
          { status: 400 }
        )
      }

      const description = await generateJobDescription({
        title,
        department,
        location,
        employmentType,
        experienceLevel,
        industry,
        companyDescription,
        additionalContext,
      })

      return NextResponse.json({
        success: true,
        data: description,
      })
    }

    if (action === "generate-questions") {
      const { jobTitle, jobDescription, candidateSkills, interviewType } = body

      if (!jobTitle || !interviewType) {
        return NextResponse.json(
          { error: "Job title and interview type are required" },
          { status: 400 }
        )
      }

      const questions = await generateInterviewQuestions(
        jobTitle,
        jobDescription || "",
        candidateSkills || [],
        interviewType
      )

      return NextResponse.json({
        success: true,
        data: questions,
      })
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'generate-description' or 'generate-questions'" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Job generation error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
