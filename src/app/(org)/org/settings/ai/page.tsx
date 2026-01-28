import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AISettingsClient } from "./ai-settings-client"

export default async function AISettingsPage() {
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

  // Get organization name
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

  // Get organization AI configurations
  const { data: aiConfigs, error: aiError } = await supabase
    .from("organization_ai_config")
    .select("*")
    .eq("org_id", orgId)

  if (aiError) {
    console.error("AI configs error:", aiError)
  }

  return (
    <AISettingsClient
      orgId={orgId}
      orgName={org?.name || "Organization"}
      aiConfigs={aiConfigs || []}
    />
  )
}
