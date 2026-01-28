// @ts-nocheck
// Note: user_roles table type causes "Type instantiation is excessively deep" error
import { createClient } from "@/lib/supabase/server"

export interface DepartmentAccess {
  userId: string
  orgId: string
  role: string | null
  /** Department IDs user is scoped to. null = no filtering (full access). [] = no departments assigned. */
  departmentIds: string[] | null
}

/**
 * Server-side helper to get the current user's role and department access scope.
 *
 * For `hiring_manager` role: returns assigned department IDs from `user_role_departments`.
 * For other roles (hr_manager, recruiter, org_admin, etc.): returns null (no filtering needed).
 *
 * Usage in server page components:
 * ```
 * const access = await getDepartmentAccess()
 * if (access.departmentIds) {
 *   // Filter queries by department
 *   query.in("department_id", access.departmentIds)
 * }
 * ```
 */
export async function getDepartmentAccess(): Promise<DepartmentAccess | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's org_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) return null

  const orgId = profile.org_id

  // Get user's role in this org
  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .single()

  const role = userRole?.role || null

  // Only hiring_manager needs department scoping
  if (role !== "hiring_manager") {
    return {
      userId: user.id,
      orgId,
      role,
      departmentIds: null, // null = full access, no filtering
    }
  }

  // Fetch assigned departments for hiring_manager
  const { data: deptAssignments } = await supabase
    .from("user_role_departments")
    .select("department_id")
    .eq("user_id", user.id)
    .eq("org_id", orgId)

  const departmentIds = deptAssignments?.map((d) => d.department_id) || []

  return {
    userId: user.id,
    orgId,
    role,
    departmentIds, // array of department IDs to filter by
  }
}
