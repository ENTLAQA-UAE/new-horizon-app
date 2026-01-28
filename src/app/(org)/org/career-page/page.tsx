// @ts-nocheck
// Note: career_page_blocks table not in Supabase types
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CareerPageBuilder } from "./career-page-builder"

export default async function CareerPageBuilderPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) {
    redirect("/onboarding")
  }

  // Get user role from user_roles table
  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", profile.org_id)
    .single()

  // Only org_admin and super_admin can access career page builder
  const allowedRoles = ["org_admin", "super_admin", "hr_manager"]
  if (!userRole?.role || !allowedRoles.includes(userRole.role)) {
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
    .eq("status", "open")

  return (
    <CareerPageBuilder
      organization={organization}
      initialBlocks={blocks || []}
      jobsCount={jobsCount || 0}
    />
  )
}
