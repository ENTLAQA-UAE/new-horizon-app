// @ts-nocheck
// Note: Type instantiation is excessively deep error with Supabase typed client
import { createClient } from "@/lib/supabase/server"
import { getServerTranslation } from "@/lib/i18n/server"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Briefcase,
  Users,
  UserSearch,
  FileText,
  Calendar,
  CheckCircle,
  ChevronRight,
  ArrowRight,
  Zap,
  Target,
  Clock,
} from "lucide-react"

interface RecruiterDashboardProps {
  orgId: string
}

async function getRecruiterStats(orgId: string) {
  const supabase = await createClient()

  const now = new Date().toISOString()
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: activeJobsCount },
    { count: totalApplicationsCount },
    { data: allApplications },
    { data: recentApplications },
    { data: upcomingInterviews },
    { count: hiredCount },
    { count: newThisWeekCount },
  ] = await Promise.all([
    // Active jobs count
    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "open"),

    // Total applications count
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),

    // Applications by status for pipeline
    supabase
      .from("applications")
      .select("status")
      .eq("org_id", orgId),

    // Recent 5 applications
    supabase
      .from("applications")
      .select("id, status, created_at, candidate:candidates(first_name, last_name), job:jobs(title)")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5),

    // Upcoming 5 interviews (org-scoped)
    supabase
      .from("interviews")
      .select("id, scheduled_at, candidate:candidates(first_name, last_name), job:jobs(title)")
      .eq("org_id", orgId)
      .gte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(5),

    // Hired count
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "hired"),

    // New this week
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .gte("created_at", oneWeekAgo),
  ])

  // Count applications by status
  const stageCounts: Record<string, number> = {}
  if (allApplications) {
    allApplications.forEach((app) => {
      const status = (app as { status: string }).status || "new"
      stageCounts[status] = (stageCounts[status] || 0) + 1
    })
  }

  return {
    activeJobs: activeJobsCount || 0,
    totalApplications: totalApplicationsCount || 0,
    stageCounts,
    recentApplications: recentApplications || [],
    upcomingInterviews: upcomingInterviews || [],
    hired: hiredCount || 0,
    newThisWeek: newThisWeekCount || 0,
  }
}

function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case "new":
      return "bg-indigo-500/10 text-indigo-600 border-indigo-200"
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
      return "bg-slate-500/10 text-slate-600 border-slate-200"
  }
}

