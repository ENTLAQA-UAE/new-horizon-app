"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Building2,
  Mail,
  ShieldCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  UserPlus,
} from "lucide-react"
import type { OrgAdminStats } from "@/lib/analytics/org-admin-stats"

interface OrgAdminAnalyticsProps {
  stats: OrgAdminStats
}

const ROLE_COLORS: Record<string, string> = {
  hr_manager: "bg-purple-500",
  recruiter: "bg-indigo-500",
  hiring_manager: "bg-cyan-500",
  interviewer: "bg-emerald-500",
}

const ROLE_BAR_COLORS: Record<string, string> = {
  hr_manager: "#a855f7",
  recruiter: "#6366f1",
  hiring_manager: "#06b6d4",
  interviewer: "#10b981",
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatRoleLabel(role: string | null): string {
  if (!role) return "Unassigned"
  const labels: Record<string, string> = {
    super_admin: "Super Admin",
    org_admin: "Org Admin",
    hr_manager: "HR Manager",
    recruiter: "Recruiter",
    hiring_manager: "Hiring Manager",
    interviewer: "Interviewer",
  }
  return labels[role] || role
}

export function OrgAdminAnalytics({ stats }: OrgAdminAnalyticsProps) {
  const totalInvites =
    stats.inviteStatus.pending +
    stats.inviteStatus.accepted +
    stats.inviteStatus.expired

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
          Organization Overview
        </h2>
        <p className="text-muted-foreground mt-1">
          Monitor your team structure, departments, and organizational health
        </p>
      </div>

      {/* Hero Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Team Members */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-100 text-sm font-medium">
                  Total Team Members
                </p>
                <p className="text-4xl font-bold mt-1">
                  {stats.teamOverview.totalMembers}
                </p>
                <p className="text-sm text-indigo-100 mt-2">
                  {stats.teamOverview.activeMembers} active
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Departments */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-100 text-sm font-medium">
                  Active Departments
                </p>
                <p className="text-4xl font-bold mt-1">
                  {stats.departmentStats.totalDepartments}
                </p>
                <p className="text-sm text-emerald-100 mt-2">
                  Organizational units
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Invites */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-amber-100 text-sm font-medium">
                  Pending Invites
                </p>
                <p className="text-4xl font-bold mt-1">
                  {stats.inviteStatus.pending}
                </p>
                <p className="text-sm text-amber-100 mt-2">
                  Awaiting response
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Mail className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Coverage */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-cyan-100 text-sm font-medium">
                  Role Coverage
                </p>
                <p className="text-4xl font-bold mt-1">
                  {stats.distinctRolesAssigned}
                  <span className="text-xl ml-1">/ 4</span>
                </p>
                <p className="text-sm text-cyan-100 mt-2">
                  Distinct roles assigned
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section: Role Distribution + Department Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-500" />
              Role Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of team members by assigned role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {stats.roleDistribution.map((role) => {
              const totalMembers = stats.teamOverview.totalMembers || 1
              const percentOfTeam = Math.round(
                (role.count / totalMembers) * 100
              )

              return (
                <div key={role.role} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-3 w-3 rounded-full ${ROLE_COLORS[role.role] || "bg-slate-400"}`}
                      />
                      <span className="font-medium">{role.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        {role.count} member{role.count !== 1 ? "s" : ""}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {role.percentage}%
                      </Badge>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.max(role.percentage, 2)}%`,
                        backgroundColor:
                          ROLE_BAR_COLORS[role.role] || "#94a3b8",
                      }}
                    />
                  </div>
                </div>
              )
            })}

            {stats.roleDistribution.every((r) => r.count === 0) && (
              <div className="py-8 text-center">
                <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground text-sm">
                  No roles have been assigned yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-500" />
              Department Overview
            </CardTitle>
            <CardDescription>
              Departments and their member counts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.departmentStats.departments.length > 0 ? (
              <div className="space-y-3">
                {stats.departmentStats.departments.map((dept, index) => {
                  const maxMembers = Math.max(
                    ...stats.departmentStats.departments.map(
                      (d) => d.memberCount
                    ),
                    1
                  )
                  const barWidth = (dept.memberCount / maxMembers) * 100

                  return (
                    <div
                      key={dept.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-sm shrink-0">
                        {dept.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{dept.name}</p>
                        <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.max(barWidth, 4)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {dept.memberCount} member
                        {dept.memberCount !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Building2 className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground text-sm">
                  No departments created yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Invite Status + Recent Members */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invite Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-amber-500" />
              Invite Status
            </CardTitle>
            <CardDescription>
              Team invitation tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pending */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="p-2.5 rounded-lg bg-amber-500/20">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Pending
                </p>
                <p className="text-2xl font-bold">
                  {stats.inviteStatus.pending}
                </p>
              </div>
              {stats.inviteStatus.pending > 0 && (
                <Badge className="bg-amber-500 text-white">
                  Action needed
                </Badge>
              )}
            </div>

            {/* Accepted */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="p-2.5 rounded-lg bg-emerald-500/20">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Accepted
                </p>
                <p className="text-2xl font-bold">
                  {stats.inviteStatus.accepted}
                </p>
              </div>
            </div>

            {/* Expired */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <div className="p-2.5 rounded-lg bg-rose-500/20">
                <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Expired
                </p>
                <p className="text-2xl font-bold">
                  {stats.inviteStatus.expired}
                </p>
              </div>
              {stats.inviteStatus.expired > 0 && (
                <Badge variant="outline" className="text-rose-600 border-rose-300">
                  Resend
                </Badge>
              )}
            </div>

            {/* Summary bar */}
            {totalInvites > 0 && (
              <div className="pt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Acceptance rate</span>
                  <span>
                    {Math.round(
                      (stats.inviteStatus.accepted / totalInvites) * 100
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={Math.round(
                    (stats.inviteStatus.accepted / totalInvites) * 100
                  )}
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Members */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-indigo-500" />
              Recent Members
            </CardTitle>
            <CardDescription>
              Last 10 team members who joined the organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentMembers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Role
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentMembers.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold shrink-0">
                              {member.firstName?.charAt(0) || ""}
                              {member.lastName?.charAt(0) || ""}
                            </div>
                            <span className="font-medium truncate">
                              {member.firstName} {member.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground truncate max-w-[200px]">
                          {member.email}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={member.role ? "default" : "secondary"}
                            className={
                              member.role
                                ? `${ROLE_COLORS[member.role] || "bg-slate-500"} text-white`
                                : ""
                            }
                          >
                            {formatRoleLabel(member.role)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground whitespace-nowrap">
                          {formatDate(member.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  No team members found
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
