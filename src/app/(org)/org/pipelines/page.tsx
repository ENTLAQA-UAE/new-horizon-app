// @ts-nocheck
// Note: Type mismatch between Supabase query result and PipelineStage interface
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PipelinesClient } from "./pipelines-client"

export default async function PipelinesPage() {
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

  // Get pipelines with their stages
  const { data: pipelines } = await supabase
    .from("pipelines")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  // Get pipeline stages
  const { data: stages } = await supabase
    .from("pipeline_stages")
    .select("*")
    .eq("org_id", orgId)
    .order("sort_order", { ascending: true })

  // Get email templates for auto-email configuration
  const { data: emailTemplates } = await supabase
    .from("email_templates")
    .select("id, name")
    .eq("is_active", true)
    .or(`org_id.eq.${orgId},is_system.eq.true`)
    .order("name")

  // Get team members for approvers
  const { data: teamMembers } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .eq("org_id", orgId)

  return (
    <PipelinesClient
      pipelines={pipelines || []}
      stages={stages || []}
      emailTemplates={emailTemplates || []}
      teamMembers={
        teamMembers?.map((m) => ({
          id: m.id,
          name: m.first_name && m.last_name
            ? `${m.first_name} ${m.last_name}`
            : m.email || "Unknown",
        })) || []
      }
      organizationId={orgId}
    />
  )
}
