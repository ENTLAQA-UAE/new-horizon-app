import { SupabaseClient } from "@supabase/supabase-js"

export interface RecentInterview {
  id: string
  scheduled_at: string
  status: string
  application_id: string
  title: string
  has_scorecard: boolean
}

export interface InterviewerStats {
  // Schedule
  upcomingInterviews: number
  completedInterviews: number
  totalInterviews: number

  // Scorecards
  scorecardsSubmitted: number
  scorecardsPending: number
  scorecardCompletionRate: number

  // My Activity
  recentInterviews: RecentInterview[]
}

export async function getInterviewerStats(
  supabase: SupabaseClient,
  userId: string
): Promise<InterviewerStats> {
  const now = new Date().toISOString()

  // Fetch all data in parallel
  const [
    upcomingResult,
    completedResult,
    allInterviewsResult,
    scorecardsResult,
    recentResult,
  ] = await Promise.all([
    // Upcoming interviews (scheduled or confirmed, in the future)
    supabase
      .from("interviews")
      .select("id", { count: "exact" })
      .eq("interviewer_id", userId)
      .in("status", ["scheduled", "confirmed"])
      .gte("scheduled_at", now),

    // Completed interviews
    supabase
      .from("interviews")
      .select("id", { count: "exact" })
      .eq("interviewer_id", userId)
      .eq("status", "completed"),

    // All interviews for this interviewer (to calculate pending scorecards)
    supabase
      .from("interviews")
      .select("id, status")
      .eq("interviewer_id", userId),

    // Scorecards submitted by this interviewer
    supabase
      .from("interview_scorecards")
      .select("id, interview_id", { count: "exact" })
      .eq("interviewer_id", userId),

    // Recent interviews (last 10) with details
    supabase
      .from("interviews")
      .select("id, scheduled_at, status, application_id, title")
      .eq("interviewer_id", userId)
      .order("scheduled_at", { ascending: false })
      .limit(10),
  ])

  const upcomingInterviews = upcomingResult.count || 0
  const completedInterviews = completedResult.count || 0

  const allInterviews = allInterviewsResult.data || []
  const totalInterviews = allInterviews.length

  // Build a set of interview IDs that have scorecards
  const scorecards = scorecardsResult.data || []
  const scorecardsSubmitted = scorecardsResult.count || 0
  const scorecardInterviewIds = new Set(scorecards.map((s) => s.interview_id))

  // Pending scorecards = completed interviews without a scorecard
  const completedInterviewIds = allInterviews
    .filter((i) => i.status === "completed")
    .map((i) => i.id)

  const scorecardsPending = completedInterviewIds.filter(
    (id) => !scorecardInterviewIds.has(id)
  ).length

  // Completion rate: submitted / (submitted + pending)
  const totalExpected = scorecardsSubmitted + scorecardsPending
  const scorecardCompletionRate =
    totalExpected > 0 ? Math.round((scorecardsSubmitted / totalExpected) * 100) : 0

  // Build recent interviews list with scorecard status
  const recentInterviews: RecentInterview[] = (recentResult.data || []).map(
    (interview) => ({
      id: interview.id,
      scheduled_at: interview.scheduled_at,
      status: interview.status || "scheduled",
      application_id: interview.application_id,
      title: interview.title || "Interview",
      has_scorecard: scorecardInterviewIds.has(interview.id),
    })
  )

  return {
    upcomingInterviews,
    completedInterviews,
    totalInterviews,
    scorecardsSubmitted,
    scorecardsPending,
    scorecardCompletionRate,
    recentInterviews,
  }
}
