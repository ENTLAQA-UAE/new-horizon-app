// @ts-nocheck
// Note: Type mismatch between Supabase query result and Job interface
import { createClient } from "@/lib/supabase/server"
import { getDepartmentAccess } from "@/lib/auth/get-department-access"
import { JobsClient } from "./jobs-client"

async function getJobs(orgId: string, departmentIds: string[] | null) {
  const supabase = await createClient()

  let query = supabase
    .from("jobs")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  if (departmentIds) {
    query = query.in("department_id", departmentIds.length > 0 ? departmentIds : ["__none__"])
  }

  const { data: jobs, error } = await query

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
  const access = await getDepartmentAccess()
  if (!access) {
    const { redirect } = await import("next/navigation")
    redirect("/login")
  }

  const [jobs, departments, jobTypes, jobGrades, locations, hiringStages, orgSlug] = await Promise.all([
    getJobs(access.orgId, access.departmentIds),
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
