import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getDepartmentAccess } from "@/lib/auth/get-department-access"
import { OrgCandidatesClient } from "./candidates-client"

async function getCandidates(orgId: string, departmentIds: string[] | null) {
  const supabase = await createClient()

  if (departmentIds) {
    // For hiring_manager: only candidates who applied to jobs in their departments
    const deptFilter = departmentIds.length > 0 ? departmentIds : ["__none__"]

    // Get job IDs for their departments
    const { data: deptJobs } = await supabase
      .from("jobs")
      .select("id")
      .eq("org_id", orgId)
      .in("department_id", deptFilter)

    const jobIds = deptJobs?.map((j) => j.id) || []

    if (jobIds.length === 0) return []

    // Get candidate IDs who applied to those jobs
    const { data: apps } = await supabase
      .from("applications")
      .select("candidate_id")
      .in("job_id", jobIds)

    const candidateIds = [...new Set(apps?.map((a) => a.candidate_id) || [])]

    if (candidateIds.length === 0) return []

    const { data: candidates, error } = await supabase
      .from("candidates")
      .select("*")
      .eq("org_id", orgId)
      .in("id", candidateIds)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching candidates:", error)
      return []
    }
    return candidates || []
  }

  // Full access - all candidates
  const { data: candidates, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching candidates:", error)
    return []
  }

  return candidates || []
}

async function getJobs(orgId: string, departmentIds: string[] | null) {
  const supabase = await createClient()

  let query = supabase
    .from("jobs")
    .select("id, title, title_ar, status")
    .eq("org_id", orgId)
    .order("title")

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

export default async function OrgCandidatesPage() {
  const access = await getDepartmentAccess()

  if (!access) {
    redirect("/org")
  }

  const [candidates, jobs] = await Promise.all([
    getCandidates(access.orgId, access.departmentIds),
    getJobs(access.orgId, access.departmentIds),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <OrgCandidatesClient candidates={candidates as any} jobs={jobs} organizationId={access.orgId} />
}
