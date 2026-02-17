import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/server"

async function verifySuperAdmin(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (userRole?.role !== "super_admin") return null
  return user
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await verifySuperAdmin(supabase)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      org_id,
      tier_id,
      billing_cycle,
      subscription_status,
      subscription_start_date,
      subscription_end_date,
      payment_method,
      notes,
    } = body

    if (!org_id) {
      return NextResponse.json({ error: "org_id is required" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Get tier details if tier_id is provided
    let tierUpdate: Record<string, any> = {}
    if (tier_id) {
      const { data: tier } = await serviceClient
        .from("subscription_tiers")
        .select("max_jobs, max_candidates, max_users")
        .eq("id", tier_id)
        .single()

      if (tier) {
        tierUpdate = {
          max_jobs: tier.max_jobs,
          max_candidates: tier.max_candidates,
          max_users: tier.max_users,
        }
      }
    }

    // Build update object
    const updateData: Record<string, any> = {
      ...tierUpdate,
    }

    if (tier_id !== undefined) updateData.tier_id = tier_id
    if (billing_cycle) updateData.billing_cycle = billing_cycle
    if (subscription_status) updateData.subscription_status = subscription_status
    if (subscription_start_date) updateData.subscription_start_date = subscription_start_date
    if (subscription_end_date) updateData.subscription_end_date = subscription_end_date

    const { error } = await serviceClient
      .from("organizations")
      .update(updateData)
      .eq("id", org_id)

    if (error) {
      console.error("Subscription update error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Admin subscription update error:", error)
    return NextResponse.json({ error: error.message || "Failed to update subscription" }, { status: 500 })
  }
}
