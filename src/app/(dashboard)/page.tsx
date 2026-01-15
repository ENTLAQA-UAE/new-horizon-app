import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Briefcase, TrendingUp } from "lucide-react"

async function getStats() {
  const supabase = await createClient()

  // Get organizations count
  const { count: orgsCount } = await supabase
    .from("organizations")
    .select("*", { count: "exact", head: true })

  // Get subscription tiers
  const { data: tiers } = await supabase
    .from("subscription_tiers")
    .select("*")
    .eq("is_active", true)

  return {
    organizations: orgsCount || 0,
    tiers: tiers?.length || 0,
    // Placeholder values for now
    activeUsers: 0,
    monthlyRevenue: 0,
  }
}

export default async function DashboardPage() {
  const stats = await getStats()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome to Jadarat ATS</h2>
        <p className="text-muted-foreground">
          AI-Powered Applicant Tracking System for MENA Region
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.organizations}</div>
            <p className="text-xs text-muted-foreground">Active tenants on platform</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Across all organizations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription Tiers</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tiers}</div>
            <p className="text-xs text-muted-foreground">Active pricing plans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current MRR</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Get started by adding organizations, configuring subscription tiers, or viewing analytics.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent activity to display.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
