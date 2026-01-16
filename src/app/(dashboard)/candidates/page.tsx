import { createClient } from "@/lib/supabase/server"
import { CandidatesClient } from "./candidates-client"

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
    .eq("status", "published")
    .order("title")

  if (error) {
    console.error("Error fetching jobs:", error)
    return []
  }

  return jobs || []
}

export default async function CandidatesPage() {
  const [candidates, jobs] = await Promise.all([
    getCandidates(),
    getJobs(),
  ])

  return <CandidatesClient candidates={candidates} jobs={jobs} />
}
