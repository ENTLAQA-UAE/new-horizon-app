// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { jobId, candidateId, screeningId, orgId } = await request.json()

    if (!jobId || !candidateId || !orgId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify user belongs to org
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single()

    if (!profile || profile.org_id !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Check if application already exists
    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("candidate_id", candidateId)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Candidate already has an application for this job" }, { status: 409 })
    }

    // Get the first pipeline stage (Applied) for this job
    const { data: job } = await supabase
      .from("jobs")
      .select("pipeline_id")
      .eq("id", jobId)
      .single()

    let stageId = null
    if (job?.pipeline_id) {
      const { data: stage } = await supabase
        .from("pipeline_stages")
        .select("id")
        .eq("pipeline_id", job.pipeline_id)
        .order("order_index", { ascending: true })
        .limit(1)
        .single()

      stageId = stage?.id || null
    }

    // Create the application
    const { data: application, error: appError } = await supabase
      .from("applications")
      .insert({
        org_id: orgId,
        job_id: jobId,
        candidate_id: candidateId,
        status: "new",
        source: "ai_talent_pool",
        applied_at: new Date().toISOString(),
        ...(stageId ? { stage_id: stageId } : {}),
      })
      .select("id")
      .single()

    if (appError) {
      console.error("Error creating application:", appError)
      return NextResponse.json({ error: "Failed to create application" }, { status: 500 })
    }

    // Update the screening record to link the new application
    if (screeningId && application) {
      await supabase
        .from("candidate_ai_screening")
        .update({
          application_id: application.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", screeningId)
    }

    return NextResponse.json({
      success: true,
      applicationId: application.id,
    })
  } catch (error) {
    console.error("Talent pool apply error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to apply candidate" },
      { status: 500 }
    )
  }
}
