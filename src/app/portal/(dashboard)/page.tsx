// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Calendar,
  Gift,
  ArrowRight,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  Briefcase,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Application {
  id: string
  status: string
  applied_at: string
  jobs: {
    id: string
    title: string
    organizations: {
      name: string
      logo_url: string | null
    }
  }
}

interface Interview {
  id: string
  title: string
  scheduled_at: string
  interview_type: string
  applications: {
    jobs: {
      title: string
    }
  }
}

interface Offer {
  id: string
  status: string
  job_title: string
  salary_amount: number
  salary_currency: string
  created_at: string
}

// Status config with brand-aware colors for primary stages
const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  applied: { label: "Applied", color: "bg-[var(--brand-primary,#3b82f6)]/10 text-[var(--brand-primary,#3b82f6)]", icon: Clock },
  screening: { label: "Screening", color: "bg-[var(--brand-secondary,#8b5cf6)]/10 text-[var(--brand-secondary,#8b5cf6)]", icon: AlertCircle },
  interview: { label: "Interview", color: "bg-amber-100 text-amber-700", icon: Calendar },
  offer: { label: "Offer", color: "bg-emerald-100 text-emerald-700", icon: Gift },
  hired: { label: "Hired", color: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "Not Selected", color: "bg-red-100 text-red-700", icon: XCircle },
  withdrawn: { label: "Withdrawn", color: "bg-gray-100 text-gray-700", icon: XCircle },
}

export default function CandidateDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([])
  const [pendingOffers, setPendingOffers] = useState<Offer[]>([])
  const [candidateId, setCandidateId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Get candidate ID
      const { data: candidate } = await supabase
        .from("candidates")
        .select("id")
        .eq("email", user.email)
        .single()

      if (!candidate) return
      setCandidateId(candidate.id)

      // Fetch recent applications
      const { data: apps } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          applied_at,
          jobs (
            id,
            title,
            organizations:org_id (
              name,
              logo_url
            )
          )
        `)
        .eq("candidate_id", candidate.id)
        .order("applied_at", { ascending: false })
        .limit(5)

      setApplications(apps || [])

      // Fetch upcoming interviews
      const { data: interviews } = await supabase
        .from("interviews")
        .select(`
          id,
          title,
          scheduled_at,
          interview_type,
          applications (
            jobs (
              title
            )
          )
        `)
        .eq("applications.candidate_id", candidate.id)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(3)

      setUpcomingInterviews(interviews || [])

      // Fetch pending offers
      const { data: offers } = await supabase
        .from("offers")
        .select(`
          id,
          status,
          job_title,
          salary_amount,
          salary_currency,
          created_at
        `)
        .eq("applications.candidate_id", candidate.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(3)

      setPendingOffers(offers || [])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const stats = {
    total: applications.length,
    active: applications.filter(a => !["rejected", "withdrawn", "hired"].includes(a.status)).length,
    interviews: upcomingInterviews.length,
    offers: pendingOffers.length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
        <p className="text-muted-foreground">
          Track your job applications, interviews, and offers
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Interviews</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interviews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Offers</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.offers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Your latest job applications</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/portal/applications">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No applications yet</p>
              <p className="text-sm">Start applying to jobs to see them here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const status = statusConfig[app.status] || statusConfig.applied
                const StatusIcon = status.icon
                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: "var(--brand-gradient-subtle, linear-gradient(135deg, #6366f115 0%, #8b5cf615 100%))" }}
                      >
                        <Building2 className="h-5 w-5" style={{ color: "var(--brand-primary, #6366f1)" }} />
                      </div>
                      <div>
                        <p className="font-medium">{app.jobs?.title || "Position"}</p>
                        <p className="text-sm text-muted-foreground">
                          {app.jobs?.organizations?.name || "Company"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge className={status.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {app.applied_at
                            ? formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })
                            : "Recently"}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Interviews */}
      {upcomingInterviews.length > 0 && (
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
            <div className="space-y-4">
              {upcomingInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">{interview.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {interview.applications?.jobs?.title || "Position"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {new Date(interview.scheduled_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(interview.scheduled_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Offers */}
      {pendingOffers.length > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Gift className="h-5 w-5" />
              You have pending offers!
            </CardTitle>
            <CardDescription>Review and respond to your job offers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-white"
                >
                  <div>
                    <p className="font-medium">{offer.job_title}</p>
                    <p className="text-sm text-muted-foreground">
                      {offer.salary_currency} {offer.salary_amount.toLocaleString()} / year
                    </p>
                  </div>
                  <Button asChild>
                    <Link href={`/portal/offers/${offer.id}`}>
                      View Offer
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
