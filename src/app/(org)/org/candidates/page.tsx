import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OrgCandidatesClient } from "./candidates-client"

async function getUserOrgId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single()

  return profile?.org_id || null
}

async function getCandidates(orgId: string) {
  const supabase = await createClient()

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

async function getJobs(orgId: string) {
  const supabase = await createClient()

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, title, title_ar, status")
    .eq("org_id", orgId)
    .order("title")

  if (error) {
    console.error("Error fetching jobs:", error)
    return []
  }

  return jobs || []
}

export default async function OrgCandidatesPage() {
  const orgId = await getUserOrgId()

  if (!orgId) {
    redirect("/org")
  }

  const [candidates, jobs] = await Promise.all([
    getCandidates(orgId),
    getJobs(orgId),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <OrgCandidatesClient candidates={candidates as any} jobs={jobs} organizationId={orgId} />
}
