import { createClient } from "@/lib/supabase/server"
import { OrgCandidatesClient } from "./candidates-client"

async function getCandidates() {
  const supabase = await createClient()

  const { data: candidates, error } = await supabase
    .from("candidates")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching candidates:", error)
    return []
  }

  return candidates || []
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

export default async function OrgCandidatesPage() {
  const [candidates, jobs] = await Promise.all([
    getCandidates(),
    getJobs(),
  ])

  return <OrgCandidatesClient candidates={candidates} jobs={jobs} />
}