export async function RecruiterDashboard({ orgId }: RecruiterDashboardProps) {
  const stats = await getRecruiterStats(orgId)
  const { t } = await getServerTranslation()

  const pipelineStages = [
    { name: t("dashboard.pipeline.new"), count: stats.stageCounts["new"] || 0, color: "#6366f1" },
    { name: t("dashboard.pipeline.screening"), count: stats.stageCounts["screening"] || 0, color: "#8b5cf6" },
    { name: t("dashboard.pipeline.interview"), count: stats.stageCounts["interview"] || 0, color: "#06b6d4" },
    { name: t("dashboard.pipeline.offer"), count: stats.stageCounts["offer"] || 0, color: "#10b981" },
    { name: t("dashboard.pipeline.hired"), count: stats.stageCounts["hired"] || 0, color: "#22c55e" },
  ]

  const totalPipelineCount = pipelineStages.reduce((sum, stage) => sum + stage.count, 0)

  // Active pipeline = everything except hired and rejected
  const activePipeline =
    (stats.stageCounts["new"] || 0) +
    (stats.stageCounts["screening"] || 0) +
    (stats.stageCounts["interview"] || 0) +
    (stats.stageCounts["offer"] || 0)

  return (
    <div className="space-y-6">
      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        {/* Featured Card - My Pipeline */}
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
                  <Target className="h-6 w-6" />
                </div>
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                  {t("dashboard.recruiter.pipeline")}
                </Badge>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <p className="text-white/70 text-sm font-medium mb-2">{t("dashboard.recruiter.myPipeline")}</p>
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-bold">{activePipeline}</span>
                </div>
                <p className="text-white/60 text-sm mt-2">
                  {t("dashboard.recruiter.activeApplicationsInProgress")}
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">{t("dashboard.stats.hired")}</span>
                  <span className="font-semibold">{stats.hired}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/70 text-sm">{t("dashboard.stats.activeJobs")}</span>
                  <span className="font-semibold">{stats.activeJobs}</span>
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
                <Briefcase className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">{t("dashboard.stats.activeJobs")}</p>
            <p className="text-3xl font-bold mt-1">{stats.activeJobs}</p>
            <Link
              href="/org/jobs"
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
                <FileText className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
              </div>
              <Badge variant="secondary" className="text-xs">{t("common.time.thisWeek")}</Badge>
            </div>
            <p className="text-sm text-muted-foreground font-medium">{t("dashboard.stats.newThisWeek")}</p>
            <p className="text-3xl font-bold mt-1">{stats.newThisWeek}</p>
            <p className="text-sm text-muted-foreground mt-3">{t("dashboard.recruiter.applicationsReceived")}</p>
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
                <Calendar className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
              </div>
              <Badge variant="secondary" className="text-xs">{t("common.status.scheduled")}</Badge>
            </div>
            <p className="text-sm text-muted-foreground font-medium">{t("dashboard.stats.interviews")}</p>
            <p className="text-3xl font-bold mt-1">{stats.upcomingInterviews.length}</p>
            <Link
              href="/org/interviews"
              className="inline-flex items-center gap-1 text-sm font-medium mt-3 hover:gap-2 transition-all"
              style={{ color: "var(--brand-primary)" }}
            >
              {t("dashboard.actions.schedule")} <ChevronRight className="h-4 w-4" />
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
                <CheckCircle className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">{t("dashboard.stats.hired")}</p>
            <p className="text-3xl font-bold mt-1">{stats.hired}</p>
            <p className="text-sm text-muted-foreground mt-3">{t("dashboard.hrManager.totalPlacements")}</p>
          </div>
        </div>

        {/* Hiring Pipeline */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bento-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">{t("dashboard.recruiter.hiringPipeline")}</h3>
                <p className="text-sm text-muted-foreground">{t("dashboard.recruiter.candidatesByStage")}</p>
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
                  const maxCount = Math.max(...pipelineStages.map(s => s.count), 1)
                  const height = (stage.count / maxCount) * 100
                  return (
                    <div key={stage.name} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-sm font-semibold">{stage.count}</span>
                      <div
                        className="w-full rounded-xl transition-all hover:opacity-80"
                        style={{
                          height: `${Math.max(height, 5)}%`,
                          background: stage.color,
                          minHeight: '8px'
                        }}
                      />
                      <span className="text-xs text-muted-foreground text-center">{stage.name}</span>
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
                    <Target className="h-6 w-6" style={{ color: "var(--brand-primary)" }} />
                  </div>
                  <p className="text-sm text-muted-foreground">{t("dashboard.emptyStates.noApplications")}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("dashboard.emptyStates.noApplicationsDesc")}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bento-card p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">{t("dashboard.quickActions")}</h3>
              <Zap className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="space-y-3">
              <Link
                href="/org/jobs"
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-transparent hover:shadow-md hover:bg-card transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: "var(--brand-gradient-subtle)" }}
                >
                  <Briefcase className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{t("dashboard.recruiter.postAJob")}</p>
                  <p className="text-xs text-muted-foreground">{t("dashboard.recruiter.createNewJobListing")}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/org/candidates"
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-transparent hover:shadow-md hover:bg-card transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: "var(--brand-gradient-subtle)" }}
                >
                  <UserSearch className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{t("dashboard.recruiter.viewCandidates")}</p>
                  <p className="text-xs text-muted-foreground">{t("dashboard.recruiter.browseCandidatePool")}</p>
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
                  <FileText className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{t("dashboard.recruiter.viewApplications")}</p>
                  <p className="text-xs text-muted-foreground">{t("dashboard.recruiter.reviewAllApplications")}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bento-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold">{t("dashboard.widgets.recentApplications")}</h3>
                <p className="text-sm text-muted-foreground">{t("dashboard.recruiter.latestCandidatesApplied")}</p>
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
                {stats.recentApplications.map((app: any) => {
                  const candidate = app.candidate as any
                  const job = app.job as any
                  const candidateName = candidate
                    ? `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim()
                    : t("dashboard.recruiter.unknownCandidate")
                  const jobTitle = job?.title || t("dashboard.recruiter.untitledPosition")

                  return (
                    <div
                      key={app.id}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "var(--brand-gradient-subtle)" }}
                      >
                        <Users className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{candidateName}</p>
                        <p className="text-xs text-muted-foreground truncate">{jobTitle}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant="secondary"
                          className={getStatusBadgeClasses(app.status)}
                        >
                          {app.status || "new"}
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
                  <FileText className="h-6 w-6" style={{ color: "var(--brand-primary)" }} />
                </div>
                <p className="text-sm text-muted-foreground">{t("dashboard.emptyStates.noApplications")}</p>
                <Link
                  href="/org/jobs"
                  className="inline-flex items-center gap-1 text-sm font-medium mt-2"
                  style={{ color: "var(--brand-primary)" }}
                >
                  {t("dashboard.recruiter.postAJobToGetStarted")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bento-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold">{t("dashboard.upcomingInterviews")}</h3>
                <p className="text-sm text-muted-foreground">{t("dashboard.recruiter.yourScheduledInterviews")}</p>
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
                {stats.upcomingInterviews.map((interview: any) => {
                  const candidate = interview.candidate as any
                  const job = interview.job as any
                  const candidateName = candidate
                    ? `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim()
                    : t("dashboard.recruiter.unknownCandidate")
                  const jobTitle = job?.title || t("dashboard.recruiter.untitledPosition")
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
                        <Calendar className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{candidateName}</p>
                        <p className="text-xs text-muted-foreground truncate">{jobTitle}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium">
                          {scheduledDate.toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                          <Clock className="h-3 w-3" />
                          {scheduledDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
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
                  <Calendar className="h-6 w-6" style={{ color: "var(--brand-primary)" }} />
                </div>
                <p className="text-sm text-muted-foreground">{t("dashboard.emptyStates.noInterviews")}</p>
                <Link
                  href="/org/interviews"
                  className="inline-flex items-center gap-1 text-sm font-medium mt-2"
                  style={{ color: "var(--brand-primary)" }}
                >
                  {t("dashboard.recruiter.scheduleAnInterview")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
