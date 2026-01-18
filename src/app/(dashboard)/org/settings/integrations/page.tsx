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

  // Get user's profile with organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, organizations(id, name)")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) {
    redirect("/org")
  }

  // Check if user has admin role
  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single()

  const isAdmin = userRole?.role === "org_admin" || userRole?.role === "super_admin"

  if (!isAdmin) {
    redirect("/org")
  }

  const orgId = profile.org_id

  // Get organization integrations
  const { data: integrations } = await supabase
    .from("organization_integrations")
    .select("*")
    .eq("org_id", orgId)

  // Get email configuration
  const { data: emailConfig } = await supabase
    .from("organization_email_config")
    .select("*")
    .eq("org_id", orgId)
    .single()

  return (
    <IntegrationsSettingsClient
      orgId={orgId}
      orgName={(profile.organizations as { name: string })?.name || "Organization"}
      integrations={integrations || []}
      emailConfig={emailConfig}
    />
  )
}
