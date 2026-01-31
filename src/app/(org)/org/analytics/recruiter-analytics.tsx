"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Briefcase,
  Users,
  Calendar,
  CheckCircle,
  ArrowRight,
  Clock,
  FileText,
  UserCheck,
} from "lucide-react"
import type { RecruiterStats } from "@/lib/analytics/recruiter-stats"

interface RecruiterAnalyticsProps {
  stats: RecruiterStats
}

const FUNNEL_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981"]

const STATUS_BADGE_MAP: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-indigo-500 text-white" },
  screening: { label: "Screening", className: "bg-purple-500 text-white" },
  interviewing: { label: "Interviewing", className: "bg-cyan-500 text-white" },
  offered: { label: "Offered", className: "bg-amber-500 text-white" },
  hired: { label: "Hired", className: "bg-emerald-500 text-white" },
  rejected: { label: "Rejected", className: "bg-rose-500 text-white" },
}

export function RecruiterAnalytics({ stats }: RecruiterAnalyticsProps) {
  const pipelineStages = [
    { key: "new" as const, label: "New", count: stats.myPipeline.new },
    { key: "screening" as const, label: "Screening", count: stats.myPipeline.screening },
    { key: "interviewing" as const, label: "Interviewing", count: stats.myPipeline.interviewing },
    { key: "offered" as const, label: "Offered", count: stats.myPipeline.offered },
    { key: "hired" as const, label: "Hired", count: stats.myPipeline.hired },
  ]

  const maxPipelineCount = Math.max(...pipelineStages.map((s) => s.count), 1)

  const activePipeline =
    stats.myPipeline.new +
    stats.myPipeline.screening +
    stats.myPipeline.interviewing +
    stats.myPipeline.offered

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
          My Performance
        </h2>
        <p className="text-muted-foreground mt-1">
          Your sourcing, screening, and pipeline activity at a glance
        </p>
      </div>

      {/* Hero Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Active Jobs - Indigo */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Active Jobs</p>
                <p className="text-4xl font-bold mt-1">{stats.myJobs.activeJobs}</p>
                <p className="text-sm text-indigo-100 mt-2">
                  {stats.myJobs.totalJobs} total job{stats.myJobs.totalJobs !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Briefcase className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications in Pipeline - Purple */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-purple-700 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-100 text-sm font-medium">Applications in Pipeline</p>
                <p className="text-4xl font-bold mt-1">{activePipeline}</p>
                <p className="text-sm text-purple-100 mt-2">
                  {stats.myPipeline.total} total application{stats.myPipeline.total !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interviews This Month - Amber */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-amber-700 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-amber-100 text-sm font-medium">Interviews This Month</p>
                <p className="text-4xl font-bold mt-1">{stats.myActivity.interviewsThisMonth}</p>
                <p className="text-sm text-amber-100 mt-2">
                  {stats.myActivity.applicationsThisMonth} new app{stats.myActivity.applicationsThisMonth !== 1 ? "s" : ""} this month
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hires - Emerald */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Hires</p>
                <p className="text-4xl font-bold mt-1">{stats.myPerformance.totalHires}</p>
                <p className="text-sm text-emerald-100 mt-2">
                  {stats.myPerformance.avgTimeToHire > 0
                    ? `Avg ${stats.myPerformance.avgTimeToHire} days to hire`
                    : "No hires yet"}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Pipeline - Funnel Bars */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-indigo-500" />
            My Pipeline
          </CardTitle>
          <CardDescription>
            Candidates at each stage of your hiring funnel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.myPipeline.total > 0 ? (
            <div className="space-y-4">
              {pipelineStages.map((stage, index) => {
                const width = (stage.count / maxPipelineCount) * 100
                const percentage =
                  stats.myPipeline.total > 0
                    ? Math.round((stage.count / stats.myPipeline.total) * 100)
                    : 0

                return (
                  <div key={stage.key}>
                    <div className="flex items-center gap-3">
                      {/* Stage label */}
                      <div className="w-28 shrink-0">
                        <div className="flex items-center gap-2">
                          {index < pipelineStages.length - 1 && (
                            <ArrowRight
                              className="h-3 w-3 text-muted-foreground hidden sm:block"
                              style={{ color: FUNNEL_COLORS[index] }}
                            />
                          )}
                          <span className="text-sm font-medium">{stage.label}</span>
                        </div>
                      </div>

                      {/* Bar */}
                      <div className="flex-1 h-9 bg-muted rounded-lg overflow-hidden relative">
                        <div
                          className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-3"
                          style={{
                            width: `${Math.max(width, 4)}%`,
                            background: `linear-gradient(90deg, ${FUNNEL_COLORS[index]}, ${FUNNEL_COLORS[index]}dd)`,
                          }}
                        >
                          {width > 15 && (
                            <span className="text-white text-sm font-medium">
                              {stage.count}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Count + percentage */}
                      <div className="w-20 shrink-0 text-right">
                        <span className="text-sm font-semibold">{stage.count}</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({percentage}%)
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Rejected count (shown below the funnel) */}
              {stats.myPipeline.rejected > 0 && (
                <div className="pt-3 mt-3 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Rejected</span>
                    <span className="font-medium text-rose-500">
                      {stats.myPipeline.rejected} candidate{stats.myPipeline.rejected !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No applications in your pipeline yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" />
            Recent Applications
          </CardTitle>
          <CardDescription>Last 10 applications across your jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentApplications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Candidate
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Job Title
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                      Applied
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentApplications.map((app) => {
                    const badgeInfo = STATUS_BADGE_MAP[app.status] || {
                      label: app.status,
                      className: "bg-slate-500 text-white",
                    }

                    return (
                      <tr
                        key={app.id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {app.candidateName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium truncate max-w-[180px]">
                              {app.candidateName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="truncate max-w-[200px] inline-block">
                            {app.jobTitle}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={badgeInfo.className}>
                            {badgeInfo.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">
                          <div className="flex items-center justify-end gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {app.appliedAt
                              ? new Date(app.appliedAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "--"}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                No recent applications to display
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
