"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DollarSign,
  TrendingUp,
  Building2,
  CreditCard,
  Calendar,
  ArrowUpRight,
  Pencil,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"

interface Tier {
  id: string
  name: string
  price_monthly: number
  price_yearly: number | null
  currency: string
}

interface Organization {
  id: string
  name: string
  subscription_status: string | null
  billing_cycle: string | null
  subscription_start_date: string | null
  subscription_end_date: string | null
  created_at: string
  subscription_tiers: Tier | null
}

interface BillingClientProps {
  organizations: Organization[]
  tiers: Tier[]
}

export function BillingClient({ organizations: initialOrgs, tiers }: BillingClientProps) {
  const [organizations, setOrganizations] = useState(initialOrgs)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [formData, setFormData] = useState({
    tier_id: "",
    billing_cycle: "monthly",
    subscription_status: "active",
    subscription_start_date: "",
    subscription_end_date: "",
    payment_method: "bank_transfer",
  })

  // Calculate stats
  let mrr = 0
  let arr = 0
  let defaultCurrency = "USD"
  const tierRevenue: Record<string, { name: string; count: number; revenue: number; currency: string }> = {}

  organizations.forEach((org) => {
    const tier = org.subscription_tiers
    if (tier && org.subscription_status === "active") {
      mrr += tier.price_monthly
      arr += (tier.price_yearly || tier.price_monthly * 12)

      if (!tierRevenue[tier.name]) {
        tierRevenue[tier.name] = { name: tier.name, count: 0, revenue: 0, currency: tier.currency || "USD" }
      }
      tierRevenue[tier.name].count++
      tierRevenue[tier.name].revenue += tier.price_monthly

      if (defaultCurrency === "USD" && tier.currency) {
        defaultCurrency = tier.currency
      }
    }
  })

  const tierRevenueList = Object.values(tierRevenue)

  const formatCurrency = (amount: number, currency?: string) => {
    const code = currency || defaultCurrency || "USD"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const openManageDialog = (org: Organization) => {
    setSelectedOrg(org)

    const today = new Date().toISOString().split("T")[0]

    // Calculate end date based on billing cycle
    const startDate = org.subscription_start_date || today
    let endDate = org.subscription_end_date || ""
    if (!endDate) {
      const start = new Date(startDate)
      const cycle = org.billing_cycle || "monthly"
      if (cycle === "annually") {
        start.setFullYear(start.getFullYear() + 1)
      } else if (cycle === "quarterly") {
        start.setMonth(start.getMonth() + 3)
      } else {
        start.setMonth(start.getMonth() + 1)
      }
      endDate = start.toISOString().split("T")[0]
    }

    setFormData({
      tier_id: org.subscription_tiers?.id || (tiers[0]?.id || ""),
      billing_cycle: org.billing_cycle || "monthly",
      subscription_status: org.subscription_status || "active",
      subscription_start_date: org.subscription_start_date || today,
      subscription_end_date: endDate,
      payment_method: "bank_transfer",
    })
    setIsDialogOpen(true)
  }

  // Auto-calculate end date when start date or billing cycle changes
  const updateEndDate = (startDate: string, cycle: string) => {
    if (!startDate) return
    const start = new Date(startDate)
    if (cycle === "annually") {
      start.setFullYear(start.getFullYear() + 1)
    } else if (cycle === "quarterly") {
      start.setMonth(start.getMonth() + 3)
    } else {
      start.setMonth(start.getMonth() + 1)
    }
    setFormData((prev) => ({
      ...prev,
      subscription_end_date: start.toISOString().split("T")[0],
    }))
  }

  const handleSave = async () => {
    if (!selectedOrg) return

    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: selectedOrg.id,
          tier_id: formData.tier_id,
          billing_cycle: formData.billing_cycle,
          subscription_status: formData.subscription_status,
          subscription_start_date: formData.subscription_start_date,
          subscription_end_date: formData.subscription_end_date,
          payment_method: formData.payment_method,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to update")

      // Update local state
      const selectedTier = tiers.find((t) => t.id === formData.tier_id) || null
      setOrganizations((prev) =>
        prev.map((org) =>
          org.id === selectedOrg.id
            ? {
                ...org,
                subscription_status: formData.subscription_status,
                billing_cycle: formData.billing_cycle,
                subscription_start_date: formData.subscription_start_date,
                subscription_end_date: formData.subscription_end_date,
                subscription_tiers: selectedTier,
              }
            : org
        )
      )

      toast.success(`Subscription updated for ${selectedOrg.name}`)
      setIsDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to update subscription")
    } finally {
      setIsSaving(false)
    }
  }

  const activeCount = organizations.filter((o) => o.subscription_status === "active").length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing & Revenue</h2>
        <p className="text-muted-foreground">
          Monitor platform revenue, manage subscriptions, and activate plans manually
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
            <div className="text-2xl font-bold">{formatCurrency(mrr)}</div>
            <p className="text-xs text-muted-foreground mt-1">From {activeCount} active subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Revenue (ARR)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(arr)}</div>
            <p className="text-xs text-muted-foreground mt-1">Projected yearly revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{activeCount} active, {organizations.length - activeCount} trial/other</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Revenue/Customer</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeCount > 0 ? formatCurrency(mrr / activeCount) : formatCurrency(0)}
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
            {tierRevenueList.length > 0 ? (
              <div className="space-y-4">
                {tierRevenueList.map((tier) => (
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
                          width: `${mrr > 0 ? (tier.revenue / mrr) * 100 : 0}%`,
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
                  <p className="font-medium">Billing Cycles</p>
                  <p className="text-sm text-muted-foreground">Monthly / Quarterly (-10%) / Annually (-20%)</p>
                </div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Payment Methods</p>
                  <p className="text-sm text-muted-foreground">Stripe, Bank Transfer, Cheque, Cash</p>
                </div>
              </div>
              <Badge variant="default">Enabled</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Currency</p>
                  <p className="text-sm text-muted-foreground">{defaultCurrency}</p>
                </div>
              </div>
              <Badge variant="secondary">Default</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Subscriptions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Organization Subscriptions</CardTitle>
              <CardDescription>Manage subscriptions for all organizations</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {organizations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Renewal</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>{org.subscription_tiers?.name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {org.billing_cycle === "annually" ? "Annual"
                          : org.billing_cycle === "quarterly" ? "Quarterly"
                            : "Monthly"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {org.subscription_tiers
                        ? formatCurrency(org.subscription_tiers.price_monthly, org.subscription_tiers.currency)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={org.subscription_status === "active" ? "default" : "secondary"}
                        className={
                          org.subscription_status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : org.subscription_status === "cancelled"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : ""
                        }
                      >
                        {org.subscription_status || "trial"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {org.subscription_end_date
                        ? new Date(org.subscription_end_date).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openManageDialog(org)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No organizations found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Manage Subscription Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Subscription</DialogTitle>
            <DialogDescription>
              Update subscription for <strong>{selectedOrg?.name}</strong>. Use this to activate subscriptions paid via bank transfer, cheque, or other offline methods.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Subscription Tier */}
            <div className="space-y-2">
              <Label>Subscription Tier</Label>
              <Select
                value={formData.tier_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, tier_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  {tiers.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.name} — {formatCurrency(tier.price_monthly, tier.currency)}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.subscription_status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, subscription_status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Billing Cycle */}
            <div className="space-y-2">
              <Label>Billing Cycle</Label>
              <Select
                value={formData.billing_cycle}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, billing_cycle: value }))
                  updateEndDate(formData.subscription_start_date, value)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly (every 3 months)</SelectItem>
                  <SelectItem value="annually">Annually (every 12 months)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.subscription_start_date}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, subscription_start_date: e.target.value }))
                  updateEndDate(e.target.value, formData.billing_cycle)
                }}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>End / Renewal Date</Label>
              <Input
                type="date"
                value={formData.subscription_end_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, subscription_end_date: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Auto-calculated from start date + billing cycle. You can override it manually.
              </p>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, payment_method: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="stripe">Stripe (Online)</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {isSaving ? "Saving..." : "Save & Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
