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

  // Get user's organization
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .single()

  if (!membership) {
    redirect("/organizations")
  }

  // Get workflows
  const { data: workflows } = await supabase
    .from("workflows")
    .select("*")
    .eq("organization_id", membership.organization_id)
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
    .eq("organization_id", membership.organization_id)
    .order("sort_order", { ascending: true })

  // Get team members
  const { data: teamMembers } = await supabase
    .from("organization_members")
    .select("user_id, users(id, email, full_name)")
    .eq("organization_id", membership.organization_id)

  return (
    <WorkflowsClient
      workflows={workflows || []}
      emailTemplates={emailTemplates || []}
      stages={stages || []}
      teamMembers={
        teamMembers?.map((m) => ({
          id: (m.users as { id: string })?.id || m.user_id,
          name: (m.users as { full_name: string })?.full_name || (m.users as { email: string })?.email || "Unknown",
        })) || []
      }
    />
  )
}
