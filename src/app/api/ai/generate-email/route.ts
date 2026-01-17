import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  generateEmailTemplate,
  improveEmailTemplate,
  translateEmailToArabic,
} from "@/lib/ai/email-generator"

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
    const { action } = body

    if (action === "generate") {
      const { templateType, context } = body

      if (!templateType) {
        return NextResponse.json(
          { error: "Template type is required" },
          { status: 400 }
        )
      }

      const template = await generateEmailTemplate({
        templateType,
        context,
      })

      return NextResponse.json({
        success: true,
        data: template,
      })
    }

    if (action === "improve") {
      const { subject, body_html, improvement } = body

      if (!subject || !body_html || !improvement) {
        return NextResponse.json(
          { error: "Subject, body HTML, and improvement instructions are required" },
          { status: 400 }
        )
      }

      const improved = await improveEmailTemplate(
        { subject, body_html },
        improvement
      )

      return NextResponse.json({
        success: true,
        data: improved,
      })
    }

    if (action === "translate") {
      const { subject, body_html } = body

      if (!subject || !body_html) {
        return NextResponse.json(
          { error: "Subject and body HTML are required" },
          { status: 400 }
        )
      }

      const translated = await translateEmailToArabic({ subject, body_html })

      return NextResponse.json({
        success: true,
        data: translated,
      })
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'generate', 'improve', or 'translate'" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Email generation error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate email content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
