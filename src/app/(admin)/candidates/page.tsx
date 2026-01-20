import { createClient } from "@/lib/supabase/server"
import { CandidatesClient } from "./candidates-client"

async function getCandidatesAndOrgId() {
  const supabase = await createClient()

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()

  // Get user's org_id from profile
  let orgId = ""
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single()
    orgId = profile?.org_id || ""
  }

  const { data: candidates, error } = await supabase
    .from("candidates")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching candidates:", error)
    return { candidates: [], orgId }
  }

  return { candidates: candidates || [], orgId }
}

async function getJobs() {
  const supabase = await createClient()

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, title, title_ar, status")
    .eq("status", "open")
    .order("title")

  if (error) {
    console.error("Error fetching jobs:", error)
    return []
  }

  return jobs || []
}

export default async function CandidatesPage() {
  const [{ candidates, orgId }, jobs] = await Promise.all([
    getCandidatesAndOrgId(),
    getJobs(),
  ])

  return <CandidatesClient candidates={candidates} jobs={jobs} orgId={orgId} />
}
