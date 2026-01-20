import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getDashboardStats } from "@/lib/analytics/dashboard-stats"
import { AnalyticsDashboard } from "./analytics-dashboard"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const stats = await getDashboardStats(supabase)

  return <AnalyticsDashboard stats={stats} />
}
