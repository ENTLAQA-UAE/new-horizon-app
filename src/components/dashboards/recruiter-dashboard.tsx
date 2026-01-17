"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Briefcase,
  Users,
  FileText,
  Calendar,
  Clock,
  Plus,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

interface RecruiterDashboardProps {
  stats: {
    myActiveJobs: number
    myCandidates: number
    pendingScreening: number
    interviewsToday: number
    interviewsThisWeek: number
    tasksOverdue: number
  }
  recentApplications?: {
    id: string
    candidateName: string
    jobTitle: string
    appliedAt: string
    status: string
  }[]
  upcomingInterviews?: {
    id: string
    candidateName: string
    jobTitle: string
    scheduledAt: string
    type: string
  }[]
}

export function RecruiterDashboard({
  stats,
  recentApplications = [],
  upcomingInterviews = [],
}: RecruiterDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Dashboard</h2>
          <p className="text-muted-foreground">
            Your recruitment overview for today
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/org/jobs/new">
              <Plus className="mr-2 h-4 w-4" />
              New Job
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myActiveJobs}</div>
            <Link href="/org/jobs?filter=mine" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Screening</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingScreening}</div>
            <Link href="/org/applications?filter=screening" className="text-xs text-primary hover:underline">
              Review now →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interviewsToday}</div>
            <p className="text-xs text-muted-foreground">
              {stats.interviewsThisWeek} this week
            </p>
          </CardContent>
        </Card>

        <Card className={stats.tasksOverdue > 0 ? "border-red-200 bg-red-50 dark:bg-red-950/20" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Overdue</CardTitle>
            {stats.tasksOverdue > 0 ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.tasksOverdue > 0 ? "text-red-600" : "text-green-600"}`}>
              {stats.tasksOverdue}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.tasksOverdue > 0 ? "Require attention" : "All caught up!"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications & Upcoming Interviews */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Latest candidates to review</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/org/applications">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentApplications.length > 0 ? (
              <div className="space-y-4">
                {recentApplications.slice(0, 5).map((app) => (
                  <div key={app.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{app.candidateName}</p>
                      <p className="text-xs text-muted-foreground">{app.jobTitle}</p>
                    </div>
                    <Badge variant="secondary">{app.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent applications</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Interviews</CardTitle>
              <CardDescription>Your scheduled interviews</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/org/interviews">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingInterviews.length > 0 ? (
              <div className="space-y-4">
                {upcomingInterviews.slice(0, 5).map((interview) => (
                  <div key={interview.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{interview.candidateName}</p>
                      <p className="text-xs text-muted-foreground">{interview.jobTitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">{interview.scheduledAt}</p>
                      <Badge variant="outline">{interview.type}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming interviews</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
