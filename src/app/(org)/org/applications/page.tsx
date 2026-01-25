import { createClient } from "@/lib/supabase/server"
import { ApplicationsClient } from "./applications-client"

async function getApplications() {
  const supabase = await createClient()

  const { data: applications, error } = await supabase
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
      jobs (
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
    .order("created_at", { ascending: false })

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

async function getJobsWithPipelines() {
  const supabase = await createClient()

  // Get jobs that have applications, with their pipeline stages
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(`
      id,
      title,
      title_ar,
      status,
      pipeline_id,
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
    .order("title")

  if (error) {
    console.error("Error fetching jobs with pipelines:", error)
    return []
  }

  return jobs || []
}

export default async function OrgApplicationsPage() {
  const [applications, jobsWithPipelines] = await Promise.all([
    getApplications(),
    getJobsWithPipelines(),
  ])

  return (
    <ApplicationsClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      applications={applications as any}
      jobsWithPipelines={jobsWithPipelines as any}
    />
  )
}
