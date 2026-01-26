import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ScorecardSubmitClient } from "./scorecard-submit-client"

interface PageProps {
  searchParams: Promise<{ interview?: string; template?: string }>
}

export default async function ScorecardSubmitPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const interviewId = params.interview
  const templateId = params.template

  if (!interviewId || !templateId) {
    redirect("/org/scorecards")
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, org_id, first_name, last_name")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) {
    redirect("/org")
  }

  // Fetch the interview with application and candidate details
  const { data: interview } = await supabase
    .from("interviews")
    .select(`
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
          title
        )
      )
    `)
    .eq("id", interviewId)
    .single()

  if (!interview) {
    redirect("/org/scorecards")
  }

  // Fetch the template
  const { data: template } = await supabase
    .from("scorecard_templates")
    .select("*")
    .eq("id", templateId)
    .eq("org_id", profile.org_id)
    .single()

  if (!template) {
    redirect("/org/scorecards")
  }

  // Check if scorecard already exists for this interview by this user
  const { data: existingScorecard } = await supabase
    .from("interview_scorecards")
    .select("id")
    .eq("interview_id", interviewId)
    .eq("interviewer_id", user.id)
    .single()

  return (
    <ScorecardSubmitClient
      interview={interview as any}
      template={template as any}
      organizationId={profile.org_id}
      userId={user.id}
      existingScorecardId={existingScorecard?.id || null}
    />
  )
}
