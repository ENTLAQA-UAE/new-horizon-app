// @ts-nocheck
// Note: Type instantiation is excessively deep error with team_invites table
import { createClient } from "@/lib/supabase/server"
import { getServerTranslation } from "@/lib/i18n/server"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Users,
  Building2,
  Mail,
  Shield,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Palette,
  CheckCircle,
  UserPlus,
  FolderTree,
} from "lucide-react"

interface OrgAdminDashboardProps {
  orgId: string
}

const ROLE_LABELS: Record<string, string> = {
  hr_manager: "HR Manager",
  recruiter: "Recruiter",
  hiring_manager: "Hiring Manager",
  interviewer: "Interviewer",
}

const ROLE_COLORS: Record<string, string> = {
  hr_manager: "#8b5cf6",
  recruiter: "#06b6d4",
  hiring_manager: "#f59e0b",
  interviewer: "#10b981",
}

const ROLE_BADGE_STYLES: Record<string, string> = {
  hr_manager: "bg-purple-500/10 text-purple-600 border-purple-200",
  recruiter: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
  hiring_manager: "bg-amber-500/10 text-amber-600 border-amber-200",
  interviewer: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  org_admin: "bg-blue-500/10 text-blue-600 border-blue-200",
  super_admin: "bg-red-500/10 text-red-600 border-red-200",
}

const TRACKED_ROLES = ["hr_manager", "recruiter", "hiring_manager", "interviewer"] as const

