import { SupabaseClient } from "@supabase/supabase-js"

export type AppRole = "super_admin" | "org_admin" | "hr_manager" | "recruiter" | "hiring_manager" | "interviewer"

interface UserAuthInfo {
  userId: string
  orgId: string | null
  role: AppRole | null
  isAdmin: boolean
  isSuperAdmin: boolean
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

  return {
    userId,
    orgId: profile?.org_id || null,
    role,
    isAdmin,
    isSuperAdmin,
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
