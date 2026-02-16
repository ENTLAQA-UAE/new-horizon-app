"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Clock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getCurrentUserId, supabaseSelect } from "@/lib/supabase/auth-fetch"

export function TrialBanner() {
  const [trialDays, setTrialDays] = useState<number | null>(null)
  const [isOnTrial, setIsOnTrial] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    async function checkTrial() {
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

        const { data: orgData } = await supabaseSelect<any[]>(
          "organizations",
          {
            select: "subscription_status,created_at",
            filter: [{ column: "id", operator: "eq", value: profileData[0].org_id }],
            limit: 1,
          }
        )

        if (!orgData?.[0]) return

        const org = orgData[0]
        const status = org.subscription_status || "trial"

        if (status !== "trial") return

        const createdAt = new Date(org.created_at)
        const trialEnd = new Date(createdAt)
        trialEnd.setDate(trialEnd.getDate() + 14)
        const now = new Date()
        const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

        setTrialDays(daysRemaining)
        setIsOnTrial(true)
      } catch (error) {
        console.error("Error checking trial status:", error)
      }
    }

    checkTrial()
  }, [])

  if (!isOnTrial || dismissed || trialDays === null) return null

  const isExpired = trialDays === 0
  const isUrgent = trialDays <= 3

  return (
    <div
      className={`flex items-center justify-between px-4 py-2.5 text-sm ${
        isExpired
          ? "bg-red-600 text-white"
          : isUrgent
            ? "bg-amber-500 text-white"
            : "bg-blue-600 text-white"
      }`}
    >
      <div className="flex items-center gap-2">
        {isExpired ? (
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        ) : (
          <Clock className="h-4 w-4 flex-shrink-0" />
        )}
        <span>
          {isExpired
            ? "Your trial has expired. Complete payment to continue using all features."
            : `You have ${trialDays} day${trialDays !== 1 ? "s" : ""} left in your free trial.`
          }
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/org/billing">
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs"
          >
            {isExpired ? "Complete Payment" : "Upgrade Now"}
          </Button>
        </Link>
        {!isExpired && (
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-sm hover:bg-white/20 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
