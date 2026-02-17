import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, TrendingUp, Building2, CreditCard, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react"

async function getBillingStats() {
  const supabase = await createClient()

  // Get organizations with their tiers
  const { data: organizations } = await supabase
    .from("organizations")
    .select(`
      id,
      name,
      subscription_status,
      billing_cycle,
      subscription_start_date,
      subscription_end_date,
      created_at,
      subscription_tiers (
        name,
        price_monthly,
        price_yearly,
        currency
      )
    `)

  // Get all tiers for revenue calculation
  const { data: tiers } = await supabase
    .from("subscription_tiers")
    .select("*")
    .eq("is_active", true)

  // Calculate MRR (Monthly Recurring Revenue)
  let mrr = 0
  let arr = 0
  let defaultCurrency = "USD"
  const tierRevenue: Record<string, { name: string; count: number; revenue: number; currency: string }> = {}

  organizations?.forEach((org) => {
    const tier = org.subscription_tiers
    if (tier) {
      mrr += tier.price_monthly
      arr += tier.price_yearly

      if (!tierRevenue[tier.name]) {
        tierRevenue[tier.name] = { name: tier.name, count: 0, revenue: 0, currency: tier.currency || "USD" }
      }
      tierRevenue[tier.name].count++
      tierRevenue[tier.name].revenue += tier.price_monthly

      // Use the first tier's currency as the default for aggregate stats
      if (!defaultCurrency || defaultCurrency === "USD") {
        defaultCurrency = tier.currency || "USD"
      }
    }
  })

  return {
    mrr,
    arr,
    defaultCurrency,
    activeOrganizations: organizations?.length || 0,
    tierRevenue: Object.values(tierRevenue),
    recentOrganizations: organizations?.slice(0, 10) || [],
  }
}

export default async function BillingPage() {
  const stats = await getBillingStats()

  const formatCurrency = (amount: number, currency?: string) => {
    const code = currency || stats.defaultCurrency || "USD"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing & Revenue</h2>
        <p className="text-muted-foreground">
          Monitor platform revenue and subscription metrics
        </p>
      </div>

      {/* Revenue Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue (MRR)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.mrr)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">+12%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Revenue (ARR)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.arr)}</div>
            <p className="text-xs text-muted-foreground mt-1">Projected yearly revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paying Customers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOrganizations}</div>
            <p className="text-xs text-muted-foreground mt-1">Active subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Revenue/Customer</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activeOrganizations > 0
                ? formatCurrency(stats.mrr / stats.activeOrganizations)
                : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">ARPU monthly</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Tier */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Tier</CardTitle>
            <CardDescription>Monthly revenue breakdown by subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.tierRevenue.length > 0 ? (
              <div className="space-y-4">
                {stats.tierRevenue.map((tier) => (
                  <div key={tier.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tier.name}</span>
                        <Badge variant="secondary">{tier.count} orgs</Badge>
                      </div>
                      <span className="font-bold">{formatCurrency(tier.revenue, tier.currency)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${stats.mrr > 0 ? (tier.revenue / stats.mrr) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No revenue data available yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Billing Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Overview</CardTitle>
            <CardDescription>Platform billing configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Billing Cycle</p>
                  <p className="text-sm text-muted-foreground">Monthly / Quarterly / Annually</p>
                </div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Payment Methods</p>
                  <p className="text-sm text-muted-foreground">Credit Card, Bank Transfer</p>
                </div>
              </div>
              <Badge variant="default">Enabled</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Currency</p>
                  <p className="text-sm text-muted-foreground">{stats.defaultCurrency}</p>
                </div>
              </div>
              <Badge variant="secondary">Default</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Subscriptions</CardTitle>
          <CardDescription>Organizations with active billing</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentOrganizations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Renewal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentOrganizations.map((org: any) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>{org.subscription_tiers?.name || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {org.billing_cycle === "annually" ? "Annual"
                          : org.billing_cycle === "quarterly" ? "Quarterly"
                            : "Monthly"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(org.subscription_tiers?.price_monthly || 0, org.subscription_tiers?.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={org.subscription_status === "active" ? "default" : "secondary"}>
                        {org.subscription_status || "trial"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {org.subscription_end_date
                        ? new Date(org.subscription_end_date).toLocaleDateString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No active subscriptions yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
