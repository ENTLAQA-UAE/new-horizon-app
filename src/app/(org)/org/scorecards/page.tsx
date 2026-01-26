import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ScorecardsPageClient, Scorecard } from "./scorecards-page-client"

export default async function ScorecardsPage() {
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

  // Fetch all submitted scorecards for this organization with related data
  const { data: scorecards } = await supabase
    .from("interview_scorecards")
    .select(`
      *,
      scorecard_templates (
        id,
        name,
        name_ar,
        template_type,
        criteria
      ),
      interviews (
        id,
        title,
        scheduled_at,
        applications (
          id,
          candidates (
            id,
            first_name,
            last_name,
            email
          ),
          jobs (
            id,
            title,
            title_ar
          )
        )
      )
    `)
    .eq("org_id", orgId)
    .in("status", ["submitted", "locked"])
    .order("submitted_at", { ascending: false })

  // Get unique interviewer IDs
  const interviewerIds = [...new Set((scorecards || []).map(s => s.interviewer_id))]

  // Fetch interviewer profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url")
    .in("id", interviewerIds.length > 0 ? interviewerIds : ["no-match"])

  // Create a map of user_id to profile
  const profileMap = new Map(
    (profiles || []).map(p => [p.id, { first_name: p.first_name, last_name: p.last_name, avatar_url: p.avatar_url }])
  )

  // Attach profiles to scorecards and cast to proper type
  const scorecardsWithProfiles = (scorecards || []).map(scorecard => ({
    ...scorecard,
    profiles: profileMap.get(scorecard.interviewer_id) || null
  })) as unknown as Scorecard[]

  // Fetch jobs for filter
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title")
    .eq("org_id", orgId)
    .order("title")

  return (
    <ScorecardsPageClient
      scorecards={scorecardsWithProfiles}
      jobs={jobs || []}
      organizationId={orgId}
    />
  )
}
