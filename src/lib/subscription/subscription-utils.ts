/**
 * Subscription Status Utilities
 *
 * Centralized logic for determining if an organization's subscription is active.
 * Handles trial (14-day from org creation), active subscription, and expiry states.
 *
 * IMPORTANT: This module is used both client-side and server-side.
 */

export type SubscriptionState = "active" | "trial" | "expired" | "cancelled"

export interface OrgSubscriptionData {
  subscription_status: string | null
  subscription_end_date: string | null
  created_at: string
}

export interface SubscriptionStatus {
  /** Whether the org has an active subscription or is within a valid trial */
  isActive: boolean
  /** Current state of the subscription */
  state: SubscriptionState
  /** Days remaining in trial (only relevant when state is 'trial') */
  trialDaysRemaining: number
  /** Whether the trial has expired */
  trialExpired: boolean
  /** The date the trial ends */
  trialEndDate: Date
}

const TRIAL_DURATION_DAYS = 14

/**
 * Calculate the subscription status for an organization.
 *
 * Active conditions (isActive = true):
 * - subscription_status is 'active' AND subscription_end_date is in the future (or null)
 * - subscription_status is 'trial' AND within 14-day trial window from created_at
 *
 * Inactive conditions (isActive = false):
 * - subscription_status is 'trial' AND 14-day trial window has passed
 * - subscription_status is 'cancelled'
 * - subscription_status is 'active' but subscription_end_date is in the past
 */
export function getSubscriptionStatus(org: OrgSubscriptionData): SubscriptionStatus {
  const now = new Date()
  const status = org.subscription_status || "trial"

  // Calculate trial dates regardless of status (used for display)
  const createdAt = new Date(org.created_at)
  const trialEndDate = new Date(createdAt)
  trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DURATION_DAYS)
  const trialDaysRemaining = Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const trialExpired = trialDaysRemaining === 0

  // Active subscription
  if (status === "active") {
    // If there's an end date, check if it's still valid
    if (org.subscription_end_date) {
      const endDate = new Date(org.subscription_end_date)
      if (endDate > now) {
        return { isActive: true, state: "active", trialDaysRemaining, trialExpired, trialEndDate }
      }
      // End date has passed — subscription lapsed
      return { isActive: false, state: "expired", trialDaysRemaining: 0, trialExpired: true, trialEndDate }
    }
    // No end date = ongoing active subscription
    return { isActive: true, state: "active", trialDaysRemaining, trialExpired, trialEndDate }
  }

  // Cancelled subscription
  if (status === "cancelled") {
    return { isActive: false, state: "cancelled", trialDaysRemaining: 0, trialExpired: true, trialEndDate }
  }

  // Trial status (default)
  if (!trialExpired) {
    return { isActive: true, state: "trial", trialDaysRemaining, trialExpired, trialEndDate }
  }

  // Trial expired and no active subscription
  return { isActive: false, state: "expired", trialDaysRemaining: 0, trialExpired: true, trialEndDate }
}
