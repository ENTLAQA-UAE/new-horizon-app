import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { getSubscriptionStatus, type OrgSubscriptionData } from "./subscription-utils"

/**
 * API route wrapper that enforces subscription checks.
 *
 * Usage:
 *   export const POST = withSubscriptionCheck(async (request) => {
 *     // Your handler code — only runs if subscription is active or user is admin
 *   })
 *
 * Rules:
 * - super_admin: always allowed
 * - org_admin: always allowed (they need access to fix billing)
 * - All other roles: blocked with 403 when subscription is inactive
 *
 * Requires the request to include org_id in the request body or query params.
 * Falls back to looking up org_id from the user's profile.
 */
type RouteHandler = (request: NextRequest) => Promise<NextResponse>

export function withSubscriptionCheck(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest) => {
    try {
      const supabase = createServiceClient()

      // Get user from auth header
      const authHeader = request.headers.get("authorization")
      if (!authHeader) {
        return handler(request) // No auth = let the handler deal with it
      }

      const token = authHeader.replace("Bearer ", "")
      const { data: { user }, error: userError } = await supabase.auth.getUser(token)

      if (userError || !user) {
        return handler(request) // Can't determine user = let handler deal with auth
      }

      // Get user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single()

      const role = roleData?.role || null

      // super_admin and org_admin bypass subscription checks
      if (role === "super_admin" || role === "org_admin") {
        return handler(request)
      }

      // Get user's org_id from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single()

      if (!profile?.org_id) {
        return handler(request) // No org = let handler deal with it
      }

      // Check org subscription
      const { data: orgData } = await supabase
        .from("organizations")
        .select("subscription_status,subscription_end_date,created_at")
        .eq("id", profile.org_id)
        .single()

      if (!orgData) {
        return handler(request) // Can't determine subscription = let through
      }

      const subscription = getSubscriptionStatus(orgData as OrgSubscriptionData)

      if (subscription.isActive) {
        return handler(request)
      }

      // Subscription is inactive — block non-admin users
      // Use a neutral message that doesn't reveal billing details
      return NextResponse.json(
        {
          error: "Access restricted",
          message: "Your organization's access is currently restricted. Please contact your administrator.",
          code: "SUBSCRIPTION_INACTIVE",
        },
        { status: 403 }
      )
    } catch (error) {
      console.error("withSubscriptionCheck error:", error)
      // On error, let the request through rather than blocking
      return handler(request)
    }
  }
}
