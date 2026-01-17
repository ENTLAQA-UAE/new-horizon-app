import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { IntegrationsClient } from "./integrations-client"

export default async function IntegrationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user's connected integrations
  const { data: integrations } = await supabase
    .from("user_integrations")
    .select("provider, metadata, created_at, updated_at, expires_at")
    .eq("user_id", user.id)

  // Get org integration settings
  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .single()

  let orgIntegrations = null
  if (membership) {
    const { data } = await supabase
      .from("org_integrations")
      .select("*")
      .eq("org_id", membership.org_id)

    orgIntegrations = data
  }

  const connectedProviders = integrations?.map((i) => ({
    provider: i.provider,
    metadata: i.metadata as Record<string, unknown>,
    connectedAt: i.created_at,
    expiresAt: i.expires_at,
  })) || []

  return (
    <IntegrationsClient
      connectedProviders={connectedProviders}
      orgIntegrations={orgIntegrations || []}
      isOrgAdmin={membership?.role === "owner" || membership?.role === "admin"}
    />
  )
}
