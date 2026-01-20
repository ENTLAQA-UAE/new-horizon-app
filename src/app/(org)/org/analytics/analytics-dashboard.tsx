"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
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
} from "recharts"
import type { DashboardStats } from "@/lib/analytics/dashboard-stats"

interface AnalyticsDashboardProps {
  stats: DashboardStats
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe", "#00C49F"]
const FUNNEL_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#22c55e", "#ef4444"]
const DEPT_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#14b8a6"]

export function AnalyticsDashboard({ stats }: AnalyticsDashboardProps) {
  const overviewCards = [
    {
      title: "Total Jobs",
      value: stats.overview.totalJobs,
      subtitle: `${stats.overview.activeJobs} active`,
      icon: Briefcase,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Candidates",
      value: stats.overview.totalCandidates,
      subtitle: "In talent pool",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Applications",
      value: stats.overview.totalApplications,
      subtitle: "All time",
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Hired This Month",
      value: stats.overview.hiredThisMonth,
      subtitle: "Successful hires",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Interviews Scheduled",
      value: stats.overview.interviewsScheduled,
      subtitle: "Upcoming",
      icon: Calendar,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "Avg. Time to Hire",
      value: `${stats.overview.avgTimeToHire}`,
      subtitle: "Days",
      icon: Clock,
      color: "text-teal-600",
      bgColor: "bg-teal-100",
    },
    {
      title: "Offer Acceptance",
      value: `${stats.overview.offerAcceptanceRate}%`,
      subtitle: "Rate",
      icon: Award,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ]

  const getTrendIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />
    if (change < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-green-600"
    if (change < 0) return "text-red-600"
    return "text-gray-500"
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Advanced Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive hiring metrics and performance insights
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Last updated: {new Date().toLocaleString()}
        </Badge>
      </div>

      {/* Period Comparison Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.periodComparison.map((item) => (
          <Card key={item.metric}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{item.metric} (30d)</p>
                  <p className="text-3xl font-bold">{item.current}</p>
                </div>
                <div className={`text-right ${getTrendColor(item.change)}`}>
                  <div className="flex items-center gap-1 justify-end">
                    {getTrendIcon(item.change)}
                    <span className="text-lg font-semibold">
                      {item.changePercent > 0 ? "+" : ""}{item.changePercent}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">vs previous 30d</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {overviewCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="funnel">
            <Target className="mr-2 h-4 w-4" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="sources">
            <PieChart className="mr-2 h-4 w-4" />
            Sources
          </TabsTrigger>
          <TabsTrigger value="departments">
            <Building2 className="mr-2 h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="team">
            <UserCheck className="mr-2 h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="time">
            <Clock className="mr-2 h-4 w-4" />
            Time Analysis
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Applications Trend */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Applications Trend (Last 30 Days)</CardTitle>
                <CardDescription>
                  Daily applications and successful hires
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.applicationsTrend}>
                    <defs>
                      <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorHired" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Area
                      type="monotone"
                      dataKey="applications"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorApps)"
                      name="Applications"
                    />
                    <Area
                      type="monotone"
                      dataKey="hired"
                      stroke="#82ca9d"
                      fillOpacity={1}
                      fill="url(#colorHired)"
                      name="Hired"
                    />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Performing Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Jobs</CardTitle>
                <CardDescription>Jobs with highest conversion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topPerformingJobs.length > 0 ? (
                    stats.topPerformingJobs.map((job, index) => (
                      <div key={job.id} className="space-y-2">
                        <div className="flex items-center gap-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{job.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {job.applications} apps • {job.interviews} interviews • {job.hires} hires
                            </p>
                          </div>
                          <Badge variant={job.conversionRate >= 10 ? "default" : "secondary"}>
                            {job.conversionRate}%
                          </Badge>
                        </div>
                        <Progress value={job.conversionRate} className="h-1" />
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No active jobs yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
                <CardDescription>Critical hiring metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Application Rate</span>
                    <span className="font-medium">
                      {stats.overview.totalJobs > 0
                        ? Math.round(stats.overview.totalApplications / stats.overview.totalJobs)
                        : 0}{" "}
                      per job
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Interview Rate</span>
                    <span className="font-medium">
                      {stats.overview.totalApplications > 0
                        ? Math.round((stats.hiringFunnel.find(f => f.stage === "Interviewing")?.count || 0) / stats.overview.totalApplications * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Hire Rate</span>
                    <span className="font-medium">
                      {stats.overview.totalApplications > 0
                        ? Math.round((stats.hiringFunnel.find(f => f.stage === "Hired")?.count || 0) / stats.overview.totalApplications * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Offer Acceptance Rate</span>
                    <span className="font-medium">{stats.overview.offerAcceptanceRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Active Pipeline</span>
                    <span className="font-medium">
                      {(stats.hiringFunnel.find(f => f.stage === "Screening")?.count || 0) +
                        (stats.hiringFunnel.find(f => f.stage === "Interviewing")?.count || 0)}{" "}
                      candidates
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Avg. Time to Hire</span>
                    <span className="font-medium">{stats.overview.avgTimeToHire} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pipeline/Funnel Tab */}
        <TabsContent value="funnel" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Hiring Pipeline</CardTitle>
                <CardDescription>Candidate progression through stages</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={stats.hiringFunnel.filter(f => f.stage !== "Rejected")}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="stage" type="category" className="text-xs" width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number, name: string, props: any) => [
                        `${value} (${props.payload.percentage}%)`,
                        "Candidates"
                      ]}
                    />
                    <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]}>
                      {stats.hiringFunnel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pipeline Velocity</CardTitle>
                <CardDescription>Average time spent at each stage</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stats.pipelineVelocity}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="stage" className="text-xs" />
                    <YAxis yAxisId="left" className="text-xs" />
                    <YAxis yAxisId="right" orientation="right" className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar yAxisId="left" dataKey="candidates" fill="#8884d8" name="Candidates" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="avgDays" stroke="#ff7300" name="Avg Days" strokeWidth={2} />
                    <Legend />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Stage Cards */}
          <div className="grid gap-4 md:grid-cols-5">
            {stats.hiringFunnel.filter(f => f.stage !== "Rejected").map((stage, index) => (
              <Card key={stage.stage}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div
                      className="mx-auto mb-2 h-3 w-3 rounded-full"
                      style={{ backgroundColor: FUNNEL_COLORS[index] }}
                    />
                    <p className="text-sm font-medium">{stage.stage}</p>
                    <p className="text-3xl font-bold">{stage.count}</p>
                    <p className="text-xs text-muted-foreground">{stage.percentage}% of total</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Applications by Source</CardTitle>
                <CardDescription>Where your candidates come from</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={stats.applicationsBySource}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="source"
                    >
                      {stats.applicationsBySource.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Source Effectiveness</CardTitle>
                <CardDescription>Conversion rates by source</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.applicationsBySource}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="source" className="text-xs" angle={-45} textAnchor="end" height={80} />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="conversionRate" fill="#22c55e" name="Conversion %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Source Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Source Performance Details</CardTitle>
              <CardDescription>Comprehensive source metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Source</th>
                      <th className="text-right py-3 px-4 font-medium">Applications</th>
                      <th className="text-right py-3 px-4 font-medium">Interviews</th>
                      <th className="text-right py-3 px-4 font-medium">Hires</th>
                      <th className="text-right py-3 px-4 font-medium">Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.applicationsBySource.map((source, index) => (
                      <tr key={source.source} className="border-b last:border-0">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            {source.source}
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">{source.count}</td>
                        <td className="text-right py-3 px-4">{source.interviews}</td>
                        <td className="text-right py-3 px-4">{source.hires}</td>
                        <td className="text-right py-3 px-4">
                          <Badge variant={source.conversionRate >= 10 ? "default" : "secondary"}>
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
        <TabsContent value="departments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Department Performance Comparison</CardTitle>
                <CardDescription>Applications, interviews, and hires by department</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.departmentMetrics}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="department" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="applications" fill="#8884d8" name="Applications" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="interviews" fill="#82ca9d" name="Interviews" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="hires" fill="#ffc658" name="Hires" radius={[4, 4, 0, 0]} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Department Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.departmentMetrics.map((dept, index) => (
              <Card key={dept.department}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{dept.department}</CardTitle>
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: DEPT_COLORS[index % DEPT_COLORS.length] }}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Open Positions</p>
                      <p className="text-xl font-bold">{dept.openPositions}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Applications</p>
                      <p className="text-xl font-bold">{dept.applications}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Interviews</p>
                      <p className="text-xl font-bold">{dept.interviews}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Hires</p>
                      <p className="text-xl font-bold">{dept.hires}</p>
                    </div>
                  </div>
                  {dept.avgTimeToFill > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Avg. Time to Fill</span>
                        <Badge variant="outline">{dept.avgTimeToFill} days</Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {stats.departmentMetrics.length === 0 && (
              <Card className="col-span-3">
                <CardContent className="py-12 text-center text-muted-foreground">
                  No department data available
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>Recruiter and interviewer activity metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.teamActivity.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Team Member</th>
                        <th className="text-right py-3 px-4 font-medium">Applications Reviewed</th>
                        <th className="text-right py-3 px-4 font-medium">Interviews Conducted</th>
                        <th className="text-right py-3 px-4 font-medium">Offers Extended</th>
                        <th className="text-right py-3 px-4 font-medium">Hires</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.teamActivity.map((member, index) => (
                        <tr key={member.userId} className="border-b last:border-0">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{member.userName}</p>
                                <p className="text-xs text-muted-foreground">{member.userEmail}</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4">{member.applicationsReviewed}</td>
                          <td className="text-right py-3 px-4">
                            <Badge variant="secondary">{member.interviewsConducted}</Badge>
                          </td>
                          <td className="text-right py-3 px-4">{member.offersExtended}</td>
                          <td className="text-right py-3 px-4">{member.hires}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  No team activity data available yet
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
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="userName" type="category" className="text-xs" width={120} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="interviewsConducted" fill="#8884d8" name="Interviews" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Time Analysis Tab */}
        <TabsContent value="time" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Time to Hire by Department</CardTitle>
                <CardDescription>Average days from application to hire</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {stats.timeToHire.byDepartment.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.timeToHire.byDepartment} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="department" type="category" className="text-xs" width={120} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value} days`, "Avg. Time"]}
                      />
                      <Bar dataKey="days" fill="#8884d8" name="Days" radius={[0, 4, 4, 0]}>
                        {stats.timeToHire.byDepartment.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No department hire data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time to Hire by Job</CardTitle>
                <CardDescription>Which positions fill fastest</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {stats.timeToHire.byJob.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.timeToHire.byJob} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="jobTitle" type="category" className="text-xs" width={150} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === "days") return [`${value} days`, "Avg. Time"]
                          return [value, "Hires"]
                        }}
                      />
                      <Bar dataKey="days" fill="#f59e0b" name="Days" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No job hire data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Time to Hire Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Hiring Efficiency Summary</CardTitle>
              <CardDescription>Overall time metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-3xl font-bold">{stats.timeToHire.average}</p>
                  <p className="text-sm text-muted-foreground">Avg. Days to Hire</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-3xl font-bold">{stats.overview.offerAcceptanceRate}%</p>
                  <p className="text-sm text-muted-foreground">Offer Accept Rate</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-3xl font-bold">
                    {stats.timeToHire.byDepartment.length > 0
                      ? Math.min(...stats.timeToHire.byDepartment.map(d => d.days))
                      : "-"}
                  </p>
                  <p className="text-sm text-muted-foreground">Fastest Dept (days)</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-3xl font-bold">{stats.timeToHire.byDepartment.length}</p>
                  <p className="text-sm text-muted-foreground">Depts with Hires</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
