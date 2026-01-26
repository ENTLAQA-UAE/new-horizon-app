// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      interview_id,
      template_id,
      org_id,
      criteria_scores,
      overall_score,
      weighted_score,
      recommendation,
      strengths,
      weaknesses,
      additional_notes,
      status,
      submitted_at,
    } = body

    if (!interview_id || !org_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Create the scorecard
    const { data: scorecard, error } = await serviceClient
      .from("interview_scorecards")
      .insert({
        interview_id,
        template_id,
        interviewer_id: user.id,
        org_id,
        criteria_scores,
        overall_score,
        weighted_score,
        recommendation,
        strengths,
        weaknesses,
        additional_notes,
        status,
        submitted_at,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating scorecard:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ scorecard })
  } catch (error) {
    console.error("Error in scorecards POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,
      criteria_scores,
      overall_score,
      weighted_score,
      recommendation,
      strengths,
      weaknesses,
      additional_notes,
      status,
      submitted_at,
    } = body

    if (!id) {
      return NextResponse.json({ error: "Scorecard ID required" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Verify the scorecard belongs to this user
    const { data: existing } = await serviceClient
      .from("interview_scorecards")
      .select("id, interviewer_id")
      .eq("id", id)
      .single()

    if (!existing || existing.interviewer_id !== user.id) {
      return NextResponse.json({ error: "Not authorized to update this scorecard" }, { status: 403 })
    }

    // Update the scorecard
    const { data: scorecard, error } = await serviceClient
      .from("interview_scorecards")
      .update({
        criteria_scores,
        overall_score,
        weighted_score,
        recommendation,
        strengths,
        weaknesses,
        additional_notes,
        status,
        submitted_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating scorecard:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ scorecard })
  } catch (error) {
    console.error("Error in scorecards PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
