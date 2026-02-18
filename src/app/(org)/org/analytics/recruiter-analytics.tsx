"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  Users,
  Calendar,
  CheckCircle,
  ArrowRight,
  Clock,
  FileText,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Target,
  TrendingUp,
  PieChart,
  Zap,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import type { RecruiterStats } from "@/lib/analytics/recruiter-stats"

interface RecruiterAnalyticsProps {
  stats: RecruiterStats
}

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"]
const FUNNEL_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981"]

const STATUS_BADGE_MAP: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-indigo-500 text-white" },
  screening: { label: "Screening", className: "bg-purple-500 text-white" },
  interviewing: { label: "Interviewing", className: "bg-cyan-500 text-white" },
  offered: { label: "Offered", className: "bg-amber-500 text-white" },
  hired: { label: "Hired", className: "bg-emerald-500 text-white" },
  rejected: { label: "Rejected", className: "bg-rose-500 text-white" },
}

// Mini sparkline SVG component
function Sparkline({ data, color, height = 32 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const width = 80
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(" ")
  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  )
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, " ")
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

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUpRight className="h-3.5 w-3.5" />
    if (current < previous) return <ArrowDownRight className="h-3.5 w-3.5" />
    return <Minus className="h-3.5 w-3.5" />
  }

  const getChangePercent = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  // Glass-morphic card base class
  const glassCard = "backdrop-blur-sm bg-background/80 border border-white/20 dark:border-white/10 shadow-xl shadow-black/5"

  // Donut chart data for source breakdown
  const sourceDonutData = stats.sourceBreakdown.map((s) => ({
    name: capitalizeFirst(s.source),
    value: s.count,
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
          My Performance
        </h2>
        <p className="text-muted-foreground mt-1">
          Your sourcing, screening, and pipeline activity at a glance
        </p>
      </div>

      {/* KPI Hero Cards with Sparklines */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Active Jobs",
            value: stats.myJobs.activeJobs,
            suffix: "",
            subtext: `${stats.myJobs.totalJobs} total job${stats.myJobs.totalJobs !== 1 ? "s" : ""}`,
            gradient: "from-indigo-500 to-purple-600",
            textColor: "text-indigo-100",
            icon: Briefcase,
            sparkline: stats.sparklineData.applications,
            sparkColor: "#c7d2fe",
          },
          {
            label: "Pipeline Active",
            value: activePipeline,
            suffix: "",
            subtext: `${stats.myPipeline.total} total application${stats.myPipeline.total !== 1 ? "s" : ""}`,
            gradient: "from-purple-500 to-fuchsia-600",
            textColor: "text-purple-100",
            icon: Users,
            sparkline: stats.sparklineData.pipeline,
            sparkColor: "#e9d5ff",
            current: stats.myActivity.applicationsThisMonth,
            previous: stats.previousMonthActivity.applicationsLastMonth,
          },
          {
            label: "Interviews This Month",
            value: stats.myActivity.interviewsThisMonth,
            suffix: "",
            subtext: `${stats.myActivity.applicationsThisMonth} new app${stats.myActivity.applicationsThisMonth !== 1 ? "s" : ""} this month`,
            gradient: "from-amber-500 to-orange-600",
            textColor: "text-amber-100",
            icon: Calendar,
            sparkline: stats.sparklineData.interviews,
            sparkColor: "#fde68a",
            current: stats.myActivity.interviewsThisMonth,
            previous: stats.previousMonthActivity.interviewsLastMonth,
          },
          {
            label: "Total Hires",
            value: stats.myPerformance.totalHires,
            suffix: "",
            subtext: stats.myPerformance.avgTimeToHire > 0
              ? `Avg ${stats.myPerformance.avgTimeToHire} days to hire`
              : "No hires yet",
            gradient: "from-emerald-500 to-teal-600",
            textColor: "text-emerald-100",
            icon: CheckCircle,
            sparkline: stats.sparklineData.hires,
            sparkColor: "#a7f3d0",
          },
        ].map((kpi) => (
          <Card
            key={kpi.label}
            className={`relative overflow-hidden border-0 bg-gradient-to-br ${kpi.gradient} text-white group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-xl" />
            <CardContent className="pt-6 relative">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className={`${kpi.textColor} text-sm font-medium`}>{kpi.label}</p>
                  <p className="text-4xl font-bold mt-1">{kpi.value}<span className="text-xl">{kpi.suffix}</span></p>
                  <div className={`flex items-center gap-1 mt-2 ${kpi.textColor}`}>
                    {"current" in kpi && kpi.current !== undefined && kpi.previous !== undefined ? (
                      <>
                        {getTrendIcon(kpi.current, kpi.previous)}
                        <span className="text-sm">{Math.abs(getChangePercent(kpi.current, kpi.previous))}% vs last month</span>
                      </>
                    ) : (
                      <span className="text-sm">{kpi.subtext}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                    <kpi.icon className="h-6 w-6" />
                  </div>
                  <Sparkline data={kpi.sparkline} color={kpi.sparkColor} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* === BENTO GRID LAYOUT === */}

      {/* Row 1: Application Trend + Source Donut + Conversion Rates */}
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className={`lg:col-span-2 ${glassCard}`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Monthly Trend
            </CardTitle>
            <CardDescription>Applications, interviews, and hires over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {stats.monthlyTrend.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyTrend}>
                  <defs>
                    <linearGradient id="gradApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradInterviews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradHires" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(v) => { const [y, m] = v.split("-"); return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("en-US", { month: "short" }) }}
                    className="text-xs"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis className="text-xs" axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }}
                    labelFormatter={(v) => { const [y, m] = v.split("-"); return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }) }}
                  />
                  <Area type="monotone" dataKey="applications" stroke="#6366f1" strokeWidth={2} fill="url(#gradApps)" name="Applications" />
                  <Area type="monotone" dataKey="interviews" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradInterviews)" name="Interviews" />
                  <Area type="monotone" dataKey="hires" stroke="#22c55e" strokeWidth={2} fill="url(#gradHires)" name="Hires" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Not enough data for trend chart</div>
            )}
          </CardContent>
        </Card>

        <Card className={glassCard}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-5 w-5 text-purple-500" />
              Source Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {sourceDonutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={sourceDonutData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="name" strokeWidth={0}>
                    {sourceDonutData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
                  <Legend iconType="circle" iconSize={8} />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No source data</div>
            )}
          </CardContent>
        </Card>

        <Card className={glassCard}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-5 w-5 text-amber-500" />
              Conversion Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "App → Screening", value: stats.conversionRates.applicationToScreening, color: "bg-indigo-500" },
              { label: "Screening → Interview", value: stats.conversionRates.screeningToInterview, color: "bg-purple-500" },
              { label: "Interview → Offer", value: stats.conversionRates.interviewToOffer, color: "bg-amber-500" },
              { label: "Offer → Hire", value: stats.conversionRates.offerToHire, color: "bg-emerald-500" },
            ].map((rate) => (
              <div key={rate.label} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{rate.label}</span>
                  <span className="font-semibold">{rate.value}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${rate.color} rounded-full transition-all duration-1000`} style={{ width: `${Math.min(rate.value, 100)}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-medium">Overall</span>
                <Badge className="bg-indigo-500 text-white">{stats.conversionRates.overallConversion}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Pipeline Funnel + Pipeline Stage Cards */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Pipeline Funnel - takes 3 cols */}
        <Card className={`lg:col-span-3 ${glassCard}`}>
          <CardHeader className="pb-2">
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
              <div className="space-y-3">
                {pipelineStages.map((stage, index) => {
                  const width = (stage.count / maxPipelineCount) * 100
                  const percentage =
                    stats.myPipeline.total > 0
                      ? Math.round((stage.count / stats.myPipeline.total) * 100)
                      : 0

                  return (
                    <div key={stage.key} className="group">
                      <div className="flex items-center gap-3">
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

                        <div className="flex-1 h-9 bg-muted rounded-lg overflow-hidden relative">
                          <div
                            className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-3 group-hover:brightness-110"
                            style={{
                              width: `${Math.max(width, 4)}%`,
                              background: `linear-gradient(90deg, ${FUNNEL_COLORS[index]}cc, ${FUNNEL_COLORS[index]})`,
                            }}
                          >
                            {width > 15 && (
                              <span className="text-white text-sm font-medium">
                                {stage.count}
                              </span>
                            )}
                          </div>
                        </div>

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

        {/* Pipeline Stage Mini Cards - takes 2 cols */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4 content-start">
          {pipelineStages.map((stage, index) => (
            <Card key={stage.key} className={`group hover:shadow-lg transition-all hover:-translate-y-1 ${glassCard}`}>
              <CardContent className="pt-5 text-center">
                <div
                  className="mx-auto mb-2 h-11 w-11 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${FUNNEL_COLORS[index]}, ${FUNNEL_COLORS[index]}cc)` }}
                >
                  <span className="font-bold">{stage.count}</span>
                </div>
                <p className="font-medium text-sm">{stage.label}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.myPipeline.total > 0 ? Math.round((stage.count / stats.myPipeline.total) * 100) : 0}%
                </p>
              </CardContent>
            </Card>
          ))}
          {stats.myPipeline.rejected > 0 && (
            <Card className={`group hover:shadow-lg transition-all hover:-translate-y-1 border-rose-500/20 ${glassCard}`}>
              <CardContent className="pt-5 text-center">
                <div className="mx-auto mb-2 h-11 w-11 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br from-rose-500 to-rose-600 group-hover:scale-110 transition-transform">
                  <span className="font-bold">{stats.myPipeline.rejected}</span>
                </div>
                <p className="font-medium text-sm">Rejected</p>
                <p className="text-xs text-muted-foreground">
                  {stats.myPipeline.total > 0 ? Math.round((stats.myPipeline.rejected / stats.myPipeline.total) * 100) : 0}%
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Row 3: Job Performance + Source ROI */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Job Performance */}
        <Card className={glassCard}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-indigo-500" />
              Job Performance
            </CardTitle>
            <CardDescription>Your top performing jobs by applications</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.jobPerformance.length > 0 ? (
              <div className="space-y-3">
                {stats.jobPerformance.slice(0, 6).map((job, index) => (
                  <div key={job.jobId} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{job.title}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span>{job.applications} apps</span>
                        <span>{job.interviews} interviews</span>
                        <span>{job.hires} hires</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={job.conversionRate >= 10 ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"}>
                        {job.conversionRate}%
                      </Badge>
                      {job.avgTimeToHire > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{job.avgTimeToHire}d avg</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Briefcase className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground text-sm">No jobs with applications yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Source ROI */}
        <Card className={glassCard}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-5 w-5 text-emerald-500" />
              Source Performance
            </CardTitle>
            <CardDescription>Conversion rate and hire count by source</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.sourceBreakdown.length > 0 ? (
              <div className="space-y-3">
                {stats.sourceBreakdown.map((source, index) => (
                  <div key={source.source} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${CHART_COLORS[index % CHART_COLORS.length]}20` }}>
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{capitalizeFirst(source.source)}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>{source.count} apps</span>
                        <span>{source.hires} hires</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="font-bold text-sm">{source.conversionRate}%</p>
                        <p className="text-[10px] text-muted-foreground">conversion</p>
                      </div>
                      <div className="h-8 w-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="w-full rounded-full transition-all duration-700"
                          style={{
                            height: `${Math.min(source.conversionRate * 2, 100)}%`,
                            backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">No source data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Job Performance Bar Chart */}
      {stats.jobPerformance.length > 0 && (
        <Card className={glassCard}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-5 w-5 text-blue-500" />
              Job Comparison
            </CardTitle>
            <CardDescription>Applications, interviews, and hires per job</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.jobPerformance.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis type="number" className="text-xs" axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="title" className="text-xs" width={120} axisLine={false} tickLine={false} tickFormatter={(v) => v.length > 18 ? v.slice(0, 18) + "..." : v} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
                <Bar dataKey="applications" fill="#6366f1" name="Applications" radius={[0, 4, 4, 0]} />
                <Bar dataKey="interviews" fill="#8b5cf6" name="Interviews" radius={[0, 4, 4, 0]} />
                <Bar dataKey="hires" fill="#22c55e" name="Hires" radius={[0, 4, 4, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Row 5: Recent Applications */}
      <Card className={glassCard}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" />
            Recent Applications
          </CardTitle>
          <CardDescription>Last 10 applications across your jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentApplications.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
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
