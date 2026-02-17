import { SupabaseClient } from "@supabase/supabase-js"
import { getSubscriptionStatus, type OrgSubscriptionData, type SubscriptionStatus } from "./subscription-utils"
import { NextResponse } from "next/server"

/**
 * Server-side subscription check for API routes.
 *
 * Checks if an organization's subscription is active and whether
 * the requesting user is an org_admin.
 *
 * Rules:
 * - super_admin: always allowed (bypasses subscription check)
 * - org_admin: always allowed (they need access to fix billing)
 * - All other roles: blocked with 403 when subscription is inactive
 *
 * Returns null if the request should proceed, or a NextResponse if it should be blocked.
 */
export async function checkSubscriptionAccess(
  supabase: SupabaseClient,
  userId: string,
  orgId: string
): Promise<{ allowed: boolean; response?: NextResponse; subscription?: SubscriptionStatus }> {
  // Get user role
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single()

  const role = roleData?.role || null

  // super_admin bypasses all checks
  if (role === "super_admin") {
    return { allowed: true }
  }

  // org_admin always has access (needs to manage billing)
  if (role === "org_admin") {
    return { allowed: true }
  }

  // Fetch org subscription data
  const { data: orgData, error } = await supabase
    .from("organizations")
    .select("subscription_status,subscription_end_date,created_at")
    .eq("id", orgId)
    .single()

  if (error || !orgData) {
    return { allowed: true } // If we can't determine status, allow through
  }

  const subscription = getSubscriptionStatus(orgData as OrgSubscriptionData)

  if (subscription.isActive) {
    return { allowed: true, subscription }
  }

  // Subscription is inactive and user is not admin
  return {
    allowed: false,
    subscription,
    response: NextResponse.json(
      {
        error: "Access restricted",
        message: "Your organization's access is currently restricted. Please contact your administrator.",
        code: "SUBSCRIPTION_INACTIVE",
      },
      { status: 403 }
    ),
  }
}
