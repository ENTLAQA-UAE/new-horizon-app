import { SupabaseClient } from "@supabase/supabase-js"

export interface RecruiterStats {
  myJobs: {
    totalJobs: number
    activeJobs: number
  }
  myPipeline: {
    new: number
    screening: number
    interviewing: number
    offered: number
    hired: number
    rejected: number
    total: number
  }
  myActivity: {
    applicationsThisMonth: number
    interviewsThisMonth: number
    offersThisMonth: number
  }
  myPerformance: {
    totalHires: number
    avgTimeToHire: number
  }
  recentApplications: {
    id: string
    status: string
    candidateName: string
    jobTitle: string
    appliedAt: string
  }[]
}

export async function getRecruiterStats(
  supabase: SupabaseClient,
  userId: string
): Promise<RecruiterStats> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Fetch all data in parallel
  const [
    jobsResult,
    applicationsResult,
    interviewsThisMonthResult,
    offersThisMonthResult,
    hiredApplicationsResult,
    recentApplicationsResult,
  ] = await Promise.all([
    // All jobs the recruiter can see
    supabase
      .from("jobs")
      .select("id, status, title"),

    // All applications the recruiter can see (pipeline + activity)
    supabase
      .from("applications")
      .select("id, status, candidate_id, job_id, created_at, updated_at, hired_at"),

    // Interviews scheduled this month
    supabase
      .from("interviews")
      .select("id", { count: "exact" })
      .gte("scheduled_at", startOfMonth.toISOString())
      .in("status", ["scheduled", "confirmed", "completed"]),

    // Offers created this month
    supabase
      .from("offers")
      .select("id", { count: "exact" })
      .gte("created_at", startOfMonth.toISOString()),

    // All hired applications (for avg time to hire calculation)
    supabase
      .from("applications")
      .select("id, created_at, updated_at, hired_at")
      .eq("status", "hired"),

    // Recent 10 applications with candidate and job info
    supabase
      .from("applications")
      .select("id, status, candidate_id, job_id, created_at, candidates(first_name, last_name), jobs(title)")
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  // --- My Jobs ---
  const jobs = jobsResult.data || []
  const totalJobs = jobs.length
  const activeJobs = jobs.filter(
    (j) => j.status === "published" || j.status === "open"
  ).length

  // --- My Pipeline ---
  const applications = applicationsResult.data || []
  const pipelineStatuses = ["new", "screening", "interviewing", "offered", "hired", "rejected"] as const
  const statusCounts: Record<string, number> = {}
  pipelineStatuses.forEach((s) => (statusCounts[s] = 0))

  applications.forEach((app) => {
    if (statusCounts[app.status] !== undefined) {
      statusCounts[app.status]++
    }
  })

  // --- My Activity (this month) ---
  const applicationsThisMonth = applications.filter(
    (app) => app.created_at && new Date(app.created_at) >= startOfMonth
  ).length

  const interviewsThisMonth = interviewsThisMonthResult.count || 0
  const offersThisMonth = offersThisMonthResult.count || 0

  // --- My Performance ---
  const hiredApps = hiredApplicationsResult.data || []
  const totalHires = hiredApps.length

  let totalDaysToHire = 0
  let validHireCount = 0
  hiredApps.forEach((app) => {
    const startDate = app.created_at
    const endDate = app.hired_at || app.updated_at
    if (startDate && endDate) {
      const days = Math.round(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
      if (days >= 0 && days < 365) {
        totalDaysToHire += days
        validHireCount++
      }
    }
  })
  const avgTimeToHire =
    validHireCount > 0 ? Math.round(totalDaysToHire / validHireCount) : 0

  // --- Recent Applications ---
  const recentRaw = recentApplicationsResult.data || []
  const recentApplications = recentRaw.map((app: any) => {
    const candidate = app.candidates as any
    const job = app.jobs as any
    const firstName = candidate?.first_name || ""
    const lastName = candidate?.last_name || ""
    const candidateName =
      [firstName, lastName].filter(Boolean).join(" ") || "Unknown Candidate"
    const jobTitle = job?.title || "Unknown Job"

    return {
      id: app.id,
      status: app.status,
      candidateName,
      jobTitle,
      appliedAt: app.created_at || "",
    }
  })

  return {
    myJobs: {
      totalJobs,
      activeJobs,
    },
    myPipeline: {
      new: statusCounts["new"],
      screening: statusCounts["screening"],
      interviewing: statusCounts["interviewing"],
      offered: statusCounts["offered"],
      hired: statusCounts["hired"],
      rejected: statusCounts["rejected"],
      total: applications.length,
    },
    myActivity: {
      applicationsThisMonth,
      interviewsThisMonth,
      offersThisMonth,
    },
    myPerformance: {
      totalHires,
      avgTimeToHire,
    },
    recentApplications,
  }
}
