"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Calendar,
  CheckCircle,
  ClipboardCheck,
  Clock,
  FileText,
  AlertCircle,
} from "lucide-react"
import type { InterviewerStats } from "@/lib/analytics/interviewer-stats"

interface InterviewerAnalyticsProps {
  stats: InterviewerStats
}

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">Completed</Badge>
    case "scheduled":
      return <Badge className="bg-blue-500 hover:bg-blue-600">Scheduled</Badge>
    case "confirmed":
      return <Badge className="bg-indigo-500 hover:bg-indigo-600">Confirmed</Badge>
    case "cancelled":
      return <Badge className="bg-rose-500 hover:bg-rose-600">Cancelled</Badge>
    case "no_show":
      return <Badge className="bg-slate-500 hover:bg-slate-600">No Show</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function InterviewerAnalytics({ stats }: InterviewerAnalyticsProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
          My Interview Activity
        </h2>
        <p className="text-muted-foreground mt-1">
          Your personal interview schedule and scorecard overview
        </p>
      </div>

      {/* Hero Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Upcoming Interviews */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Upcoming Interviews</p>
                <p className="text-4xl font-bold mt-1">{stats.upcomingInterviews}</p>
                <p className="text-sm text-indigo-100 mt-2">
                  {stats.upcomingInterviews === 0
                    ? "No interviews scheduled"
                    : `${stats.upcomingInterviews} interview${stats.upcomingInterviews !== 1 ? "s" : ""} ahead`}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed Interviews */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Completed Interviews</p>
                <p className="text-4xl font-bold mt-1">{stats.completedInterviews}</p>
                <p className="text-sm text-emerald-100 mt-2">
                  {stats.totalInterviews > 0
                    ? `${stats.completedInterviews} of ${stats.totalInterviews} total`
                    : "No interviews yet"}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scorecard Completion Rate */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardContent className="pt-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-amber-100 text-sm font-medium">Scorecard Completion</p>
                <p className="text-4xl font-bold mt-1">
                  {stats.scorecardCompletionRate}
                  <span className="text-xl ml-0.5">%</span>
                </p>
                <p className="text-sm text-amber-100 mt-2">
                  {stats.scorecardsSubmitted + stats.scorecardsPending === 0
                    ? "No scorecards due"
                    : `${stats.scorecardsSubmitted} submitted, ${stats.scorecardsPending} pending`}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <ClipboardCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scorecard Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-500" />
            Scorecard Status
          </CardTitle>
          <CardDescription>
            Track your scorecard submissions for completed interviews
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completion Progress</span>
              <span className="font-semibold">{stats.scorecardCompletionRate}%</span>
            </div>
            <Progress value={stats.scorecardCompletionRate} className="h-3" />
          </div>

          {/* Submitted vs Pending breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.scorecardsSubmitted}</p>
                <p className="text-sm text-muted-foreground">Submitted</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.scorecardsPending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </div>

          {stats.scorecardsPending > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Scorecards Awaiting Submission
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  You have {stats.scorecardsPending} completed interview{stats.scorecardsPending !== 1 ? "s" : ""} without
                  a submitted scorecard. Please submit your feedback promptly.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Interviews Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-500" />
            Recent Interviews
          </CardTitle>
          <CardDescription>
            Your last {stats.recentInterviews.length} interviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentInterviews.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium">Interview</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Scorecard</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentInterviews.map((interview) => (
                    <tr
                      key={interview.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium truncate max-w-[200px]">{interview.title}</p>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {formatDate(interview.scheduled_at)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(interview.status)}
                      </td>
                      <td className="py-3 px-4">
                        {interview.status === "completed" ? (
                          interview.has_scorecard ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Submitted
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25 hover:bg-amber-500/25">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No interviews found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Interviews assigned to you will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
