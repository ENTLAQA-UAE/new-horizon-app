import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getDepartmentAccess } from "@/lib/auth/get-department-access"
import { ApplicationsClient } from "./applications-client"

async function getApplications(orgId: string, departmentIds: string[] | null) {
  const supabase = await createClient()

  let query = supabase
    .from("applications")
    .select(`
      *,
      candidates (
        id,
        first_name,
        last_name,
        email,
        phone,
        current_title,
        resume_url,
        avatar_url
      ),
      jobs!inner (
        id,
        title,
        title_ar,
        department_id,
        location_id,
        pipeline_id
      ),
      pipeline_stages (
        id,
        name,
        name_ar,
        color,
        sort_order,
        stage_type
      )
    `)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  if (departmentIds) {
    query = query.in("jobs.department_id", departmentIds.length > 0 ? departmentIds : ["__none__"])
  }

  const { data: applications, error } = await query

  if (error) {
    console.error("Error fetching applications:", error)
    return []
  }

  // Calculate application counts per candidate
  const candidateAppCounts: Record<string, number> = {}
  applications?.forEach(app => {
    if (app.candidate_id) {
      candidateAppCounts[app.candidate_id] = (candidateAppCounts[app.candidate_id] || 0) + 1
    }
  })

  // Add application count to each application
  const applicationsWithCount = applications?.map(app => ({
    ...app,
    candidate_app_count: candidateAppCounts[app.candidate_id] || 1
  }))

  return applicationsWithCount || []
}

async function getJobsWithPipelines(orgId: string, departmentIds: string[] | null) {
  const supabase = await createClient()

  let query = supabase
    .from("jobs")
    .select(`
      id,
      title,
      title_ar,
      status,
      pipeline_id,
      department_id,
      pipelines:pipeline_id (
        id,
        name,
        name_ar,
        pipeline_stages (
          id,
          name,
          name_ar,
          color,
          sort_order,
          stage_type,
          is_system
        )
      )
    `)
    .eq("org_id", orgId)
    .order("title")

  if (departmentIds) {
    query = query.in("department_id", departmentIds.length > 0 ? departmentIds : ["__none__"])
  }

  const { data: jobs, error } = await query

  if (error) {
    console.error("Error fetching jobs with pipelines:", error)
    return []
  }

  return jobs || []
}

export default async function OrgApplicationsPage() {
  const access = await getDepartmentAccess()
  if (!access) {
    redirect("/login")
  }

  const [applications, jobsWithPipelines] = await Promise.all([
    getApplications(access.orgId, access.departmentIds),
    getJobsWithPipelines(access.orgId, access.departmentIds),
  ])

  return (
    <ApplicationsClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      applications={applications as any}
      jobsWithPipelines={jobsWithPipelines as any}
    />
  )
}
