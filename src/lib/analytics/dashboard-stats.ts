import { SupabaseClient } from "@supabase/supabase-js"

export interface DashboardStats {
  overview: {
    totalJobs: number
    activeJobs: number
    totalCandidates: number
    totalApplications: number
    hiredThisMonth: number
    interviewsScheduled: number
  }
  hiringFunnel: {
    stage: string
    count: number
    percentage: number
  }[]
  applicationsBySource: {
    source: string
    count: number
  }[]
  applicationsTrend: {
    date: string
    applications: number
    hired: number
  }[]
  timeToHire: {
    average: number
    byDepartment: {
      department: string
      days: number
    }[]
  }
  topPerformingJobs: {
    id: string
    title: string
    applications: number
    interviews: number
    hires: number
  }[]
  teamActivity: {
    userId: string
    userName: string
    actions: number
    interviews: number
  }[]
}

export async function getDashboardStats(
  supabase: SupabaseClient
): Promise<DashboardStats> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Fetch all data in parallel
  const [
    jobsResult,
    candidatesResult,
    applicationsResult,
    hiredResult,
    interviewsResult,
    applicationsByStageResult,
    applicationsBySourceResult,
    recentApplicationsResult,
  ] = await Promise.all([
    // Total and active jobs
    supabase.from("jobs").select("id, status", { count: "exact" }),

    // Total candidates
    supabase.from("candidates").select("id", { count: "exact" }),

    // Total applications
    supabase.from("applications").select("id", { count: "exact" }),

    // Hired this month
    supabase
      .from("applications")
      .select("id", { count: "exact" })
      .eq("status", "hired")
      .gte("updated_at", startOfMonth.toISOString()),

    // Scheduled interviews
    supabase
      .from("interviews")
      .select("id", { count: "exact" })
      .in("status", ["scheduled", "confirmed"])
      .gte("scheduled_at", now.toISOString()),

    // Applications by stage for funnel
    supabase.from("applications").select("status"),

    // Applications by source
    supabase.from("applications").select("source"),

    // Recent applications for trend
    supabase
      .from("applications")
      .select("created_at, status")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true }),
  ])

  // Calculate overview stats
  const jobs = jobsResult.data || []
  const totalJobs = jobsResult.count || 0
  const activeJobs = jobs.filter(
    (j) => j.status === "published" || j.status === "open"
  ).length

  // Calculate hiring funnel
  const stageMap = new Map<string, number>()
  const stages = ["new", "screening", "interviewing", "offered", "hired", "rejected"]
  stages.forEach((s) => stageMap.set(s, 0))

  const applications = applicationsByStageResult.data || []
  applications.forEach((app) => {
    const count = stageMap.get(app.status) || 0
    stageMap.set(app.status, count + 1)
  })

  const totalApps = applications.length || 1
  const hiringFunnel = stages.map((stage) => ({
    stage: stage.charAt(0).toUpperCase() + stage.slice(1),
    count: stageMap.get(stage) || 0,
    percentage: Math.round(((stageMap.get(stage) || 0) / totalApps) * 100),
  }))

  // Calculate applications by source
  const sourceMap = new Map<string, number>()
  const sources = applicationsBySourceResult.data || []
  sources.forEach((app) => {
    const source = app.source || "direct"
    sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
  })

  const applicationsBySource = Array.from(sourceMap.entries())
    .map(([source, count]) => ({
      source: formatSourceName(source),
      count,
    }))
    .sort((a, b) => b.count - a.count)

  // Calculate applications trend (last 30 days)
  const trendMap = new Map<string, { applications: number; hired: number }>()
  const recentApps = recentApplicationsResult.data || []

  // Initialize all dates
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateKey = date.toISOString().split("T")[0]
    trendMap.set(dateKey, { applications: 0, hired: 0 })
  }

  recentApps.forEach((app) => {
    const dateKey = app.created_at.split("T")[0]
    const current = trendMap.get(dateKey) || { applications: 0, hired: 0 }
    current.applications++
    if (app.status === "hired") current.hired++
    trendMap.set(dateKey, current)
  })

  const applicationsTrend = Array.from(trendMap.entries())
    .map(([date, data]) => ({
      date,
      ...data,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Fetch top performing jobs
  const { data: topJobs } = await supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      applications:applications(count),
      interviews:interviews(count)
    `
    )
    .eq("status", "published")
    .limit(5)

  const topPerformingJobs = (topJobs || []).map((job) => ({
    id: job.id,
    title: job.title,
    applications: (job.applications as unknown as { count: number }[])?.[0]?.count || 0,
    interviews: (job.interviews as unknown as { count: number }[])?.[0]?.count || 0,
    hires: 0, // Would need additional query
  }))

  return {
    overview: {
      totalJobs,
      activeJobs,
      totalCandidates: candidatesResult.count || 0,
      totalApplications: applicationsResult.count || 0,
      hiredThisMonth: hiredResult.count || 0,
      interviewsScheduled: interviewsResult.count || 0,
    },
    hiringFunnel,
    applicationsBySource,
    applicationsTrend,
    timeToHire: {
      average: 21, // Placeholder - would need hired_at tracking
      byDepartment: [],
    },
    topPerformingJobs,
    teamActivity: [],
  }
}

function formatSourceName(source: string): string {
  const names: Record<string, string> = {
    direct: "Direct Application",
    linkedin: "LinkedIn",
    indeed: "Indeed",
    referral: "Employee Referral",
    agency: "Recruitment Agency",
    career_fair: "Career Fair",
    website: "Company Website",
    other: "Other",
  }
  return names[source] || source
}
