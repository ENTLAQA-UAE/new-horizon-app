// @ts-nocheck
// Note: Type mismatch between Supabase Json type and ScreeningQuestion interface
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ScreeningQuestionsClient } from "./screening-questions-client"

export default async function ScreeningQuestionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user's profile with organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) {
    redirect("/org")
  }

  const orgId = profile.org_id

  // Get screening questions (global ones - not job-specific)
  const { data: questions } = await supabase
    .from("screening_questions")
    .select("*")
    .eq("org_id", orgId)
    .is("job_id", null)
    .order("sort_order", { ascending: true })

  // Get jobs for optional job-specific questions
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title")
    .eq("org_id", orgId)
    .order("title")

  return (
    <ScreeningQuestionsClient
      questions={questions || []}
      jobs={jobs || []}
      organizationId={orgId}
    />
  )
}
