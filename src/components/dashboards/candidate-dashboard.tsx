"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  FileText,
  Calendar,
  Gift,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Search,
} from "lucide-react"

interface CandidateDashboardProps {
  stats: {
    totalApplications: number
    inProgress: number
    interviews: number
    offers: number
  }
  applications?: {
    id: string
    jobTitle: string
    companyName: string
    status: string
    appliedAt: string
    currentStage: string
  }[]
  upcomingInterviews?: {
    id: string
    jobTitle: string
    companyName: string
    scheduledAt: string
    type: string
  }[]
}

export function CandidateDashboard({
  stats,
  applications = [],
  upcomingInterviews = [],
}: CandidateDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Dashboard</h2>
          <p className="text-muted-foreground">
            Track your job applications and interviews
          </p>
        </div>
        <Button asChild>
          <Link href="/careers">
            <Search className="mr-2 h-4 w-4" />
            Find Jobs
          </Link>
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <Link href="/portal/applications" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Active applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interviews}</div>
            <Link href="/portal/interviews" className="text-xs text-primary hover:underline">
              View schedule →
            </Link>
          </CardContent>
        </Card>

        <Card className={stats.offers > 0 ? "border-green-200 bg-green-50 dark:bg-green-950/20" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offers</CardTitle>
            <Gift className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.offers}</div>
            {stats.offers > 0 && (
              <Link href="/portal/offers" className="text-xs text-primary hover:underline">
                View offers →
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Applications & Interviews */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Applications</CardTitle>
              <CardDescription>Track your application status</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/portal/applications">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {applications.length > 0 ? (
              <div className="space-y-4">
                {applications.slice(0, 5).map((app) => (
                  <div key={app.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{app.jobTitle}</p>
                      <p className="text-xs text-muted-foreground">{app.companyName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {app.status === "rejected" ? (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Rejected
                        </Badge>
                      ) : app.status === "hired" ? (
                        <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Hired
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{app.currentStage}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No applications yet</p>
                <Button variant="link" asChild>
                  <Link href="/careers">Start applying for jobs</Link>
                </Button>
              </div>
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
              <Link href="/portal/interviews">
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
                      <p className="text-sm font-medium">{interview.jobTitle}</p>
                      <p className="text-xs text-muted-foreground">{interview.companyName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">{interview.scheduledAt}</p>
                      <Badge variant="outline">{interview.type}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming interviews</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tips for Success</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Keep your profile and resume up to date</li>
            <li>• Respond to interview invitations promptly</li>
            <li>• Prepare for interviews by researching the company</li>
            <li>• Follow up after interviews with a thank you note</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
