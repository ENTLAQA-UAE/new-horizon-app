"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Users,
  Calendar,
  Gift,
  ClipboardCheck,
  ArrowRight,
  Star,
  Clock,
} from "lucide-react"

interface HiringManagerDashboardProps {
  stats: {
    candidatesToReview: number
    myInterviews: number
    pendingOfferApprovals: number
    pendingJobApprovals: number
  }
  pendingReviews?: {
    id: string
    candidateName: string
    jobTitle: string
    stage: string
    daysWaiting: number
  }[]
  upcomingInterviews?: {
    id: string
    candidateName: string
    jobTitle: string
    scheduledAt: string
    type: string
  }[]
}

export function HiringManagerDashboard({
  stats,
  pendingReviews = [],
  upcomingInterviews = [],
}: HiringManagerDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Dashboard</h2>
        <p className="text-muted-foreground">
          Review candidates and manage approvals
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={stats.candidatesToReview > 0 ? "border-blue-200 bg-blue-50 dark:bg-blue-950/20" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidates to Review</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.candidatesToReview}</div>
            <Link href="/org/candidates?filter=pending-review" className="text-xs text-primary hover:underline">
              Review now →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Interviews</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myInterviews}</div>
            <Link href="/org/interviews?filter=mine" className="text-xs text-primary hover:underline">
              View schedule →
            </Link>
          </CardContent>
        </Card>

        <Card className={stats.pendingOfferApprovals > 0 ? "border-orange-200 bg-orange-50 dark:bg-orange-950/20" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Offers</CardTitle>
            <Gift className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOfferApprovals}</div>
            <Link href="/org/offers?filter=pending" className="text-xs text-primary hover:underline">
              Approve offers →
            </Link>
          </CardContent>
        </Card>

        <Card className={stats.pendingJobApprovals > 0 ? "border-purple-200 bg-purple-50 dark:bg-purple-950/20" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Requisitions</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingJobApprovals}</div>
            <Link href="/org/jobs?filter=pending-approval" className="text-xs text-primary hover:underline">
              Approve jobs →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Pending Reviews & Upcoming Interviews */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Awaiting Your Review</CardTitle>
              <CardDescription>Candidates waiting for your feedback</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/org/candidates?filter=pending-review">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingReviews.length > 0 ? (
              <div className="space-y-4">
                {pendingReviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{review.candidateName}</p>
                      <p className="text-xs text-muted-foreground">{review.jobTitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{review.stage}</Badge>
                      {review.daysWaiting > 3 && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {review.daysWaiting}d
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Star className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No pending reviews</p>
                <p className="text-xs text-muted-foreground">You're all caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Interviews</CardTitle>
              <CardDescription>Your scheduled interviews</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/org/interviews?filter=mine">
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
              <p className="text-sm text-muted-foreground text-center py-6">
                No upcoming interviews
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
