import { createClient } from "@/lib/supabase/server"
import { UsersClient } from "./users-client"

async function getUsers() {
  const supabase = await createClient()

  // Get all organizations first
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name")

  // Get all profiles (without join to avoid FK issues)
  const { data: profiles, error } = await supabase
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
      created_at,
      organization_id
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching profiles:", error)
    return { users: [], organizations: [] }
  }

  // Get all user roles
  const { data: roles } = await supabase
    .from("user_roles")
    .select("*")

  // Map organizations and roles to users
  const usersWithData = profiles?.map((profile) => {
    const userRoles = roles?.filter((r) => r.user_id === profile.id) || []
    const org = organizations?.find((o) => o.id === profile.organization_id)
    return {
      ...profile,
      roles: userRoles.map((r) => r.role),
      organizations: org ? { id: org.id, name: org.name } : null,
    }
  }) || []

  return {
    users: usersWithData,
    organizations: organizations || [],
  }
}

export default async function UsersPage() {
  const { users, organizations } = await getUsers()

  return <UsersClient initialUsers={users} organizations={organizations} />
}
