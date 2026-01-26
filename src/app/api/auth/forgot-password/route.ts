// @ts-nocheck
/**
 * Custom Password Reset Endpoint
 *
 * ALWAYS uses the notification system to send password reset emails with custom templates
 * that include dynamic organization branding (colors, logo).
 *
 * If the organization has email configured, uses their provider.
 * Otherwise, falls back to platform-level Resend API (RESEND_API_KEY env var).
 *
 * This ensures consistent branding across all password reset emails, avoiding
 * Supabase's default templates which have hardcoded colors.
 */
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendNotification } from "@/lib/notifications/send-notification"

export async function POST(request: NextRequest) {
  try {
    const { email, redirectUrl } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = createServiceClient()
    const baseUrl = redirectUrl || `${request.nextUrl.origin}/reset-password`

    // Look up the user by email to get their profile info
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, org_id")
      .eq("email", email.toLowerCase())
      .single()

    // Look up user in auth.users by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      console.error("Failed to list users:", userError)
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      })
    }

    const authUser = userData?.users?.find(
      (u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase()
    )

    if (!authUser) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      })
    }

    // Get org_id for template lookup and branding
    const orgId = profile?.org_id || null

    // Always generate the reset link using Supabase Admin API
    // This gives us the token without sending Supabase's default email
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: authUser.email!,
      options: {
        redirectTo: baseUrl,
      },
    })

    if (linkError) {
      console.error("Failed to generate reset link:", linkError)
      return NextResponse.json(
        { error: "Failed to generate reset link" },
        { status: 500 }
      )
    }

    let resetUrl = linkData.properties?.action_link
    if (!resetUrl) {
      console.error("No action_link in response:", linkData)
      return NextResponse.json(
        { error: "Failed to generate reset link" },
        { status: 500 }
      )
    }

    // CRITICAL: Fix localhost URLs in reset link
    // Supabase's generateLink uses the Site URL from dashboard which may be misconfigured
    // We must replace localhost with the actual production URL
    const productionUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

    // Check if URL contains localhost and needs to be replaced
    if (resetUrl.includes("localhost")) {
      console.log("[Password Reset] Original URL contains localhost, replacing...")
      console.log("[Password Reset] Original:", resetUrl.substring(0, 50) + "...")

      // Replace localhost:PORT with production URL
      resetUrl = resetUrl.replace(/https?:\/\/localhost(:\d+)?/gi, productionUrl)

      console.log("[Password Reset] Fixed:", resetUrl.substring(0, 50) + "...")
    }

    // Also fix if URL uses 127.0.0.1
    if (resetUrl.includes("127.0.0.1")) {
      resetUrl = resetUrl.replace(/https?:\/\/127\.0\.0\.1(:\d+)?/gi, productionUrl)
    }

    const userName = (profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : null) || authUser.user_metadata?.full_name || email.split("@")[0]

    // Always use notification system for password reset emails
    // This ensures consistent branding with dynamic colors from org settings
    // The notification system will:
    // 1. Try org email provider if configured
    // 2. Fall back to platform-level Resend API if org email not configured
    const result = await sendNotification(supabase, {
      eventCode: "password_reset",
      orgId: orgId || "platform", // Use "platform" for users without org
      recipients: [{ email: authUser.email!, name: userName }],
      variables: {
        user_name: userName,
        receiver_name: userName,
        reset_url: resetUrl,
        expiry_time: "1 hour",
      },
      forceEmail: true,
    })

    if (!result.emailSent) {
      console.error("Failed to send password reset email:", result.errors)
      // Log the error but still return success to not reveal user existence
      // The platform admin should monitor logs for email delivery issues
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
    })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json(
      { error: "An error occurred processing your request" },
      { status: 500 }
    )
  }
}
