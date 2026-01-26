/**
 * Test endpoint for in-app notifications
 * Creates a test notification for the current user
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/notifications/notification-service"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const testType = body.type || "system"

    // Create a test notification for the current user
    const notification = await createNotification(supabase, user.id, {
      type: testType,
      title: "Test Notification",
      message: `This is a test notification created at ${new Date().toLocaleTimeString()}`,
      link: "/org/dashboard",
    })

    if (notification) {
      return NextResponse.json({
        success: true,
        message: "Test notification created successfully",
        notification,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: "Failed to create test notification",
      }, { status: 500 })
    }
  } catch (err) {
    console.error("Test notification error:", err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }, { status: 500 })
  }
}
