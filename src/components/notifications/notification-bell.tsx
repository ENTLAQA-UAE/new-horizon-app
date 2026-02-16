"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { KawadirIcon } from "@/components/ui/kawadir-icon"
import {
  Bell,
  BellOff,
  CheckCheck,
  FileText,
  Calendar,
  UserCheck,
  Briefcase,
  MessageSquare,
  AlertCircle,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  application_received: FileText,
  application_status_changed: UserCheck,
  interview_scheduled: Calendar,
  interview_reminder: Calendar,
  candidate_scored: KawadirIcon,
  offer_sent: Briefcase,
  team_mention: MessageSquare,
  job_published: Briefcase,
  job_closed: BellOff,
  system: AlertCircle,
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/notifications?limit=20")
      if (!response.ok) {
        console.error("Failed to fetch notifications:", response.status)
        return
      }
      const data = await response.json()
      if (data.notifications) {
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications?count=true")
      if (!response.ok) return
      const data = await response.json()
      if (typeof data.count === "number") {
        setUnreadCount(data.count)
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error)
    }
  }, [])

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", notificationId }),
      })
      if (!response.ok) {
        console.error("Failed to mark notification as read:", response.status)
        return
      }
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      })
      if (!response.ok) {
        console.error("Failed to mark all as read:", response.status)
        return
      }
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  // Poll for unread count on mount and every 30 seconds
  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  // Fetch notifications and accurate count when popover opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
      fetchUnreadCount()
    }
  }, [isOpen, fetchNotifications, fetchUnreadCount])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={markAllAsRead}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BellOff className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Bell
                const content = (
                  <div
                    className={`flex gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                      !notification.is_read ? "bg-primary/5" : ""
                    }`}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsRead(notification.id)
                      }
                    }}
                  >
                    <div
                      className={`mt-1 p-2 rounded-full ${
                        notification.is_read
                          ? "bg-muted"
                          : "bg-primary/10"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          notification.is_read
                            ? "text-muted-foreground"
                            : "text-primary"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm ${
                            notification.is_read
                              ? "font-normal"
                              : "font-medium"
                          }`}
                        >
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                )

                if (notification.link) {
                  return (
                    <Link
                      key={notification.id}
                      href={notification.link}
                      onClick={() => setIsOpen(false)}
                    >
                      {content}
                    </Link>
                  )
                }

                return <div key={notification.id}>{content}</div>
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
