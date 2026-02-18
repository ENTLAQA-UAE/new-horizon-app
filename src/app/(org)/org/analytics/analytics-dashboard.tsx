"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Briefcase,
  Users,
  FileText,
  CheckCircle,
  TrendingUp,
  PieChart,
  Clock,
  Target,
  Building2,
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
  Trophy,
  Medal,
  AlertTriangle,
  Printer,
  TrendingDown as FunnelIcon,
  Flag,
  DollarSign,
  Sparkles,
  ChevronRight,
  Star,
} from "lucide-react"
import { KawadirIcon } from "@/components/ui/kawadir-icon"
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
  LineChart,
  Line,
} from "recharts"
import type { DashboardStats, DateRange } from "@/lib/analytics/dashboard-stats"
import type { CandidateListStats } from "@/lib/analytics/candidates-list-stats"
import { CandidatesList } from "./candidates-list"

interface AnalyticsDashboardProps {
  stats: DashboardStats
  candidateListData?: CandidateListStats | null
}

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"]
const FUNNEL_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#22c55e", "#10b981"]
const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"]

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

// Gauge chart component using SVG
function GaugeChart({ value, max = 100, label, color }: { value: number; max?: number; label: string; color: string }) {
  const pct = Math.min(value / max, 1)
  const angle = pct * 180
  const r = 60
  const cx = 70
  const cy = 70
  const startAngle = Math.PI
  const endAngle = startAngle - (angle * Math.PI) / 180
  const x1 = cx + r * Math.cos(startAngle)
  const y1 = cy - r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(endAngle)
  const y2 = cy - r * Math.sin(endAngle)
  const largeArc = angle > 180 ? 1 : 0

  return (
    <div className="flex flex-col items-center">
      <svg width={140} height={80} viewBox="0 0 140 80">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="hsl(var(--muted))" strokeWidth="12" strokeLinecap="round" />
        {angle > 0 && (
          <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
        )}
        <text x={cx} y={cy - 10} textAnchor="middle" className="text-2xl font-bold fill-foreground">{value}</text>
        <text x={cx} y={cy + 6} textAnchor="middle" className="text-[10px] fill-muted-foreground">{label}</text>
      </svg>
    </div>
  )
}

type DrillDownType = "applications" | "hires" | "timeToHire" | "offerRate" | null

