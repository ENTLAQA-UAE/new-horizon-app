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
        current_job_title,
        resume_url
      ),
      jobs (
        id,
        title,
        title_ar,
        department_id,
        location
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching applications:", error)
    return []
  }

  return applications || []
}

async function getJobs() {
  const supabase = await createClient()

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, title, title_ar, status")
    .order("title")

  if (error) {
    console.error("Error fetching jobs:", error)
    return []
  }

  return jobs || []
}

async function getPipelineStages() {
  // Default pipeline stages for ATS
  return [
    { id: "applied", name: "Applied", color: "#3B82F6" },
    { id: "screening", name: "Screening", color: "#F59E0B" },
    { id: "interview", name: "Interview", color: "#8B5CF6" },
    { id: "assessment", name: "Assessment", color: "#06B6D4" },
    { id: "offer", name: "Offer", color: "#10B981" },
    { id: "hired", name: "Hired", color: "#059669" },
    { id: "rejected", name: "Rejected", color: "#EF4444" },
  ]
}

export default async function OrgApplicationsPage() {
  const [applications, jobs, stages] = await Promise.all([
    getApplications(),
    getJobs(),
    getPipelineStages(),
  ])

  return (
    <ApplicationsClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      applications={applications as any}
      jobs={jobs}
      stages={stages}
    />
  )
}
