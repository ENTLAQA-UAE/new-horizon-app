import { createClient } from "@/lib/supabase/server"
import { TiersClient } from "./tiers-client"

async function getSubscriptionTiers() {
  const supabase = await createClient()

  const { data: tiers, error } = await supabase
    .from("subscription_tiers")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Error fetching tiers:", error)
    return []
  }

  return tiers || []
}

async function getTierStats() {
  const supabase = await createClient()

  const { data: stats, error } = await supabase
    .from("organizations")
    .select("tier_id")

  if (error) {
    console.error("Error fetching tier stats:", error)
    return {}
  }

  // Count organizations per tier
  const tierCounts: Record<string, number> = {}
  stats?.forEach((org) => {
    if (org.tier_id) {
      tierCounts[org.tier_id] = (tierCounts[org.tier_id] || 0) + 1
    }
  })

  return tierCounts
}

export default async function TiersPage() {
  const [tiers, tierStats] = await Promise.all([
    getSubscriptionTiers(),
    getTierStats(),
  ])

  return <TiersClient tiers={tiers} tierStats={tierStats} />
}
