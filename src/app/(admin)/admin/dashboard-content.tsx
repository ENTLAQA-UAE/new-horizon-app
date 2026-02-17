"use client"

import { useI18n } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building2, Users, CheckCircle, Clock, DollarSign, BarChart3 } from "lucide-react"
import Link from "next/link"
import { DashboardCharts } from "../dashboard-charts"

interface DashboardStats {
  organizations: number
  activeOrganizations: number
  trialOrganizations: number
  cancelledOrganizations: number
  tiers: number
  activeUsers: number
  recentOrganizations: any[]
  monthlyRevenue: number
  chartData: {
    monthlyGrowth: any[]
    subscriptionDistribution: any[]
    applicationTrends: any[]
    revenueByTier: any[]
  }
}

export function DashboardContent({ stats }: { stats: DashboardStats }) {
  const { t } = useI18n()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("admin.dashboard.title")}</h2>
        <p className="text-muted-foreground">
          {t("admin.dashboard.subtitle")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.dashboard.totalOrgs")}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.organizations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeOrganizations} {t("admin.dashboard.active").toLowerCase()}, {stats.trialOrganizations} {t("admin.dashboard.trial").toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.dashboard.activeUsers")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">{t("admin.dashboard.acrossAllOrgs")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.dashboard.subscriptionTiers")}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tiers}</div>
            <p className="text-xs text-muted-foreground">{t("admin.dashboard.activePricingPlans")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.dashboard.monthlyRevenue")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(stats.monthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("admin.dashboard.arr")}: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(stats.monthlyRevenue * 12)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <DashboardCharts data={stats.chartData} />

      {/* Quick Actions & System Health */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.dashboard.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/organizations"
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">{t("admin.dashboard.manageOrgs")}</p>
                <p className="text-xs text-muted-foreground">{t("admin.dashboard.viewManageTenants")}</p>
              </div>
            </Link>
            <Link
              href="/users"
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">{t("admin.dashboard.userManagement")}</p>
                <p className="text-xs text-muted-foreground">{t("admin.dashboard.manageUsersRoles")}</p>
              </div>
            </Link>
            <Link
              href="/billing"
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">{t("admin.dashboard.billingPayments")}</p>
                <p className="text-xs text-muted-foreground">{t("admin.dashboard.viewInvoicesPayments")}</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.dashboard.systemHealth")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">{t("admin.dashboard.database")}</span>
              <Badge variant="default" className="bg-green-500">{t("admin.dashboard.healthy")}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">{t("admin.dashboard.api")}</span>
              <Badge variant="default" className="bg-green-500">{t("admin.dashboard.operational")}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">{t("admin.dashboard.aiServices")}</span>
              <Badge variant="default" className="bg-green-500">{t("admin.dashboard.active")}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">{t("admin.dashboard.emailService")}</span>
              <Badge variant="default" className="bg-green-500">{t("admin.dashboard.connected")}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Organizations Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("admin.dashboard.recentOrgs")}</CardTitle>
          <Link href="/organizations" className="text-sm text-primary hover:underline">
            {t("admin.dashboard.viewAll")}
          </Link>
        </CardHeader>
        <CardContent>
          {stats.recentOrganizations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.dashboard.name")}</TableHead>
                  <TableHead>{t("admin.dashboard.tier")}</TableHead>
                  <TableHead>{t("admin.dashboard.status")}</TableHead>
                  <TableHead>{t("admin.dashboard.created")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentOrganizations.map((org: any) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>{org.subscription_tiers?.name || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={org.subscription_status === "active" ? "default" : "secondary"}>
                        {org.subscription_status === "active" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {org.subscription_status || t("admin.dashboard.trial").toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(org.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("admin.dashboard.noOrgsYet")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
