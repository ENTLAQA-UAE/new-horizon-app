import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  Users,
  UserSearch,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  Calendar
} from "lucide-react"

async function getOrgStats() {
  const supabase = await createClient()

  // Get jobs count
  const { count: jobsCount } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })

  // Get candidates count
  const { count: candidatesCount } = await supabase
    .from("candidates")
    .select("*", { count: "exact", head: true })

  // Get applications count
  const { count: applicationsCount } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })

  // Get recent jobs
  const { data: recentJobs } = await supabase
    .from("jobs")
    .select("id, title, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5)

  return {
    jobs: jobsCount || 0,
    candidates: candidatesCount || 0,
    applications: applicationsCount || 0,
    recentJobs: recentJobs || [],
  }
}

export default async function OrgDashboardPage() {
  const stats = await getOrgStats()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your recruitment activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.jobs}</div>
            <p className="text-xs text-muted-foreground">Open positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <UserSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.candidates}</div>
            <p className="text-xs text-muted-foreground">In talent pool</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.applications}</div>
            <p className="text-xs text-muted-foreground">Total received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time to Hire</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">21 days</div>
            <p className="text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>Your latest job postings</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentJobs.length > 0 ? (
              <div className="space-y-4">
                {stats.recentJobs.map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Posted {new Date(job.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={job.status === "published" ? "default" : "secondary"}>
                      {job.status || "draft"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No jobs posted yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/org/jobs"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted transition-colors"
              >
                <Briefcase className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Post a Job</span>
              </a>
              <a
                href="/org/candidates"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted transition-colors"
              >
                <UserSearch className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Add Candidate</span>
              </a>
              <a
                href="/org/team"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted transition-colors"
              >
                <Users className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Invite Team</span>
              </a>
              <a
                href="/org/settings"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted transition-colors"
              >
                <Calendar className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Schedule Interview</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates on your hiring process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">System ready</p>
                <p className="text-xs text-muted-foreground">
                  Your organization is set up and ready to start hiring
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Getting started</p>
                <p className="text-xs text-muted-foreground">
                  Post your first job to start receiving applications
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
