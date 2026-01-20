"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Briefcase,
  Users,
  FileText,
  CheckCircle,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Clock,
  Target,
  Building2,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Award,
  Download,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  Zap,
  Activity,
  Eye,
  Timer,
  Layers,
  ChevronRight,
  Sparkles,
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
  ComposedChart,
  Line,
  RadialBarChart,
  RadialBar,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts"
import type { DashboardStats } from "@/lib/analytics/dashboard-stats"

interface AnalyticsDashboardProps {
  stats: DashboardStats
}

const GRADIENT_COLORS = {
  primary: ["#6366f1", "#8b5cf6"],
  success: ["#22c55e", "#10b981"],
  warning: ["#f59e0b", "#f97316"],
  danger: ["#ef4444", "#dc2626"],
  info: ["#06b6d4", "#0ea5e9"],
  purple: ["#a855f7", "#7c3aed"],
}

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"]
const FUNNEL_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#22c55e", "#10b981"]

type DateRange = "7d" | "30d" | "90d" | "12m" | "all"

export function AnalyticsDashboard({ stats }: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>("30d")
  const [isExporting, setIsExporting] = useState(false)

  // Export to CSV function
  const exportToCSV = () => {
    setIsExporting(true)

    // Prepare CSV data
    const csvData = [
      ["Metric", "Value"],
      ["Total Jobs", stats.overview.totalJobs],
      ["Active Jobs", stats.overview.activeJobs],
      ["Total Candidates", stats.overview.totalCandidates],
      ["Total Applications", stats.overview.totalApplications],
      ["Hired This Month", stats.overview.hiredThisMonth],
      ["Interviews Scheduled", stats.overview.interviewsScheduled],
      ["Avg Time to Hire (days)", stats.overview.avgTimeToHire],
      ["Offer Acceptance Rate (%)", stats.overview.offerAcceptanceRate],
      [""],
      ["Pipeline Stage", "Count", "Percentage"],
      ...stats.hiringFunnel.map(f => [f.stage, f.count, `${f.percentage}%`]),
      [""],
      ["Source", "Applications", "Interviews", "Hires", "Conversion Rate"],
      ...stats.applicationsBySource.map(s => [s.source, s.count, s.interviews, s.hires, `${s.conversionRate}%`]),
      [""],
      ["Department", "Open Positions", "Applications", "Interviews", "Hires", "Avg Time to Fill"],
      ...stats.departmentMetrics.map(d => [d.department, d.openPositions, d.applications, d.interviews, d.hires, d.avgTimeToFill]),
    ]

    const csvContent = csvData.map(row => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `analytics_report_${new Date().toISOString().split("T")[0]}.csv`
    link.click()

    setTimeout(() => setIsExporting(false), 1000)
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="h-4 w-4" />
    if (change < 0) return <ArrowDownRight className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-emerald-500"
    if (change < 0) return "text-rose-500"
    return "text-slate-400"
  }

  // Radial data for gauges
  const conversionGaugeData = [
    { name: "Conversion", value: stats.overview.offerAcceptanceRate, fill: "#22c55e" },
  ]

  // Prepare radar data for source effectiveness
  const radarData = stats.applicationsBySource.slice(0, 6).map(s => ({
    source: s.source.split(" ")[0],
    applications: Math.min(s.count, 100),
    conversion: s.conversionRate,
    hires: s.hires * 10,
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Filters and Export */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Real-time insights into your hiring performance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Filter */}
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
            <Filter className="h-4 w-4 text-muted-foreground ml-2" />
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-[130px] border-0 bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="12m">Last 12 months</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={isExporting}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </Button>

          <Badge variant="secondary" className="text-xs gap-1.5 py-1.5">
            <RefreshCw className="h-3 w-3" />
            {new Date().toLocaleTimeString()}
          </Badge>
        </div>
      </div>

      {/* Hero Stats - Modern Gradient Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Applications Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Total Applications</p>
                <p className="text-4xl font-bold mt-1">{stats.overview.totalApplications}</p>
                <div className="flex items-center gap-1 mt-2 text-indigo-100">
                  {getTrendIcon(stats.periodComparison[0]?.change || 0)}
                  <span className="text-sm">
                    {stats.periodComparison[0]?.changePercent || 0}% vs last period
                  </span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hired Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Hired This Month</p>
                <p className="text-4xl font-bold mt-1">{stats.overview.hiredThisMonth}</p>
                <div className="flex items-center gap-1 mt-2 text-emerald-100">
                  {getTrendIcon(stats.periodComparison[1]?.change || 0)}
                  <span className="text-sm">
                    {stats.periodComparison[1]?.changePercent || 0}% vs last period
                  </span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time to Hire Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-amber-100 text-sm font-medium">Avg. Time to Hire</p>
                <p className="text-4xl font-bold mt-1">{stats.overview.avgTimeToHire}<span className="text-xl ml-1">days</span></p>
                <p className="text-sm text-amber-100 mt-2">
                  {stats.overview.avgTimeToHire === 0 ? "No hires yet" : "From application to offer"}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Timer className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Offer Acceptance Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-cyan-100 text-sm font-medium">Offer Acceptance</p>
                <p className="text-4xl font-bold mt-1">{stats.overview.offerAcceptanceRate}%</p>
                <p className="text-sm text-cyan-100 mt-2">
                  {stats.overview.offerAcceptanceRate === 0 ? "No offers yet" : "Acceptance rate"}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Award className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Active Jobs", value: stats.overview.activeJobs, total: stats.overview.totalJobs, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Candidates", value: stats.overview.totalCandidates, icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
          { label: "Interviews", value: stats.overview.interviewsScheduled, icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-100" },
          { label: "In Pipeline", value: stats.hiringFunnel.filter(f => !["Hired", "Rejected"].includes(f.stage)).reduce((sum, f) => sum + f.count, 0), icon: Layers, color: "text-teal-600", bg: "bg-teal-100" },
          { label: "Departments", value: stats.departmentMetrics.length, icon: Building2, color: "text-orange-600", bg: "bg-orange-100" },
        ].map((stat) => (
          <Card key={stat.label} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-auto flex-wrap gap-1">
          {[
            { value: "overview", label: "Overview", icon: BarChart3 },
            { value: "pipeline", label: "Pipeline", icon: Target },
            { value: "jobs", label: "Jobs", icon: Briefcase },
            { value: "sources", label: "Sources", icon: PieChart },
            { value: "departments", label: "Departments", icon: Building2 },
            { value: "team", label: "Team", icon: UserCheck },
          ].map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Applications Trend - Large Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-indigo-500" />
                      Applications Trend
                    </CardTitle>
                    <CardDescription>Daily applications and hires over time</CardDescription>
                  </div>
                  <Badge variant="outline" className="font-normal">Last 30 days</Badge>
                </div>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.applicationsTrend}>
                    <defs>
                      <linearGradient id="gradientApps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradientHired" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      className="text-xs"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis className="text-xs" axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                      labelFormatter={(v) => new Date(v).toLocaleDateString()}
                    />
                    <Area type="monotone" dataKey="applications" stroke="#6366f1" strokeWidth={2} fill="url(#gradientApps)" name="Applications" />
                    <Area type="monotone" dataKey="hired" stroke="#22c55e" strokeWidth={2} fill="url(#gradientHired)" name="Hired" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quick KPIs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Quick Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  { label: "Application Rate", value: stats.overview.totalJobs > 0 ? Math.round(stats.overview.totalApplications / stats.overview.totalJobs) : 0, suffix: "per job", color: "bg-indigo-500" },
                  { label: "Interview Rate", value: stats.overview.totalApplications > 0 ? Math.round((stats.hiringFunnel.find(f => f.stage === "Interviewing")?.count || 0) / stats.overview.totalApplications * 100) : 0, suffix: "%", color: "bg-purple-500" },
                  { label: "Hire Rate", value: stats.overview.totalApplications > 0 ? Math.round((stats.hiringFunnel.find(f => f.stage === "Hired")?.count || 0) / stats.overview.totalApplications * 100) : 0, suffix: "%", color: "bg-emerald-500" },
                  { label: "Active Pipeline", value: stats.hiringFunnel.filter(f => !["Hired", "Rejected"].includes(f.stage)).reduce((sum, f) => sum + f.count, 0), suffix: "candidates", color: "bg-cyan-500" },
                ].map((kpi, i) => (
                  <div key={kpi.label} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{kpi.label}</span>
                      <span className="font-semibold">{kpi.value} {kpi.suffix}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${kpi.color} rounded-full transition-all duration-1000`} style={{ width: `${Math.min(kpi.value, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Jobs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Top Performing Jobs
                  </CardTitle>
                  <CardDescription>Jobs with highest application volume and conversion</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {stats.topPerformingJobs.length > 0 ? (
                <div className="space-y-4">
                  {stats.topPerformingJobs.map((job, index) => (
                    <div key={job.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{job.title}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {job.applications} apps</span>
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {job.interviews} interviews</span>
                          <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {job.hires} hires</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={job.conversionRate >= 10 ? "bg-emerald-500" : "bg-slate-500"}>
                          {job.conversionRate}% conversion
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No active jobs with applications yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Visual Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Hiring Funnel</CardTitle>
                <CardDescription>Candidate progression through stages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.hiringFunnel.filter(f => f.stage !== "Rejected").map((stage, index) => {
                    const maxCount = Math.max(...stats.hiringFunnel.map(f => f.count), 1)
                    const width = (stage.count / maxCount) * 100
                    return (
                      <div key={stage.stage} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{stage.stage}</span>
                          <span className="text-muted-foreground">{stage.count} ({stage.percentage}%)</span>
                        </div>
                        <div className="h-10 bg-muted rounded-lg overflow-hidden relative">
                          <div
                            className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-3"
                            style={{
                              width: `${Math.max(width, 5)}%`,
                              background: `linear-gradient(90deg, ${FUNNEL_COLORS[index]}, ${FUNNEL_COLORS[index]}dd)`,
                            }}
                          >
                            {width > 20 && <span className="text-white text-sm font-medium">{stage.count}</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Pipeline Velocity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Distribution</CardTitle>
                <CardDescription>Candidates at each stage</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.pipelineVelocity} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" className="text-xs" axisLine={false} tickLine={false} />
                    <YAxis dataKey="stage" type="category" className="text-xs" width={90} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="candidates" radius={[0, 8, 8, 0]}>
                      {stats.pipelineVelocity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Stage Cards */}
          <div className="grid gap-4 md:grid-cols-5">
            {stats.hiringFunnel.filter(f => f.stage !== "Rejected").map((stage, index) => (
              <Card key={stage.stage} className="group hover:shadow-lg transition-all hover:-translate-y-1">
                <CardContent className="pt-6 text-center">
                  <div
                    className="mx-auto mb-3 h-12 w-12 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform"
                    style={{ background: `linear-gradient(135deg, ${FUNNEL_COLORS[index]}, ${FUNNEL_COLORS[index]}cc)` }}
                  >
                    <span className="font-bold text-lg">{stage.count}</span>
                  </div>
                  <p className="font-medium">{stage.stage}</p>
                  <p className="text-sm text-muted-foreground">{stage.percentage}% of total</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Jobs Tab - NEW */}
        <TabsContent value="jobs" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Job Performance Overview</CardTitle>
                    <CardDescription>All jobs with their metrics</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left py-3 px-4 font-medium rounded-tl-lg">Job Title</th>
                        <th className="text-center py-3 px-4 font-medium">Applications</th>
                        <th className="text-center py-3 px-4 font-medium">Interviews</th>
                        <th className="text-center py-3 px-4 font-medium">Hires</th>
                        <th className="text-center py-3 px-4 font-medium rounded-tr-lg">Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topPerformingJobs.length > 0 ? (
                        stats.topPerformingJobs.map((job, index) => (
                          <tr key={job.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                  style={{ background: `linear-gradient(135deg, ${CHART_COLORS[index % CHART_COLORS.length]}, ${CHART_COLORS[index % CHART_COLORS.length]}cc)` }}
                                >
                                  {index + 1}
                                </div>
                                <span className="font-medium truncate max-w-[200px]">{job.title}</span>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">{job.applications}</td>
                            <td className="text-center py-3 px-4">{job.interviews}</td>
                            <td className="text-center py-3 px-4">
                              <Badge variant={job.hires > 0 ? "default" : "secondary"} className={job.hires > 0 ? "bg-emerald-500" : ""}>
                                {job.hires}
                              </Badge>
                            </td>
                            <td className="text-center py-3 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${job.conversionRate}%`,
                                      background: job.conversionRate >= 10 ? "#22c55e" : "#94a3b8",
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-medium w-8">{job.conversionRate}%</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-muted-foreground">
                            No job data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Job Stats Summary */}
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white mb-3">
                      <Briefcase className="h-8 w-8" />
                    </div>
                    <p className="text-4xl font-bold">{stats.overview.totalJobs}</p>
                    <p className="text-muted-foreground">Total Jobs</p>
                    <div className="flex justify-center gap-4 mt-4 text-sm">
                      <div>
                        <p className="font-semibold text-emerald-600">{stats.overview.activeJobs}</p>
                        <p className="text-muted-foreground text-xs">Active</p>
                      </div>
                      <div className="w-px bg-border" />
                      <div>
                        <p className="font-semibold text-slate-600">{stats.overview.totalJobs - stats.overview.activeJobs}</p>
                        <p className="text-muted-foreground text-xs">Closed</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Time to Hire Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats.timeToHire.byJob.length > 0 ? (
                    stats.timeToHire.byJob.slice(0, 4).map((job, i) => (
                      <div key={job.jobTitle} className="flex items-center justify-between">
                        <span className="text-sm truncate max-w-[150px]">{job.jobTitle}</span>
                        <Badge variant="outline">{job.days} days</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No hire data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Applications by Source</CardTitle>
                <CardDescription>Distribution of candidate sources</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={stats.applicationsBySource}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="source"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.applicationsBySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                      }}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Source Conversion Rates</CardTitle>
                <CardDescription>How effective is each source</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.applicationsBySource} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" className="text-xs" axisLine={false} tickLine={false} />
                    <YAxis dataKey="source" type="category" className="text-xs" width={120} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                      }}
                      formatter={(v: number) => [`${v}%`, "Conversion Rate"]}
                    />
                    <Bar dataKey="conversionRate" radius={[0, 8, 8, 0]}>
                      {stats.applicationsBySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.conversionRate >= 10 ? "#22c55e" : "#94a3b8"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Source Details Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Source Performance Details</CardTitle>
                  <CardDescription>Comprehensive metrics by source</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-3 px-4 font-medium">Source</th>
                      <th className="text-right py-3 px-4 font-medium">Applications</th>
                      <th className="text-right py-3 px-4 font-medium">Interviews</th>
                      <th className="text-right py-3 px-4 font-medium">Hires</th>
                      <th className="text-right py-3 px-4 font-medium">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.applicationsBySource.map((source, index) => (
                      <tr key={source.source} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                            {source.source}
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">{source.count}</td>
                        <td className="text-right py-3 px-4">{source.interviews}</td>
                        <td className="text-right py-3 px-4">{source.hires}</td>
                        <td className="text-right py-3 px-4">
                          <Badge className={source.conversionRate >= 10 ? "bg-emerald-500" : "bg-slate-500"}>
                            {source.conversionRate}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Comparison</CardTitle>
              <CardDescription>Performance metrics across departments</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.departmentMetrics}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="department" className="text-xs" axisLine={false} tickLine={false} />
                  <YAxis className="text-xs" axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                    }}
                  />
                  <Bar dataKey="applications" fill="#6366f1" name="Applications" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="interviews" fill="#8b5cf6" name="Interviews" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="hires" fill="#22c55e" name="Hires" radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Department Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.departmentMetrics.length > 0 ? (
              stats.departmentMetrics.map((dept, index) => (
                <Card key={dept.department} className="group hover:shadow-lg transition-all hover:-translate-y-1">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{dept.department}</CardTitle>
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-2 rounded-lg bg-muted/30">
                        <p className="text-2xl font-bold">{dept.openPositions}</p>
                        <p className="text-xs text-muted-foreground">Open Positions</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/30">
                        <p className="text-2xl font-bold">{dept.applications}</p>
                        <p className="text-xs text-muted-foreground">Applications</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/30">
                        <p className="text-2xl font-bold">{dept.interviews}</p>
                        <p className="text-xs text-muted-foreground">Interviews</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/30">
                        <p className="text-2xl font-bold text-emerald-600">{dept.hires}</p>
                        <p className="text-xs text-muted-foreground">Hires</p>
                      </div>
                    </div>
                    {dept.avgTimeToFill > 0 && (
                      <div className="mt-4 pt-3 border-t flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Avg. Time to Fill</span>
                        <Badge variant="outline">{dept.avgTimeToFill} days</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-3">
                <CardContent className="py-12 text-center">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No department data available</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Performance</CardTitle>
                  <CardDescription>Recruiter and interviewer activity</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {stats.teamActivity.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left py-3 px-4 font-medium">Team Member</th>
                        <th className="text-center py-3 px-4 font-medium">Apps Reviewed</th>
                        <th className="text-center py-3 px-4 font-medium">Interviews</th>
                        <th className="text-center py-3 px-4 font-medium">Offers</th>
                        <th className="text-center py-3 px-4 font-medium">Hires</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.teamActivity.map((member, index) => (
                        <tr key={member.userId} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold"
                                style={{ background: `linear-gradient(135deg, ${CHART_COLORS[index % CHART_COLORS.length]}, ${CHART_COLORS[index % CHART_COLORS.length]}cc)` }}
                              >
                                {member.userName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium">{member.userName}</p>
                                <p className="text-xs text-muted-foreground">{member.userEmail}</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">{member.applicationsReviewed}</td>
                          <td className="text-center py-3 px-4">
                            <Badge variant="secondary">{member.interviewsConducted}</Badge>
                          </td>
                          <td className="text-center py-3 px-4">{member.offersExtended}</td>
                          <td className="text-center py-3 px-4">{member.hires}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <UserCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No team activity data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {stats.teamActivity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Interview Activity</CardTitle>
                <CardDescription>Interviews conducted by team member</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.teamActivity} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" className="text-xs" axisLine={false} tickLine={false} />
                    <YAxis dataKey="userName" type="category" className="text-xs" width={120} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="interviewsConducted" name="Interviews" radius={[0, 8, 8, 0]}>
                      {stats.teamActivity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
