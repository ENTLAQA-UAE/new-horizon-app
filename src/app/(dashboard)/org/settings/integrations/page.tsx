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

  // Get user's organization membership
  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id, role, organizations(id, name)")
    .eq("user_id", user.id)
    .single()

  if (!membership) {
    redirect("/org")
  }

  // Check if user is admin
  const isAdmin = membership.role === "owner" || membership.role === "admin"

  if (!isAdmin) {
    redirect("/org")
  }

  const orgId = membership.org_id

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
      orgName={(membership.organizations as { name: string })?.name || "Organization"}
      integrations={integrations || []}
      emailConfig={emailConfig}
    />
  )
}
