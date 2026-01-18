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

  // Get workflows
  const { data: workflows } = await supabase
    .from("workflows")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })

  // Get email templates for workflow actions
  const { data: emailTemplates } = await supabase
    .from("email_templates")
    .select("id, name, slug")
    .eq("is_active", true)

  // Get hiring stages
  const { data: stages } = await supabase
    .from("hiring_stages")
    .select("id, name")
    .eq("organization_id", orgId)
    .order("sort_order", { ascending: true })

  // Get team members from profiles
  const { data: teamMembers } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .eq("org_id", orgId)

  return (
    <WorkflowsClient
      workflows={workflows || []}
      emailTemplates={emailTemplates || []}
      stages={stages || []}
      teamMembers={
        teamMembers?.map((m) => ({
          id: m.id,
          name: m.first_name && m.last_name ? `${m.first_name} ${m.last_name}` : m.email || "Unknown",
        })) || []
      }
    />
  )
}
