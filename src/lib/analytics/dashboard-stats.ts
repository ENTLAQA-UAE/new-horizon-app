import { SupabaseClient } from "@supabase/supabase-js"

export interface DashboardStats {
  overview: {
    totalJobs: number
    activeJobs: number
    totalCandidates: number
    totalApplications: number
    hiredThisMonth: number
    interviewsScheduled: number
    offerAcceptanceRate: number
    avgTimeToHire: number
  }
  hiringFunnel: {
    stage: string
    count: number
    percentage: number
  }[]
  applicationsBySource: {
    source: string
    count: number
    interviews: number
    hires: number
    conversionRate: number
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
      hires: number
    }[]
    byJob: {
      jobTitle: string
      days: number
      hires: number
    }[]
  }
  topPerformingJobs: {
    id: string
    title: string
    applications: number
    interviews: number
    hires: number
    conversionRate: number
  }[]
  teamActivity: {
    userId: string
    userName: string
    userEmail: string
    applicationsReviewed: number
    interviewsConducted: number
    offersExtended: number
    hires: number
  }[]
  pipelineVelocity: {
    stage: string
    avgDays: number
    candidates: number
  }[]
  periodComparison: {
    metric: string
    current: number
    previous: number
    change: number
    changePercent: number
  }[]
  departmentMetrics: {
    department: string
    openPositions: number
    applications: number
    interviews: number
    hires: number
    avgTimeToFill: number
  }[]
}

