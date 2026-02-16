import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get("org_id")

    if (!orgId) {
      return NextResponse.json({ error: "org_id is required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: org, error } = await supabase
      .from("organizations")
      .select(`
        id,
        name,
        subscription_status,
        subscription_start_date,
        subscription_end_date,
        tier_id,
        stripe_customer_id,
        stripe_subscription_id,
        max_jobs,
        max_candidates,
        max_users,
        created_at,
        subscription_tiers (
          id,
          name,
          name_ar,
          description,
          description_ar,
          price_monthly,
          price_yearly,
          currency,
          max_jobs,
          max_candidates,
          max_users,
          max_storage_gb,
          features
        )
      `)
      .eq("id", orgId)
      .single()

    if (error || !org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Calculate trial days remaining
    const createdAt = new Date(org.created_at)
    const trialEndDate = new Date(createdAt)
    trialEndDate.setDate(trialEndDate.getDate() + 14)
    const now = new Date()
    const trialDaysRemaining = Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    const trialExpired = trialDaysRemaining === 0

    // Get all available tiers for plan selection
    const { data: tiers } = await supabase
      .from("subscription_tiers")
      .select("id, name, name_ar, description, description_ar, price_monthly, price_yearly, currency, max_jobs, max_candidates, max_users, max_storage_gb, features, sort_order")
      .eq("is_active", true)
      .order("sort_order")

    return NextResponse.json({
      organization: org,
      trial: {
        days_remaining: trialDaysRemaining,
        end_date: trialEndDate.toISOString().split("T")[0],
        expired: trialExpired,
      },
      available_tiers: tiers || [],
    })
  } catch (error: any) {
    console.error("Subscription fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch subscription details" }, { status: 500 })
  }
}