async function getOrgAdminDashboardData(orgId: string) {
  const supabase = await createClient()

  const [
    profilesResult,
    activeProfilesResult,
    departmentsResult,
    activeDepartmentsResult,
    pendingInvitesResult,
    userRolesResult,
    recentMembersResult,
    orgResult,
  ] = await Promise.all([
    // Total team members (also fetch IDs to filter user_roles by org)
    supabase
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("org_id", orgId),

    // Active team members
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("is_active", true),

    // Total departments
    supabase
      .from("departments")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),

    // Active departments
    supabase
      .from("departments")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("is_active", true),

    // Pending invites
    supabase
      .from("team_invites")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "pending"),

    // User roles for role distribution
    supabase
      .from("user_roles")
      .select("user_id, role"),

    // Recent 5 members with profile data
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5),

    // Organization info for logo check
    supabase
      .from("organizations")
      .select("logo_url")
      .eq("id", orgId)
      .single(),
  ])

  // Build role distribution from user_roles
  // user_roles has no org_id — filter to only include members of this org
  const orgMemberIds = new Set((profilesResult.data || []).map((p: any) => p.id))
  const userRoles = (userRolesResult.data || []).filter((ur: any) => orgMemberIds.has(ur.user_id))
  const roleCounts = new Map<string, number>()
  TRACKED_ROLES.forEach((r) => roleCounts.set(r, 0))

  const distinctRoles = new Set<string>()

  userRoles.forEach((ur) => {
    if (TRACKED_ROLES.includes(ur.role as (typeof TRACKED_ROLES)[number])) {
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

  // Build role lookup for recent members
  const roleByUser = new Map<string, string>()
  userRoles.forEach((ur) => {
    if (!roleByUser.has(ur.user_id)) {
      roleByUser.set(ur.user_id, ur.role)
    }
  })

  const recentMembers = (recentMembersResult.data || []).map((m) => ({
    id: m.id,
    firstName: m.first_name,
    lastName: m.last_name,
    email: m.email,
    role: roleByUser.get(m.id) || null,
    createdAt: m.created_at,
  }))

  return {
    totalMembers: profilesResult.count || 0,
    activeMembers: activeProfilesResult.count || 0,
    totalDepartments: departmentsResult.count || 0,
    activeDepartments: activeDepartmentsResult.count || 0,
    pendingInvites: pendingInvitesResult.count || 0,
    roleDistribution,
    distinctRolesAssigned: distinctRoles.size,
    recentMembers,
    hasLogo: !!orgResult.data?.logo_url,
  }
}

export async function OrgAdminDashboard({ orgId }: OrgAdminDashboardProps) {
  const stats = await getOrgAdminDashboardData(orgId)
  const { t } = await getServerTranslation()

  const roleLabels: Record<string, string> = {
    hr_manager: t("dashboard.roles.hrManager"),
    recruiter: t("dashboard.roles.recruiter"),
    hiring_manager: t("dashboard.roles.hiringManager"),
    interviewer: t("dashboard.roles.interviewer"),
  }

  const maxRoleCount = Math.max(...stats.roleDistribution.map((r) => r.count), 1)

  return (
    <div className="space-y-6">
      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        {/* Featured Card - Team Members */}
        <div className="col-span-12 lg:col-span-4 row-span-2">
          <div
            className="h-full rounded-3xl p-6 text-white relative overflow-hidden"
            style={{ background: "var(--brand-gradient)" }}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                  {t("dashboard.orgAdmin.organization")}
                </Badge>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <p className="text-white/70 text-sm font-medium mb-2">{t("dashboard.stats.teamMembers")}</p>
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-bold">{stats.totalMembers}</span>
                </div>
                <p className="text-white/60 text-sm mt-2">
                  {t("dashboard.orgAdmin.totalPeopleInOrg")}
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">{t("dashboard.stats.activeMembers")}</span>
                  <span className="font-semibold">{stats.activeMembers}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/70 text-sm">{t("dashboard.stats.departments")}</span>
                  <span className="font-semibold">{stats.activeDepartments}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards - Row 1 */}
        <div className="col-span-6 lg:col-span-4">
          <div className="bento-card p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "var(--brand-gradient-subtle)" }}
              >
                <Building2 className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">{t("dashboard.stats.departments")}</p>
            <p className="text-3xl font-bold mt-1">{stats.activeDepartments}</p>
            <Link
              href="/org/departments"
              className="inline-flex items-center gap-1 text-sm font-medium mt-3 hover:gap-2 transition-all"
              style={{ color: "var(--brand-primary)" }}
            >
              {t("dashboard.actions.manage")} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="col-span-6 lg:col-span-4">
          <div className="bento-card p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "var(--brand-gradient-subtle)" }}
              >
                <Mail className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
              </div>
              {stats.pendingInvites > 0 && (
                <Badge variant="warning">{stats.pendingInvites} {t("dashboard.orgAdmin.pending")}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-medium">{t("dashboard.stats.pendingInvites")}</p>
            <p className="text-3xl font-bold mt-1">{stats.pendingInvites}</p>
            <Link
              href="/org/team"
              className="inline-flex items-center gap-1 text-sm font-medium mt-3 hover:gap-2 transition-all"
              style={{ color: "var(--brand-primary)" }}
            >
              {t("dashboard.actions.viewAll")} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Stat Cards - Row 2 */}
        <div className="col-span-6 lg:col-span-4">
          <div className="bento-card p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "var(--brand-gradient-subtle)" }}
              >
                <Shield className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">{t("dashboard.stats.activeRoles")}</p>
            <p className="text-3xl font-bold mt-1">{stats.distinctRolesAssigned}</p>
            <p className="text-sm text-muted-foreground mt-3">{t("dashboard.orgAdmin.distinctRolesAssigned")}</p>
          </div>
        </div>

        <div className="col-span-6 lg:col-span-4">
          <div className="bento-card p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "var(--brand-gradient-subtle)" }}
              >
                <Users className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">{t("dashboard.stats.teamMembers")}</p>
            <p className="text-3xl font-bold mt-1">{stats.totalMembers}</p>
            <Link
              href="/org/team"
              className="inline-flex items-center gap-1 text-sm font-medium mt-3 hover:gap-2 transition-all"
              style={{ color: "var(--brand-primary)" }}
            >
              {t("dashboard.actions.viewAll")} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Role Distribution - 8 cols */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bento-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">{t("dashboard.orgAdmin.roleDistribution")}</h3>
                <p className="text-sm text-muted-foreground">{t("dashboard.orgAdmin.teamMembersByRole")}</p>
              </div>
              <Link
                href="/org/team"
                className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: "var(--brand-primary)" }}
              >
                {t("dashboard.orgAdmin.manageRoles")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {stats.roleDistribution.some((r) => r.count > 0) ? (
              <div className="space-y-4">
                {stats.roleDistribution.map((role) => (
                  <div key={role.role} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{roleLabels[role.role] || role.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {role.count} {role.count === 1 ? t("dashboard.orgAdmin.member") : t("dashboard.orgAdmin.members")}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max((role.count / maxRoleCount) * 100, role.count > 0 ? 5 : 0)}%`,
                          background: ROLE_COLORS[role.role] || "var(--brand-primary)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div
                    className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                    style={{ background: "var(--brand-gradient-subtle)" }}
                  >
                    <Shield className="h-6 w-6" style={{ color: "var(--brand-primary)" }} />
                  </div>
                  <p className="text-sm text-muted-foreground">{t("dashboard.emptyStates.noRolesAssigned")}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("dashboard.emptyStates.noRolesAssignedDesc")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions - 4 cols */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bento-card p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">{t("dashboard.quickActions")}</h3>
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="space-y-3">
              <Link
                href="/org/team"
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-transparent hover:shadow-md hover:bg-card transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: "var(--brand-gradient-subtle)" }}
                >
                  <UserPlus className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{t("dashboard.orgAdmin.manageTeam")}</p>
                  <p className="text-xs text-muted-foreground">{t("dashboard.orgAdmin.inviteAndManageMembers")}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/org/departments"
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-transparent hover:shadow-md hover:bg-card transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: "var(--brand-gradient-subtle)" }}
                >
                  <FolderTree className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{t("dashboard.orgAdmin.manageDepartments")}</p>
                  <p className="text-xs text-muted-foreground">{t("dashboard.orgAdmin.organizeYourTeams")}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/org/branding"
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-transparent hover:shadow-md hover:bg-card transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: "var(--brand-gradient-subtle)" }}
                >
                  <Palette className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{t("dashboard.orgAdmin.branding")}</p>
                  <p className="text-xs text-muted-foreground">{t("dashboard.orgAdmin.customizeYourLook")}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Members - 6 cols */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bento-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold">{t("dashboard.orgAdmin.recentMembers")}</h3>
                <p className="text-sm text-muted-foreground">{t("dashboard.orgAdmin.newestTeamAdditions")}</p>
              </div>
              <Link
                href="/org/team"
                className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: "var(--brand-primary)" }}
              >
                {t("dashboard.actions.viewAll")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {stats.recentMembers.length > 0 ? (
              <div className="space-y-3">
                {stats.recentMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "var(--brand-gradient-subtle)" }}
                    >
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "var(--brand-primary)" }}
                      >
                        {member.firstName?.charAt(0) || ""}
                        {member.lastName?.charAt(0) || ""}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {member.role && (
                        <Badge
                          variant="outline"
                          className={ROLE_BADGE_STYLES[member.role] || ""}
                        >
                          {roleLabels[member.role] || member.role}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {member.createdAt
                          ? new Date(member.createdAt).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div
                  className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: "var(--brand-gradient-subtle)" }}
                >
                  <Users className="h-6 w-6" style={{ color: "var(--brand-primary)" }} />
                </div>
                <p className="text-sm text-muted-foreground">{t("dashboard.emptyStates.noTeamMembers")}</p>
                <Link
                  href="/org/team"
                  className="inline-flex items-center gap-1 text-sm font-medium mt-2"
                  style={{ color: "var(--brand-primary)" }}
                >
                  {t("dashboard.orgAdmin.inviteMembers")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Getting Started - 6 cols */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bento-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold">{t("dashboard.orgAdmin.gettingStarted")}</h3>
                <p className="text-sm text-muted-foreground">{t("dashboard.orgAdmin.completeYourSetup")}</p>
              </div>
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="space-y-4">
              {/* Set up branding */}
              <div className="flex items-start gap-3 group">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    stats.hasLogo ? "bg-green-500" : "bg-muted"
                  }`}
                >
                  {stats.hasLogo ? (
                    <CheckCircle className="h-4 w-4 text-white" />
                  ) : (
                    <Palette className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      stats.hasLogo ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {t("dashboard.orgAdmin.setUpBranding")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("dashboard.orgAdmin.setUpBrandingDesc")}
                  </p>
                </div>
                {!stats.hasLogo && (
                  <Link
                    href="/org/branding"
                    className="text-xs font-medium shrink-0 hover:underline"
                    style={{ color: "var(--brand-primary)" }}
                  >
                    {t("dashboard.actions.setUp")}
                  </Link>
                )}
              </div>

              {/* Add departments */}
              <div className="flex items-start gap-3 group">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    stats.totalDepartments > 0 ? "bg-green-500" : "bg-muted"
                  }`}
                >
                  {stats.totalDepartments > 0 ? (
                    <CheckCircle className="h-4 w-4 text-white" />
                  ) : (
                    <FolderTree className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      stats.totalDepartments > 0
                        ? "line-through text-muted-foreground"
                        : ""
                    }`}
                  >
                    {t("dashboard.orgAdmin.addDepartments")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("dashboard.orgAdmin.addDepartmentsDesc")}
                  </p>
                </div>
                {stats.totalDepartments === 0 && (
                  <Link
                    href="/org/departments"
                    className="text-xs font-medium shrink-0 hover:underline"
                    style={{ color: "var(--brand-primary)" }}
                  >
                    {t("common.add")}
                  </Link>
                )}
              </div>

              {/* Invite team members */}
              <div className="flex items-start gap-3 group">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    stats.totalMembers > 1 ? "bg-green-500" : "bg-muted"
                  }`}
                >
                  {stats.totalMembers > 1 ? (
                    <CheckCircle className="h-4 w-4 text-white" />
                  ) : (
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      stats.totalMembers > 1
                        ? "line-through text-muted-foreground"
                        : ""
                    }`}
                  >
                    {t("dashboard.orgAdmin.inviteTeamMembers")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("dashboard.orgAdmin.inviteTeamMembersDesc")}
                  </p>
                </div>
                {stats.totalMembers <= 1 && (
                  <Link
                    href="/org/team"
                    className="text-xs font-medium shrink-0 hover:underline"
                    style={{ color: "var(--brand-primary)" }}
                  >
                    {t("dashboard.actions.invite")}
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t">
              <Link
                href="/org/settings"
                className="flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg hover:bg-muted transition-colors"
                style={{ color: "var(--brand-primary)" }}
              >
                {t("dashboard.orgAdmin.configureSettings")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
