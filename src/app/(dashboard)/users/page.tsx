import { createClient } from "@/lib/supabase/server"
import { UsersClient } from "./users-client"

async function getUsers() {
  const supabase = await createClient()

  // Get all users with their profiles, roles, and organizations
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
      organizations (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching profiles:", error)
    return { users: [], roles: [], organizations: [] }
  }

  // Get all user roles
  const { data: roles } = await supabase
    .from("user_roles")
    .select("*")

  // Get all organizations for the filter
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name")

  // Map roles to users
  const usersWithRoles = profiles?.map((profile) => {
    const userRoles = roles?.filter((r) => r.user_id === profile.id) || []
    return {
      ...profile,
      roles: userRoles.map((r) => r.role),
    }
  }) || []

  return {
    users: usersWithRoles,
    organizations: organizations || [],
  }
}

export default async function UsersPage() {
  const { users, organizations } = await getUsers()

  return <UsersClient initialUsers={users} organizations={organizations} />
}
