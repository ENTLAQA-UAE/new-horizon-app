// @ts-nocheck
// Note: This file uses tables that may not exist in the database schema yet (job_types, job_grades, hiring_stages)
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

async function getJobTypes() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("job_types")
    .select("id, name, name_ar")
    .eq("is_active", true)
    .order("name")

  return data || []
}

async function getJobGrades() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("job_grades")
    .select("id, name, name_ar, level")
    .eq("is_active", true)
    .order("level")

  return data || []
}

async function getLocations() {
  const supabase = await createClient()

  // Use 'locations' table from vacancy settings (configured by HR)
  // instead of 'job_locations' which may be empty
  const { data } = await supabase
    .from("locations")
    .select("id, name, name_ar, city, country")
    .eq("is_active", true)
    .order("name")

  return data || []
}

async function getHiringStages() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("hiring_stages")
    .select("id, name, name_ar, color, sort_order")
    .eq("is_active", true)
    .order("sort_order")

  return data || []
}

async function getOrgSlug() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) return null

  const { data: org } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", profile.org_id)
    .single()

  return org?.slug || null
}

export default async function OrgJobsPage() {
  const [jobs, departments, jobTypes, jobGrades, locations, hiringStages, orgSlug] = await Promise.all([
    getJobs(),
    getDepartments(),
    getJobTypes(),
    getJobGrades(),
    getLocations(),
    getHiringStages(),
    getOrgSlug(),
  ])

  return (
    <JobsClient
      jobs={jobs}
      departments={departments}
      jobTypes={jobTypes}
      jobGrades={jobGrades}
      locations={locations}
      hiringStages={hiringStages}
      orgSlug={orgSlug}
    />
  )
}
