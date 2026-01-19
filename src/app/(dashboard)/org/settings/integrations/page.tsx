// @ts-nocheck
// Note: This file uses tables that don't exist in the database schema yet (organization_integrations)
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { IntegrationsSettingsClient } from "./integrations-settings-client"

export default async function IntegrationsSettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user's profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single()

  if (profileError || !profile?.org_id) {
    console.error("Profile error:", profileError)
    redirect("/org")
  }

  const orgId = profile.org_id

  // Get organization name separately
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single()

  // Check if user has admin role
  const { data: userRole, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (roleError) {
    console.error("Role error:", roleError)
  }

  const role = userRole?.role as string
  const isAdmin = role === "org_admin" || role === "super_admin"

  if (!isAdmin) {
    redirect("/org")
  }

  // Get organization integrations
  const { data: integrations, error: intError } = await supabase
    .from("organization_integrations")
    .select("*")
    .eq("org_id", orgId)

  if (intError) {
    console.error("Integrations error:", intError)
  }

  // Get email configuration
  const { data: emailConfig, error: emailError } = await supabase
    .from("organization_email_config")
    .select("*")
    .eq("org_id", orgId)
    .single()

  if (emailError && emailError.code !== "PGRST116") {
    console.error("Email config error:", emailError)
  }

  return (
    <IntegrationsSettingsClient
      orgId={orgId}
      orgName={org?.name || "Organization"}
      integrations={integrations || []}
      emailConfig={emailConfig}
    />
  )
}
