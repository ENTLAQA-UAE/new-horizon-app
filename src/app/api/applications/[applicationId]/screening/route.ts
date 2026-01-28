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

    // Role check - only hr_manager and recruiter can view screening responses
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

    // Use service client to bypass RLS
    const serviceClient = createServiceClient()

    // Fetch screening responses with questions
    const { data: responses, error } = await serviceClient
      .from("screening_responses")
      .select(`
        id,
        question_id,
        answer,
        answer_json,
        is_knockout_triggered,
        created_at,
        screening_questions (
          id,
          question,
          question_ar,
          question_type,
          options,
          is_knockout,
          knockout_value,
          is_required
        )
      `)
      .eq("application_id", applicationId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching screening responses:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format the responses for easier frontend consumption
    const formattedResponses = (responses || []).map(response => ({
      id: response.id,
      question_id: response.question_id,
      answer: response.answer,
      answer_json: response.answer_json,
      is_knockout_triggered: response.is_knockout_triggered,
      created_at: response.created_at,
      question: response.screening_questions
    }))

    return NextResponse.json({ responses: formattedResponses })
  } catch (error) {
    console.error("Error in screening GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
