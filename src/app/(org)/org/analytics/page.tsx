import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getDashboardStats, DateRange } from "@/lib/analytics/dashboard-stats"
import { getOrgAdminStats } from "@/lib/analytics/org-admin-stats"
import { getRecruiterStats } from "@/lib/analytics/recruiter-stats"
import { getInterviewerStats } from "@/lib/analytics/interviewer-stats"
import { getCandidateListStats } from "@/lib/analytics/candidates-list-stats"
import { AnalyticsDashboard } from "./analytics-dashboard"
import { OrgAdminAnalytics } from "./org-admin-analytics"
import { RecruiterAnalytics } from "./recruiter-analytics"
import { InterviewerAnalytics } from "./interviewer-analytics"

interface PageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user's role and org_id
  const [{ data: roleData }, { data: profileData }] = await Promise.all([
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single(),
  ])

  const role = roleData?.role || null
  const orgId = profileData?.org_id

  if (!orgId) {
    redirect("/org")
  }

  // Route by role — all analytics queries are scoped to orgId
  switch (role) {
    case "org_admin": {
      const stats = await getOrgAdminStats(supabase, orgId)
      return <OrgAdminAnalytics stats={stats} />
    }

    case "hr_manager": {
      // Validate date range parameter
      const validRanges: DateRange[] = ["7d", "30d", "90d", "12m", "all"]
      const dateRange: DateRange = validRanges.includes(params.range as DateRange)
        ? (params.range as DateRange)
        : "30d"

      // Fetch HR stats and candidate list in parallel
      const [stats, candidateListData] = await Promise.all([
        getDashboardStats(supabase, dateRange, orgId),
        getCandidateListStats(supabase, orgId),
      ])

      return <AnalyticsDashboard stats={stats} candidateListData={candidateListData} />
    }

    case "recruiter": {
      const stats = await getRecruiterStats(supabase, user.id, orgId)
      return <RecruiterAnalytics stats={stats} />
    }

    case "interviewer": {
      const stats = await getInterviewerStats(supabase, user.id, orgId)
      return <InterviewerAnalytics stats={stats} />
    }

    case "super_admin": {
      // Super admin shouldn't be here, redirect to admin
      redirect("/admin")
    }

    default: {
      // Fallback: redirect to org dashboard
      redirect("/org")
    }
  }
}
