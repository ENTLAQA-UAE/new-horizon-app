import { createClient } from "@/lib/supabase/server"
import { InterviewsClient } from "./interviews-client"

export default async function InterviewsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if user has Google Calendar connected
  let hasCalendarConnected = false
  if (user) {
    const { data: integration } = await supabase
      .from("user_integrations")
      .select("id")
      .eq("user_id", user.id)
      .eq("provider", "google_calendar")
      .single()
    hasCalendarConnected = !!integration
  }

  // Fetch interviews with related data
  const { data: interviews } = await supabase
    .from("interviews")
    .select(`
      *,
      applications (
        id,
        candidates (
          id,
          first_name,
          last_name,
          email,
          phone,
          current_title
        ),
        jobs (
          id,
          title,
          title_ar
        )
      )
    `)
    .order("scheduled_at", { ascending: true })

  // Fetch team members for interviewer selection
  const { data: teamMembers } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, role")
    .order("full_name")

  // Fetch applications that don't have interviews yet (for scheduling new ones)
  const { data: applications } = await supabase
    .from("applications")
    .select(`
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
    `)
    .in("status", ["screening", "interview", "assessment"])
    .order("created_at", { ascending: false })

  return (
    <InterviewsClient
      interviews={interviews || []}
      teamMembers={teamMembers || []}
      applications={applications || []}
      hasCalendarConnected={hasCalendarConnected}
    />
  )
}
