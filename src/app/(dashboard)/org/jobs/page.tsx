import { createClient } from "@/lib/supabase/server"
import { JobsClient } from "./jobs-client"

async function getJobs() {
  const supabase = await createClient()

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching jobs:", error)
    return []
  }

  return jobs || []
}

async function getDepartments() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("departments")
    .select("id, name, name_ar")
    .eq("is_active", true)
    .order("name")

  return data || []
}

export default async function OrgJobsPage() {
  const [jobs, departments] = await Promise.all([
    getJobs(),
    getDepartments(),
  ])

  return <JobsClient jobs={jobs} departments={departments} />
}
