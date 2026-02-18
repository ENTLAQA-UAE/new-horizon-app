import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getDepartmentAccess } from "@/lib/auth/get-department-access"
import { AITalentMatchClient } from "./ai-talent-match-client"

async function getJobs(orgId: string, departmentIds: string[] | null) {
  const supabase = await createClient()

  let query = supabase
    .from("jobs")
    .select(`
      id,
      title,
      title_ar,
      status,
      department_id,
      location_id,
      created_at,
      departments:department_id (id, name, name_ar),
      locations:location_id (id, city, city_ar, country, country_ar)
    `)
    .eq("org_id", orgId)
    .in("status", ["open", "paused", "closed"])
    .order("created_at", { ascending: false })

  if (departmentIds) {
    query = query.in("department_id", departmentIds.length > 0 ? departmentIds : ["__none__"])
  }

  const { data, error } = await query
  if (error) {
    console.error("Error fetching jobs:", error)
    return []
  }
  return data || []
}

async function getAIScreenings(orgId: string, departmentIds: string[] | null) {
  const supabase = await createClient()

  // Get job IDs filtered by department if needed
  let jobIds: string[] | null = null
  if (departmentIds) {
    const { data: deptJobs } = await supabase
      .from("jobs")
      .select("id")
      .eq("org_id", orgId)
      .in("department_id", departmentIds.length > 0 ? departmentIds : ["__none__"])

    jobIds = deptJobs?.map((j) => j.id) || []
    if (jobIds.length === 0) return []
  }

  let query = supabase
    .from("candidate_ai_screening")
    .select(`
      id,
      job_id,
      candidate_id,
      application_id,
      overall_score,
      skills_match_score,
      experience_score,
      education_score,
      recommendation,
      recommendation_reason,
      screening_feedback,
      strengths,
      concerns,
      skill_gaps,
      screening_data,
      created_at,
      updated_at,
      candidates:candidate_id (
        id,
        first_name,
        last_name,
        email,
        phone,
        current_title,
        city,
        country,
        avatar_url,
        resume_url
      )
    `)
    .eq("org_id", orgId)
    .order("overall_score", { ascending: false })

  if (jobIds) {
    query = query.in("job_id", jobIds)
  }

  const { data, error } = await query
  if (error) {
    console.error("Error fetching AI screenings:", error)
    return []
  }
  return data || []
}

async function getApplicationCounts(orgId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("applications")
    .select("job_id, id")
    .eq("org_id", orgId)

  if (error) {
    console.error("Error fetching application counts:", error)
    return {}
  }

  const counts: Record<string, number> = {}
  data?.forEach((app) => {
    counts[app.job_id] = (counts[app.job_id] || 0) + 1
  })
  return counts
}

export default async function AITalentMatchPage() {
  const access = await getDepartmentAccess()
  if (!access) {
    redirect("/login")
  }

  const [jobs, screenings, applicationCounts] = await Promise.all([
    getJobs(access.orgId, access.departmentIds),
    getAIScreenings(access.orgId, access.departmentIds),
    getApplicationCounts(access.orgId),
  ])

  return (
    <AITalentMatchClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jobs={jobs as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      screenings={screenings as any}
      applicationCounts={applicationCounts}
      organizationId={access.orgId}
    />
  )
}
