import { createClient } from "@/lib/supabase/server"
import { JobsClient } from "./jobs-client"

async function getJobs() {
  const supabase = await createClient()

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(`
      *,
      departments (name, name_ar),
      job_locations (name, name_ar, city, country)
    `)
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
    .select("*")
    .eq("is_active", true)
    .order("name")

  return data || []
}

async function getLocations() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("job_locations")
    .select("*")
    .eq("is_active", true)
    .order("name")

  return data || []
}

export default async function JobsPage() {
  const [jobs, departments, locations] = await Promise.all([
    getJobs(),
    getDepartments(),
    getLocations(),
  ])

  return (
    <JobsClient
      jobs={jobs}
      departments={departments}
      locations={locations}
    />
  )
}
