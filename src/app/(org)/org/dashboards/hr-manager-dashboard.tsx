// @ts-nocheck
// Note: Type instantiation is excessively deep error with Supabase typed client
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Briefcase,
  Users,
  UserSearch,
  CheckCircle,
  Calendar,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  ChevronRight,
} from "lucide-react"

interface HrManagerDashboardProps {
  orgId: string
}

async function getHrManagerStats(orgId: string) {
  const supabase = await createClient()

  const [
    jobsResult,
    candidatesResult,
    applicationsResult,
    appStatusResult,
    recentJobsResult,
    interviewsResult,
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "open"),

    supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),

    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),

    supabase
      .from("applications")
      .select("status")
      .eq("org_id", orgId),

    supabase
      .from("jobs")
      .select("id, title, status, created_at, department")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("interviews")
      .select("id, scheduled_at, candidate:candidates(first_name, last_name), job:jobs!inner(title)")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(3),
  ])

  const stageCounts: Record<string, number> = {}
  if (appStatusResult.data) {
    appStatusResult.data.forEach((app) => {
      const status = (app as { status: string }).status || "new"
      stageCounts[status] = (stageCounts[status] || 0) + 1
    })
  }

  return {
    jobs: jobsResult.count || 0,
    candidates: candidatesResult.count || 0,
    applications: applicationsResult.count || 0,
    stageCounts,
    recentJobs: recentJobsResult.data || [],
    interviews: interviewsResult.data || [],
  }
}

