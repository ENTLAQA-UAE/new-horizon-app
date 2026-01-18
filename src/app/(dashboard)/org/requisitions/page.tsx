import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RequisitionsClient } from "./requisitions-client"

export default async function RequisitionsPage() {
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

  // Get job requisitions
  const { data: requisitions } = await supabase
    .from("job_requisitions")
    .select(`
      *,
      departments (id, name),
      job_locations (id, name, city)
    `)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  // Get requisition approvals
  const { data: approvals } = await supabase
    .from("requisition_approvals")
    .select("*")

  // Get departments
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, name_ar")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("name")

  // Get locations
  const { data: locations } = await supabase
    .from("job_locations")
    .select("id, name, city")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("name")

  // Get team members for approvers
  const { data: teamMembers } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .eq("org_id", orgId)

  return (
    <RequisitionsClient
      requisitions={requisitions || []}
      approvals={approvals || []}
      departments={departments || []}
      locations={locations || []}
      teamMembers={
        teamMembers?.map((m) => ({
          id: m.id,
          name: m.first_name && m.last_name
            ? `${m.first_name} ${m.last_name}`
            : m.email || "Unknown",
        })) || []
      }
      organizationId={orgId}
      currentUserId={user.id}
    />
  )
}
