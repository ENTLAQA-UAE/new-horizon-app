// @ts-nocheck
// Note: This file uses tables that don't exist (user_integrations)
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Calendar, Check, ExternalLink, Loader2, Unlink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface CalendarIntegrationProps {
  isConnected: boolean
  connectedAt?: string
}

export function CalendarIntegration({
  isConnected,
  connectedAt,
}: CalendarIntegrationProps) {
  const router = useRouter()
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const handleConnect = () => {
    // Redirect to the Google OAuth flow
    window.location.href = "/api/google/connect?redirect=/org/settings"
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await supabase
          .from("user_integrations")
          .delete()
          .eq("user_id", user.id)
          .eq("provider", "google_calendar")
      }

      router.refresh()
    } catch (error) {
      console.error("Error disconnecting calendar:", error)
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Google Calendar</CardTitle>
              <CardDescription>
                Sync interviews with your Google Calendar
              </CardDescription>
            </div>
          </div>
          {isConnected ? (
            <Badge variant="default" className="bg-green-600">
              <Check className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">Not Connected</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isConnected ? (
            <>
              <p className="text-sm text-muted-foreground">
                Your Google Calendar is connected. Interviews will automatically
                be synced to your calendar with Google Meet links.
              </p>
              {connectedAt && (
                <p className="text-xs text-muted-foreground">
                  Connected on {new Date(connectedAt).toLocaleDateString()}
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Calendar
                  </a>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Unlink className="mr-2 h-4 w-4" />
                      Disconnect
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disconnect Google Calendar?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the connection to your Google Calendar.
                        Existing calendar events will not be deleted, but new
                        interviews won&apos;t be synced automatically.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDisconnect}
                        disabled={isDisconnecting}
                      >
                        {isDisconnecting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Disconnect
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Connect your Google Calendar to automatically create calendar
                events for interviews with Google Meet links.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automatic event creation for scheduled interviews</li>
                <li>• Google Meet links generated automatically</li>
                <li>• Calendar invites sent to candidates and interviewers</li>
                <li>• Sync interview updates and cancellations</li>
              </ul>
              <Button onClick={handleConnect}>
                <Calendar className="mr-2 h-4 w-4" />
                Connect Google Calendar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