export async function HrManagerDashboard({ orgId }: HrManagerDashboardProps) {
  const stats = await getHrManagerStats(orgId)

  const pipelineStages = [
    { name: "New", count: stats.stageCounts["new"] || 0, color: "#6366f1" },
    { name: "Screening", count: stats.stageCounts["screening"] || 0, color: "#8b5cf6" },
    { name: "Interview", count: stats.stageCounts["interview"] || 0, color: "#06b6d4" },
    { name: "Offer", count: stats.stageCounts["offer"] || 0, color: "#10b981" },
    { name: "Hired", count: stats.stageCounts["hired"] || 0, color: "#22c55e" },
  ]

  const totalPipelineCount = pipelineStages.reduce((sum, stage) => sum + stage.count, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        {/* Featured Stat - Large Card */}
        <div className="col-span-12 lg:col-span-4 row-span-2">
          <div
            className="h-full rounded-3xl p-6 text-white relative overflow-hidden"
            style={{ background: "var(--brand-gradient)" }}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Target className="h-6 w-6" />
                </div>
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                  This Month
                </Badge>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <p className="text-white/70 text-sm font-medium mb-2">Total Applications</p>
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-bold">{stats.applications}</span>
                </div>
                <p className="text-white/60 text-sm mt-2">Across all jobs</p>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Active Jobs</span>
                  <span className="font-semibold">{stats.jobs}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/70 text-sm">Candidates</span>
                  <span className="font-semibold">{stats.candidates}</span>
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
            <p className="text-sm text-muted-foreground font-medium">Active Jobs</p>
            <p className="text-3xl font-bold mt-1">{stats.jobs}</p>
            <Link
              href="/org/jobs"
              className="inline-flex items-center gap-1 text-sm font-medium mt-3 hover:gap-2 transition-all"
              style={{ color: "var(--brand-primary)" }}
            >
              View all <ChevronRight className="h-4 w-4" />
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
                <UserSearch className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Candidates</p>
            <p className="text-3xl font-bold mt-1">{stats.candidates}</p>
            <Link
              href="/org/candidates"
              className="inline-flex items-center gap-1 text-sm font-medium mt-3 hover:gap-2 transition-all"
              style={{ color: "var(--brand-primary)" }}
            >
              View all <ChevronRight className="h-4 w-4" />
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
                <Calendar className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
              </div>
              <Badge variant="secondary" className="text-xs">Today</Badge>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Interviews</p>
            <p className="text-3xl font-bold mt-1">{stats.interviews.length}</p>
            <Link
              href="/org/interviews"
              className="inline-flex items-center gap-1 text-sm font-medium mt-3 hover:gap-2 transition-all"
              style={{ color: "var(--brand-primary)" }}
            >
              Schedule <ChevronRight className="h-4 w-4" />
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
            <p className="text-sm text-muted-foreground font-medium">Hired</p>
            <p className="text-3xl font-bold mt-1">{stats.stageCounts["hired"] || 0}</p>
            <p className="text-sm text-muted-foreground mt-3">Total placements</p>
          </div>
        </div>

        {/* Pipeline Overview */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bento-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Hiring Pipeline</h3>
                <p className="text-sm text-muted-foreground">Candidates by stage</p>
              </div>
              <Link
                href="/org/pipelines"
                className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: "var(--brand-primary)" }}
              >
                View Pipeline <ArrowRight className="h-4 w-4" />
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
                  <p className="text-sm text-muted-foreground">No applications yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Applications will appear here as candidates apply</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bento-card p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Quick Actions</h3>
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
                  <p className="font-medium text-sm">Manage Jobs</p>
                  <p className="text-xs text-muted-foreground">View all job postings</p>
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
                  <p className="font-medium text-sm">View Candidates</p>
                  <p className="text-xs text-muted-foreground">Browse candidate pool</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/org/pipelines"
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-transparent hover:shadow-md hover:bg-card transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: "var(--brand-gradient-subtle)" }}
                >
                  <Users className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Manage Pipelines</p>
                  <p className="text-xs text-muted-foreground">Configure hiring workflows</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bento-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold">Recent Jobs</h3>
                <p className="text-sm text-muted-foreground">Your latest postings</p>
              </div>
              <Link
                href="/org/jobs"
                className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: "var(--brand-primary)" }}
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {stats.recentJobs.length > 0 ? (
              <div className="space-y-3">
                {stats.recentJobs.slice(0, 4).map((job: any) => (
                  <Link
                    key={job.id}
                    href={`/org/jobs/${job.id}`}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "var(--brand-gradient-subtle)" }}
                    >
                      <Briefcase className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {job.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={job.status === "open" ? "default" : "secondary"}
                      className={job.status === "open" ? "bg-green-500/10 text-green-600 border-green-200" : ""}
                    >
                      {job.status === "open" ? "published" : job.status || "draft"}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div
                  className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: "var(--brand-gradient-subtle)" }}
                >
                  <Briefcase className="h-6 w-6" style={{ color: "var(--brand-primary)" }} />
                </div>
                <p className="text-sm text-muted-foreground">No jobs posted yet</p>
                <Link
                  href="/org/jobs"
                  className="inline-flex items-center gap-1 text-sm font-medium mt-2"
                  style={{ color: "var(--brand-primary)" }}
                >
                  Go to Jobs <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Getting Started */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bento-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold">Getting Started</h3>
                <p className="text-sm text-muted-foreground">Complete your setup</p>
              </div>
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${stats.jobs > 0 ? 'bg-green-500' : 'bg-muted'}`}>
                  {stats.jobs > 0 ? (
                    <CheckCircle className="h-4 w-4 text-white" />
                  ) : (
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${stats.jobs > 0 ? 'line-through text-muted-foreground' : ''}`}>Post your first job</p>
                  <p className="text-xs text-muted-foreground">Create a job listing to attract candidates</p>
                </div>
              </div>

              <div className="flex items-start gap-3 group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${stats.candidates > 0 ? 'bg-green-500' : 'bg-muted'}`}>
                  {stats.candidates > 0 ? (
                    <CheckCircle className="h-4 w-4 text-white" />
                  ) : (
                    <UserSearch className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${stats.candidates > 0 ? 'line-through text-muted-foreground' : ''}`}>Add your first candidate</p>
                  <p className="text-xs text-muted-foreground">Import or add candidates manually</p>
                </div>
              </div>

              <div className="flex items-start gap-3 group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${stats.interviews.length > 0 ? 'bg-green-500' : 'bg-muted'}`}>
                  {stats.interviews.length > 0 ? (
                    <CheckCircle className="h-4 w-4 text-white" />
                  ) : (
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${stats.interviews.length > 0 ? 'line-through text-muted-foreground' : ''}`}>Schedule an interview</p>
                  <p className="text-xs text-muted-foreground">Set up your first candidate interview</p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t">
              <Link
                href="/org/settings/notifications"
                className="flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg hover:bg-muted transition-colors"
                style={{ color: "var(--brand-primary)" }}
              >
                Configure notifications <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
