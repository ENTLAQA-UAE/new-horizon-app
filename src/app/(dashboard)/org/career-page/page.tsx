// @ts-nocheck
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CareerPageBuilder } from "./career-page-builder"

export default async function CareerPageBuilderPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // Get user profile and organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) {
    redirect("/onboarding")
  }

  // Only org_admin and super_admin can access
  if (!["org_admin", "super_admin"].includes(profile.role || "")) {
    redirect("/org")
  }

  // Get organization data
  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, name_ar, slug, logo_url, primary_color, secondary_color, career_page_config, career_page_published")
    .eq("id", profile.org_id)
    .single()

  if (!organization) {
    redirect("/org")
  }

  // Get existing blocks
  const { data: blocks } = await supabase
    .from("career_page_blocks")
    .select("*")
    .eq("org_id", profile.org_id)
    .order("block_order", { ascending: true })

  // Get published jobs count
  const { count: jobsCount } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("org_id", profile.org_id)
    .eq("status", "published")

  return (
    <CareerPageBuilder
      organization={organization}
      initialBlocks={blocks || []}
      jobsCount={jobsCount || 0}
    />
  )
}
