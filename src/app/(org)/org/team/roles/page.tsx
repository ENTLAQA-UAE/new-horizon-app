// @ts-nocheck
// Note: Supabase nested relation queries cause "Type instantiation is excessively deep" error
import { createClient } from "@/lib/supabase/server"
import { RolesManagementClient } from "./roles-client"
import { redirect } from "next/navigation"

export default async function RolesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user has permission to manage roles
  const { data: hasPermission } = await supabase.rpc("has_permission", {
    p_user_id: user.id,
    p_permission_code: "users.roles.manage",
    p_org_id: null,
  })

  if (!hasPermission) {
    redirect("/org")
  }

  // Fetch all roles
  const { data: roles } = await supabase
    .from("roles")
    .select("*")
    .order("is_system_role", { ascending: false })
    .order("name")

  // Fetch all permissions
  const { data: permissions } = await supabase
    .from("permissions")
    .select("*")
    .eq("is_active", true)
    .order("category")
    .order("code")

  // Fetch role permissions - use type assertion to avoid deep type instantiation
  const rolePermissionsResult = await supabase
    .from("role_permissions")
    .select(`
      role_id,
      permission_id,
      permissions (
        code,
        name,
        category
      )
    `)
  const rolePermissions = rolePermissionsResult.data as { role_id: string; permission_id: string; permissions: { code: string; name: string; category: string } }[] | null

  return (
    <RolesManagementClient
      roles={roles || []}
      permissions={permissions || []}
      rolePermissions={rolePermissions || []}
    />
  )
}
