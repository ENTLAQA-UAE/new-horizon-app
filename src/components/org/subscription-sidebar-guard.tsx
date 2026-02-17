"use client"

import { ReactNode, useCallback, MouseEvent } from "react"
import { useSubscriptionGuard } from "@/lib/subscription/subscription-context"

/**
 * Wraps the sidebar and intercepts link clicks for non-admin users
 * when the org subscription is inactive.
 *
 * Instead of allowing navigation, shows the restriction modal.
 * The /org (dashboard) link is always allowed through.
 */
export function SubscriptionSidebarGuard({ children }: { children: ReactNode }) {
  const { subscription, isOrgAdmin, isLoading, triggerRestriction } = useSubscriptionGuard()

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      // Don't guard while loading or if subscription is active
      if (isLoading || !subscription || subscription.isActive) return

      // org_admin always has full access
      if (isOrgAdmin) return

      // Check if the click target is a link (or inside a link)
      const target = e.target as HTMLElement
      const link = target.closest("a")

      if (!link) return

      const href = link.getAttribute("href")

      // Allow dashboard navigation
      if (href === "/org") return

      // Block all other navigation for non-admin users
      e.preventDefault()
      e.stopPropagation()
      triggerRestriction()
    },
    [subscription, isOrgAdmin, isLoading, triggerRestriction]
  )

  return (
    <div onClickCapture={handleClick} className="contents">
      {children}
    </div>
  )
}
