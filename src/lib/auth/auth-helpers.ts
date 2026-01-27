import { SupabaseClient } from "@supabase/supabase-js"

export type AppRole = "super_admin" | "org_admin" | "hr_manager" | "recruiter" | "hiring_manager" | "interviewer"

export interface UserAuthInfo {
  userId: string
  orgId: string | null
  role: AppRole | null
  isAdmin: boolean
  isSuperAdmin: boolean
  departmentIds: string[]
}

/**
 * Get user's auth info including org_id and role
 * Uses profiles and user_roles tables (NOT organization_members)
 */
export async function getUserAuthInfo(supabase: SupabaseClient, userId: string): Promise<UserAuthInfo | null> {
  // Get user's profile with org_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", userId)
    .single()

  // Get user's role
  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single()

  const role = userRole?.role as AppRole | null
  const isSuperAdmin = role === "super_admin"
  const isAdmin = role === "org_admin" || role === "super_admin"

  // Fetch department assignments for hiring_manager
  let departmentIds: string[] = []
  if (role === "hiring_manager" && profile?.org_id) {
    const { data: deptData } = await supabase
      .from("user_role_departments")
      .select("department_id")
      .eq("user_id", userId)
      .eq("org_id", profile.org_id)
    departmentIds = deptData?.map((d: { department_id: string }) => d.department_id) || []
  }

  return {
    userId,
    orgId: profile?.org_id || null,
    role,
    isAdmin,
    isSuperAdmin,
    departmentIds,
  }
}

/**
 * Verify user is admin of a specific organization
 */
export async function verifyOrgAdmin(
  supabase: SupabaseClient,
  userId: string,
  orgId: string
): Promise<{ authorized: boolean; error?: string }> {
  const authInfo = await getUserAuthInfo(supabase, userId)

  if (!authInfo) {
    return { authorized: false, error: "User not found" }
  }

  // Super admins can access any org
  if (authInfo.isSuperAdmin) {
    return { authorized: true }
  }

  // Check if user is org_admin and belongs to this org
  if (authInfo.isAdmin && authInfo.orgId === orgId) {
    return { authorized: true }
  }

  return { authorized: false, error: "Not authorized" }
}

/**
 * Verify user has access to an organization (any role)
 */
export async function verifyOrgMember(
  supabase: SupabaseClient,
  userId: string,
  orgId: string
): Promise<{ authorized: boolean; error?: string }> {
  const authInfo = await getUserAuthInfo(supabase, userId)

  if (!authInfo) {
    return { authorized: false, error: "User not found" }
  }

  // Super admins can access any org
  if (authInfo.isSuperAdmin) {
    return { authorized: true }
  }

  // Check if user belongs to this org
  if (authInfo.orgId === orgId) {
    return { authorized: true }
  }

  return { authorized: false, error: "Not authorized" }
}

/**
 * Verify user has one of the allowed roles in an organization
 */
export async function verifyAccess(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
  allowedRoles: AppRole[]
): Promise<{ authorized: boolean; error?: string; authInfo?: UserAuthInfo }> {
  const authInfo = await getUserAuthInfo(supabase, userId)

  if (!authInfo) {
    return { authorized: false, error: "User not found" }
  }

  // Super admins can access everything
  if (authInfo.isSuperAdmin) {
    return { authorized: true, authInfo }
  }

  // Check org membership
  if (authInfo.orgId !== orgId) {
    return { authorized: false, error: "Not authorized for this organization" }
  }

  // Check role
  if (!authInfo.role || !allowedRoles.includes(authInfo.role)) {
    return { authorized: false, error: "Insufficient permissions" }
  }

  return { authorized: true, authInfo }
}
