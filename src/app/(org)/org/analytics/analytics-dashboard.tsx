"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  FileSpreadsheet,
  Filter,
  RefreshCw,
  Zap,
  Activity,
  Timer,
  Layers,
  Sparkles,
  Trophy,
  Medal,
  AlertTriangle,
  Printer,
  TrendingDown as FunnelIcon,
  Flag,
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
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts"
import type { DashboardStats, DateRange } from "@/lib/analytics/dashboard-stats"

interface AnalyticsDashboardProps {
  stats: DashboardStats
}

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"]
const FUNNEL_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#22c55e", "#10b981"]
const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"]

export function AnalyticsDashboard({ stats }: AnalyticsDashboardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState<number | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isExporting, setIsExporting] = useState(false)

  // Handle date range change via URL
  const handleDateRangeChange = (range: DateRange) => {
    router.push(`/org/analytics?range=${range}`)
  }

  // Manual refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => {
      setIsRefreshing(false)
      setLastRefresh(new Date())
    }, 1000)
  }, [router])

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        handleRefresh()
      }, autoRefresh * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, handleRefresh])

  // Export to CSV
  const exportToCSV = () => {
    setIsExporting(true)
    const csvData = [
      ["Analytics Report - " + stats.periodLabel],
      ["Generated: " + new Date().toLocaleString()],
      [""],
      ["OVERVIEW METRICS"],
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
      ["PIPELINE FUNNEL"],
      ["Stage", "Count", "Percentage"],
      ...stats.hiringFunnel.map(f => [f.stage, f.count, `${f.percentage}%`]),
      [""],
      ["DROP-OFF ANALYSIS"],
      ["From Stage", "To Stage", "Drop-off Count", "Drop-off Rate"],
      ...stats.dropoffAnalysis.map(d => [d.fromStage, d.toStage, d.dropoffCount, `${d.dropoffRate}%`]),
      [""],
      ["SOURCES"],
      ["Source", "Applications", "Interviews", "Hires", "Conversion Rate"],
      ...stats.applicationsBySource.map(s => [s.source, s.count, s.interviews, s.hires, `${s.conversionRate}%`]),
      [""],
      ["DEPARTMENTS"],
      ["Department", "Open Positions", "Applications", "Interviews", "Hires", "Avg Time to Fill"],
      ...stats.departmentMetrics.map(d => [d.department, d.openPositions, d.applications, d.interviews, d.hires, d.avgTimeToFill]),
      [""],
      ["TEAM LEADERBOARD"],
      ["Rank", "Name", "Score", "Interviews", "Apps Reviewed"],
      ...stats.teamActivity.map((t, i) => [i + 1, t.userName, t.score, t.interviewsConducted, t.applicationsReviewed]),
    ]

    const csvContent = csvData.map(row => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `analytics_report_${stats.dateRange}_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    setTimeout(() => setIsExporting(false), 1000)
  }

  // Print report
  const handlePrint = () => {
    window.print()
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

  const getGoalColor = (current: number, target: number) => {
    const percent = (current / target) * 100
    if (percent >= 100) return "bg-emerald-500"
    if (percent >= 75) return "bg-blue-500"
    if (percent >= 50) return "bg-amber-500"
    return "bg-rose-500"
  }

  return (
    <div className="space-y-6 animate-fade-in print:space-y-4">
      {/* Header with Filters and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
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
            <Select value={stats.dateRange} onValueChange={handleDateRangeChange}>
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

          {/* Auto-refresh */}
          <Select
            value={autoRefresh?.toString() || "off"}
            onValueChange={(v) => setAutoRefresh(v === "off" ? null : parseInt(v))}
          >
            <SelectTrigger className="w-[120px]">
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
              <SelectValue placeholder="Auto refresh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">Off</SelectItem>
              <SelectItem value="30">30 sec</SelectItem>
              <SelectItem value="60">1 min</SelectItem>
              <SelectItem value="300">5 min</SelectItem>
            </SelectContent>
          </Select>

          {/* Manual Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {/* Export */}
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={isExporting}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export
          </Button>

          {/* Print */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>

          <Badge variant="secondary" className="text-xs gap-1.5 py-1.5">
            <Clock className="h-3 w-3" />
            {lastRefresh.toLocaleTimeString()}
          </Badge>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">Analytics Report - {stats.periodLabel}</h1>
        <p className="text-sm text-muted-foreground">Generated: {new Date().toLocaleString()}</p>
      </div>

      {/* Goal Progress Cards */}
      <div className="grid gap-4 md:grid-cols-3 print:grid-cols-3">
        {stats.goals.map((goal) => {
          const progress = Math.min((goal.current / goal.target) * 100, 100)
          return (
            <Card key={goal.id} className="relative overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{goal.title}</span>
                  </div>
                  {progress >= 100 && (
                    <Badge className="bg-emerald-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Achieved
                    </Badge>
                  )}
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-3xl font-bold">{goal.current}</span>
                  <span className="text-muted-foreground text-sm">/ {goal.target}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {Math.round(progress)}% complete • Due {new Date(goal.deadline).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Hero Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-500 to-purple-600 text-white print:border print:bg-white print:text-black">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl print:hidden" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-100 text-sm font-medium print:text-muted-foreground">Total Applications</p>
                <p className="text-4xl font-bold mt-1 print:text-3xl">{stats.overview.totalApplications}</p>
                <div className="flex items-center gap-1 mt-2 text-indigo-100 print:text-muted-foreground">
                  {getTrendIcon(stats.periodComparison[0]?.change || 0)}
                  <span className="text-sm">
                    {stats.periodComparison[0]?.changePercent || 0}% vs previous
                  </span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm print:bg-muted">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white print:border print:bg-white print:text-black">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl print:hidden" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-100 text-sm font-medium print:text-muted-foreground">Hired This Month</p>
                <p className="text-4xl font-bold mt-1 print:text-3xl">{stats.overview.hiredThisMonth}</p>
                <div className="flex items-center gap-1 mt-2 text-emerald-100 print:text-muted-foreground">
                  {getTrendIcon(stats.periodComparison[1]?.change || 0)}
                  <span className="text-sm">
                    {stats.periodComparison[1]?.changePercent || 0}% vs previous
                  </span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm print:bg-muted">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white print:border print:bg-white print:text-black">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl print:hidden" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-amber-100 text-sm font-medium print:text-muted-foreground">Avg. Time to Hire</p>
                <p className="text-4xl font-bold mt-1 print:text-3xl">{stats.overview.avgTimeToHire}<span className="text-xl ml-1">days</span></p>
                <p className="text-sm text-amber-100 mt-2 print:text-muted-foreground">
                  {stats.overview.avgTimeToHire === 0 ? "No hires yet" : "From application to offer"}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm print:bg-muted">
                <Timer className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-cyan-500 to-blue-600 text-white print:border print:bg-white print:text-black">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl print:hidden" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-cyan-100 text-sm font-medium print:text-muted-foreground">Offer Acceptance</p>
                <p className="text-4xl font-bold mt-1 print:text-3xl">{stats.overview.offerAcceptanceRate}%</p>
                <p className="text-sm text-cyan-100 mt-2 print:text-muted-foreground">
                  {stats.overview.offerAcceptanceRate === 0 ? "No offers yet" : "Acceptance rate"}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm print:bg-muted">
                <Award className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-auto flex-wrap gap-1 print:hidden">
          {[
            { value: "overview", label: "Overview", icon: BarChart3 },
            { value: "pipeline", label: "Pipeline", icon: Target },
            { value: "dropoff", label: "Drop-off", icon: FunnelIcon },
            { value: "leaderboard", label: "Leaderboard", icon: Trophy },
            { value: "sources", label: "Sources", icon: PieChart },
            { value: "departments", label: "Departments", icon: Building2 },
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
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-indigo-500" />
                      Applications Trend
                    </CardTitle>
                    <CardDescription>Daily applications and hires - {stats.periodLabel}</CardDescription>
                  </div>
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
                ].map((kpi) => (
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

          {/* Top Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Top Performing Jobs
              </CardTitle>
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
                          <span>{job.applications} apps</span>
                          <span>{job.interviews} interviews</span>
                          <span>{job.hires} hires</span>
                        </div>
                      </div>
                      <Badge className={job.conversionRate >= 10 ? "bg-emerald-500" : "bg-slate-500"}>
                        {job.conversionRate}%
                      </Badge>
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
                      {stats.pipelineVelocity.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

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
                  <p className="text-sm text-muted-foreground">{stage.percentage}%</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Drop-off Analysis Tab */}
        <TabsContent value="dropoff" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Candidate Drop-off Analysis
              </CardTitle>
              <CardDescription>Identify where candidates exit your hiring funnel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stats.dropoffAnalysis.map((stage, index) => (
                  <div key={stage.fromStage} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{stage.fromStage}</Badge>
                          <span className="text-muted-foreground">→</span>
                          <Badge variant="outline">{stage.toStage}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{stage.dropoffRate}% drop-off</p>
                        <p className="text-sm text-muted-foreground">{stage.dropoffCount} of {stage.totalEntered} candidates</p>
                      </div>
                    </div>
                    <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-700"
                        style={{ width: `${100 - stage.dropoffRate}%` }}
                      />
                      <div
                        className="h-full bg-rose-500 transition-all duration-700"
                        style={{ width: `${stage.dropoffRate}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progressed: {100 - stage.dropoffRate}%</span>
                      <span>Dropped: {stage.dropoffRate}%</span>
                    </div>
                  </div>
                ))}

                {stats.dropoffAnalysis.length === 0 && (
                  <div className="py-12 text-center">
                    <FunnelIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No drop-off data available yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bottleneck Alert */}
          {stats.dropoffAnalysis.some(d => d.dropoffRate > 50) && (
            <Card className="border-amber-500/50 bg-amber-500/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <AlertTriangle className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-700 dark:text-amber-400">Bottleneck Detected</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      High drop-off rate detected at{" "}
                      {stats.dropoffAnalysis
                        .filter(d => d.dropoffRate > 50)
                        .map(d => `${d.fromStage} → ${d.toStage}`)
                        .join(", ")}
                      . Consider reviewing your process at these stages.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Recruiter Leaderboard
              </CardTitle>
              <CardDescription>Top performers based on activity score</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.teamActivity.length > 0 ? (
                <div className="space-y-4">
                  {/* Top 3 Podium */}
                  <div className="flex items-end justify-center gap-4 pb-6 border-b">
                    {stats.teamActivity.slice(0, 3).map((member, index) => {
                      const positions = [1, 0, 2] // 2nd, 1st, 3rd order for display
                      const displayIndex = positions[index]
                      const heights = ["h-24", "h-32", "h-20"]
                      const member_at_position = stats.teamActivity[displayIndex]
                      if (!member_at_position) return null

                      return (
                        <div key={member_at_position.userId} className="flex flex-col items-center">
                          <div className="relative mb-2">
                            <div
                              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                              style={{ background: `linear-gradient(135deg, ${CHART_COLORS[displayIndex]}, ${CHART_COLORS[displayIndex]}cc)` }}
                            >
                              {member_at_position.userName.charAt(0)}
                            </div>
                            <div
                              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: MEDAL_COLORS[displayIndex] }}
                            >
                              <Medal className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <p className="font-medium text-sm text-center truncate max-w-[100px]">{member_at_position.userName}</p>
                          <p className="text-2xl font-bold" style={{ color: MEDAL_COLORS[displayIndex] }}>{member_at_position.score}</p>
                          <div
                            className={`w-20 ${heights[displayIndex]} rounded-t-lg mt-2 flex items-end justify-center pb-2`}
                            style={{ background: `linear-gradient(180deg, ${CHART_COLORS[displayIndex]}40, ${CHART_COLORS[displayIndex]}20)` }}
                          >
                            <span className="text-2xl font-bold" style={{ color: MEDAL_COLORS[displayIndex] }}>{displayIndex + 1}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Rest of the list */}
                  <div className="space-y-2">
                    {stats.teamActivity.slice(3).map((member, index) => (
                      <div key={member.userId} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                          {index + 4}
                        </div>
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ background: `linear-gradient(135deg, ${CHART_COLORS[(index + 3) % CHART_COLORS.length]}, ${CHART_COLORS[(index + 3) % CHART_COLORS.length]}cc)` }}
                        >
                          {member.userName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{member.userName}</p>
                          <p className="text-xs text-muted-foreground">{member.userEmail}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{member.score}</p>
                          <p className="text-xs text-muted-foreground">points</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Score breakdown */}
                  <div className="mt-6 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Score calculation:</p>
                    <div className="flex gap-4 text-xs">
                      <Badge variant="outline">Interview = 10 pts</Badge>
                      <Badge variant="outline">App Review = 5 pts</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No team activity data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Applications by Source</CardTitle>
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
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.applicationsBySource.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Source Conversion Rates</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.applicationsBySource} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" className="text-xs" axisLine={false} tickLine={false} />
                    <YAxis dataKey="source" type="category" className="text-xs" width={120} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => [`${v}%`, "Conversion Rate"]} />
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

          <Card>
            <CardHeader>
              <CardTitle>Source Performance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4">Source</th>
                    <th className="text-right py-3 px-4">Applications</th>
                    <th className="text-right py-3 px-4">Interviews</th>
                    <th className="text-right py-3 px-4">Hires</th>
                    <th className="text-right py-3 px-4">Conversion</th>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Comparison</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.departmentMetrics}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="department" className="text-xs" axisLine={false} tickLine={false} />
                  <YAxis className="text-xs" axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="applications" fill="#6366f1" name="Applications" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="interviews" fill="#8b5cf6" name="Interviews" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="hires" fill="#22c55e" name="Hires" radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.departmentMetrics.length > 0 ? (
              stats.departmentMetrics.map((dept, index) => (
                <Card key={dept.department} className="hover:shadow-lg transition-all">
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
                        <p className="text-xs text-muted-foreground">Open</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/30">
                        <p className="text-2xl font-bold">{dept.applications}</p>
                        <p className="text-xs text-muted-foreground">Apps</p>
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
      </Tabs>

      {/* Print-only full report */}
      <div className="hidden print:block space-y-6 mt-8">
        <h2 className="text-xl font-bold">Pipeline Funnel</h2>
        <table className="w-full text-sm border">
          <thead>
            <tr className="border-b bg-muted">
              <th className="text-left p-2">Stage</th>
              <th className="text-right p-2">Count</th>
              <th className="text-right p-2">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {stats.hiringFunnel.map(f => (
              <tr key={f.stage} className="border-b">
                <td className="p-2">{f.stage}</td>
                <td className="text-right p-2">{f.count}</td>
                <td className="text-right p-2">{f.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
