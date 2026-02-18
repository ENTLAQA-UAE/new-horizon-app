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
  ExternalLink,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react"
import { IntegrationView } from "@/lib/transforms/integration"

interface IntegrationsSettingsClientProps {
  orgId: string
  orgName: string
  integrations: IntegrationView[]
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
    setupGuide: [
      "Go to the Zoom App Marketplace (marketplace.zoom.us) and sign in with your Zoom account.",
      "Click \"Develop\" in the top menu, then select \"Build App\".",
      "Choose \"Server-to-Server OAuth\" as the app type and click \"Create\".",
      "Give your app a name (e.g., \"Kawadir Interviews\") and click \"Create\".",
      "On the App Credentials page, copy the \"Account ID\", \"Client ID\" and \"Client Secret\".",
      "Go to the \"Scopes\" tab and add these scopes: meeting:write:admin, meeting:read:admin, user:read:admin.",
      "Click \"Continue\" and then \"Activate your app\".",
      "Paste the Client ID and Client Secret in the fields above.",
    ],
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
      { key: "tenant_id", label: "Tenant ID", type: "text", placeholder: "Your Azure AD tenant ID" },
    ],
    helpUrl: "https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade",
    helpText: "Create an App Registration in Azure Portal",
    setupGuide: [
      "Go to the Azure Portal (portal.azure.com) and sign in with your Microsoft 365 admin account.",
      "Navigate to \"Azure Active Directory\" > \"App registrations\" > \"New registration\".",
      "Enter a name (e.g., \"Kawadir Interviews\"), select \"Accounts in this organizational directory only\", and click \"Register\".",
      "On the Overview page, copy the \"Application (client) ID\" and \"Directory (tenant) ID\".",
      "Go to \"Certificates & secrets\" > \"New client secret\", add a description, choose an expiry, and click \"Add\". Copy the secret value immediately (it won't be shown again).",
      "Go to \"API permissions\" > \"Add a permission\" > \"Microsoft Graph\" > \"Application permissions\".",
      "Add these permissions: OnlineMeetings.ReadWrite.All, Calendars.ReadWrite, User.Read.All.",
      "Click \"Grant admin consent for [your org]\" to authorize the permissions.",
      "Paste the Application ID, Client Secret, and Tenant ID in the fields above.",
    ],
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
    setupGuide: [
      "Go to the Google Cloud Console (console.cloud.google.com) and sign in with your Google Workspace admin account.",
      "Create a new project or select an existing one from the project dropdown at the top.",
      "Go to \"APIs & Services\" > \"Library\". Search for and enable: \"Google Calendar API\" and \"Google Meet REST API\".",
      "Go to \"APIs & Services\" > \"OAuth consent screen\". Select \"Internal\" (for Workspace) or \"External\", fill in the app name, and save.",
      "Go to \"APIs & Services\" > \"Credentials\" > \"Create Credentials\" > \"OAuth 2.0 Client IDs\".",
      "Select \"Web application\" as the application type.",
      "Under \"Authorized redirect URIs\", add your app's callback URL (e.g., https://your-domain.com/api/google/callback).",
      "Click \"Create\" and copy the \"Client ID\" and \"Client Secret\".",
      "Paste the Client ID and Client Secret in the fields above.",
    ],
  },
}

export function IntegrationsSettingsClient({
  orgId,
  orgName,
  integrations,
}: IntegrationsSettingsClientProps) {
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [providerToDelete, setProviderToDelete] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSetupGuide, setShowSetupGuide] = useState(false)

  const getIntegration = (provider: string) =>
    integrations.find((i) => i.provider === provider)

  const handleConfigureClick = (provider: string) => {
    setSelectedProvider(provider)
    setCredentials({})
    setShowSecrets({})
    setShowSetupGuide(false)
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

  const handleDeleteClick = (provider: string) => {
    setProviderToDelete(provider)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!providerToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch("/api/org/integrations/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, provider: providerToDelete }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete integration")
      }

      toast.success(`${PROVIDER_CONFIG[providerToDelete as keyof typeof PROVIDER_CONFIG]?.name} configuration removed`)
      setDeleteDialogOpen(false)
      setProviderToDelete(null)
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete integration")
    } finally {
      setIsDeleting(false)
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
                const isEnabled = integration?.isEnabled ?? false
                const isConfigured = integration?.isConfigured ?? false
                const isVerified = integration?.isVerified ?? false

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
                          {integration?.isDefaultMeetingProvider && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                        {integration?.providerMetadata?.email && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Connected: {String(integration.providerMetadata.email)}
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
                      {isEnabled && isVerified && !integration?.isDefaultMeetingProvider && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefaultProvider(provider)}
                        >
                          Set Default
                        </Button>
                      )}

                      {/* Connect Account button - shown when configured but not verified */}
                      {isConfigured && !isVerified && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            window.location.href = `/api/org/integrations/connect?provider=${provider}&redirect=/org/settings/integrations`
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Connect Account
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

                      {/* Remove button - shown when configured */}
                      {isConfigured && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(provider)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
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

            {/* Setup Guide */}
            {providerConfig?.setupGuide && (
              <div className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium bg-muted/50 hover:bg-muted transition-colors"
                  onClick={() => setShowSetupGuide(!showSetupGuide)}
                >
                  <span className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    Step-by-step setup guide
                  </span>
                  {showSetupGuide ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {showSetupGuide && (
                  <div className="px-3 py-3 space-y-2 bg-muted/20">
                    <ol className="list-decimal list-outside space-y-2 text-sm text-muted-foreground ml-4">
                      {providerConfig.setupGuide.map((step: string, i: number) => (
                        <li key={i} className="leading-relaxed">{step}</li>
                      ))}
                    </ol>
                    {providerConfig.helpUrl && (
                      <a
                        href={providerConfig.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open {providerConfig.name} Console
                      </a>
                    )}
                  </div>
                )}
              </div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Remove Integration
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the{" "}
              <strong>
                {providerToDelete
                  ? PROVIDER_CONFIG[providerToDelete as keyof typeof PROVIDER_CONFIG]?.name
                  : ""}
              </strong>{" "}
              integration? This will:
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Delete all saved credentials for this provider</li>
              <li>Disconnect the linked account</li>
              <li>Remove it as the default meeting provider (if applicable)</li>
            </ul>
            <p className="mt-4 text-sm font-medium">
              You can reconfigure this integration at any time.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setProviderToDelete(null)
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Remove Integration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
