"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Video,
  Check,
  Eye,
  EyeOff,
  TestTube,
  Loader2,
  Settings2,
  Shield,
  Star,
} from "lucide-react"

interface Integration {
  id: string
  provider: string
  is_enabled: boolean
  is_configured: boolean
  is_verified: boolean
  is_default_meeting_provider: boolean
  provider_metadata: Record<string, unknown> | null
  verified_at: string | null
}

interface IntegrationsSettingsClientProps {
  orgId: string
  orgName: string
  integrations: Integration[]
}

const PROVIDER_CONFIG = {
  zoom: {
    name: "Zoom",
    description: "Video meetings for interviews",
    icon: Video,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    fields: [
      { key: "client_id", label: "Client ID", type: "text", placeholder: "Your Zoom OAuth App Client ID" },
      { key: "client_secret", label: "Client Secret", type: "password", placeholder: "Your Zoom OAuth App Client Secret" },
      { key: "webhook_secret", label: "Webhook Secret (Optional)", type: "password", placeholder: "For webhook verification" },
    ],
    helpUrl: "https://marketplace.zoom.us/develop/create",
    helpText: "Create an OAuth App at Zoom Marketplace",
  },
  microsoft: {
    name: "Microsoft 365",
    description: "Teams meetings & Outlook calendar",
    icon: Video,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    fields: [
      { key: "client_id", label: "Application (Client) ID", type: "text", placeholder: "Azure AD App Client ID" },
      { key: "client_secret", label: "Client Secret", type: "password", placeholder: "Azure AD App Client Secret" },
      { key: "tenant_id", label: "Tenant ID", type: "text", placeholder: "common (for multi-tenant) or your tenant ID" },
    ],
    helpUrl: "https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade",
    helpText: "Create an App Registration in Azure Portal",
  },
  google: {
    name: "Google Workspace",
    description: "Google Meet & Calendar",
    icon: Video,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    fields: [
      { key: "client_id", label: "Client ID", type: "text", placeholder: "Google OAuth Client ID" },
      { key: "client_secret", label: "Client Secret", type: "password", placeholder: "Google OAuth Client Secret" },
    ],
    helpUrl: "https://console.cloud.google.com/apis/credentials",
    helpText: "Create OAuth credentials in Google Cloud Console",
  },
}

export function IntegrationsSettingsClient({
  orgId,
  orgName,
  integrations,
}: IntegrationsSettingsClientProps) {
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const getIntegration = (provider: string) =>
    integrations.find((i) => i.provider === provider)

  const handleConfigureClick = (provider: string) => {
    setSelectedProvider(provider)
    setCredentials({})
    setShowSecrets({})
    setConfigDialogOpen(true)
  }

  const handleSaveCredentials = async () => {
    if (!selectedProvider) return

    setIsSaving(true)
    try {
      const response = await fetch("/api/org/integrations/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          provider: selectedProvider,
          credentials,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save credentials")
      }

      toast.success("Credentials saved successfully")
      setConfigDialogOpen(false)
      window.location.reload()
    } catch (error) {
      toast.error("Failed to save credentials")
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestCredentials = async () => {
    if (!selectedProvider) return

    setIsTesting(true)
    try {
      const response = await fetch("/api/org/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          provider: selectedProvider,
          credentials,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Connection successful! Connected as: ${result.email || "verified"}`)
      } else {
        toast.error(result.error || "Connection test failed")
      }
    } catch (error) {
      toast.error("Failed to test credentials")
    } finally {
      setIsTesting(false)
    }
  }

  const handleToggleIntegration = async (provider: string, enabled: boolean) => {
    try {
      const response = await fetch("/api/org/integrations/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, provider, enabled }),
      })

      if (!response.ok) throw new Error("Failed to update")

      toast.success(`${PROVIDER_CONFIG[provider as keyof typeof PROVIDER_CONFIG]?.name} ${enabled ? "enabled" : "disabled"}`)
      window.location.reload()
    } catch (error) {
      toast.error("Failed to update integration")
    }
  }

  const handleSetDefaultProvider = async (provider: string) => {
    try {
      const response = await fetch("/api/org/integrations/default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, provider }),
      })

      if (!response.ok) throw new Error("Failed to set default")

      toast.success(`${PROVIDER_CONFIG[provider as keyof typeof PROVIDER_CONFIG]?.name} set as default for interviews`)
      window.location.reload()
    } catch (error) {
      toast.error("Failed to set default provider")
    }
  }

  const providerConfig = selectedProvider
    ? PROVIDER_CONFIG[selectedProvider as keyof typeof PROVIDER_CONFIG]
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Video Integration</h1>
        <p className="text-muted-foreground">
          Configure your organization&apos;s video meeting integrations for interviews
        </p>
      </div>

      <Card>
            <CardHeader>
              <CardTitle className="text-lg">Video Meeting Providers</CardTitle>
              <CardDescription>
                Connect your organization&apos;s video conferencing accounts for interview scheduling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(["zoom", "microsoft", "google"] as const).map((provider) => {
                const config = PROVIDER_CONFIG[provider]
                const integration = getIntegration(provider)
                const Icon = config.icon
                const isEnabled = integration?.is_enabled ?? false
                const isConfigured = integration?.is_configured ?? false
                const isVerified = integration?.is_verified ?? false

                return (
                  <div
                    key={provider}
                    className={cn(
                      "flex items-center justify-between p-4 border rounded-lg transition-colors",
                      isEnabled ? "border-primary/50 bg-primary/5" : "border-border"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{config.name}</h3>
                          {isEnabled && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              Active
                            </Badge>
                          )}
                          {!isConfigured && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                              Not Configured
                            </Badge>
                          )}
                          {isConfigured && isVerified && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              <Check className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          {integration?.is_default_meeting_provider && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                        {integration?.provider_metadata?.email && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Connected: {String(integration.provider_metadata.email)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Enable/Disable Toggle - Always visible */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {isEnabled ? "Enabled" : "Disabled"}
                        </span>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => handleToggleIntegration(provider, checked)}
                          disabled={!isConfigured}
                        />
                      </div>

                      {/* Set as Default button */}
                      {isEnabled && isVerified && !integration?.is_default_meeting_provider && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefaultProvider(provider)}
                        >
                          Set Default
                        </Button>
                      )}

                      {/* Configure button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfigureClick(provider)}
                      >
                        <Settings2 className="h-4 w-4 mr-1" />
                        {isConfigured ? "Update" : "Configure"}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security Note
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your API credentials are encrypted using AES-256 encryption before being stored.
                We never log or expose your credentials in plain text.
              </p>
            </CardContent>
          </Card>

      {/* Configure Credentials Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure {providerConfig?.name}</DialogTitle>
            <DialogDescription>
              Enter your API credentials. These will be encrypted and stored securely.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {providerConfig?.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <div className="relative">
                  <Input
                    id={field.key}
                    type={field.type === "password" && !showSecrets[field.key] ? "password" : "text"}
                    placeholder={field.placeholder}
                    value={credentials[field.key] || ""}
                    onChange={(e) =>
                      setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                  />
                  {field.type === "password" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() =>
                        setShowSecrets((prev) => ({ ...prev, [field.key]: !prev[field.key] }))
                      }
                    >
                      {showSecrets[field.key] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {providerConfig?.helpUrl && (
              <p className="text-sm text-muted-foreground">
                {providerConfig.helpText}:{" "}
                <a
                  href={providerConfig.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Open {providerConfig.name}
                </a>
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleTestCredentials} disabled={isTesting}>
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
            <Button onClick={handleSaveCredentials} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
