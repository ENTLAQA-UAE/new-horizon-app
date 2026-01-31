// @ts-nocheck
// Note: Type instantiation is excessively deep error with Supabase typed client
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Briefcase,
  UserSearch,
  CheckCircle,
  Calendar,
  Target,
  ChevronRight,
} from "lucide-react"

interface HrManagerDashboardProps {
  orgId: string
}

async function getHrManagerStats(orgId: string) {
  const supabase = await createClient()

  const [
    jobsResult,
    candidatesResult,
    applicationsResult,
    hiredResult,
    interviewsResult,
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "open"),

    supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),

    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),

    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "hired"),

    supabase
      .from("interviews")
      .select("id, scheduled_at")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(3),
  ])

  return {
    jobs: jobsResult.count || 0,
    candidates: candidatesResult.count || 0,
    applications: applicationsResult.count || 0,
    hired: hiredResult.count || 0,
    interviews: interviewsResult.data || [],
  }
}

export async function HrManagerDashboard({ orgId }: HrManagerDashboardProps) {
  const stats = await getHrManagerStats(orgId)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        {/* Featured Stat - Large Card */}
        <div className="col-span-12 lg:col-span-4 row-span-2">
          <div
            className="h-full rounded-3xl p-6 text-white relative overflow-hidden"
            style={{ background: "var(--brand-gradient)" }}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Target className="h-6 w-6" />
                </div>
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                  This Month
                </Badge>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <p className="text-white/70 text-sm font-medium mb-2">Total Applications</p>
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-bold">{stats.applications}</span>
                </div>
                <p className="text-white/60 text-sm mt-2">Across all jobs</p>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Active Jobs</span>
                  <span className="font-semibold">{stats.jobs}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/70 text-sm">Candidates</span>
                  <span className="font-semibold">{stats.candidates}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards - Row 1 */}
        <div className="col-span-6 lg:col-span-4">
          <div className="bento-card p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "var(--brand-gradient-subtle)" }}
              >
                <Briefcase className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Active Jobs</p>
            <p className="text-3xl font-bold mt-1">{stats.jobs}</p>
            <Link
              href="/org/jobs"
              className="inline-flex items-center gap-1 text-sm font-medium mt-3 hover:gap-2 transition-all"
              style={{ color: "var(--brand-primary)" }}
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="col-span-6 lg:col-span-4">
          <div className="bento-card p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "var(--brand-gradient-subtle)" }}
              >
                <UserSearch className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Candidates</p>
            <p className="text-3xl font-bold mt-1">{stats.candidates}</p>
            <Link
              href="/org/candidates"
              className="inline-flex items-center gap-1 text-sm font-medium mt-3 hover:gap-2 transition-all"
              style={{ color: "var(--brand-primary)" }}
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Stat Cards - Row 2 */}
        <div className="col-span-6 lg:col-span-4">
          <div className="bento-card p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "var(--brand-gradient-subtle)" }}
              >
                <Calendar className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
              </div>
              <Badge variant="secondary" className="text-xs">Today</Badge>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Interviews</p>
            <p className="text-3xl font-bold mt-1">{stats.interviews.length}</p>
            <Link
              href="/org/interviews"
              className="inline-flex items-center gap-1 text-sm font-medium mt-3 hover:gap-2 transition-all"
              style={{ color: "var(--brand-primary)" }}
            >
              Schedule <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="col-span-6 lg:col-span-4">
          <div className="bento-card p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "var(--brand-gradient-subtle)" }}
              >
                <CheckCircle className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Hired</p>
            <p className="text-3xl font-bold mt-1">{stats.hired}</p>
            <p className="text-sm text-muted-foreground mt-3">Total placements</p>
          </div>
        </div>

      </div>
    </div>
  )
}
