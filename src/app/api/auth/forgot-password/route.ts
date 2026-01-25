// @ts-nocheck
/**
 * Custom Password Reset Endpoint
 *
 * Uses the notification system to send password reset emails with custom templates
 * instead of Supabase's default email.
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

    // Look up the user by email to get their profile info
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email, org_id")
      .eq("email", email.toLowerCase())
      .single()

    // Look up user in auth.users by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      console.error("Failed to list users:", userError)
      // Still return success for security
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
      // Return success even if user doesn't exist
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      })
    }

    // Generate password reset link using Supabase Admin API
    const baseUrl = redirectUrl || `${request.nextUrl.origin}/reset-password`

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

    // The generated link contains a token that needs to be used
    const resetUrl = linkData.properties?.action_link

    if (!resetUrl) {
      console.error("No action_link in response:", linkData)
      return NextResponse.json(
        { error: "Failed to generate reset link" },
        { status: 500 }
      )
    }

    // Get user's name for the email
    const userName = profile?.full_name || authUser.user_metadata?.full_name || email.split("@")[0]

    // Get org_id for template lookup (use profile's org or null for default template)
    const orgId = profile?.org_id || null

    // Send password reset email using notification system
    await sendNotification(supabase, {
      eventCode: "password_reset",
      orgId: orgId,
      recipients: [{ email: authUser.email!, name: userName }],
      variables: {
        receiver_name: userName,
        reset_url: resetUrl,
      },
      forceEmail: true, // Always send email for password reset
    })

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
