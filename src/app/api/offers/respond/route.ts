// @ts-nocheck
// Note: Supabase relation type depth issue with nested select
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function POST(request: NextRequest) {
  try {
    const { token, action } = await request.json()

    if (!token || !action) {
      return NextResponse.json(
        { error: "Missing token or action" },
        { status: 400 }
      )
    }

    if (action !== "accept" && action !== "decline") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'accept' or 'decline'" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Look up the offer by response token
    const { data: offer, error: fetchError } = await supabase
      .from("offers")
      .select("id, status, response_token_expires_at, org_id, application_id, job_title, applications(candidates(first_name, last_name, email))")
      .eq("response_token", token)
      .single()

    if (fetchError || !offer) {
      return NextResponse.json(
        { error: "Invalid or expired link. This offer link is no longer valid." },
        { status: 404 }
      )
    }

    // Check if token has expired
    if (offer.response_token_expires_at && new Date(offer.response_token_expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This link has expired. Please contact the hiring team." },
        { status: 410 }
      )
    }

    // Check if already responded
    if (offer.status === "accepted" || offer.status === "declined") {
      return NextResponse.json(
        {
          error: `This offer has already been ${offer.status}. No further action is needed.`,
          alreadyResponded: true,
          status: offer.status,
        },
        { status: 409 }
      )
    }

    // Only allow response on sent/viewed offers
    if (offer.status !== "sent" && offer.status !== "viewed") {
      return NextResponse.json(
        { error: "This offer is not available for response." },
        { status: 400 }
      )
    }

    const newStatus = action === "accept" ? "accepted" : "declined"
    const now = new Date().toISOString()

    // Update the offer status
    const { error: updateError } = await supabase
      .from("offers")
      .update({
        status: newStatus,
        candidate_response: newStatus,
        candidate_response_at: now,
        // Invalidate the token after use
        response_token_expires_at: now,
      })
      .eq("id", offer.id)

    if (updateError) {
      console.error("Failed to update offer:", updateError)
      return NextResponse.json(
        { error: "Failed to process your response. Please try again." },
        { status: 500 }
      )
    }

    // Send notification to hiring team about the response
    const candidate = (offer as any).applications?.candidates
    const candidateName = candidate
      ? `${candidate.first_name} ${candidate.last_name}`
      : "Candidate"

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || ""

    fetch(`${baseUrl}/api/notifications/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: action === "accept" ? "offer_accepted" : "offer_rejected",
        orgId: offer.org_id,
        data: {
          candidateName,
          candidateEmail: candidate?.email,
          jobTitle: offer.job_title,
          applicationId: offer.application_id,
          offerId: offer.id,
        },
      }),
    }).catch((err) => {
      console.error("Failed to send offer response notification:", err)
    })

    // Log activity on the application
    fetch(`${baseUrl}/api/applications/${offer.application_id}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activity_type: action === "accept" ? "offer_accepted" : "offer_declined",
        description: `Candidate ${action === "accept" ? "accepted" : "declined"} the offer via email`,
        metadata: { offer_id: offer.id },
      }),
    }).catch((err) => {
      console.error("Failed to log offer response activity:", err)
    })

    return NextResponse.json({
      success: true,
      status: newStatus,
      jobTitle: offer.job_title,
    })
  } catch (error) {
    console.error("Offer respond error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
