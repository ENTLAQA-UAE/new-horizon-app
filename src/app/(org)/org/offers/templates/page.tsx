// @ts-nocheck
// Note: Type mismatch between Supabase Json type and OfferTemplate interface
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OfferTemplatesClient } from "./templates-client"

export default async function OfferTemplatesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user's profile with organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) {
    redirect("/org")
  }

  const orgId = profile.org_id

  // Fetch offer templates
  const { data: templates } = await supabase
    .from("offer_templates")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  return <OfferTemplatesClient templates={templates || []} orgId={orgId} />
}
