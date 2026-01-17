"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Video,
  Calendar,
  Mail,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Settings,
  Loader2,
} from "lucide-react"

interface ConnectedProvider {
  provider: string
  metadata: Record<string, unknown>
  connectedAt: string
  expiresAt: string | null
}

interface OrgIntegration {
  id: string
  provider: string
  is_enabled: boolean
  default_for_interviews: boolean
  settings: Record<string, unknown>
}

interface IntegrationsClientProps {
  connectedProviders: ConnectedProvider[]
  orgIntegrations: OrgIntegration[]
  isOrgAdmin: boolean
}

const integrationConfig = {
  zoom: {
    name: "Zoom",
    description: "Create Zoom meetings for interviews",
    icon: Video,
    color: "bg-blue-500",
    connectUrl: "/api/zoom/connect",
  },
  microsoft: {
    name: "Microsoft 365",
    description: "Teams meetings & Outlook calendar integration",
    icon: Calendar,
    color: "bg-purple-500",
    connectUrl: "/api/microsoft/connect",
  },
  google_calendar: {
    name: "Google Calendar",
    description: "Sync interviews with Google Calendar & Meet",
    icon: Calendar,
    color: "bg-green-500",
    connectUrl: "/api/google/connect",
  },
}

export function IntegrationsClient({
  connectedProviders,
  orgIntegrations,
  isOrgAdmin,
}: IntegrationsClientProps) {
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  const isConnected = (provider: string) =>
    connectedProviders.some((p) => p.provider === provider)

  const getProviderData = (provider: string) =>
    connectedProviders.find((p) => p.provider === provider)

  const handleConnect = (provider: string) => {
    const config = integrationConfig[provider as keyof typeof integrationConfig]
    if (config) {
      const redirectUrl = encodeURIComponent("/org/settings/integrations")
      window.location.href = `${config.connectUrl}?redirect=${redirectUrl}`
    }
  }

  const handleDisconnect = async (provider: string) => {
    setDisconnecting(provider)
    try {
      const response = await fetch(`/api/integrations/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      })

      if (!response.ok) {
        throw new Error("Failed to disconnect")
      }

      toast.success(`${integrationConfig[provider as keyof typeof integrationConfig]?.name || provider} disconnected`)
      window.location.reload()
    } catch (error) {
      toast.error("Failed to disconnect integration")
    } finally {
      setDisconnecting(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Connect external services for video meetings and calendar sync
        </p>
      </div>

      {/* Video Conferencing Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Video Conferencing</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Zoom Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Video className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Zoom</CardTitle>
                    <CardDescription className="text-xs">Video meetings</CardDescription>
                  </div>
                </div>
                {isConnected("zoom") ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <Check className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline">Not connected</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isConnected("zoom") ? (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {getProviderData("zoom")?.metadata?.email && (
                      <p>Connected as: {String(getProviderData("zoom")?.metadata?.email)}</p>
                    )}
                    <p>Connected: {formatDate(getProviderData("zoom")?.connectedAt || "")}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnect("zoom")}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reconnect
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect("zoom")}
                      disabled={disconnecting === "zoom"}
                    >
                      {disconnecting === "zoom" ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => handleConnect("zoom")} className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect Zoom
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Microsoft Teams Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Video className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Microsoft Teams</CardTitle>
                    <CardDescription className="text-xs">Teams meetings & Outlook</CardDescription>
                  </div>
                </div>
                {isConnected("microsoft") ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <Check className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline">Not connected</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isConnected("microsoft") ? (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {getProviderData("microsoft")?.metadata?.email && (
                      <p>Connected as: {String(getProviderData("microsoft")?.metadata?.email)}</p>
                    )}
                    <p>Connected: {formatDate(getProviderData("microsoft")?.connectedAt || "")}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnect("microsoft")}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reconnect
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect("microsoft")}
                      disabled={disconnecting === "microsoft"}
                    >
                      {disconnecting === "microsoft" ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => handleConnect("microsoft")} className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect Microsoft
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Google Meet Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Video className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Google Meet</CardTitle>
                    <CardDescription className="text-xs">Calendar & video</CardDescription>
                  </div>
                </div>
                {isConnected("google_calendar") ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <Check className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline">Not connected</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isConnected("google_calendar") ? (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {getProviderData("google_calendar")?.metadata?.email && (
                      <p>Connected as: {String(getProviderData("google_calendar")?.metadata?.email)}</p>
                    )}
                    <p>Connected: {formatDate(getProviderData("google_calendar")?.connectedAt || "")}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnect("google_calendar")}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reconnect
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect("google_calendar")}
                      disabled={disconnecting === "google_calendar"}
                    >
                      {disconnecting === "google_calendar" ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => handleConnect("google_calendar")} className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect Google
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Default Meeting Provider Section */}
      {isOrgAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Default Meeting Provider
            </CardTitle>
            <CardDescription>
              Set the default video meeting provider for interviews in your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Video className="h-4 w-4 text-blue-500" />
                  <Label>Zoom</Label>
                </div>
                <Switch disabled={!isConnected("zoom")} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Video className="h-4 w-4 text-purple-500" />
                  <Label>Microsoft Teams</Label>
                </div>
                <Switch disabled={!isConnected("microsoft")} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Video className="h-4 w-4 text-green-500" />
                  <Label>Google Meet</Label>
                </div>
                <Switch disabled={!isConnected("google_calendar")} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Connect a provider above to set it as the default for new interviews
            </p>
          </CardContent>
        </Card>
      )}

      {/* API Keys / Webhook Info */}
      {isOrgAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Webhook & API Configuration</CardTitle>
            <CardDescription>
              Configure webhooks for real-time updates from integrated services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Zoom Webhook URL</p>
                <code className="text-xs text-muted-foreground break-all">
                  {process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"}/api/zoom/webhook
                </code>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Required Environment Variables</p>
                <div className="text-xs text-muted-foreground space-y-1 font-mono">
                  <p>ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET</p>
                  <p>MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET</p>
                  <p>GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
