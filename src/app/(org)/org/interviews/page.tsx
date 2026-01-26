// @ts-nocheck
// Note: organization_integrations table not in generated types
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

  // Fetch team members for interviewer selection (only from same org)
  const { data: rawTeamMembers } = orgId
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, avatar_url")
        .eq("org_id", orgId)
        .order("first_name")
    : { data: [] }

  // Fetch user roles for team members
  const { data: userRoles } = orgId
    ? await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("org_id", orgId)
    : { data: [] }

  // Create a map of user roles
  const roleMap = new Map(userRoles?.map(r => [r.user_id, r.role]) || [])

  // Transform team members to include computed full_name and role from user_roles
  const teamMembers = (rawTeamMembers || []).map(m => ({
    ...m,
    full_name: [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email,
    role: roleMap.get(m.id) || "member",
  }))

  // Fetch ALL applications for scheduling interviews (not filtered by status)
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
    .order("created_at", { ascending: false })

  // Get org meeting integrations to know which providers are available
  const { data: meetingIntegrations } = orgId
    ? await supabase
        .from("organization_integrations")
        .select("provider, is_enabled, is_verified, is_default_meeting_provider")
        .eq("org_id", orgId)
        .eq("is_enabled", true)
        .eq("is_verified", true)
        .in("provider", ["zoom", "microsoft", "google"])
    : { data: [] }

  // Fetch scorecard templates for the organization
  const { data: scorecardTemplates } = orgId
    ? await supabase
        .from("scorecard_templates")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
    : { data: [] }

  // Determine default meeting provider
  const defaultProvider = meetingIntegrations?.find(i => i.is_default_meeting_provider)?.provider ||
                          meetingIntegrations?.[0]?.provider || null

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scorecardTemplates={(scorecardTemplates || []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      meetingProviders={(meetingIntegrations || []) as any}
      defaultMeetingProvider={defaultProvider}
    />
  )
}
