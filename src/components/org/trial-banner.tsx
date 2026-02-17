"use client"

import { useState } from "react"
import { AlertTriangle, Clock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSubscriptionGuard } from "@/lib/subscription/subscription-context"
import { useAuth } from "@/lib/auth"
import { useI18n } from "@/lib/i18n"

/**
 * Trial Banner - Role-Aware
 *
 * Shows trial countdown during an active trial.
 * Per B2B best practices:
 * - Admin sees: days remaining + "Upgrade Now" CTA linking to billing
 * - Non-admin sees: days remaining only (no billing CTA, no payment mention)
 * - When trial is expired: the SubscriptionAdminBanner handles admin messaging,
 *   and the SubscriptionRestrictionModal handles non-admin blocking.
 *   So this banner only shows during ACTIVE trials.
 */
export function TrialBanner() {
  const { subscription, isLoading } = useSubscriptionGuard()
  const { isOrgAdmin } = useAuth()
  const { language } = useI18n()
  const [dismissed, setDismissed] = useState(false)
  const isAr = language === "ar"

  // Don't show if still loading, no subscription data, or not on trial
  if (isLoading || !subscription || subscription.state !== "trial") return null

  // Don't show if trial expired (SubscriptionAdminBanner takes over)
  if (subscription.trialExpired) return null

  // Don't show if dismissed
  if (dismissed) return null

  const days = subscription.trialDaysRemaining
  const isUrgent = days <= 3

  return (
    <div
      className={`flex items-center justify-between px-4 py-2.5 text-sm ${
        isUrgent
          ? "bg-amber-500 text-white"
          : "bg-blue-600 text-white"
      }`}
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 flex-shrink-0" />
        <span>
          {isAr
            ? `لديك ${days} ${days !== 1 ? "أيام" : "يوم"} متبقية في الفترة التجريبية المجانية.`
            : `You have ${days} day${days !== 1 ? "s" : ""} left in your free trial.`
          }
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* Only admins see the upgrade/billing CTA */}
        {isOrgAdmin && (
          <Link href="/org/billing">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs"
            >
              {isAr ? "ترقية الآن" : "Upgrade Now"}
            </Button>
          </Link>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-sm hover:bg-white/20 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
