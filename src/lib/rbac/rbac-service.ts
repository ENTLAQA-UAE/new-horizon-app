import { SupabaseClient } from "@supabase/supabase-js"
import type { PermissionCode, RoleContext, SystemRoleCode } from "./types"

// =====================================================
// RBAC SERVICE - Server-side permission checking
// =====================================================

/**
 * Get the role context for a user
 */
export async function getUserRoleContext(
  supabase: SupabaseClient,
  userId: string,
  orgId?: string | null
): Promise<RoleContext | null> {
  try {
    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select(`
        id,
        org_id,
        is_primary,
        role:roles (
          id,
          code,
          name
        )
      `)
      .eq("user_id", userId)

    if (rolesError) {
      console.error("Error fetching user roles:", rolesError)
      return null
    }

    if (!userRoles || userRoles.length === 0) {
      return {
        userId,
        orgId: orgId || null,
        roles: [],
        permissions: [],
        primaryRole: null,
        isSuperAdmin: false,
        isOrgAdmin: false,
        isHRManager: false,
        isRecruiter: false,
        isHiringManager: false,
        isCandidate: false,
      }
    }

    // Get permissions for all user roles
    const roleIds = userRoles.map((ur) => (ur.role as any).id)
    const { data: rolePermissions, error: permError } = await supabase
      .from("role_permissions")
      .select(`
        permission:permissions (
          code
        )
      `)
      .in("role_id", roleIds)

    if (permError) {
      console.error("Error fetching permissions:", permError)
    }

    const permissions: PermissionCode[] = rolePermissions
      ? [...new Set(rolePermissions.map((rp) => (rp.permission as any).code as PermissionCode))]
      : []

    const roles = userRoles.map((ur) => ({
      id: (ur.role as any).id,
      code: (ur.role as any).code,
      name: (ur.role as any).name,
      orgId: ur.org_id,
      isPrimary: ur.is_primary,
    }))

    const roleCodes = roles.map((r) => r.code)
    const primaryRole = roles.find((r) => r.isPrimary)?.code || roles[0]?.code || null

    return {
      userId,
      orgId: orgId || null,
      roles,
      permissions,
      primaryRole,
      isSuperAdmin: roleCodes.includes("super_admin"),
      isOrgAdmin: roleCodes.includes("org_admin"),
      isHRManager: roleCodes.includes("hr_manager"),
      isRecruiter: roleCodes.includes("recruiter"),
      isHiringManager: roleCodes.includes("hiring_manager"),
      isCandidate: roleCodes.includes("candidate"),
    }
  } catch (error) {
    console.error("Error in getUserRoleContext:", error)
    return null
  }
}

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(
  supabase: SupabaseClient,
  userId: string,
  permission: PermissionCode,
  orgId?: string | null
): Promise<boolean> {
  try {
    // Use the database function for efficient checking
    const { data, error } = await supabase.rpc("has_permission", {
      p_user_id: userId,
      p_permission_code: permission,
      p_org_id: orgId || null,
    })

    if (error) {
      console.error("Error checking permission:", error)
      return false
    }

    return data === true
  } catch (error) {
    console.error("Error in hasPermission:", error)
    return false
  }
}

/**
 * Check if a user has any of the specified permissions
 */
export async function hasAnyPermission(
  supabase: SupabaseClient,
  userId: string,
  permissions: PermissionCode[],
  orgId?: string | null
): Promise<boolean> {
  const context = await getUserRoleContext(supabase, userId, orgId)
  if (!context) return false

  return permissions.some((p) => context.permissions.includes(p))
}

/**
 * Check if a user has all of the specified permissions
 */
export async function hasAllPermissions(
  supabase: SupabaseClient,
  userId: string,
  permissions: PermissionCode[],
  orgId?: string | null
): Promise<boolean> {
  const context = await getUserRoleContext(supabase, userId, orgId)
  if (!context) return false

  return permissions.every((p) => context.permissions.includes(p))
}

/**
 * Check if a user has a specific role
 */
export async function hasRole(
  supabase: SupabaseClient,
  userId: string,
  role: SystemRoleCode,
  orgId?: string | null
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("has_role", {
      p_user_id: userId,
      p_role_code: role,
      p_org_id: orgId || null,
    })

    if (error) {
      console.error("Error checking role:", error)
      return false
    }

    return data === true
  } catch (error) {
    console.error("Error in hasRole:", error)
    return false
  }
}