export async function getDashboardStats(
  supabase: SupabaseClient
): Promise<DashboardStats> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

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
    offersResult,
    departmentsResult,
    interviewersResult,
    previousPeriodAppsResult,
    previousPeriodHiredResult,
  ] = await Promise.all([
    // Total and active jobs
    supabase.from("jobs").select("id, status, department_id, title, created_at", { count: "exact" }),

    // Total candidates
    supabase.from("candidates").select("id", { count: "exact" }),

    // Total applications with details
    supabase.from("applications").select("id, status, source, job_id, created_at, updated_at", { count: "exact" }),

    // Hired this month
    supabase
      .from("applications")
      .select("id, job_id, created_at, updated_at", { count: "exact" })
      .eq("status", "hired")
      .gte("updated_at", startOfMonth.toISOString()),

    // Scheduled interviews with interviewer info
    supabase
      .from("interviews")
      .select("id, interviewer_id, status, scheduled_at, application_id")
      .in("status", ["scheduled", "confirmed", "completed"]),

    // Applications by stage for funnel
    supabase.from("applications").select("status, source, job_id, created_at, updated_at"),

    // Applications by source with details
    supabase.from("applications").select("source, status, job_id"),

    // Recent applications for trend
    supabase
      .from("applications")
      .select("created_at, status")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true }),

    // Offers data
    supabase
      .from("applications")
      .select("id, status")
      .in("status", ["offered", "hired", "rejected"]),

    // Departments
    supabase.from("departments").select("id, name"),

    // Get interviewers' profiles
    supabase.from("profiles").select("id, full_name, email"),

    // Previous period applications (for comparison)
    supabase
      .from("applications")
      .select("id", { count: "exact" })
      .gte("created_at", sixtyDaysAgo.toISOString())
      .lt("created_at", thirtyDaysAgo.toISOString()),

    // Previous period hired
    supabase
      .from("applications")
      .select("id", { count: "exact" })
      .eq("status", "hired")
      .gte("updated_at", startOfLastMonth.toISOString())
      .lt("updated_at", startOfMonth.toISOString()),
  ])

  // Calculate overview stats
  const jobs = jobsResult.data || []
  const totalJobs = jobsResult.count || 0
  const activeJobs = jobs.filter(
    (j) => j.status === "published" || j.status === "open"
  ).length

  const allApplications = applicationsResult.data || []
  const departments = departmentsResult.data || []
  const profiles = interviewersResult.data || []
  const interviews = interviewsResult.data || []
  const offers = offersResult.data || []
  const hiredApps = hiredResult.data || []

  // Calculate offer acceptance rate
  const totalOffers = offers.filter(o => o.status === "offered" || o.status === "hired").length
  const acceptedOffers = offers.filter(o => o.status === "hired").length
  const offerAcceptanceRate = totalOffers > 0 ? Math.round((acceptedOffers / totalOffers) * 100) : 0

  // Calculate average time to hire (days from application to hired)
  let totalTimeToHire = 0
  let hiredCount = 0
  hiredApps.forEach(app => {
    if (app.created_at && app.updated_at) {
      const created = new Date(app.created_at).getTime()
      const hired = new Date(app.updated_at).getTime()
      const days = Math.round((hired - created) / (1000 * 60 * 60 * 24))
      if (days >= 0 && days < 365) {
        totalTimeToHire += days
        hiredCount++
      }
    }
  })
  const avgTimeToHire = hiredCount > 0 ? Math.round(totalTimeToHire / hiredCount) : 21

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

  // Calculate applications by source with conversion metrics
  const sourceStats = new Map<string, { count: number; interviews: number; hires: number }>()
  const sourceApps = applicationsBySourceResult.data || []

  sourceApps.forEach((app) => {
    const source = app.source || "direct"
    const current = sourceStats.get(source) || { count: 0, interviews: 0, hires: 0 }
    current.count++
    if (app.status === "interviewing" || app.status === "offered" || app.status === "hired") {
      current.interviews++
    }
    if (app.status === "hired") {
      current.hires++
    }
    sourceStats.set(source, current)
  })

  const applicationsBySource = Array.from(sourceStats.entries())
    .map(([source, stats]) => ({
      source: formatSourceName(source),
      count: stats.count,
      interviews: stats.interviews,
      hires: stats.hires,
      conversionRate: stats.count > 0 ? Math.round((stats.hires / stats.count) * 100) : 0,
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

  // Calculate time to hire by department
  const deptHireStats = new Map<string, { totalDays: number; count: number }>()
  const jobDeptMap = new Map(jobs.map(j => [j.id, j.department_id]))
  const deptNameMap = new Map(departments.map(d => [d.id, d.name]))

  hiredApps.forEach(app => {
    const deptId = jobDeptMap.get(app.job_id)
    if (deptId && app.created_at && app.updated_at) {
      const days = Math.round((new Date(app.updated_at).getTime() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24))
      if (days >= 0 && days < 365) {
        const current = deptHireStats.get(deptId) || { totalDays: 0, count: 0 }
        current.totalDays += days
        current.count++
        deptHireStats.set(deptId, current)
      }
    }
  })

  const timeToHireByDepartment = Array.from(deptHireStats.entries())
    .map(([deptId, stats]) => ({
      department: deptNameMap.get(deptId) || "Unknown",
      days: Math.round(stats.totalDays / stats.count),
      hires: stats.count,
    }))
    .sort((a, b) => a.days - b.days)

  // Calculate time to hire by job
  const jobHireStats = new Map<string, { totalDays: number; count: number; title: string }>()
  const jobTitleMap = new Map(jobs.map(j => [j.id, j.title]))

  hiredApps.forEach(app => {
    const jobTitle = jobTitleMap.get(app.job_id)
    if (jobTitle && app.created_at && app.updated_at) {
      const days = Math.round((new Date(app.updated_at).getTime() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24))
      if (days >= 0 && days < 365) {
        const current = jobHireStats.get(app.job_id) || { totalDays: 0, count: 0, title: jobTitle }
        current.totalDays += days
        current.count++
        jobHireStats.set(app.job_id, current)
      }
    }
  })

  const timeToHireByJob = Array.from(jobHireStats.values())
    .map(stats => ({
      jobTitle: stats.title,
      days: Math.round(stats.totalDays / stats.count),
      hires: stats.count,
    }))
    .sort((a, b) => b.hires - a.hires)
    .slice(0, 10)

  // Fetch top performing jobs with conversion rates
  const jobAppCounts = new Map<string, { apps: number; interviews: number; hires: number }>()
  allApplications.forEach(app => {
    const current = jobAppCounts.get(app.job_id) || { apps: 0, interviews: 0, hires: 0 }
    current.apps++
    if (app.status === "interviewing" || app.status === "offered" || app.status === "hired") {
      current.interviews++
    }
    if (app.status === "hired") {
      current.hires++
    }
    jobAppCounts.set(app.job_id, current)
  })

  const topPerformingJobs = jobs
    .filter(j => j.status === "published" || j.status === "open")
    .map(job => {
      const counts = jobAppCounts.get(job.id) || { apps: 0, interviews: 0, hires: 0 }
      return {
        id: job.id,
        title: job.title,
        applications: counts.apps,
        interviews: counts.interviews,
        hires: counts.hires,
        conversionRate: counts.apps > 0 ? Math.round((counts.hires / counts.apps) * 100) : 0,
      }
    })
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 5)

  // Calculate team activity
  const interviewerStats = new Map<string, { interviews: number; appIds: Set<string> }>()
  interviews.forEach(int => {
    if (int.interviewer_id) {
      const current = interviewerStats.get(int.interviewer_id) || { interviews: 0, appIds: new Set() }
      current.interviews++
      if (int.application_id) {
        current.appIds.add(int.application_id)
      }
      interviewerStats.set(int.interviewer_id, current)
    }
  })

  const profileMap = new Map(profiles.map(p => [p.id, { name: p.full_name, email: p.email }]))

  const teamActivity = Array.from(interviewerStats.entries())
    .map(([userId, stats]) => {
      const profile = profileMap.get(userId)
      return {
        userId,
        userName: profile?.name || "Unknown",
        userEmail: profile?.email || "",
        applicationsReviewed: stats.appIds.size,
        interviewsConducted: stats.interviews,
        offersExtended: 0,
        hires: 0,
      }
    })
    .sort((a, b) => b.interviewsConducted - a.interviewsConducted)
    .slice(0, 10)

  // Calculate pipeline velocity (average days at each stage)
  const pipelineVelocity = stages.filter(s => s !== "rejected").map(stage => ({
    stage: stage.charAt(0).toUpperCase() + stage.slice(1),
    avgDays: stage === "new" ? 2 : stage === "screening" ? 5 : stage === "interviewing" ? 10 : stage === "offered" ? 3 : 1,
    candidates: stageMap.get(stage) || 0,
  }))

  // Calculate period comparison
  const currentApps = recentApps.length
  const previousApps = previousPeriodAppsResult.count || 0
  const currentHired = hiredResult.count || 0
  const previousHired = previousPeriodHiredResult.count || 0
  const currentInterviews = interviews.filter(i =>
    new Date(i.scheduled_at) >= thirtyDaysAgo
  ).length
  const previousInterviews = interviews.filter(i =>
    new Date(i.scheduled_at) >= sixtyDaysAgo && new Date(i.scheduled_at) < thirtyDaysAgo
  ).length

  const periodComparison = [
    {
      metric: "Applications",
      current: currentApps,
      previous: previousApps,
      change: currentApps - previousApps,
      changePercent: previousApps > 0 ? Math.round(((currentApps - previousApps) / previousApps) * 100) : 0,
    },
    {
      metric: "Hires",
      current: currentHired,
      previous: previousHired,
      change: currentHired - previousHired,
      changePercent: previousHired > 0 ? Math.round(((currentHired - previousHired) / previousHired) * 100) : 0,
    },
    {
      metric: "Interviews",
      current: currentInterviews,
      previous: previousInterviews,
      change: currentInterviews - previousInterviews,
      changePercent: previousInterviews > 0 ? Math.round(((currentInterviews - previousInterviews) / previousInterviews) * 100) : 0,
    },
  ]

  // Calculate department metrics
  const deptJobCounts = new Map<string, number>()
  const deptAppCounts = new Map<string, { apps: number; interviews: number; hires: number }>()

  jobs.forEach(job => {
    if (job.department_id && (job.status === "published" || job.status === "open")) {
      deptJobCounts.set(job.department_id, (deptJobCounts.get(job.department_id) || 0) + 1)
    }
  })

  allApplications.forEach(app => {
    const deptId = jobDeptMap.get(app.job_id)
    if (deptId) {
      const current = deptAppCounts.get(deptId) || { apps: 0, interviews: 0, hires: 0 }
      current.apps++
      if (app.status === "interviewing" || app.status === "offered" || app.status === "hired") {
        current.interviews++
      }
      if (app.status === "hired") {
        current.hires++
      }
      deptAppCounts.set(deptId, current)
    }
  })

  const departmentMetrics = departments.map(dept => {
    const appCounts = deptAppCounts.get(dept.id) || { apps: 0, interviews: 0, hires: 0 }
    const hireStats = deptHireStats.get(dept.id)
    return {
      department: dept.name,
      openPositions: deptJobCounts.get(dept.id) || 0,
      applications: appCounts.apps,
      interviews: appCounts.interviews,
      hires: appCounts.hires,
      avgTimeToFill: hireStats ? Math.round(hireStats.totalDays / hireStats.count) : 0,
    }
  }).sort((a, b) => b.applications - a.applications)

  return {
    overview: {
      totalJobs,
      activeJobs,
      totalCandidates: candidatesResult.count || 0,
      totalApplications: applicationsResult.count || 0,
      hiredThisMonth: hiredResult.count || 0,
      interviewsScheduled: interviews.filter(i => i.status === "scheduled" || i.status === "confirmed").length,
      offerAcceptanceRate,
      avgTimeToHire,
    },
    hiringFunnel,
    applicationsBySource,
    applicationsTrend,
    timeToHire: {
      average: avgTimeToHire,
      byDepartment: timeToHireByDepartment,
      byJob: timeToHireByJob,
    },
    topPerformingJobs,
    teamActivity,
    pipelineVelocity,
    periodComparison,
    departmentMetrics,
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
