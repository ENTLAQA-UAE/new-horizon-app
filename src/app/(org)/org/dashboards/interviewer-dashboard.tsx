// @ts-nocheck
// Note: Type instantiation is excessively deep error with Supabase typed client
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Calendar,
  CalendarDays,
  ClipboardList,
  CheckCircle,
  ChevronRight,
  AlertTriangle,
  Clock,
  Zap,
} from "lucide-react"

interface InterviewerDashboardProps {
  orgId: string
  userId: string
}

async function getInterviewerStats(orgId: string, userId: string) {
  const supabase = await createClient()

  const [
    { data: upcomingInterviews },
    { count: completedCount },
    { count: totalCount },
    { count: scorecardsSubmitted },
    { data: completedInterviews },
    { data: scorecardRecords },
  ] = await Promise.all([
    // Upcoming interviews: scheduled or confirmed, in the future, limit 5
    supabase
      .from("interviews")
      .select("id, scheduled_at, status, jobs(title)")
      .eq("interviewer_id", userId)
      .gte("scheduled_at", new Date().toISOString())
      .in("status", ["scheduled", "confirmed"])
      .order("scheduled_at", { ascending: true })
      .limit(5),

    // Completed interviews count
    supabase
      .from("interviews")
      .select("*", { count: "exact", head: true })
      .eq("interviewer_id", userId)
      .eq("status", "completed"),

    // Total interviews count
    supabase
      .from("interviews")
      .select("*", { count: "exact", head: true })
      .eq("interviewer_id", userId),

    // Scorecards submitted count
    supabase
      .from("interview_scorecards")
      .select("*", { count: "exact", head: true })
      .eq("interviewer_id", userId),

    // Completed interviews (to calculate pending scorecards)
    supabase
      .from("interviews")
      .select("id")
      .eq("interviewer_id", userId)
      .eq("status", "completed"),

    // Scorecard records (to build set of interview IDs with scorecards)
    supabase
      .from("interview_scorecards")
      .select("interview_id")
      .eq("interviewer_id", userId),
  ])

  // Calculate pending scorecards: completed interviews without a scorecard
  const scorecardInterviewIds = new Set(
    (scorecardRecords || []).map((s: any) => s.interview_id)
  )
  const pendingScorecards = (completedInterviews || []).filter(
    (interview: any) => !scorecardInterviewIds.has(interview.id)
  ).length

  return {
    upcomingInterviews: upcomingInterviews || [],
    completedCount: completedCount || 0,
    totalCount: totalCount || 0,
    scorecardsSubmitted: scorecardsSubmitted || 0,
    pendingScorecards,
  }
}

