"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Briefcase,
  Users,
  FileText,
  CheckCircle,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Clock,
  Target,
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
import type { DashboardStats } from "@/lib/analytics/dashboard-stats"

interface AnalyticsDashboardProps {
  stats: DashboardStats
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe", "#00C49F"]

const FUNNEL_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#22c55e", "#ef4444"]

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
      value: `${stats.timeToHire.average}`,
      subtitle: "Days",
      icon: Clock,
      color: "text-teal-600",
      bgColor: "bg-teal-100",
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Track your hiring performance and metrics
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Last updated: {new Date().toLocaleString()}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="funnel">
            <Target className="mr-2 h-4 w-4" />
            Hiring Funnel
          </TabsTrigger>
          <TabsTrigger value="sources">
            <PieChart className="mr-2 h-4 w-4" />
            Sources
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="mr-2 h-4 w-4" />
            Trends
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
                <CardDescription>Jobs with most applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topPerformingJobs.length > 0 ? (
                    stats.topPerformingJobs.map((job, index) => (
                      <div key={job.id} className="flex items-center gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{job.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {job.applications} applications • {job.interviews} interviews
                          </p>
                        </div>
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

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Insights</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
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
                    <span className="text-muted-foreground">Active Pipeline</span>
                    <span className="font-medium">
                      {(stats.hiringFunnel.find(f => f.stage === "Screening")?.count || 0) +
                        (stats.hiringFunnel.find(f => f.stage === "Interviewing")?.count || 0)}{" "}
                      candidates
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hiring Funnel</CardTitle>
              <CardDescription>
                Candidate progression through hiring stages
              </CardDescription>
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
                    formatter={(value: number, name: string, props) => [
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

          {/* Funnel metrics */}
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
                    <p className="text-2xl font-bold">{stage.count}</p>
                    <p className="text-xs text-muted-foreground">{stage.percentage}%</p>
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
                <CardTitle>Source Breakdown</CardTitle>
                <CardDescription>Detailed source statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.applicationsBySource.map((source, index) => (
                    <div key={source.source} className="flex items-center gap-4">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{source.source}</span>
                          <span className="text-muted-foreground">{source.count}</span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(source.count / stats.overview.totalApplications) * 100}%`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Volume Trend</CardTitle>
              <CardDescription>30-day application history</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.applicationsTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", { day: "numeric" })
                    }
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
                  <Bar dataKey="applications" fill="#8884d8" radius={[4, 4, 0, 0]} name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
