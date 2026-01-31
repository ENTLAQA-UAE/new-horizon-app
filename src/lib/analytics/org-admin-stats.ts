import { SupabaseClient } from "@supabase/supabase-js"

export interface OrgAdminStats {
  teamOverview: {
    totalMembers: number
    activeMembers: number
  }
  roleDistribution: {
    role: string
    label: string
    count: number
    percentage: number
  }[]
  departmentStats: {
    totalDepartments: number
    departments: {
      id: string
      name: string
      memberCount: number
    }[]
  }
  inviteStatus: {
    pending: number
    accepted: number
    expired: number
  }
  recentMembers: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string | null
    createdAt: string | null
  }[]
  distinctRolesAssigned: number
}

const ROLE_LABELS: Record<string, string> = {
  hr_manager: "HR Manager",
  recruiter: "Recruiter",
  hiring_manager: "Hiring Manager",
  interviewer: "Interviewer",
}

const TRACKED_ROLES = ["hr_manager", "recruiter", "hiring_manager", "interviewer"] as const

export async function getOrgAdminStats(
  supabase: SupabaseClient,
  orgId: string
): Promise<OrgAdminStats> {
  const now = new Date()

  // Fetch all data in parallel — every query is scoped to the current org
  const [
    profilesResult,
    userRolesResult,
    departmentsResult,
    invitesPendingResult,
    invitesAcceptedResult,
    invitesExpiredResult,
    recentMembersResult,
    departmentMembersResult,
  ] = await Promise.all([
    // All team member profiles (org-scoped)
    supabase
      .from("profiles")
      .select("id, is_active", { count: "exact" })
      .eq("org_id", orgId),

    // All user role assignments (user_roles has no org_id — filtered in JS below)
    supabase
      .from("user_roles")
      .select("user_id, role"),

    // All departments (org-scoped)
    supabase
      .from("departments")
      .select("id, name, is_active")
      .eq("org_id", orgId),

    // Pending invites (org-scoped)
    supabase
      .from("team_invites")
      .select("id", { count: "exact" })
      .eq("org_id", orgId)
      .eq("status", "pending"),

    // Accepted invites (org-scoped)
    supabase
      .from("team_invites")
      .select("id", { count: "exact" })
      .eq("org_id", orgId)
      .eq("status", "accepted"),

    // Expired invites (org-scoped)
    supabase
      .from("team_invites")
      .select("id", { count: "exact" })
      .eq("org_id", orgId)
      .eq("status", "expired"),

    // Last 10 members who joined (org-scoped, most recent first)
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10),

    // Department-to-member mapping (org-scoped)
    supabase
      .from("user_role_departments")
      .select("user_id, department_id")
      .eq("org_id", orgId),
  ])

  // ---------- Team overview ----------
  const profiles = profilesResult.data || []
  const totalMembers = profilesResult.count || 0
  const activeMembers = profiles.filter((p) => p.is_active !== false).length

  // ---------- Role distribution ----------
  // user_roles table has no org_id — filter to only include members of this org
  const orgMemberIds = new Set(profiles.map((p) => p.id))
  const userRoles = (userRolesResult.data || []).filter((ur) => orgMemberIds.has(ur.user_id))
  const roleCounts = new Map<string, number>()
  TRACKED_ROLES.forEach((r) => roleCounts.set(r, 0))

  const distinctRoles = new Set<string>()

  userRoles.forEach((ur) => {
    if (TRACKED_ROLES.includes(ur.role as typeof TRACKED_ROLES[number])) {
      roleCounts.set(ur.role, (roleCounts.get(ur.role) || 0) + 1)
      distinctRoles.add(ur.role)
    }
  })

  const totalRoleAssignments = Array.from(roleCounts.values()).reduce(
    (sum, c) => sum + c,
    0
  )

  const roleDistribution = TRACKED_ROLES.map((role) => {
    const count = roleCounts.get(role) || 0
    return {
      role,
      label: ROLE_LABELS[role] || role,
      count,
      percentage:
        totalRoleAssignments > 0
          ? Math.round((count / totalRoleAssignments) * 100)
          : 0,
    }
  })

  // ---------- Department stats ----------
  const departments = departmentsResult.data || []
  const activeDepartments = departments.filter((d) => d.is_active !== false)
  const departmentMembers = departmentMembersResult.data || []

  // Count members per department
  const deptMemberCounts = new Map<string, Set<string>>()
  departmentMembers.forEach((dm) => {
    if (!deptMemberCounts.has(dm.department_id)) {
      deptMemberCounts.set(dm.department_id, new Set())
    }
    deptMemberCounts.get(dm.department_id)!.add(dm.user_id)
  })

  const departmentList = activeDepartments
    .map((dept) => ({
      id: dept.id,
      name: dept.name,
      memberCount: deptMemberCounts.get(dept.id)?.size || 0,
    }))
    .sort((a, b) => b.memberCount - a.memberCount)

  // ---------- Invite status ----------
  const pendingInvites = invitesPendingResult.count || 0
  const acceptedInvites = invitesAcceptedResult.count || 0
  const expiredInvites = invitesExpiredResult.count || 0

  // ---------- Recent members ----------
  const recentMembersRaw = recentMembersResult.data || []

  // Build a quick role lookup for recent members
  const roleByUser = new Map<string, string>()
  userRoles.forEach((ur) => {
    // Keep the first (most relevant) role per user
    if (!roleByUser.has(ur.user_id)) {
      roleByUser.set(ur.user_id, ur.role)
    }
  })

  const recentMembers = recentMembersRaw.map((m) => ({
    id: m.id,
    firstName: m.first_name,
    lastName: m.last_name,
    email: m.email,
    role: roleByUser.get(m.id) || null,
    createdAt: m.created_at,
  }))

  return {
    teamOverview: {
      totalMembers,
      activeMembers,
    },
    roleDistribution,
    departmentStats: {
      totalDepartments: activeDepartments.length,
      departments: departmentList,
    },
    inviteStatus: {
      pending: pendingInvites,
      accepted: acceptedInvites,
      expired: expiredInvites,
    },
    recentMembers,
    distinctRolesAssigned: distinctRoles.size,
  }
}