export async function InterviewerDashboard({
  orgId,
  userId,
}: InterviewerDashboardProps) {
  const stats = await getInterviewerStats(orgId, userId)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        {/* Featured Card - My Interviews */}
        <div className="col-span-12 lg:col-span-4 row-span-2">
          <div
            className="h-full rounded-3xl p-6 text-white relative overflow-hidden"
            style={{ background: "var(--brand-gradient)" }}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Calendar className="h-6 w-6" />
                </div>
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                  Interviewer
                </Badge>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <p className="text-white/70 text-sm font-medium mb-2">
                  My Interviews
                </p>
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-bold">
                    {stats.upcomingInterviews.length}
                  </span>
                  <span className="text-white/60 text-lg mb-2">upcoming</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Completed</span>
                  <span className="font-semibold">{stats.completedCount}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/70 text-sm">
                    Scorecards Submitted
                  </span>
                  <span className="font-semibold">
                    {stats.scorecardsSubmitted}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="col-span-6 lg:col-span-4">
          <div className="bento-card p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "var(--brand-gradient-subtle)" }}
              >
                <CalendarDays
                  className="h-5 w-5"
                  style={{ color: "var(--brand-primary)" }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Upcoming Interviews
            </p>
            <p className="text-3xl font-bold mt-1">
              {stats.upcomingInterviews.length}
            </p>
            <Link
              href="/org/interviews"
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
                <CheckCircle
                  className="h-5 w-5"
                  style={{ color: "var(--brand-primary)" }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Completed Interviews
            </p>
            <p className="text-3xl font-bold mt-1">{stats.completedCount}</p>
            <p className="text-sm text-muted-foreground mt-3">
              of {stats.totalCount} total
            </p>
          </div>
        </div>

        <div className="col-span-6 lg:col-span-4">
          <div className="bento-card p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "var(--brand-gradient-subtle)" }}
              >
                <ClipboardList
                  className="h-5 w-5"
                  style={{ color: "var(--brand-primary)" }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Scorecards Submitted
            </p>
            <p className="text-3xl font-bold mt-1">
              {stats.scorecardsSubmitted}
            </p>
            <Link
              href="/org/scorecards"
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
                className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  stats.pendingScorecards > 0
                    ? "bg-amber-500/10"
                    : ""
                }`}
                style={
                  stats.pendingScorecards > 0
                    ? undefined
                    : { background: "var(--brand-gradient-subtle)" }
                }
              >
                <AlertTriangle
                  className={`h-5 w-5 ${
                    stats.pendingScorecards > 0
                      ? "text-amber-500"
                      : ""
                  }`}
                  style={
                    stats.pendingScorecards > 0
                      ? undefined
                      : { color: "var(--brand-primary)" }
                  }
                />
              </div>
              {stats.pendingScorecards > 0 && (
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">
                  Action needed
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Pending Scorecards
            </p>
            <p
              className={`text-3xl font-bold mt-1 ${
                stats.pendingScorecards > 0 ? "text-amber-600" : ""
              }`}
            >
              {stats.pendingScorecards}
            </p>
            {stats.pendingScorecards > 0 ? (
              <Link
                href="/org/scorecards"
                className="inline-flex items-center gap-1 text-sm font-medium mt-3 text-amber-600 hover:gap-2 transition-all"
              >
                Submit now <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground mt-3">
                All caught up
              </p>
            )}
          </div>
        </div>

        {/* Pending Scorecards Alert */}
        {stats.pendingScorecards > 0 && (
          <div className="col-span-12">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-500/5 dark:border-amber-500/20 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-amber-800 dark:text-amber-400">
                    You have {stats.pendingScorecards} pending{" "}
                    {stats.pendingScorecards === 1
                      ? "scorecard"
                      : "scorecards"}{" "}
                    to submit
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                    Please complete your scorecards promptly so the hiring team
                    can proceed.
                  </p>
                </div>
                <Link
                  href="/org/scorecards"
                  className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 dark:text-amber-400 hover:gap-2 transition-all shrink-0"
                >
                  Go to Scorecards <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Interviews List */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bento-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold">Upcoming Interviews</h3>
                <p className="text-sm text-muted-foreground">
                  Your next scheduled interviews
                </p>
              </div>
              <Link
                href="/org/interviews"
                className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: "var(--brand-primary)" }}
              >
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {stats.upcomingInterviews.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingInterviews.map((interview: any) => {
                  const scheduledDate = new Date(interview.scheduled_at)
                  return (
                    <div
                      key={interview.id}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "var(--brand-gradient-subtle)" }}
                      >
                        <Calendar
                          className="h-5 w-5"
                          style={{ color: "var(--brand-primary)" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {interview.jobs?.title || "Untitled Position"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {scheduledDate.toLocaleDateString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            at{" "}
                            {scheduledDate.toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          interview.status === "confirmed"
                            ? "bg-green-500/10 text-green-600 border-green-200"
                            : ""
                        }
                      >
                        {interview.status}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div
                  className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: "var(--brand-gradient-subtle)" }}
                >
                  <CalendarDays
                    className="h-6 w-6"
                    style={{ color: "var(--brand-primary)" }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  No upcoming interviews
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Interviews assigned to you will appear here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bento-card p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Quick Actions</h3>
              <Zap className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="space-y-3">
              <Link
                href="/org/interviews"
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-transparent hover:shadow-md hover:bg-card transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: "var(--brand-gradient-subtle)" }}
                >
                  <CalendarDays
                    className="h-5 w-5"
                    style={{ color: "var(--brand-primary)" }}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">My Interviews</p>
                  <p className="text-xs text-muted-foreground">
                    View your interview schedule
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/org/scorecards"
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-transparent hover:shadow-md hover:bg-card transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: "var(--brand-gradient-subtle)" }}
                >
                  <ClipboardList
                    className="h-5 w-5"
                    style={{ color: "var(--brand-primary)" }}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">My Scorecards</p>
                  <p className="text-xs text-muted-foreground">
                    Submit and review scorecards
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
