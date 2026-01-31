import { SupabaseClient } from "@supabase/supabase-js"

export interface CandidateListItem {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  source: string
  status: string
  jobTitle: string
  department: string
  appliedAt: string
  lastUpdated: string
}

export interface CandidateListStats {
  candidates: CandidateListItem[]
  totalCount: number
  statusCounts: Record<string, number>
}

export async function getCandidateListStats(
  supabase: SupabaseClient
): Promise<CandidateListStats> {
  // Fetch applications, candidates, jobs, and departments in parallel
  // Using separate queries and joining in JS to avoid complex nested join issues
  const [applicationsResult, candidatesResult, jobsResult, departmentsResult] =
    await Promise.all([
      supabase
        .from("applications")
        .select("id, status, source, candidate_id, job_id, created_at, updated_at")
        .order("created_at", { ascending: false }),

      supabase
        .from("candidates")
        .select("id, first_name, last_name, email, phone"),

      supabase
        .from("jobs")
        .select("id, title, department_id"),

      supabase
        .from("departments")
        .select("id, name"),
    ])

  const applications = applicationsResult.data || []
  const candidates = candidatesResult.data || []
  const jobs = jobsResult.data || []
  const departments = departmentsResult.data || []

  // Build lookup maps for efficient joining
  const candidateMap = new Map(
    candidates.map((c) => [
      c.id,
      {
        firstName: c.first_name || "",
        lastName: c.last_name || "",
        email: c.email || "",
        phone: c.phone || null,
      },
    ])
  )

  const departmentMap = new Map(
    departments.map((d) => [d.id, d.name || "Unknown"])
  )

  const jobMap = new Map(
    jobs.map((j) => [
      j.id,
      {
        title: j.title || "Untitled Position",
        departmentName: departmentMap.get(j.department_id) || "Unassigned",
      },
    ])
  )

  // Join data and map to CandidateListItem[]
  const candidateList: CandidateListItem[] = applications.map((app) => {
    const candidate = candidateMap.get(app.candidate_id) || {
      firstName: "Unknown",
      lastName: "",
      email: "",
      phone: null,
    }
    const job = jobMap.get(app.job_id) || {
      title: "Unknown Position",
      departmentName: "Unassigned",
    }

    return {
      id: app.id,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      phone: candidate.phone,
      source: app.source || "direct",
      status: app.status || "new",
      jobTitle: job.title,
      department: job.departmentName,
      appliedAt: app.created_at,
      lastUpdated: app.updated_at,
    }
  })

  // Calculate status counts
  const statusCounts: Record<string, number> = {}
  for (const item of candidateList) {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1
  }

  return {
    candidates: candidateList,
    totalCount: candidateList.length,
    statusCounts,
  }
}
