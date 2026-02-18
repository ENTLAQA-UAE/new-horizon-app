import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic" // Always fetch fresh data so admin changes reflect immediately

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data: tiers, error } = await supabase
      .from("subscription_tiers")
      .select("id, name, name_ar, description, description_ar, price_monthly, price_yearly, currency, max_jobs, max_users, max_candidates, features, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("[api/public/tiers] Error fetching tiers:", error)
      return NextResponse.json({ tiers: [] }, { status: 200 })
    }

    return NextResponse.json({ tiers: tiers || [] })
  } catch (err) {
    console.error("[api/public/tiers] Unexpected error:", err)
    return NextResponse.json({ tiers: [] }, { status: 200 })
  }
}
