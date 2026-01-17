import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
} from "@/lib/notifications/notification-service"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const unreadOnly = url.searchParams.get("unread") === "true"
    const countOnly = url.searchParams.get("count") === "true"
    const limit = parseInt(url.searchParams.get("limit") || "50")

    if (countOnly) {
      const count = await getUnreadCount(supabase, user.id)
      return NextResponse.json({ count })
    }

    const notifications = await getUserNotifications(
      supabase,
      user.id,
      limit,
      unreadOnly
    )

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Notifications error:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, notificationId } = body

    if (action === "mark_read" && notificationId) {
      await markNotificationAsRead(supabase, notificationId)
      return NextResponse.json({ success: true })
    }

    if (action === "mark_all_read") {
      await markAllNotificationsAsRead(supabase, user.id)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Notifications update error:", error)
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    )
  }
}
