// @ts-nocheck
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TeamClient } from "./team-client"

export default async function TeamPage() {
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
    redirect("/onboarding")
  }

  const orgId = profile.org_id

  // Fetch team members (profiles in this org)
  const { data: members } = await supabase
    .from("profiles")
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      department,
      avatar_url,
      is_active,
      last_login_at,
      created_at
    `)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  // Fetch user roles for team members
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .eq("org_id", orgId)

  // Create a map of user roles
  const roleMap = new Map(userRoles?.map(r => [r.user_id, r.role]) || [])

  // Enrich members with roles
  const enrichedMembers = members?.map(m => ({
    ...m,
    role: roleMap.get(m.id) || "member",
  })) || []

  // Fetch pending invites
  const { data: invites } = await supabase
    .from("team_invites")
    .select("*")
    .eq("org_id", orgId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  // Fetch departments for filtering
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("name")

  return (
    <TeamClient
      members={enrichedMembers}
      invites={invites || []}
      departments={departments || []}
      organizationId={orgId}
      currentUserId={user.id}
    />
  )
}
