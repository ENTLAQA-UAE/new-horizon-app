"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Loader2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  Users,
  Briefcase,
  HardDrive,
  Crown,
  ExternalLink,
  Settings,
  CreditCard,
} from "lucide-react"
import { getCurrentUserId, supabaseSelect } from "@/lib/supabase/auth-fetch"
import { useSearchParams } from "next/navigation"

interface SubscriptionTier {
  id: string
  name: string
  name_ar: string | null
  description: string | null
  description_ar: string | null
  price_monthly: number
  price_yearly: number | null
  currency: string
  max_jobs: number
  max_candidates: number
  max_users: number
  max_storage_gb: number
  features: Record<string, boolean>
  sort_order: number
}

interface SubscriptionData {
  organization: {
    id: string
    name: string
    subscription_status: string | null
    subscription_start_date: string | null
    subscription_end_date: string | null
    billing_cycle: string | null
    tier_id: string | null
    max_jobs: number | null
    max_candidates: number | null
    max_users: number | null
    created_at: string
    subscription_tiers: SubscriptionTier | null
  }
  trial: {
    days_remaining: number
    end_date: string
    expired: boolean
  }
  available_tiers: SubscriptionTier[]
}

export default function BillingClient() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null)
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "quarterly" | "annually">("monthly")

  useEffect(() => {
    const status = searchParams.get("status")
    if (status === "success") {
      toast.success("Payment successful! Your subscription is now active.")
    } else if (status === "cancelled") {
      toast.info("Payment was cancelled.")
    }
  }, [searchParams])

  useEffect(() => {
    async function loadSubscription() {
      try {
        const userId = await getCurrentUserId()
        if (!userId) return

        const { data: profileData } = await supabaseSelect<{ org_id: string }[]>(
          "profiles",
          {
            select: "org_id",
            filter: [{ column: "id", operator: "eq", value: userId }],
            limit: 1,
          }
        )

        if (!profileData?.[0]?.org_id) return

        const response = await fetch(`/api/org/subscription?org_id=${profileData[0].org_id}`)
        if (!response.ok) throw new Error("Failed to fetch subscription")

        const subData = await response.json()
        setData(subData)

        // Initialize billing cycle from saved org data
        if (subData.organization.billing_cycle) {
          setBillingCycle(subData.organization.billing_cycle as "monthly" | "quarterly" | "annually")
        }
      } catch (error) {
        console.error("Error loading subscription:", error)
        toast.error("Failed to load subscription details")
      } finally {
        setIsLoading(false)
      }
    }

    loadSubscription()
  }, [])

  const handleCheckout = async (tierId: string) => {
    if (!data?.organization.id) return

    setIsCheckingOut(tierId)
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: data.organization.id,
          tier_id: tierId,
          billing_cycle: billingCycle,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create checkout session")
      }

      if (result.url) {
        window.location.href = result.url
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to start checkout")
    } finally {
      setIsCheckingOut(null)
    }
  }

  const handleManageSubscription = async () => {
    if (!data?.organization.id) return

    setIsOpeningPortal(true)
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: data.organization.id }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to open billing portal")
      }

      if (result.url) {
        window.location.href = result.url
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to open billing portal")
    } finally {
      setIsOpeningPortal(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = "USD") => {
    const currencyMap: Record<string, string> = {
      SAR: "SAR", USD: "USD", AED: "AED", EUR: "EUR", GBP: "GBP",
      EGP: "EGP", KWD: "KWD", QAR: "QAR", BHD: "BHD",
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyMap[currency] || currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getCycleLabel = (cycle: string | null) => {
    switch (cycle) {
      case "annually": return "Annual"
      case "quarterly": return "Quarterly"
      default: return "Monthly"
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="h-3 w-3 mr-1" /> Active</Badge>
      case "trial":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><Clock className="h-3 w-3 mr-1" /> Trial</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><XCircle className="h-3 w-3 mr-1" /> Cancelled</Badge>
      case "suspended":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"><AlertTriangle className="h-3 w-3 mr-1" /> Suspended</Badge>
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Trial</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Unable to load subscription details.</p>
      </div>
    )
  }

  const { organization, trial, available_tiers } = data
  const currentTier = organization.subscription_tiers
  const isOnTrial = organization.subscription_status === "trial" || !organization.subscription_status
  const isActive = organization.subscription_status === "active"
  const isCancelled = organization.subscription_status === "cancelled"

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Billing & Subscription</h2>
          <p className="text-muted-foreground">
            Manage your subscription plan and billing details
          </p>
        </div>
        {isActive && (
          <Button
            variant="outline"
            onClick={handleManageSubscription}
            disabled={isOpeningPortal}
          >
            {isOpeningPortal ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            Payment & Invoices
          </Button>
        )}
      </div>

      {/* Trial Countdown - only show during trial */}
      {isOnTrial && (
        <Card className={trial.expired ? "border-red-300 bg-red-50 dark:bg-red-950/20" : "border-blue-300 bg-blue-50 dark:bg-blue-950/20"}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${trial.expired ? "bg-red-100 dark:bg-red-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`}>
                {trial.expired
                  ? <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  : <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                }
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {trial.expired
                    ? "Your trial has expired"
                    : `${trial.days_remaining} day${trial.days_remaining !== 1 ? "s" : ""} left in your trial`
                  }
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {trial.expired
                    ? "Choose a plan below and complete payment to continue using all features."
                    : `Your trial ends on ${formatDate(trial.end_date)}. Choose a plan and billing cycle below to subscribe.`
                  }
                </p>
                {!trial.expired && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Trial progress</span>
                      <span>{14 - trial.days_remaining} of 14 days used</span>
                    </div>
                    <Progress value={((14 - trial.days_remaining) / 14) * 100} className="h-2" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Subscription Summary */}
      {isActive && (
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/10 dark:border-green-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">Subscription Active</h3>
                  <p className="text-sm text-muted-foreground">
                    Your <strong>{currentTier?.name}</strong> plan ({getCycleLabel(organization.billing_cycle)} billing) is active and will renew on <strong>{formatDate(organization.subscription_end_date)}</strong>.
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManageSubscription}
                    disabled={isOpeningPortal}
                  >
                    {isOpeningPortal ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="mr-2 h-4 w-4" />
                    )}
                    Manage Payment Methods
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleManageSubscription}
                    disabled={isOpeningPortal}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Cancel Subscription
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancelled Subscription Notice */}
      {isCancelled && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Subscription Cancelled</h3>
                <p className="text-sm text-muted-foreground">
                  Your subscription has been cancelled. Choose a plan below to reactivate.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Plan & Dates Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="font-semibold">{currentTier?.name || "No plan selected"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              {getStatusBadge(organization.subscription_status)}
            </div>
            {(isActive || organization.billing_cycle) && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Billing Cycle</span>
                <Badge variant="outline">{getCycleLabel(organization.billing_cycle)}</Badge>
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monthly Price</span>
              <span className="font-semibold">
                {currentTier
                  ? `${formatCurrency(currentTier.price_monthly, currentTier.currency)}/mo`
                  : "—"
                }
              </span>
            </div>
            {currentTier?.price_yearly && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Annual Price</span>
                <span className="font-semibold">
                  {formatCurrency(currentTier.price_yearly, currentTier.currency)}/yr
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Billing Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isActive && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Started</span>
                  <span className="font-semibold">{formatDate(organization.subscription_start_date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Next Renewal</span>
                  <span className="font-semibold text-green-600">{formatDate(organization.subscription_end_date)}</span>
                </div>
              </>
            )}
            {isOnTrial && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trial Started</span>
                  <span className="font-semibold">{formatDate(organization.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trial Ends</span>
                  <span className={`font-semibold ${trial.expired ? "text-red-600" : "text-blue-600"}`}>
                    {formatDate(trial.end_date)}
                  </span>
                </div>
              </>
            )}
            {isCancelled && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Was Active Until</span>
                  <span className="font-semibold text-red-600">{formatDate(organization.subscription_end_date)}</span>
                </div>
              </>
            )}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Account Created</span>
              <span className="font-semibold">{formatDate(organization.created_at)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Limits */}
      {currentTier && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Limits</CardTitle>
            <CardDescription>Current resource limits for your {currentTier.name} plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {currentTier.max_jobs === -1 ? "Unlimited" : currentTier.max_jobs} Jobs
                  </p>
                  <p className="text-xs text-muted-foreground">Active job postings</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {currentTier.max_candidates === -1 ? "Unlimited" : currentTier.max_candidates.toLocaleString()} Candidates
                  </p>
                  <p className="text-xs text-muted-foreground">Candidate records</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {currentTier.max_users === -1 ? "Unlimited" : currentTier.max_users} Users
                  </p>
                  <p className="text-xs text-muted-foreground">Team members</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <HardDrive className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {currentTier.max_storage_gb === -1 ? "Unlimited" : `${currentTier.max_storage_gb} GB`}
                  </p>
                  <p className="text-xs text-muted-foreground">Storage</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Selection with Billing Cycle Toggle */}
      {available_tiers.length > 0 && (
        <>
          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {isActive ? "Change Plan or Billing Cycle" : isCancelled ? "Reactivate Subscription" : "Choose a Plan"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isActive
                    ? "Switch to a different plan or change your billing frequency. You will be redirected to Stripe to complete the change."
                    : "Select a plan and billing cycle, then complete payment through Stripe."
                  }
                </p>
              </div>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="flex items-center gap-2 pt-2">
              <span className="text-sm font-medium text-muted-foreground mr-2">Billing cycle:</span>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={billingCycle === "monthly" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setBillingCycle("monthly")}
                >
                  Monthly
                </Button>
                <Button
                  variant={billingCycle === "quarterly" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setBillingCycle("quarterly")}
                >
                  Quarterly
                  <Badge variant="secondary" className="ml-1.5 text-xs">-10%</Badge>
                </Button>
                <Button
                  variant={billingCycle === "annually" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setBillingCycle("annually")}
                >
                  Annually
                  <Badge variant="secondary" className="ml-1.5 text-xs">-20%</Badge>
                </Button>
              </div>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {available_tiers.map((tier) => {
              const isCurrentTier = tier.id === organization.tier_id
              const currentOrgCycle = organization.billing_cycle || "monthly"
              const isCurrentCycle = billingCycle === currentOrgCycle
              const isExactCurrent = isCurrentTier && isCurrentCycle && isActive

              const yearlyPrice = tier.price_yearly || tier.price_monthly * 12
              const price =
                billingCycle === "annually"
                  ? yearlyPrice
                  : billingCycle === "quarterly"
                    ? Math.round(tier.price_monthly * 3 * 0.9)
                    : tier.price_monthly
              const cycleSuffix =
                billingCycle === "annually" ? "/yr"
                  : billingCycle === "quarterly" ? "/qtr"
                    : "/mo"

              // Determine button label
              let buttonLabel = "Subscribe"
              if (isExactCurrent) {
                buttonLabel = "Current Plan"
              } else if (isActive && isCurrentTier && !isCurrentCycle) {
                buttonLabel = `Switch to ${getCycleLabel(billingCycle)}`
              } else if (isActive && !isCurrentTier) {
                buttonLabel = "Switch to This Plan"
              } else if (isCancelled) {
                buttonLabel = "Reactivate"
              }

              return (
                <Card
                  key={tier.id}
                  className={`transition-all ${
                    isExactCurrent
                      ? "border-green-400 ring-2 ring-green-200 dark:ring-green-900"
                      : isCurrentTier
                        ? "border-primary ring-2 ring-primary/20"
                        : "hover:border-primary/40"
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{tier.name}</CardTitle>
                      <div className="flex items-center gap-1.5">
                        {isCurrentTier && isActive && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Current</Badge>
                        )}
                        {isCurrentTier && !isActive && (
                          <Badge variant="outline">Assigned</Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      {tier.description || `${tier.name} plan`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-3xl font-bold">
                        {formatCurrency(price, tier.currency)}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        {cycleSuffix}
                      </span>
                      {billingCycle === "quarterly" && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          {formatCurrency(Math.round(tier.price_monthly * 3 * 0.9 / 3), tier.currency)}/mo effective (save 10%)
                        </p>
                      )}
                      {billingCycle === "annually" && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          {formatCurrency(Math.round(yearlyPrice / 12), tier.currency)}/mo effective (save 20%)
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{tier.max_jobs === -1 ? "Unlimited" : tier.max_jobs} Jobs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{tier.max_candidates === -1 ? "Unlimited" : tier.max_candidates.toLocaleString()} Candidates</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{tier.max_users === -1 ? "Unlimited" : tier.max_users} Users</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <span>{tier.max_storage_gb === -1 ? "Unlimited" : `${tier.max_storage_gb} GB`} Storage</span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      variant={isExactCurrent ? "outline" : "default"}
                      disabled={isCheckingOut !== null || isExactCurrent}
                      onClick={() => handleCheckout(tier.id)}
                    >
                      {isCheckingOut === tier.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : isExactCurrent ? (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      {buttonLabel}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
