import { createClient } from "@/lib/supabase/server"
import { InterviewsClient } from "./interviews-client"

export default async function InterviewsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user's org_id
  let orgId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single()
    orgId = profile?.org_id || null
  }

  // Calendar integration not yet available - table doesn't exist in schema
  const hasCalendarConnected = false

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      interviews={(interviews || []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      teamMembers={(teamMembers || []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      applications={(applications || []) as any}
      hasCalendarConnected={hasCalendarConnected}
      organizationId={orgId || ""}
    />
  )
}
