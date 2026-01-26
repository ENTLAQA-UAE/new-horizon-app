// @ts-nocheck
/**
 * Custom Password Reset Endpoint
 *
 * Uses the notification system to send password reset emails with custom templates
 * instead of Supabase's default email.
 *
 * Falls back to Supabase's built-in email for orgs without email configured.
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

    // Get org_id for template lookup
    const orgId = profile?.org_id || null

    // Check if org has email configured
    let hasEmailConfig = false
    if (orgId) {
      const { data: emailConfig } = await supabase
        .from("organization_email_config")
        .select("id")
        .eq("org_id", orgId)
        .eq("is_enabled", true)
        .single()

      hasEmailConfig = !!emailConfig
    }

    if (hasEmailConfig && orgId) {
      // Use custom notification template with org's email provider
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

      // Ensure the reset URL uses the production domain, not localhost
      // Supabase's generateLink uses the Site URL from dashboard which may be misconfigured
      const productionUrl = process.env.NEXT_PUBLIC_APP_URL
      if (productionUrl && resetUrl.includes("localhost")) {
        resetUrl = resetUrl.replace(/http:\/\/localhost:\d+/, productionUrl)
      }

      const userName = (profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : null) || authUser.user_metadata?.full_name || email.split("@")[0]

      // Send email using notification system
      const result = await sendNotification(supabase, {
        eventCode: "password_reset",
        orgId: orgId,
        recipients: [{ email: authUser.email!, name: userName }],
        variables: {
          user_name: userName,  // Template uses {{user_name}}
          reset_url: resetUrl,
          expiry_time: "1 hour",
        },
        forceEmail: true,
      })

      if (!result.emailSent) {
        console.error("Failed to send password reset email via notification system:", result.errors)
        // Fall back to Supabase's built-in email
        await supabase.auth.resetPasswordForEmail(authUser.email!, {
          redirectTo: baseUrl,
        })
      }
    } else {
      // No email configured - use Supabase's built-in password reset email
      // This uses Supabase's default SMTP settings
      await supabase.auth.resetPasswordForEmail(authUser.email!, {
        redirectTo: baseUrl,
      })
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
