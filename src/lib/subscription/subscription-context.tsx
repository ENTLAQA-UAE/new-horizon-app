"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import { useAuth } from "@/lib/auth"
import { getCurrentUserId, supabaseSelect } from "@/lib/supabase/auth-fetch"
import { getSubscriptionStatus, type SubscriptionStatus, type OrgSubscriptionData } from "./subscription-utils"

interface OrgAdminInfo {
  email: string | null
  first_name: string | null
  last_name: string | null
}

interface SubscriptionGuardState {
  /** Whether subscription data is still loading */
  isLoading: boolean
  /** The computed subscription status */
  subscription: SubscriptionStatus | null
  /** Whether the current user is org_admin (can see billing details) */
  isOrgAdmin: boolean
  /** Admin contact info (for non-admin users to reach out) */
  adminContact: OrgAdminInfo | null
  /** Show the restriction modal for non-admin users */
  showRestrictionModal: boolean
  /** Trigger the restriction modal (called when user tries an action) */
  triggerRestriction: () => void
  /** Dismiss the restriction modal */
  dismissRestriction: () => void
}

const defaultState: SubscriptionGuardState = {
  isLoading: true,
  subscription: null,
  isOrgAdmin: false,
  adminContact: null,
  showRestrictionModal: false,
  triggerRestriction: () => {},
  dismissRestriction: () => {},
}

const SubscriptionGuardContext = createContext<SubscriptionGuardState>(defaultState)

export function useSubscriptionGuard() {
  return useContext(SubscriptionGuardContext)
}

interface SubscriptionGuardProviderProps {
  children: ReactNode
}

export function SubscriptionGuardProvider({ children }: SubscriptionGuardProviderProps) {
  const { isOrgAdmin, profile } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [adminContact, setAdminContact] = useState<OrgAdminInfo | null>(null)
  const [showRestrictionModal, setShowRestrictionModal] = useState(false)

  useEffect(() => {
    async function loadSubscriptionData() {
      try {
        const userId = await getCurrentUserId()
        if (!userId || !profile?.org_id) {
          setIsLoading(false)
          return
        }

        // Fetch org subscription data
        const { data: orgData } = await supabaseSelect<OrgSubscriptionData[]>(
          "organizations",
          {
            select: "subscription_status,subscription_end_date,created_at",
            filter: [{ column: "id", operator: "eq", value: profile.org_id }],
            limit: 1,
          }
        )

        if (!orgData?.[0]) {
          setIsLoading(false)
          return
        }

        const status = getSubscriptionStatus(orgData[0])
        setSubscription(status)

        // If subscription is inactive and user is NOT admin, fetch admin contact
        if (!status.isActive && !isOrgAdmin) {
          const { data: adminData } = await supabaseSelect<{ user_id: string }[]>(
            "user_roles",
            {
              select: "user_id",
              filter: [{ column: "role", operator: "eq", value: "org_admin" }],
              limit: 1,
            }
          )

          if (adminData?.[0]?.user_id) {
            const { data: adminProfile } = await supabaseSelect<OrgAdminInfo[]>(
              "profiles",
              {
                select: "email,first_name,last_name",
                filter: [{ column: "id", operator: "eq", value: adminData[0].user_id }],
                limit: 1,
              }
            )

            if (adminProfile?.[0]) {
              setAdminContact(adminProfile[0])
            }
          }
        }
      } catch (error) {
        console.error("SubscriptionGuard: Error loading subscription data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSubscriptionData()
  }, [profile?.org_id, isOrgAdmin])

  const triggerRestriction = useCallback(() => {
    setShowRestrictionModal(true)
  }, [])

  const dismissRestriction = useCallback(() => {
    setShowRestrictionModal(false)
  }, [])

  const value: SubscriptionGuardState = {
    isLoading,
    subscription,
    isOrgAdmin,
    adminContact,
    showRestrictionModal,
    triggerRestriction,
    dismissRestriction,
  }

  return (
    <SubscriptionGuardContext.Provider value={value}>
      {children}
    </SubscriptionGuardContext.Provider>
  )
}
