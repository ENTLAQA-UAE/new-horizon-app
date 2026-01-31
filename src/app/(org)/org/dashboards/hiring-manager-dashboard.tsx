// @ts-nocheck
// Note: Type instantiation is excessively deep error with Supabase typed client
import { createClient } from "@/lib/supabase/server"
import { getServerTranslation } from "@/lib/i18n/server"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Briefcase,
  Users,
  FileText,
  FileCheck,
  Calendar,
  CheckCircle,
  ChevronRight,
  ArrowRight,
  Zap,
  Target,
  Clock,
  ClipboardList,
  Building2,
} from "lucide-react"

interface HiringManagerDashboardProps {
  orgId: string
  departmentIds: string[]
}

async function getHiringManagerStats(orgId: string, departmentIds: string[]) {
  const supabase = await createClient()
  const safeDeptIds = departmentIds.length > 0 ? departmentIds : ["__none__"]

  const [
    jobsResult,
    activeJobsResult,
    applicationsResult,
    recentApplicationsResult,
    upcomingInterviewsResult,
    requisitionsResult,
    departmentsResult,
  ] = await Promise.all([
    // Total department jobs
    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .in("department_id", safeDeptIds),

    // Active (open) department jobs
    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "open")
      .in("department_id", safeDeptIds),

    // Department applications by status for pipeline
    supabase
      .from("applications")
      .select("status, jobs!inner(department_id)")
      .eq("org_id", orgId)
      .in("jobs.department_id", safeDeptIds),

    // Recent 5 applications
    supabase
      .from("applications")
      .select(
        "id, status, created_at, candidates(first_name, last_name), jobs!inner(title, department_id)"
      )
      .eq("org_id", orgId)
      .in("jobs.department_id", safeDeptIds)
      .order("created_at", { ascending: false })
      .limit(5),

    // Upcoming 5 interviews (org-scoped)
    supabase
      .from("interviews")
      .select(
        "id, scheduled_at, candidates(first_name, last_name), jobs!inner(title, department_id)"
      )
      .eq("org_id", orgId)
      .in("jobs.department_id", safeDeptIds)
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(5),

    // Requisitions by status
    supabase
      .from("requisitions")
      .select("status")
      .eq("org_id", orgId)
      .in("department_id", safeDeptIds),

    // Department names
    supabase
      .from("departments")
      .select("id, name")
      .in("id", safeDeptIds),
  ])

  // Count applications by status
  const stageCounts: Record<string, number> = {}
  const applications = applicationsResult.data || []
  applications.forEach((app) => {
    const status = (app as { status: string }).status || "new"
    stageCounts[status] = (stageCounts[status] || 0) + 1
  })

  const totalApplications = applications.length

  // Count requisitions by status
  const requisitionCounts: Record<string, number> = {
    pending: 0,
    approved: 0,
    rejected: 0,
  }
  const requisitions = requisitionsResult.data || []
  requisitions.forEach((req) => {
    const status = (req as { status: string }).status || "pending"
    if (status in requisitionCounts) {
      requisitionCounts[status] += 1
    }
  })

  return {
    totalJobs: jobsResult.count || 0,
    activeJobs: activeJobsResult.count || 0,
    totalApplications,
    stageCounts,
    recentApplications: (recentApplicationsResult.data || []) as Array<{
      id: string
      status: string
      created_at: string
      candidates: { first_name: string; last_name: string } | null
      jobs: { title: string; department_id: string } | null
    }>,
    upcomingInterviews: (upcomingInterviewsResult.data || []) as Array<{
      id: string
      scheduled_at: string
      candidates: { first_name: string; last_name: string } | null
      jobs: { title: string; department_id: string } | null
    }>,
    requisitionCounts,
    departments: (departmentsResult.data || []) as Array<{
      id: string
      name: string
    }>,
  }
}

function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case "new":
      return "bg-blue-500/10 text-blue-600 border-blue-200"
    case "screening":
      return "bg-purple-500/10 text-purple-600 border-purple-200"
    case "interview":
      return "bg-cyan-500/10 text-cyan-600 border-cyan-200"
    case "offer":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-200"
    case "hired":
      return "bg-green-500/10 text-green-600 border-green-200"
    case "rejected":
      return "bg-red-500/10 text-red-600 border-red-200"
    default:
      return "bg-gray-500/10 text-gray-600 border-gray-200"
  }
}

