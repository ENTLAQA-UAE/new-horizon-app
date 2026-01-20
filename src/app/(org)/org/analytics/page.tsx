import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getDashboardStats, DateRange } from "@/lib/analytics/dashboard-stats"
import { AnalyticsDashboard } from "./analytics-dashboard"

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

  // Validate date range parameter
  const validRanges: DateRange[] = ["7d", "30d", "90d", "12m", "all"]
  const dateRange: DateRange = validRanges.includes(params.range as DateRange)
    ? (params.range as DateRange)
    : "30d"

  const stats = await getDashboardStats(supabase, dateRange)

  return <AnalyticsDashboard stats={stats} />
}
