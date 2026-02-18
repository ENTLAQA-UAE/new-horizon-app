import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getDepartmentAccess } from "@/lib/auth/get-department-access"
import { AITalentHubClient } from "./ai-talent-match-client"

async function getOpenJobs(orgId: string, departmentIds: string[] | null) {
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
      description,
      experience_level,
      job_type,
      published_at,
      created_at,
      departments:department_id (id, name, name_ar),
      locations:location_id (id, city, city_ar, country, country_ar)
    `)
    .eq("org_id", orgId)
    .eq("status", "open")
    .order("published_at", { ascending: false })

  if (departmentIds) {
    query = query.in("department_id", departmentIds.length > 0 ? departmentIds : ["__none__"])
  }

  const { data, error } = await query
  if (error) {
    console.error("Error fetching open jobs:", error)
    return []
  }
  return data || []
}

async function getPoolRecommendations(orgId: string) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
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
      source,
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
        resume_url,
        years_of_experience,
        skills
      )
    `)
    .eq("org_id", orgId)
    .eq("source", "talent_pool")
    .order("overall_score", { ascending: false })

  if (error) {
    console.error("Error fetching pool recommendations:", error)
    return []
  }
  return data || []
}

async function getCandidatePoolCount(orgId: string) {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from("candidates")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("is_blacklisted", false)

  if (error) {
    console.error("Error counting candidates:", error)
    return 0
  }
  return count || 0
}

export default async function AITalentHubPage() {
  const access = await getDepartmentAccess()
  if (!access) {
    redirect("/login")
  }

  const [jobs, recommendations, poolCount] = await Promise.all([
    getOpenJobs(access.orgId, access.departmentIds),
    getPoolRecommendations(access.orgId),
    getCandidatePoolCount(access.orgId),
  ])

  return (
    <AITalentHubClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jobs={jobs as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recommendations={recommendations as any}
      candidatePoolCount={poolCount}
      organizationId={access.orgId}
    />
  )
}