export async function HiringManagerDashboard({
  orgId,
  departmentIds,
}: HiringManagerDashboardProps) {
  const { t } = await getServerTranslation()

  if (!departmentIds || departmentIds.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "var(--brand-gradient-subtle)" }}
          >
            <Building2
              className="h-7 w-7"
              style={{ color: "var(--brand-primary)" }}
            />
          </div>
          <p className="text-lg font-semibold">{t("dashboard.emptyStates.noDepartmentsAssigned")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("dashboard.emptyStates.noDepartmentsAssignedDesc")}
          </p>
        </div>
      </div>
    )
  }

  const stats = await getHiringManagerStats(orgId, departmentIds)

  const departmentNames =
    stats.departments.map((d) => d.name).join(", ") || t("dashboard.hiringManager.myDepartment")

  const pipelineStages = [
    { name: t("dashboard.pipeline.new"), count: stats.stageCounts["new"] || 0, color: "#6366f1" },
    {
      name: t("dashboard.pipeline.screening"),
      count: stats.stageCounts["screening"] || 0,
      color: "#8b5cf6",
    },
    {
      name: t("dashboard.pipeline.interview"),
      count: stats.stageCounts["interview"] || 0,
      color: "#06b6d4",
    },
    {
      name: t("dashboard.pipeline.offer"),
      count: stats.stageCounts["offer"] || 0,
      color: "#10b981",
    },
    {
      name: t("dashboard.pipeline.hired"),
      count: stats.stageCounts["hired"] || 0,
      color: "#22c55e",
    },
  ]

  const totalPipelineCount = pipelineStages.reduce(
    (sum, stage) => sum + stage.count,
    0
  )

  return (
    <div className="space-y-6">
      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        {/* Featured Card - My Department */}
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
                  <Building2 className="h-6 w-6" />
                </div>
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                  {t("dashboard.hiringManager.myDepartment")}
                </Badge>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <p className="text-white/70 text-sm font-medium mb-1">
                  {departmentNames}
                </p>
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-bold">{stats.activeJobs}</span>
                </div>
                <p className="text-white/60 text-sm mt-2">
                  {t("dashboard.hiringManager.activeOpenPositions")}
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">
                    {t("dashboard.stats.totalApplications")}
                  </span>
                  <span className="font-semibold">
                    {stats.totalApplications}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/70 text-sm">
                    {t("dashboard.upcomingInterviews")}
                  </span>
                  <span className="font-semibold">
                    {stats.upcomingInterviews.length}
                  </span>
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
                <Briefcase
                  className="h-5 w-5"
                  style={{ color: "var(--brand-primary)" }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              {t("dashboard.stats.openPositions")}
            </p>
            <p className="text-3xl font-bold mt-1">{stats.activeJobs}</p>
            <Link
              href="/org/applications"
              className="inline-flex items-center gap-1 text-sm font-medium mt-3 hover:gap-2 transition-all"
              style={{ color: "var(--brand-primary)" }}
            >
              {t("dashboard.actions.viewAll")} <ChevronRight className="h-4 w-4" />
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
                <FileText
                  className="h-5 w-5"
                  style={{ color: "var(--brand-primary)" }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              {t("dashboard.stats.applications")}
            </p>
            <p className="text-3xl font-bold mt-1">
              {stats.totalApplications}
            </p>
            <p className="text-sm text-muted-foreground mt-3">
              {t("dashboard.hiringManager.totalForDepartment")}
            </p>
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
                <Calendar
                  className="h-5 w-5"
                  style={{ color: "var(--brand-primary)" }}
                />
              </div>
              <Badge variant="secondary" className="text-xs">
                {t("dashboard.upcomingInterviews")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              {t("dashboard.upcomingInterviews")}
            </p>
            <p className="text-3xl font-bold mt-1">
              {stats.upcomingInterviews.length}
            </p>
            <Link
              href="/org/interviews"
              className="inline-flex items-center gap-1 text-sm font-medium mt-3 hover:gap-2 transition-all"
              style={{ color: "var(--brand-primary)" }}
            >
              {t("dashboard.actions.viewSchedule")} <ChevronRight className="h-4 w-4" />
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
                <ClipboardList
                  className="h-5 w-5"
                  style={{ color: "var(--brand-primary)" }}
                />
              </div>
              {stats.requisitionCounts.pending > 0 && (
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">
                  {stats.requisitionCounts.pending} {t("dashboard.orgAdmin.pending")}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              {t("dashboard.stats.pendingRequisitions")}
            </p>
            <p className="text-3xl font-bold mt-1">
              {stats.requisitionCounts.pending}
            </p>
            <Link
              href="/org/requisitions"
              className="inline-flex items-center gap-1 text-sm font-medium mt-3 hover:gap-2 transition-all"
              style={{ color: "var(--brand-primary)" }}
            >
              {t("dashboard.actions.manage")} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Hiring Pipeline - 8 cols */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bento-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">{t("dashboard.recruiter.hiringPipeline")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.hiringManager.departmentCandidatesByStage")}
                </p>
              </div>
              <Link
                href="/org/applications"
                className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: "var(--brand-primary)" }}
              >
                {t("dashboard.actions.viewAll")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {totalPipelineCount > 0 ? (
              <div className="flex items-end gap-3 h-32">
                {pipelineStages.map((stage) => {
                  const maxCount = Math.max(
                    ...pipelineStages.map((s) => s.count),
                    1
                  )
                  const height = (stage.count / maxCount) * 100
                  return (
                    <div
                      key={stage.name}
                      className="flex-1 flex flex-col items-center gap-2"
                    >
                      <span className="text-sm font-semibold">
                        {stage.count}
                      </span>
                      <div
                        className="w-full rounded-xl transition-all hover:opacity-80"
                        style={{
                          height: `${Math.max(height, 5)}%`,
                          background: stage.color,
                          minHeight: "8px",
                        }}
                      />
                      <span className="text-xs text-muted-foreground text-center">
                        {stage.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div
                    className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                    style={{ background: "var(--brand-gradient-subtle)" }}
                  >
                    <Target
                      className="h-6 w-6"
                      style={{ color: "var(--brand-primary)" }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("dashboard.emptyStates.noApplications")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("dashboard.emptyStates.noApplicationsDesc")}
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
              <Zap className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="space-y-3">
              <Link
                href="/org/requisitions"
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-transparent hover:shadow-md hover:bg-card transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: "var(--brand-gradient-subtle)" }}
                >
                  <FileCheck
                    className="h-5 w-5"
                    style={{ color: "var(--brand-primary)" }}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{t("dashboard.hiringManager.createRequisition")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("dashboard.hiringManager.requestANewPosition")}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/org/applications"
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-transparent hover:shadow-md hover:bg-card transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: "var(--brand-gradient-subtle)" }}
                >
                  <Users
                    className="h-5 w-5"
                    style={{ color: "var(--brand-primary)" }}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{t("dashboard.recruiter.viewApplications")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("dashboard.hiringManager.reviewDepartmentCandidates")}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/org/scorecards"
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-transparent hover:shadow-md hover:bg-card transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: "var(--brand-gradient-subtle)" }}
                >
                  <CheckCircle
                    className="h-5 w-5"
                    style={{ color: "var(--brand-primary)" }}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{t("dashboard.hiringManager.myScorecards")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("dashboard.hiringManager.submitInterviewFeedback")}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Applications - 6 cols */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bento-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold">{t("dashboard.widgets.recentApplications")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.hiringManager.latestDepartmentApplications")}
                </p>
              </div>
              <Link
                href="/org/applications"
                className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: "var(--brand-primary)" }}
              >
                {t("dashboard.actions.viewAll")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {stats.recentApplications.length > 0 ? (
              <div className="space-y-3">
                {stats.recentApplications.map((app) => {
                  const candidateName = app.candidates
                    ? `${app.candidates.first_name} ${app.candidates.last_name}`
                    : t("dashboard.recruiter.unknownCandidate")
                  const jobTitle = app.jobs?.title || t("dashboard.recruiter.untitledPosition")
                  return (
                    <div
                      key={app.id}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "var(--brand-gradient-subtle)" }}
                      >
                        <FileText
                          className="h-5 w-5"
                          style={{ color: "var(--brand-primary)" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {candidateName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {jobTitle}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant="secondary"
                          className={getStatusBadgeClasses(app.status)}
                        >
                          {app.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(app.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div
                  className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: "var(--brand-gradient-subtle)" }}
                >
                  <FileText
                    className="h-6 w-6"
                    style={{ color: "var(--brand-primary)" }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.emptyStates.noApplications")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("dashboard.emptyStates.applicationsWillAppear")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Interviews - 6 cols */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bento-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold">{t("dashboard.upcomingInterviews")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.hiringManager.nextScheduledInterviews")}
                </p>
              </div>
              <Link
                href="/org/interviews"
                className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: "var(--brand-primary)" }}
              >
                {t("dashboard.actions.viewAll")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {stats.upcomingInterviews.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingInterviews.map((interview) => {
                  const candidateName = interview.candidates
                    ? `${interview.candidates.first_name} ${interview.candidates.last_name}`
                    : t("dashboard.recruiter.unknownCandidate")
                  const jobTitle =
                    interview.jobs?.title || t("dashboard.recruiter.untitledPosition")
                  const scheduledDate = new Date(interview.scheduled_at)
                  return (
                    <div
                      key={interview.id}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "var(--brand-gradient-subtle)" }}
                      >
                        <Calendar
                          className="h-5 w-5"
                          style={{ color: "var(--brand-primary)" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {candidateName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {jobTitle}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-medium">
                          {scheduledDate.toLocaleDateString()}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {scheduledDate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div
                  className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: "var(--brand-gradient-subtle)" }}
                >
                  <Calendar
                    className="h-6 w-6"
                    style={{ color: "var(--brand-primary)" }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.emptyStates.noInterviews")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("dashboard.emptyStates.interviewsWillAppearScheduled")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
