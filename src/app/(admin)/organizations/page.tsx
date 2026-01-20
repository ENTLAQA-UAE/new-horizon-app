import { createClient } from "@/lib/supabase/server"
import { OrganizationsClient } from "./organizations-client"

async function getOrganizations() {
  const supabase = await createClient()

  const { data: organizations, error } = await supabase
    .from("organizations")
    .select(`
      *,
      subscription_tiers (
        id,
        name,
        name_ar,
        price_monthly
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching organizations:", error)
    return []
  }

  return organizations || []
}

async function getSubscriptionTiers() {
  const supabase = await createClient()

  const { data: tiers, error } = await supabase
    .from("subscription_tiers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Error fetching tiers:", error)
    return []
  }

  return tiers || []
}

export default async function OrganizationsPage() {
  const [organizations, tiers] = await Promise.all([
    getOrganizations(),
    getSubscriptionTiers(),
  ])

  return <OrganizationsClient organizations={organizations} tiers={tiers} />
}
