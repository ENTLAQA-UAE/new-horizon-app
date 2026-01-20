import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Briefcase,
  Users,
  UserSearch,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Calendar,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  Plus,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react"

async function getOrgStats() {
  const supabase = await createClient()

  // Get jobs count
  const { count: jobsCount } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })

  // Get candidates count
  const { count: candidatesCount } = await supabase
    .from("candidates")
    .select("*", { count: "exact", head: true })

  // Get applications count
  const { count: applicationsCount } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })

  // Get recent jobs
  const { data: recentJobs } = await supabase
    .from("jobs")
    .select("id, title, status, created_at, department")
    .order("created_at", { ascending: false })
    .limit(5)

  // Get upcoming interviews
  const { data: interviews } = await supabase
    .from("interviews")
    .select("id, scheduled_at, candidate:candidates(first_name, last_name), job:jobs(title)")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(3)

  return {
    jobs: jobsCount || 0,
    candidates: candidatesCount || 0,
    applications: applicationsCount || 0,
    recentJobs: recentJobs || [],
    interviews: interviews || [],
  }
}

export default async function OrgDashboardPage() {
  const stats = await getOrgStats()

  // Mock data for visual demo
  const pipelineStages = [
    { name: "Applied", count: 45, color: "#6366f1" },
    { name: "Screening", count: 28, color: "#8b5cf6" },
    { name: "Interview", count: 12, color: "#06b6d4" },
    { name: "Offer", count: 5, color: "#10b981" },
    { name: "Hired", count: 3, color: "#22c55e" },
  ]

  const recentActivity = [
    { type: "application", message: "New application for Senior Developer", time: "2 min ago", icon: FileText, color: "bg-blue-500" },
    { type: "interview", message: "Interview scheduled with Sarah Ahmed", time: "1 hour ago", icon: Calendar, color: "bg-purple-500" },
    { type: "hire", message: "Mohammed Ali accepted offer", time: "3 hours ago", icon: CheckCircle, color: "bg-green-500" },
    { type: "job", message: "Product Manager position published", time: "5 hours ago", icon: Briefcase, color: "bg-indigo-500" },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Good morning! 👋</h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your recruitment today.
          </p>
        </div>
        <Link
          href="/org/jobs/new"
          className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium transition-all hover:shadow-lg hover:-translate-y-0.5"
          style={{
            background: "var(--brand-gradient)",
            boxShadow: "0 4px 14px -3px var(--brand-primary)"
          }}
        >
          <Plus className="h-4 w-4" />
          Post New Job
        </Link>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        {/* Featured Stat - Large Card */}
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
                  This Month
                </Badge>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <p className="text-white/70 text-sm font-medium mb-2">Total Applications</p>
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-bold">{stats.applications}</span>
                  <div className="flex items-center gap-1 text-green-300 mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">+12%</span>
                  </div>
                </div>
                <p className="text-white/60 text-sm mt-2">
                  vs. last month
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Conversion Rate</span>
                  <span className="font-semibold">23.5%</span>
                </div>
                <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full w-[23.5%] bg-white rounded-full" />
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
              <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <TrendingUp className="h-3.5 w-3.5" />
                +3
              </span>
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
              <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <TrendingUp className="h-3.5 w-3.5" />
                +18
              </span>
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
                <Clock className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
              </div>
              <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <TrendingDown className="h-3.5 w-3.5" />
                -3 days
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Time to Hire</p>
            <p className="text-3xl font-bold mt-1">18 <span className="text-lg font-normal text-muted-foreground">days</span></p>
            <p className="text-sm text-muted-foreground mt-3">Average this month</p>
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

            <div className="flex items-end gap-3 h-32">
              {pipelineStages.map((stage, index) => {
                const maxCount = Math.max(...pipelineStages.map(s => s.count))
                const height = (stage.count / maxCount) * 100
                return (
                  <div key={stage.name} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-sm font-semibold">{stage.count}</span>
                    <div
                      className="w-full rounded-xl transition-all hover:opacity-80"
                      style={{
                        height: `${height}%`,
                        background: stage.color,
                        minHeight: '20px'
                      }}
                    />
                    <span className="text-xs text-muted-foreground text-center">{stage.name}</span>
                  </div>
                )
              })}
            </div>
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
                href="/org/jobs/new"
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-transparent hover:shadow-md hover:bg-card transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: "var(--brand-gradient-subtle)" }}
                >
                  <Briefcase className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Post a Job</p>
                  <p className="text-xs text-muted-foreground">Create new opening</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/org/candidates/new"
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-transparent hover:shadow-md hover:bg-card transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: "var(--brand-gradient-subtle)" }}
                >
                  <UserSearch className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Add Candidate</p>
                  <p className="text-xs text-muted-foreground">Import manually</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/org/team"
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-transparent hover:shadow-md hover:bg-card transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: "var(--brand-gradient-subtle)" }}
                >
                  <Users className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Invite Team</p>
                  <p className="text-xs text-muted-foreground">Add collaborators</p>
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
                      variant={job.status === "published" ? "default" : "secondary"}
                      className={job.status === "published" ? "bg-green-500/10 text-green-600 border-green-200" : ""}
                    >
                      {job.status || "draft"}
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
                  href="/org/jobs/new"
                  className="inline-flex items-center gap-1 text-sm font-medium mt-2"
                  style={{ color: "var(--brand-primary)" }}
                >
                  Post your first job <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bento-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <p className="text-sm text-muted-foreground">Latest updates</p>
              </div>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 group">
                  <div className={`w-8 h-8 rounded-lg ${activity.color} flex items-center justify-center shrink-0`}>
                    <activity.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t">
              <Link
                href="/org/activity"
                className="flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg hover:bg-muted transition-colors"
                style={{ color: "var(--brand-primary)" }}
              >
                View all activity <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
