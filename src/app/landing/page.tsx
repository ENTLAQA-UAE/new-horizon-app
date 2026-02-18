import { createServiceClient } from "@/lib/supabase/server"
import LandingPage from "./landing-client"
import type { Tier } from "./landing-client"

async function getTiers(): Promise<Tier[]> {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("subscription_tiers")
      .select("id, name, name_ar, description, description_ar, price_monthly, price_yearly, currency, max_jobs, max_users, max_candidates, features, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("[landing] Error fetching tiers:", error)
      return []
    }

    return (data || []) as Tier[]
  } catch (err) {
    console.error("[landing] Unexpected error fetching tiers:", err)
    return []
  }
}

export default async function LandingPageWrapper() {
  const tiers = await getTiers()
  return <LandingPage initialTiers={tiers} />
}