/**
 * Check if a user has any of the specified roles
 */
export async function hasAnyRole(
  supabase: SupabaseClient,
  userId: string,
  roles: SystemRoleCode[],
  orgId?: string | null
): Promise<boolean> {
  const context = await getUserRoleContext(supabase, userId, orgId)
  if (!context) return false

  return roles.some((r) => context.roles.some((ur) => ur.code === r))
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(
  supabase: SupabaseClient,
  userId: string,
  orgId?: string | null
): Promise<PermissionCode[]> {
  try {
    const { data, error } = await supabase.rpc("get_user_permissions", {
      p_user_id: userId,
      p_org_id: orgId || null,
    })

    if (error) {
      console.error("Error getting user permissions:", error)
      return []
    }

    return data?.map((p: { permission_code: string }) => p.permission_code as PermissionCode) || []
  } catch (error) {
    console.error("Error in getUserPermissions:", error)
    return []
  }
}

/**
 * Assign a role to a user
 */
export async function assignRole(
  supabase: SupabaseClient,
  userId: string,
  roleCode: SystemRoleCode,
  orgId: string | null,
  assignedBy: string,
  isPrimary: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get role ID
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("code", roleCode)
      .single()

    if (roleError || !role) {
      return { success: false, error: "Role not found" }
    }

    // Insert user role
    const { error: insertError } = await supabase.from("user_roles").insert({
      user_id: userId,
      role_id: role.id,
      org_id: orgId,
      is_primary: isPrimary,
      assigned_by: assignedBy,
    })

    if (insertError) {
      if (insertError.code === "23505") {
        return { success: false, error: "User already has this role" }
      }
      return { success: false, error: insertError.message }
    }

    // Log the action
    await supabase.from("role_audit_logs").insert({
      user_id: assignedBy,
      target_user_id: userId,
      action: "role_assigned",
      role_id: role.id,
      org_id: orgId,
      details: { role_code: roleCode, is_primary: isPrimary },
    })

    return { success: true }
  } catch (error) {
    console.error("Error assigning role:", error)
    return { success: false, error: "Failed to assign role" }
  }
}

/**
 * Remove a role from a user
 */
export async function removeRole(
  supabase: SupabaseClient,
  userId: string,
  roleCode: SystemRoleCode,
  orgId: string | null,
  removedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get role ID
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("code", roleCode)
      .single()

    if (roleError || !role) {
      return { success: false, error: "Role not found" }
    }

    // Delete user role
    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role_id", role.id)
      .eq("org_id", orgId)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    // Log the action
    await supabase.from("role_audit_logs").insert({
      user_id: removedBy,
      target_user_id: userId,
      action: "role_removed",
      role_id: role.id,
      org_id: orgId,
      details: { role_code: roleCode },
    })

    return { success: true }
  } catch (error) {
    console.error("Error removing role:", error)
    return { success: false, error: "Failed to remove role" }
  }
}

/**
 * Get all available roles
 */
export async function getAllRoles(
  supabase: SupabaseClient,
  orgId?: string | null
): Promise<{ id: string; code: string; name: string; name_ar: string | null; is_system_role: boolean }[]> {
  try {
    let query = supabase
      .from("roles")
      .select("id, code, name, name_ar, is_system_role")
      .eq("is_active", true)
      .order("code")

    if (orgId) {
      query = query.or(`org_id.eq.${orgId},is_system_role.eq.true`)
    } else {
      query = query.eq("is_system_role", true)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching roles:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAllRoles:", error)
    return []
  }
}

/**
 * Get role with all its permissions
 */
export async function getRoleWithPermissions(
  supabase: SupabaseClient,
  roleId: string
): Promise<{ role: any; permissions: any[] } | null> {
  try {
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("*")
      .eq("id", roleId)
      .single()

    if (roleError || !role) {
      return null
    }

    const { data: permissions, error: permError } = await supabase
      .from("role_permissions")
      .select(`
        permission:permissions (*)
      `)
      .eq("role_id", roleId)

    if (permError) {
      console.error("Error fetching role permissions:", permError)
      return { role, permissions: [] }
    }

    return {
      role,
      permissions: permissions?.map((p) => p.permission) || [],
    }
  } catch (error) {
    console.error("Error in getRoleWithPermissions:", error)
    return null
  }
}
