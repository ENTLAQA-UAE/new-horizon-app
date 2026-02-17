"use client"

import { ReactNode, useEffect } from "react"
import { useSubscriptionGuard } from "@/lib/subscription/subscription-context"
import { usePathname } from "next/navigation"

/**
 * Wraps page content and intercepts navigation/interactions
 * when the organization's subscription is inactive for non-admin users.
 *
 * - org_admin: full access (they need to manage billing)
 * - All other roles: shows restriction modal on any page except /org dashboard
 *
 * The dashboard (/org) remains accessible so users aren't completely locked out
 * and can see the restriction message.
 */

// Routes that are always accessible even with inactive subscription
const ALWAYS_ACCESSIBLE_ROUTES = [
  "/org", // Dashboard - so users can see the app and the restriction
]

export function SubscriptionContentGuard({ children }: { children: ReactNode }) {
  const { subscription, isOrgAdmin, isLoading, triggerRestriction } = useSubscriptionGuard()
  const pathname = usePathname()

  useEffect(() => {
    // Don't guard while loading or if subscription is active
    if (isLoading || !subscription || subscription.isActive) return

    // org_admin always has full access (they manage billing)
    if (isOrgAdmin) return

    // Check if current route is always accessible
    const isAccessible = ALWAYS_ACCESSIBLE_ROUTES.some(
      (route) => pathname === route
    )

    if (!isAccessible) {
      // Trigger restriction modal when non-admin navigates to a protected page
      triggerRestriction()
    }
  }, [pathname, subscription, isOrgAdmin, isLoading, triggerRestriction])

  return <>{children}</>
}
