import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { WorkflowsClient } from "./workflows-client"

export default async function WorkflowsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) {
    redirect("/org")
  }

  const orgId = profile.org_id

  // Fetch workflows with execution counts
  const { data: workflows } = await supabase
    .from("workflows")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })

  // Fetch email templates for action config
  const { data: emailTemplates } = await supabase
    .from("email_templates")
    .select("id, name, slug")
    .eq("is_active", true)
    .or(`org_id.eq.${orgId},is_system.eq.true`)
    .order("name")

  // Fetch pipeline stages for action config
  const { data: stages } = await supabase
    .from("pipeline_stages")
    .select("id, name, pipeline_id")
    .eq("org_id", orgId)
    .order("sort_order")

  // Fetch team members for action config
  const { data: teamMembers } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .eq("org_id", orgId)

  return (
    <WorkflowsClient
      initialWorkflows={workflows || []}
      emailTemplates={emailTemplates || []}
      stages={stages || []}
      teamMembers={teamMembers || []}
    />
  )
}
