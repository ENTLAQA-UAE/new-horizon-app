"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSubscriptionGuard } from "@/lib/subscription/subscription-context"
import { useI18n } from "@/lib/i18n"

/**
 * Admin-only banner shown when the org subscription is inactive.
 *
 * Per B2B best practices:
 * - Only visible to org_admin (billing-responsible role)
 * - Shows clear, actionable message with billing CTA
 * - Non-dismissable when subscription is inactive
 * - Red/urgent styling to drive action
 */
export function SubscriptionAdminBanner() {
  const { subscription, isOrgAdmin, isLoading } = useSubscriptionGuard()
  const { language } = useI18n()
  const isAr = language === "ar"

  // Only show for org_admin when subscription is inactive
  if (isLoading || !subscription || subscription.isActive || !isOrgAdmin) {
    return null
  }

  return (
    <div className="flex items-center justify-between bg-red-600 px-4 py-2.5 text-sm text-white" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>
          {isAr
            ? "خطتك غير نشطة. اشترك الآن لاستعادة الوصول الكامل لفريقك."
            : "Your plan is inactive. Subscribe now to restore full access for your team."
          }
        </span>
      </div>
      <Link href="/org/billing">
        <Button
          size="sm"
          variant="secondary"
          className="h-7 text-xs"
        >
          {isAr ? "الاشتراك" : "Go to Billing"}
        </Button>
      </Link>
    </div>
  )
}
