// @ts-nocheck
// Note: Supabase query type inference issues with Map constructor
import { createClient } from "@/lib/supabase/server"
import { getDepartmentAccess } from "@/lib/auth/get-department-access"
import { InterviewsClient } from "./interviews-client"
import { toMeetingProviderView } from "@/lib/transforms/integration"

export default async function InterviewsPage() {
  const access = await getDepartmentAccess()
  const supabase = await createClient()

  const orgId = access?.orgId || null
  const user = access ? { id: access.userId } : null

  // Calendar integration not yet available - table doesn't exist in schema
  const hasCalendarConnected = false

  // Fetch interviews with related data, including department filtering
  let interviewsQuery = supabase
    .from("interviews")
    .select(`
      *,
      applications!inner (
        id,
        candidates (
          id,
          first_name,
          last_name,
          email,
          phone,
          current_title
        ),
        jobs!inner (
          id,
          title,
          title_ar,
          department_id
        )
      )
    `)
    .order("scheduled_at", { ascending: true })

  if (access?.departmentIds) {
    interviewsQuery = interviewsQuery.in(
      "applications.jobs.department_id",
      access.departmentIds.length > 0 ? access.departmentIds : ["__none__"]
    )
  }

  const { data: interviews } = await interviewsQuery

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

  // Fetch applications for scheduling interviews with department filtering
  let appsQuery = supabase
    .from("applications")
    .select(`
      id,
      candidates (
        id,
        first_name,
        last_name,
        email
      ),
      jobs!inner (
        id,
        title,
        department_id
      )
    `)
    .order("created_at", { ascending: false })

  if (access?.departmentIds) {
    appsQuery = appsQuery.in(
      "jobs.department_id",
      access.departmentIds.length > 0 ? access.departmentIds : ["__none__"]
    )
  }

  const { data: applications } = await appsQuery

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
  const meetingProviderViews = (meetingIntegrations || []).map(toMeetingProviderView)
  const defaultProvider = meetingProviderViews.find(i => i.isDefaultMeetingProvider)?.provider ||
                          meetingProviderViews[0]?.provider || null

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
      meetingProviders={meetingProviderViews as any}
      defaultMeetingProvider={defaultProvider}
    />
  )
}
