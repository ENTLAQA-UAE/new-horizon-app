import { SupabaseClient } from "@supabase/supabase-js"

export interface RecruiterMonthlyTrend {
  month: string
  applications: number
  interviews: number
  hires: number
}

export interface RecruiterSourceBreakdown {
  source: string
  count: number
  hires: number
  conversionRate: number
}

export interface RecruiterJobPerformance {
  jobId: string
  title: string
  status: string
  applications: number
  interviews: number
  hires: number
  conversionRate: number
  avgTimeToHire: number
}

export interface RecruiterConversionRates {
  applicationToScreening: number
  screeningToInterview: number
  interviewToOffer: number
  offerToHire: number
  overallConversion: number
}

export interface RecruiterSparklineData {
  applications: number[]
  interviews: number[]
  hires: number[]
  pipeline: number[]
}

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
  monthlyTrend: RecruiterMonthlyTrend[]
  sourceBreakdown: RecruiterSourceBreakdown[]
  jobPerformance: RecruiterJobPerformance[]
  conversionRates: RecruiterConversionRates
  sparklineData: RecruiterSparklineData
  previousMonthActivity: {
    applicationsLastMonth: number
    interviewsLastMonth: number
    hiresLastMonth: number
  }
}

export async function getRecruiterStats(
  supabase: SupabaseClient,
  userId: string,
  orgId: string
): Promise<RecruiterStats> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  // Fetch all data in parallel — every query is scoped to the current org
  const [
    jobsResult,
    applicationsResult,
    interviewsThisMonthResult,
    offersThisMonthResult,
    hiredApplicationsResult,
    recentApplicationsResult,
    applicationsWithSourceResult,
    interviewsLastMonthResult,
    allInterviewsResult,
  ] = await Promise.all([
    // All jobs the recruiter can see (org-scoped)
    supabase
      .from("jobs")
      .select("id, status, title")
      .eq("org_id", orgId),

    // All applications the recruiter can see (org-scoped)
    supabase
      .from("applications")
      .select("id, status, candidate_id, job_id, created_at, updated_at, hired_at")
      .eq("org_id", orgId),

    // Interviews scheduled this month (org-scoped)
    supabase
      .from("interviews")
      .select("id", { count: "exact" })
      .eq("org_id", orgId)
      .gte("scheduled_at", startOfMonth.toISOString())
      .in("status", ["scheduled", "confirmed", "completed"]),

    // Offers created this month (org-scoped)
    supabase
      .from("offers")
      .select("id", { count: "exact" })
      .eq("org_id", orgId)
      .gte("created_at", startOfMonth.toISOString()),

    // All hired applications (org-scoped, for avg time to hire calculation)
    supabase
      .from("applications")
      .select("id, created_at, updated_at, hired_at")
      .eq("org_id", orgId)
      .eq("status", "hired"),

    // Recent 10 applications with candidate and job info (org-scoped)
    supabase
      .from("applications")
      .select("id, status, candidate_id, job_id, created_at, candidates(first_name, last_name), jobs(title)")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10),

    // Applications with source for source breakdown (org-scoped)
    supabase
      .from("applications")
      .select("id, status, source, job_id, created_at, hired_at")
      .eq("org_id", orgId),

    // Interviews last month (org-scoped)
    supabase
      .from("interviews")
      .select("id", { count: "exact" })
      .eq("org_id", orgId)
      .gte("scheduled_at", startOfLastMonth.toISOString())
      .lt("scheduled_at", startOfMonth.toISOString())
      .in("status", ["scheduled", "confirmed", "completed"]),

    // All interviews for monthly trend (org-scoped, last 6 months)
    supabase
      .from("interviews")
      .select("id, scheduled_at")
      .eq("org_id", orgId)
      .gte("scheduled_at", sixMonthsAgo.toISOString())
      .in("status", ["scheduled", "confirmed", "completed"]),
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

  // --- Monthly Trend (last 6 months) ---
  const allInterviews = allInterviewsResult.data || []
  const monthlyTrend: RecruiterMonthlyTrend[] = []
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`

    const monthApps = applications.filter(
      (a) => a.created_at && new Date(a.created_at) >= monthStart && new Date(a.created_at) < monthEnd
    ).length

    const monthInterviews = allInterviews.filter(
      (iv) => iv.scheduled_at && new Date(iv.scheduled_at) >= monthStart && new Date(iv.scheduled_at) < monthEnd
    ).length

    const monthHires = hiredApps.filter((a) => {
      const hireDate = a.hired_at || a.updated_at
      return hireDate && new Date(hireDate) >= monthStart && new Date(hireDate) < monthEnd
    }).length

    monthlyTrend.push({ month: monthKey, applications: monthApps, interviews: monthInterviews, hires: monthHires })
  }

  // --- Source Breakdown ---
  const appsWithSource = applicationsWithSourceResult.data || []
  const sourceMap = new Map<string, { count: number; hires: number }>()
  appsWithSource.forEach((app) => {
    const source = app.source || "unknown"
    const entry = sourceMap.get(source) || { count: 0, hires: 0 }
    entry.count++
    if (app.status === "hired") entry.hires++
    sourceMap.set(source, entry)
  })
  const sourceBreakdown: RecruiterSourceBreakdown[] = Array.from(sourceMap.entries())
    .map(([source, data]) => ({
      source,
      count: data.count,
      hires: data.hires,
      conversionRate: data.count > 0 ? Math.round((data.hires / data.count) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  // --- Job Performance ---
  const jobAppMap = new Map<string, { title: string; status: string; applications: number; hires: number; totalDays: number; validHires: number }>()
  jobs.forEach((j) => {
    jobAppMap.set(j.id, { title: j.title, status: j.status, applications: 0, hires: 0, totalDays: 0, validHires: 0 })
  })
  applications.forEach((app) => {
    const entry = jobAppMap.get(app.job_id)
    if (entry) {
      entry.applications++
      if (app.status === "hired") {
        entry.hires++
        const startDate = app.created_at
        const endDate = app.hired_at || app.updated_at
        if (startDate && endDate) {
          const days = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
          if (days >= 0 && days < 365) {
            entry.totalDays += days
            entry.validHires++
          }
        }
      }
    }
  })

  // Count interviews per job from recent applications data
  const interviewCountByJob = new Map<string, number>()
  appsWithSource.forEach((app) => {
    if (app.status === "interviewing" || app.status === "offered" || app.status === "hired") {
      interviewCountByJob.set(app.job_id, (interviewCountByJob.get(app.job_id) || 0) + 1)
    }
  })

  const jobPerformance: RecruiterJobPerformance[] = Array.from(jobAppMap.entries())
    .filter(([, data]) => data.applications > 0)
    .map(([jobId, data]) => ({
      jobId,
      title: data.title,
      status: data.status,
      applications: data.applications,
      interviews: interviewCountByJob.get(jobId) || 0,
      hires: data.hires,
      conversionRate: data.applications > 0 ? Math.round((data.hires / data.applications) * 100) : 0,
      avgTimeToHire: data.validHires > 0 ? Math.round(data.totalDays / data.validHires) : 0,
    }))
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 8)

  // --- Conversion Rates ---
  const totalApps = applications.length
  const screeningCount = statusCounts["screening"] + statusCounts["interviewing"] + statusCounts["offered"] + statusCounts["hired"]
  const interviewCount = statusCounts["interviewing"] + statusCounts["offered"] + statusCounts["hired"]
  const offerCount = statusCounts["offered"] + statusCounts["hired"]
  const hireCount = statusCounts["hired"]

  const conversionRates: RecruiterConversionRates = {
    applicationToScreening: totalApps > 0 ? Math.round((screeningCount / totalApps) * 100) : 0,
    screeningToInterview: screeningCount > 0 ? Math.round((interviewCount / screeningCount) * 100) : 0,
    interviewToOffer: interviewCount > 0 ? Math.round((offerCount / interviewCount) * 100) : 0,
    offerToHire: offerCount > 0 ? Math.round((hireCount / offerCount) * 100) : 0,
    overallConversion: totalApps > 0 ? Math.round((hireCount / totalApps) * 100) : 0,
  }

  // --- Sparkline Data (last 6 months) ---
  const sparklineData: RecruiterSparklineData = {
    applications: monthlyTrend.map((m) => m.applications),
    interviews: monthlyTrend.map((m) => m.interviews),
    hires: monthlyTrend.map((m) => m.hires),
    pipeline: monthlyTrend.map((m) => m.applications - m.hires),
  }

  // --- Previous Month Activity ---
  const applicationsLastMonth = applications.filter(
    (app) => app.created_at && new Date(app.created_at) >= startOfLastMonth && new Date(app.created_at) < startOfMonth
  ).length
  const interviewsLastMonth = interviewsLastMonthResult.count || 0
  const hiresLastMonth = hiredApps.filter((a) => {
    const hireDate = a.hired_at || a.updated_at
    return hireDate && new Date(hireDate) >= startOfLastMonth && new Date(hireDate) < startOfMonth
  }).length

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
    monthlyTrend,
    sourceBreakdown,
    jobPerformance,
    conversionRates,
    sparklineData,
    previousMonthActivity: {
      applicationsLastMonth,
      interviewsLastMonth,
      hiresLastMonth,
    },
  }
}