export function AnalyticsDashboard({ stats, candidateListData }: AnalyticsDashboardProps) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState<number | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isExporting, setIsExporting] = useState(false)
  const [showCandidates, setShowCandidates] = useState(false)
  const [drillDown, setDrillDown] = useState<DrillDownType>(null)

  const handleDateRangeChange = (range: DateRange) => {
    router.push(`/org/analytics?range=${range}`)
  }

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => {
      setIsRefreshing(false)
      setLastRefresh(new Date())
    }, 1000)
  }, [router])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(handleRefresh, autoRefresh * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, handleRefresh])

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
      ["Source", "Applications", "Interviews", "Hires", "Conversion Rate", "Quality Score", "Efficiency"],
      ...stats.sourceROI.map(s => [s.source, s.applications, s.interviews, s.hires, `${s.conversionRate}%`, s.qualityScore, s.efficiency]),
      [""],
      ["DEPARTMENTS"],
      ["Department", "Open Positions", "Applications", "Interviews", "Hires", "Avg Time to Fill"],
      ...stats.departmentMetrics.map(d => [d.department, d.openPositions, d.applications, d.interviews, d.hires, d.avgTimeToFill]),
      [""],
      ["QUALITY OF HIRE"],
      ["Overall Score", stats.qualityOfHire.overallScore],
      ["Funnel Efficiency", `${stats.qualityOfHire.funnelEfficiency}%`],
      ["Offer Acceptance Rate", `${stats.qualityOfHire.offerAcceptanceRate}%`],
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

  const handlePrint = () => window.print()

  const getTrendIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="h-3.5 w-3.5" />
    if (change < 0) return <ArrowDownRight className="h-3.5 w-3.5" />
    return <Minus className="h-3.5 w-3.5" />
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return "#22c55e"
    if (score >= 50) return "#f59e0b"
    return "#ef4444"
  }

  // Glass-morphic card base class
  const glassCard = "backdrop-blur-sm bg-background/80 border border-white/20 dark:border-white/10 shadow-xl shadow-black/5"

  return (
    <div className="space-y-6 animate-fade-in print:space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">Real-time insights into your hiring performance</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
            <Filter className="h-4 w-4 text-muted-foreground ml-2" />
            <Select value={stats.dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-[130px] border-0 bg-transparent"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="12m">Last 12 months</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Select value={autoRefresh?.toString() || "off"} onValueChange={(v) => setAutoRefresh(v === "off" ? null : parseInt(v))}>
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
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV} disabled={isExporting} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" /> Print
          </Button>
          {candidateListData && (
            <Button variant={showCandidates ? "default" : "outline"} size="sm" onClick={() => setShowCandidates(!showCandidates)} className="gap-2">
              <Users className="h-4 w-4" /> Candidates
            </Button>
          )}
          <Badge variant="secondary" className="text-xs gap-1.5 py-1.5">
            <Clock className="h-3 w-3" /> {lastRefresh.toLocaleTimeString()}
          </Badge>
        </div>
      </div>

      {/* Executive Summary Print Header */}
      <div className="hidden print:block space-y-4 pb-4 border-b">
        <h1 className="text-2xl font-bold">Executive Hiring Report - {stats.periodLabel}</h1>
        <p className="text-sm text-muted-foreground">Generated: {new Date().toLocaleString()}</p>
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="border rounded p-3"><p className="text-xs text-muted-foreground">Applications</p><p className="text-2xl font-bold">{stats.overview.totalApplications}</p></div>
          <div className="border rounded p-3"><p className="text-xs text-muted-foreground">Hired</p><p className="text-2xl font-bold">{stats.overview.hiredThisMonth}</p></div>
          <div className="border rounded p-3"><p className="text-xs text-muted-foreground">Time to Hire</p><p className="text-2xl font-bold">{stats.overview.avgTimeToHire}d</p></div>
          <div className="border rounded p-3"><p className="text-xs text-muted-foreground">Offer Accept</p><p className="text-2xl font-bold">{stats.overview.offerAcceptanceRate}%</p></div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="border rounded p-3"><p className="text-xs text-muted-foreground">Quality of Hire Score</p><p className="text-xl font-bold">{stats.qualityOfHire.overallScore}/100</p></div>
          <div className="border rounded p-3"><p className="text-xs text-muted-foreground">Hiring Velocity Change</p><p className="text-xl font-bold">{stats.hiringVelocity.changePercent > 0 ? "+" : ""}{stats.hiringVelocity.changePercent}%</p></div>
        </div>
      </div>

      {/* Goal Progress */}
      {stats.goals.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3 print:grid-cols-3">
          {stats.goals.map((goal) => {
            const progress = Math.min((goal.current / goal.target) * 100, 100)
            return (
              <Card key={goal.id} className={`relative overflow-hidden ${glassCard}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{goal.title}</span>
                    </div>
                    {progress >= 100 && (
                      <Badge className="bg-emerald-500"><CheckCircle className="h-3 w-3 mr-1" /> Achieved</Badge>
                    )}
                  </div>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-3xl font-bold">{goal.current}</span>
                    <span className="text-muted-foreground text-sm">/ {goal.target}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">{Math.round(progress)}% complete</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* KPI Hero Cards with Sparklines and Click-to-Drill-Down */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
        {[
          {
            key: "applications" as DrillDownType,
            label: "Total Applications",
            value: stats.overview.totalApplications,
            suffix: "",
            gradient: "from-indigo-500 to-purple-600",
            textColor: "text-indigo-100",
            icon: FileText,
            sparkline: stats.sparklineData.applications,
            sparkColor: "#c7d2fe",
            comparison: stats.periodComparison[0],
          },
          {
            key: "hires" as DrillDownType,
            label: "Hired This Month",
            value: stats.overview.hiredThisMonth,
            suffix: "",
            gradient: "from-emerald-500 to-teal-600",
            textColor: "text-emerald-100",
            icon: CheckCircle,
            sparkline: stats.sparklineData.hires,
            sparkColor: "#a7f3d0",
            comparison: stats.periodComparison[1],
          },
          {
            key: "timeToHire" as DrillDownType,
            label: "Avg. Time to Hire",
            value: stats.overview.avgTimeToHire,
            suffix: " days",
            gradient: "from-amber-500 to-orange-600",
            textColor: "text-amber-100",
            icon: Timer,
            sparkline: stats.sparklineData.timeToHire,
            sparkColor: "#fde68a",
            comparison: stats.periodComparison[2],
          },
          {
            key: "offerRate" as DrillDownType,
            label: "Offer Acceptance",
            value: stats.overview.offerAcceptanceRate,
            suffix: "%",
            gradient: "from-cyan-500 to-blue-600",
            textColor: "text-cyan-100",
            icon: Award,
            sparkline: stats.sparklineData.offerRate,
            sparkColor: "#a5f3fc",
            comparison: stats.periodComparison[3],
          },
        ].map((kpi) => (
          <Card
            key={kpi.key}
            className={`relative overflow-hidden border-0 bg-gradient-to-br ${kpi.gradient} text-white cursor-pointer group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 print:border print:bg-white print:text-black print:hover:translate-y-0`}
            onClick={() => setDrillDown(kpi.key)}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl print:hidden" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-xl print:hidden" />
            <CardContent className="pt-6 relative">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className={`${kpi.textColor} text-sm font-medium print:text-muted-foreground`}>{kpi.label}</p>
                  <p className="text-4xl font-bold mt-1 print:text-3xl">{kpi.value}<span className="text-xl">{kpi.suffix}</span></p>
                  <div className={`flex items-center gap-1 mt-2 ${kpi.textColor} print:text-muted-foreground`}>
                    {getTrendIcon(kpi.comparison?.change || 0)}
                    <span className="text-sm">{Math.abs(kpi.comparison?.changePercent || 0)}% vs previous</span>
                    {(kpi.comparison?.changePercent || 0) !== 0 && (
                      <Badge className={`ml-1 text-[10px] px-1.5 py-0 ${(kpi.comparison?.change || 0) > 0 ? "bg-white/25" : "bg-white/15"}`}>
                        {(kpi.comparison?.change || 0) > 0 ? "+" : ""}{kpi.comparison?.change || 0}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm print:bg-muted group-hover:bg-white/30 transition-colors">
                    <kpi.icon className="h-6 w-6" />
                  </div>
                  <div className="print:hidden">
                    <Sparkline data={kpi.sparkline} color={kpi.sparkColor} />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                <ChevronRight className="h-4 w-4 text-white/60" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* === BENTO GRID LAYOUT === */}

      {/* Row 1: Applications Trend + Quick Insights + Quality Gauge */}
      <div className="grid gap-4 lg:grid-cols-4 print:grid-cols-2">
        <Card className={`lg:col-span-2 ${glassCard}`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              Applications Trend
            </CardTitle>
            <CardDescription>Daily applications and hires - {stats.periodLabel}</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
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
                <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} className="text-xs" axisLine={false} tickLine={false} />
                <YAxis className="text-xs" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                <Area type="monotone" dataKey="applications" stroke="#6366f1" strokeWidth={2} fill="url(#gradientApps)" name="Applications" />
                <Area type="monotone" dataKey="hired" stroke="#22c55e" strokeWidth={2} fill="url(#gradientHired)" name="Hired" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className={glassCard}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-5 w-5 text-amber-500" />
              Quick Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Application Rate", value: stats.overview.totalJobs > 0 ? Math.round(stats.overview.totalApplications / stats.overview.totalJobs) : 0, suffix: "/job", color: "bg-indigo-500" },
              { label: "Interview Rate", value: stats.overview.totalApplications > 0 ? Math.round((stats.hiringFunnel.find(f => f.stage === "Interviewing")?.count || 0) / stats.overview.totalApplications * 100) : 0, suffix: "%", color: "bg-purple-500" },
              { label: "Hire Rate", value: stats.overview.totalApplications > 0 ? Math.round((stats.hiringFunnel.find(f => f.stage === "Hired")?.count || 0) / stats.overview.totalApplications * 100) : 0, suffix: "%", color: "bg-emerald-500" },
              { label: "Pipeline", value: stats.hiringFunnel.filter(f => !["Hired", "Rejected"].includes(f.stage)).reduce((sum, f) => sum + f.count, 0), suffix: "", color: "bg-cyan-500" },
            ].map((kpi) => (
              <div key={kpi.label} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{kpi.label}</span>
                  <span className="font-semibold">{kpi.value}{kpi.suffix}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${kpi.color} rounded-full transition-all duration-1000`} style={{ width: `${Math.min(kpi.value, 100)}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={glassCard}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Quality of Hire
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <GaugeChart value={stats.qualityOfHire.overallScore} label="/ 100" color={getScoreColor(stats.qualityOfHire.overallScore)} />
            <div className="grid grid-cols-2 gap-3 w-full mt-2">
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold">{stats.qualityOfHire.funnelEfficiency}%</p>
                <p className="text-[10px] text-muted-foreground">Efficiency</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold">{stats.qualityOfHire.offerAcceptanceRate}%</p>
                <p className="text-[10px] text-muted-foreground">Acceptance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Hiring Funnel + Source Donut + Hiring Velocity */}
      <div className="grid gap-4 lg:grid-cols-3 print:grid-cols-2">
        {/* Animated Funnel */}
        <Card className={glassCard}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-indigo-500" />
              Hiring Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.hiringFunnel.filter(f => f.stage !== "Rejected").map((stage, index) => {
                const maxCount = Math.max(...stats.hiringFunnel.map(f => f.count), 1)
                const width = (stage.count / maxCount) * 100
                return (
                  <div key={stage.stage} className="group">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="font-medium">{stage.stage}</span>
                      <span className="text-muted-foreground">{stage.count} ({stage.percentage}%)</span>
                    </div>
                    <div className="h-8 bg-muted rounded-lg overflow-hidden relative">
                      <div
                        className="h-full rounded-lg transition-all duration-1000 ease-out flex items-center justify-end pr-2 group-hover:brightness-110"
                        style={{
                          width: `${Math.max(width, 8)}%`,
                          background: `linear-gradient(90deg, ${FUNNEL_COLORS[index]}cc, ${FUNNEL_COLORS[index]})`,
                        }}
                      >
                        {width > 15 && <span className="text-white text-xs font-medium">{stage.count}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Source Donut Chart */}
        <Card className={glassCard}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-5 w-5 text-purple-500" />
              Source Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie data={stats.applicationsBySource} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="count" nameKey="source" strokeWidth={0}>
                  {stats.applicationsBySource.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
                <Legend iconType="circle" iconSize={8} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hiring Velocity Trend */}
        <Card className={glassCard}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Hiring Velocity
              </CardTitle>
              <Badge variant={stats.hiringVelocity.changePercent <= 0 ? "default" : "destructive"} className="text-[10px]">
                {stats.hiringVelocity.changePercent <= 0 ? "Faster" : "Slower"} {Math.abs(stats.hiringVelocity.changePercent)}%
              </Badge>
            </div>
            <CardDescription>Monthly avg. days to hire</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            {stats.hiringVelocity.trend.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.hiringVelocity.trend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="period" tickFormatter={(v) => { const [y, m] = v.split("-"); return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("en-US", { month: "short" }) }} className="text-xs" axisLine={false} tickLine={false} />
                  <YAxis className="text-xs" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} formatter={(v: number) => [`${v} days`, "Avg. Days"]} />
                  <Line type="monotone" dataKey="avgDays" stroke="#22c55e" strokeWidth={3} dot={{ fill: "#22c55e", r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="hires" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Hires" />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Not enough data for velocity trend</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Top Jobs + Source ROI */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={glassCard}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <KawadirIcon className="h-5 w-5 text-amber-500" />
              Top Performing Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topPerformingJobs.length > 0 ? (
              <div className="space-y-3">
                {stats.topPerformingJobs.map((job, index) => (
                  <div key={job.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
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
                    <Badge className={job.conversionRate >= 10 ? "bg-emerald-500" : "bg-slate-500"}>{job.conversionRate}%</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Briefcase className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground text-sm">No active jobs with applications yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Source ROI */}
        <Card className={glassCard}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              Source ROI Analysis
            </CardTitle>
            <CardDescription>Quality score and efficiency by source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.sourceROI.map((source, index) => (
                <div key={source.source} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${CHART_COLORS[index % CHART_COLORS.length]}20` }}>
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{source.source}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{source.hires} hires</span>
                      <span>{source.avgTimeToHire > 0 ? `${source.avgTimeToHire}d avg` : "N/A"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" style={{ color: getScoreColor(source.qualityScore) }} />
                        <span className="font-bold text-sm">{source.qualityScore}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">quality</p>
                    </div>
                    <div className="h-8 w-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="w-full rounded-full transition-all duration-700" style={{ height: `${source.efficiency}%`, backgroundColor: getScoreColor(source.qualityScore) }} />
                    </div>
                  </div>
                </div>
              ))}
              {stats.sourceROI.length === 0 && (
                <div className="py-8 text-center text-muted-foreground text-sm">No source data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Pipeline Stage Cards + Drop-off Analysis */}
      <div className="grid gap-4 md:grid-cols-5 print:grid-cols-5">
        {stats.hiringFunnel.filter(f => f.stage !== "Rejected").map((stage, index) => (
          <Card key={stage.stage} className={`group hover:shadow-lg transition-all hover:-translate-y-1 ${glassCard}`}>
            <CardContent className="pt-5 text-center">
              <div
                className="mx-auto mb-2 h-11 w-11 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform"
                style={{ background: `linear-gradient(135deg, ${FUNNEL_COLORS[index]}, ${FUNNEL_COLORS[index]}cc)` }}
              >
                <span className="font-bold">{stage.count}</span>
              </div>
              <p className="font-medium text-sm">{stage.stage}</p>
              <p className="text-xs text-muted-foreground">{stage.percentage}%</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 5: Drop-off + Bottleneck */}
      <Card className={glassCard}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Drop-off Analysis
          </CardTitle>
          <CardDescription>Where candidates exit the funnel</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.dropoffAnalysis.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {stats.dropoffAnalysis.map((stage) => (
                <div key={stage.fromStage} className={`p-3 rounded-xl ${stage.dropoffRate > 50 ? "bg-rose-500/5 border border-rose-500/20" : "bg-muted/30"}`}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Badge variant="outline" className="text-[10px] px-1.5">{stage.fromStage}</Badge>
                    <span className="text-muted-foreground text-xs">→</span>
                    <Badge variant="outline" className="text-[10px] px-1.5">{stage.toStage}</Badge>
                  </div>
                  <p className="text-2xl font-bold">{stage.dropoffRate}%</p>
                  <div className="h-2 bg-muted rounded-full overflow-hidden flex mt-2">
                    <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${100 - stage.dropoffRate}%` }} />
                    <div className="h-full bg-rose-500 transition-all duration-700" style={{ width: `${stage.dropoffRate}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{stage.dropoffCount} of {stage.totalEntered}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center"><FunnelIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" /><p className="text-muted-foreground text-sm">No drop-off data available</p></div>
          )}
        </CardContent>
      </Card>

      {/* Bottleneck Alert */}
      {stats.dropoffAnalysis.some(d => d.dropoffRate > 50) && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 shrink-0"><AlertTriangle className="h-5 w-5 text-amber-500" /></div>
              <div>
                <h4 className="font-semibold text-amber-700 dark:text-amber-400 text-sm">Bottleneck Detected</h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  High drop-off at {stats.dropoffAnalysis.filter(d => d.dropoffRate > 50).map(d => `${d.fromStage} → ${d.toStage}`).join(", ")}. Review these stages.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Row 6: Department Comparison + Leaderboard */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Department Chart */}
        <Card className={glassCard}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-blue-500" />
              Department Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.departmentMetrics}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="department" className="text-xs" axisLine={false} tickLine={false} />
                <YAxis className="text-xs" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
                <Bar dataKey="applications" fill="#6366f1" name="Applications" radius={[4, 4, 0, 0]} />
                <Bar dataKey="interviews" fill="#8b5cf6" name="Interviews" radius={[4, 4, 0, 0]} />
                <Bar dataKey="hires" fill="#22c55e" name="Hires" radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className={glassCard}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-5 w-5 text-amber-500" />
              Recruiter Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.teamActivity.length > 0 ? (
              <div className="space-y-2">
                {stats.teamActivity.slice(0, 5).map((member, index) => (
                  <div key={member.userId} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="relative">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ background: `linear-gradient(135deg, ${CHART_COLORS[index % CHART_COLORS.length]}, ${CHART_COLORS[index % CHART_COLORS.length]}cc)` }}
                      >
                        {member.userName.charAt(0)}
                      </div>
                      {index < 3 && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: MEDAL_COLORS[index] }}>
                          <Medal className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{member.userName}</p>
                      <p className="text-[10px] text-muted-foreground">{member.interviewsConducted} interviews, {member.applicationsReviewed} reviews</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold" style={index < 3 ? { color: MEDAL_COLORS[index] } : undefined}>{member.score}</p>
                      <p className="text-[10px] text-muted-foreground">pts</p>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t mt-2">
                  <div className="flex gap-3 text-[10px]">
                    <Badge variant="outline" className="text-[10px]">Interview = 10 pts</Badge>
                    <Badge variant="outline" className="text-[10px]">Review = 5 pts</Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center"><Trophy className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" /><p className="text-muted-foreground text-sm">No team activity data</p></div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 7: Department Detail Cards */}
      {stats.departmentMetrics.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.departmentMetrics.map((dept, index) => (
            <Card key={dept.department} className={`hover:shadow-lg transition-all hover:-translate-y-0.5 ${glassCard}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{dept.department}</CardTitle>
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 rounded-lg bg-muted/30"><p className="text-xl font-bold">{dept.openPositions}</p><p className="text-[10px] text-muted-foreground">Open</p></div>
                  <div className="text-center p-2 rounded-lg bg-muted/30"><p className="text-xl font-bold">{dept.applications}</p><p className="text-[10px] text-muted-foreground">Apps</p></div>
                  <div className="text-center p-2 rounded-lg bg-muted/30"><p className="text-xl font-bold">{dept.interviews}</p><p className="text-[10px] text-muted-foreground">Interviews</p></div>
                  <div className="text-center p-2 rounded-lg bg-muted/30"><p className="text-xl font-bold text-emerald-600">{dept.hires}</p><p className="text-[10px] text-muted-foreground">Hires</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Candidates Section (toggleable) */}
      {showCandidates && candidateListData && (
        <CandidatesList data={candidateListData} />
      )}

      {/* Drill-Down Dialog */}
      <Dialog open={drillDown !== null} onOpenChange={() => setDrillDown(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {drillDown === "applications" && "Applications Breakdown"}
              {drillDown === "hires" && "Hires Breakdown"}
              {drillDown === "timeToHire" && "Time to Hire Details"}
              {drillDown === "offerRate" && "Offer Acceptance Details"}
            </DialogTitle>
            <DialogDescription>Detailed breakdown by department and source</DialogDescription>
          </DialogHeader>

          {drillDown === "applications" && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">By Source</h4>
              {stats.applicationsBySource.map((s, i) => (
                <div key={s.source} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} /><span className="text-sm">{s.source}</span></div>
                  <span className="font-bold">{s.count}</span>
                </div>
              ))}
              <h4 className="font-medium text-sm mt-4">By Department</h4>
              {stats.departmentMetrics.map((d) => (
                <div key={d.department} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm">{d.department}</span>
                  <span className="font-bold">{d.applications}</span>
                </div>
              ))}
            </div>
          )}

          {drillDown === "hires" && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">By Source</h4>
              {stats.sourceROI.filter(s => s.hires > 0).map((s, i) => (
                <div key={s.source} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} /><span className="text-sm">{s.source}</span></div>
                  <div className="text-right"><span className="font-bold">{s.hires}</span><span className="text-xs text-muted-foreground ml-2">({s.conversionRate}% conv.)</span></div>
                </div>
              ))}
              <h4 className="font-medium text-sm mt-4">By Department</h4>
              {stats.departmentMetrics.filter(d => d.hires > 0).map((d) => (
                <div key={d.department} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm">{d.department}</span>
                  <span className="font-bold">{d.hires}</span>
                </div>
              ))}
            </div>
          )}

          {drillDown === "timeToHire" && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-3xl font-bold">{stats.overview.avgTimeToHire} days</p>
                <p className="text-xs text-muted-foreground">Overall average</p>
              </div>
              <h4 className="font-medium text-sm">By Department</h4>
              {stats.timeToHire.byDepartment.map((d) => (
                <div key={d.department} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm">{d.department}</span>
                  <div><span className="font-bold">{d.days}d</span><span className="text-xs text-muted-foreground ml-2">({d.hires} hires)</span></div>
                </div>
              ))}
              <h4 className="font-medium text-sm mt-4">By Job</h4>
              {stats.timeToHire.byJob.slice(0, 5).map((j) => (
                <div key={j.jobTitle} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm truncate max-w-[300px]">{j.jobTitle}</span>
                  <div><span className="font-bold">{j.days}d</span><span className="text-xs text-muted-foreground ml-2">({j.hires} hires)</span></div>
                </div>
              ))}
            </div>
          )}

          {drillDown === "offerRate" && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-3xl font-bold">{stats.overview.offerAcceptanceRate}%</p>
                <p className="text-xs text-muted-foreground">Overall acceptance rate</p>
              </div>
              <h4 className="font-medium text-sm">Quality of Hire by Source</h4>
              {stats.qualityOfHire.bySource.map((s, i) => (
                <div key={s.source} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} /><span className="text-sm">{s.source}</span></div>
                  <div><span className="font-bold">{s.score}</span><span className="text-xs text-muted-foreground ml-1">/100</span><span className="text-xs text-muted-foreground ml-2">({s.hires} hires)</span></div>
                </div>
              ))}
              <h4 className="font-medium text-sm mt-4">Quality by Department</h4>
              {stats.qualityOfHire.byDepartment.map((d) => (
                <div key={d.department} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm">{d.department}</span>
                  <div><span className="font-bold">{d.score}</span><span className="text-xs text-muted-foreground ml-1">/100</span></div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print-only Executive Summary Tables */}
      <div className="hidden print:block space-y-6 mt-8">
        <h2 className="text-lg font-bold">Pipeline Funnel</h2>
        <table className="w-full text-sm border">
          <thead><tr className="border-b bg-muted"><th className="text-left p-2">Stage</th><th className="text-right p-2">Count</th><th className="text-right p-2">%</th></tr></thead>
          <tbody>{stats.hiringFunnel.map(f => (<tr key={f.stage} className="border-b"><td className="p-2">{f.stage}</td><td className="text-right p-2">{f.count}</td><td className="text-right p-2">{f.percentage}%</td></tr>))}</tbody>
        </table>

        <h2 className="text-lg font-bold mt-4">Source Performance & ROI</h2>
        <table className="w-full text-sm border">
          <thead><tr className="border-b bg-muted"><th className="text-left p-2">Source</th><th className="text-right p-2">Apps</th><th className="text-right p-2">Hires</th><th className="text-right p-2">Conv.</th><th className="text-right p-2">Quality</th></tr></thead>
          <tbody>{stats.sourceROI.map(s => (<tr key={s.source} className="border-b"><td className="p-2">{s.source}</td><td className="text-right p-2">{s.applications}</td><td className="text-right p-2">{s.hires}</td><td className="text-right p-2">{s.conversionRate}%</td><td className="text-right p-2">{s.qualityScore}/100</td></tr>))}</tbody>
        </table>

        <h2 className="text-lg font-bold mt-4">Department Metrics</h2>
        <table className="w-full text-sm border">
          <thead><tr className="border-b bg-muted"><th className="text-left p-2">Dept</th><th className="text-right p-2">Open</th><th className="text-right p-2">Apps</th><th className="text-right p-2">Hires</th><th className="text-right p-2">Avg TTF</th></tr></thead>
          <tbody>{stats.departmentMetrics.map(d => (<tr key={d.department} className="border-b"><td className="p-2">{d.department}</td><td className="text-right p-2">{d.openPositions}</td><td className="text-right p-2">{d.applications}</td><td className="text-right p-2">{d.hires}</td><td className="text-right p-2">{d.avgTimeToFill}d</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  )
}
