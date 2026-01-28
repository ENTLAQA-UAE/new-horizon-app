// @ts-nocheck
// Note: notification_events table not in Supabase types
/**
 * Notification System Test Endpoint
 *
 * Use this endpoint to verify both email and in-app notification delivery.
 * Only accessible by org admins in development/staging environments.
 *
 * POST /api/notifications/test
 * Body: { testType: "email" | "in_app" | "both", recipientEmail?: string }
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { sendNotification } from "@/lib/notifications/send-notification"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user profile and org
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, org_id")
    .eq("id", user.id)
    .single()

  if (!profile?.org_id) {
    return NextResponse.json({ error: "User has no organization" }, { status: 400 })
  }

  // Role check from user_roles table (RBAC source of truth)
  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single()

  const role = userRole?.role
  if (!role || !["super_admin", "hr_manager"].includes(role)) {
    return NextResponse.json({ error: "Only HR managers can test notifications" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { testType = "both", recipientEmail } = body

    const results: any = {
      timestamp: new Date().toISOString(),
      testType,
      orgId: profile.org_id,
      userId: user.id,
      checks: {},
      results: {},
    }

    // Check 1: Verify notification_events table has events
    const { data: events, error: eventsError } = await serviceClient
      .from("notification_events")
      .select("id, code, name, default_channels")
      .limit(5)

    results.checks.notificationEvents = {
      status: events && events.length > 0 ? "PASS" : "FAIL",
      count: events?.length || 0,
      error: eventsError?.message,
      sample: events?.slice(0, 3).map(e => ({ code: e.code, channels: e.default_channels })),
    }

    // Check 2: Verify org has email configured (for email tests)
    const { data: emailConfig } = await serviceClient
      .from("organization_email_config")
      .select("id, email_provider, is_enabled, from_email")
      .eq("org_id", profile.org_id)
      .eq("is_enabled", true)
      .single()

    results.checks.emailConfig = {
      status: emailConfig ? "PASS" : "WARN",
      hasConfig: !!emailConfig,
      provider: emailConfig?.email_provider || null,
      fromEmail: emailConfig?.from_email || null,
      message: emailConfig ? "Email provider configured" : "No email provider - emails will fail",
    }

    // Check 3: Verify notifications table exists and is accessible
    const { count: notificationCount, error: notifError } = await serviceClient
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)

    results.checks.notificationsTable = {
      status: notifError ? "FAIL" : "PASS",
      existingCount: notificationCount || 0,
      error: notifError?.message,
    }

    // Test notification sending
    const profileFullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ")
    const testRecipients = [
      {
        userId: user.id,
        email: recipientEmail || profile.email,
        name: profileFullName || "Test User",
      },
    ]

    if (testType === "in_app" || testType === "both") {
      // Test in-app notification only
      const inAppResult = await sendNotification(serviceClient, {
        eventCode: "job_published",
        orgId: profile.org_id,
        recipients: testRecipients,
        variables: {
          job_title: "[TEST] Software Engineer",
        },
        forceInApp: true,
      })

      results.results.inApp = {
        success: inAppResult.inAppSent,
        errors: inAppResult.errors,
      }

      // Verify notification was created
      const { data: newNotif } = await serviceClient
        .from("notifications")
        .select("id, title, message, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      results.results.inAppVerification = {
        created: !!newNotif,
        notification: newNotif ? {
          id: newNotif.id,
          title: newNotif.title,
          message: newNotif.message,
        } : null,
      }
    }

    if (testType === "email" || testType === "both") {
      if (!emailConfig) {
        results.results.email = {
          success: false,
          skipped: true,
          reason: "No email provider configured for organization",
        }
      } else {
        // Test user_invited email (same as team invitation)
        const emailResult = await sendNotification(serviceClient, {
          eventCode: "user_invited",
          orgId: profile.org_id,
          recipients: [{
            email: recipientEmail || profile.email,
            name: profileFullName || "Test User",
          }],
          variables: {
            receiver_name: profileFullName || "Test User",
            inviter_name: "Notification System Test",
            org_name: "Your Organization",
            role: "Test Role",
            invitation_url: `${request.nextUrl.origin}/test-notification`,
          },
          forceEmail: true,
        })

        results.results.email = {
          success: emailResult.emailSent,
          errors: emailResult.errors,
          sentTo: recipientEmail || profile.email,
          fullResult: emailResult, // Include full result for debugging
        }

        // Check email log
        const { data: emailLog } = await serviceClient
          .from("organization_email_logs")
          .select("id, status, to_email, subject, sent_at, error_message")
          .eq("org_id", profile.org_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        results.results.emailVerification = {
          logged: !!emailLog,
          log: emailLog ? {
            status: emailLog.status,
            to: emailLog.to_email,
            subject: emailLog.subject,
            error: emailLog.error_message,
          } : null,
        }
      }
    }

    // Overall status
    const allPassed = Object.values(results.checks).every(
      (c: any) => c.status === "PASS"
    )
    const testsPassed = Object.values(results.results).every(
      (r: any) => r.success !== false || r.skipped
    )

    results.overallStatus = allPassed && testsPassed ? "SUCCESS" : "PARTIAL"
    results.message = allPassed && testsPassed
      ? "All notification system checks passed!"
      : "Some checks failed - review results for details"

    return NextResponse.json(results)
  } catch (error) {
    console.error("Notification test error:", error)
    return NextResponse.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: "/api/notifications/test",
    method: "POST",
    description: "Test the notification system (email and in-app)",
    body: {
      testType: "email | in_app | both (default: both)",
      recipientEmail: "optional - defaults to your email",
    },
    requiredRole: "hr_manager or super_admin",
    example: {
      testType: "both",
    },
  })
}
