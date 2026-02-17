import { createClient } from "@/lib/supabase/server"
import { BillingClient } from "./billing-client"

async function getBillingData() {
  const supabase = await createClient()

  // Get organizations with their tiers
  const { data: organizations } = await supabase
    .from("organizations")
    .select(`
      id,
      name,
      subscription_status,
      billing_cycle,
      subscription_start_date,
      subscription_end_date,
      created_at,
      subscription_tiers (
        id,
        name,
        price_monthly,
        price_yearly,
        currency
      )
    `)
    .order("created_at", { ascending: false })

  // Get all active tiers for the management dialog
  const { data: tiers } = await supabase
    .from("subscription_tiers")
    .select("id, name, price_monthly, price_yearly, currency")
    .eq("is_active", true)
    .order("sort_order")

  return {
    organizations: organizations || [],
    tiers: tiers || [],
  }
}

export default async function BillingPage() {
  const data = await getBillingData()

  return <BillingClient organizations={data.organizations} tiers={data.tiers} />
}
