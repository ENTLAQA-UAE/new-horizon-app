import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { parseResume } from "@/lib/ai/resume-parser"

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
