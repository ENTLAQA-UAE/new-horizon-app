"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import {
  Loader2,
  CreditCard,
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

  const formatCurrency = (amount: number, currency: string = "USD") => {
    const currencyMap: Record<string, string> = {
      SAR: "SAR", USD: "USD", AED: "AED", EUR: "EUR", GBP: "GBP",
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing & Subscription</h2>
        <p className="text-muted-foreground">
          Manage your subscription plan and billing details
        </p>
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
                    ? "Complete your payment to continue using all features."
                    : `Your trial ends on ${formatDate(trial.end_date)}. Complete payment to activate your subscription.`
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

      {/* Current Plan Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Current Plan
            </CardTitle>
            <CardDescription>Your active subscription details</CardDescription>
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
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Price</span>
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
              Subscription Dates
            </CardTitle>
            <CardDescription>Your billing period information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Start Date</span>
              <span className="font-semibold">{formatDate(organization.subscription_start_date)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">End Date</span>
              <span className="font-semibold">{formatDate(organization.subscription_end_date)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Account Created</span>
              <span className="font-semibold">{formatDate(organization.created_at)}</span>
            </div>
            {isOnTrial && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Trial Ends</span>
                <span className="font-semibold text-blue-600">{formatDate(trial.end_date)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Current Plan Limits */}
      {currentTier && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Limits</CardTitle>
            <CardDescription>Current resource limits for your plan</CardDescription>
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

      {/* Available Plans */}
      {(isOnTrial || !isActive) && available_tiers.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Choose a Plan</h3>
              <p className="text-sm text-muted-foreground">
                Select a plan to activate your subscription
              </p>
            </div>
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
                <Badge variant="secondary" className="ml-1.5 text-xs">Save 10%</Badge>
              </Button>
              <Button
                variant={billingCycle === "annually" ? "default" : "ghost"}
                size="sm"
                onClick={() => setBillingCycle("annually")}
              >
                Annually
                <Badge variant="secondary" className="ml-1.5 text-xs">Save 20%</Badge>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {available_tiers.map((tier) => {
              const isCurrentTier = tier.id === organization.tier_id
              const yearlyPrice = tier.price_yearly || tier.price_monthly * 12
              const price =
                billingCycle === "annually"
                  ? yearlyPrice
                  : billingCycle === "quarterly"
                    ? Math.round(tier.price_monthly * 3 * 0.9) // 10% quarterly discount
                    : tier.price_monthly
              const cycleSuffix =
                billingCycle === "annually" ? "/yr"
                  : billingCycle === "quarterly" ? "/qtr"
                    : "/mo"

              return (
                <Card
                  key={tier.id}
                  className={isCurrentTier ? "border-primary ring-2 ring-primary/20" : ""}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{tier.name}</CardTitle>
                      {isCurrentTier && (
                        <Badge>Current</Badge>
                      )}
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
                      <span className="text-muted-foreground">
                        {cycleSuffix}
                      </span>
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
                      variant={isCurrentTier ? "outline" : "default"}
                      disabled={isCheckingOut !== null}
                      onClick={() => handleCheckout(tier.id)}
                    >
                      {isCheckingOut === tier.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      {isCurrentTier ? "Renew Plan" : "Select Plan"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Active subscription info */}
      {isActive && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Your subscription is active</p>
                <p className="text-sm text-muted-foreground">
                  Your {currentTier?.name || ""} plan will renew on {formatDate(organization.subscription_end_date)}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
