// @ts-nocheck
// Note: This file uses tables that don't exist in the database schema yet (job_types, job_grades, locations, hiring_stages)
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

export default async function OrgJobsPage() {
  const [jobs, departments, jobTypes, jobGrades, locations, hiringStages] = await Promise.all([
    getJobs(),
    getDepartments(),
    getJobTypes(),
    getJobGrades(),
    getLocations(),
    getHiringStages(),
  ])

  return (
    <JobsClient
      jobs={jobs}
      departments={departments}
      jobTypes={jobTypes}
      jobGrades={jobGrades}
      locations={locations}
      hiringStages={hiringStages}
    />
  )
}
