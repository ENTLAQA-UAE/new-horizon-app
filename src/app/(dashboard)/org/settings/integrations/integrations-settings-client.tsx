"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Mail,
  Check,
  X,
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

interface EmailConfig {
  id: string
  email_provider: string
  from_email: string
  from_name: string
  reply_to_email: string | null
  is_enabled: boolean
  is_verified: boolean
}

interface IntegrationsSettingsClientProps {
  orgId: string
  orgName: string
  integrations: Integration[]
  emailConfig: EmailConfig | null
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
  emailConfig,
}: IntegrationsSettingsClientProps) {
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  // Email config state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailSettings, setEmailSettings] = useState({
    api_key: "",
    from_email: emailConfig?.from_email || "",
    from_name: emailConfig?.from_name || orgName,
    reply_to_email: emailConfig?.reply_to_email || "",
  })

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

  const handleSaveEmailConfig = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/org/integrations/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          ...emailSettings,
        }),
      })

      if (!response.ok) throw new Error("Failed to save")

      toast.success("Email configuration saved")
      setEmailDialogOpen(false)
      window.location.reload()
    } catch (error) {
      toast.error("Failed to save email configuration")
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestEmail = async () => {
    setIsTesting(true)
    try {
      const response = await fetch("/api/org/integrations/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, apiKey: emailSettings.api_key }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Email API key is valid!")
      } else {
        toast.error(result.error || "Invalid API key")
      }
    } catch (error) {
      toast.error("Failed to test API key")
    } finally {
      setIsTesting(false)
    }
  }

  const providerConfig = selectedProvider
    ? PROVIDER_CONFIG[selectedProvider as keyof typeof PROVIDER_CONFIG]
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integration Settings</h1>
        <p className="text-muted-foreground">
          Configure your organization&apos;s video meeting and email integrations
        </p>
      </div>

      <Tabs defaultValue="video" className="space-y-4">
        <TabsList>
          <TabsTrigger value="video" className="gap-2">
            <Video className="h-4 w-4" />
            Video Meetings
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            Email (Resend)
          </TabsTrigger>
        </TabsList>

        {/* Video Meetings Tab */}
        <TabsContent value="video" className="space-y-4">
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

                return (
                  <div
                    key={provider}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{config.name}</h3>
                          {integration?.is_verified && (
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

                    <div className="flex items-center gap-2">
                      {integration?.is_configured && (
                        <>
                          <Switch
                            checked={integration?.is_enabled ?? false}
                            onCheckedChange={(checked) => handleToggleIntegration(provider, checked)}
                          />
                          {integration?.is_verified && !integration?.is_default_meeting_provider && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefaultProvider(provider)}
                            >
                              Set Default
                            </Button>
                          )}
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfigureClick(provider)}
                      >
                        <Settings2 className="h-4 w-4 mr-1" />
                        {integration?.is_configured ? "Update" : "Configure"}
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
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email Notifications (Resend)</CardTitle>
              <CardDescription>
                Configure your Resend API key to send emails to candidates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Mail className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">Resend</h3>
                      {emailConfig?.is_verified && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <Check className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Send interview invitations, confirmations, and notifications
                    </p>
                    {emailConfig?.from_email && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Sending from: {emailConfig.from_name} &lt;{emailConfig.from_email}&gt;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {emailConfig && (
                    <Switch
                      checked={emailConfig?.is_enabled ?? false}
                      onCheckedChange={async (checked) => {
                        const response = await fetch("/api/org/integrations/email/toggle", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ orgId, enabled: checked }),
                        })
                        if (response.ok) {
                          toast.success(`Email ${checked ? "enabled" : "disabled"}`)
                          window.location.reload()
                        }
                      }}
                    />
                  )}
                  <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)}>
                    <Settings2 className="h-4 w-4 mr-1" />
                    {emailConfig ? "Update" : "Configure"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">How to get your Resend API Key</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">resend.com</a> and create an account</li>
                <li>Add and verify your domain (for sending from your email address)</li>
                <li>Go to API Keys and create a new key</li>
                <li>Copy the API key and paste it in the configuration above</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

      {/* Email Configuration Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Email (Resend)</DialogTitle>
            <DialogDescription>
              Enter your Resend API key and sender information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="api_key">Resend API Key</Label>
              <div className="relative">
                <Input
                  id="api_key"
                  type={showSecrets.api_key ? "text" : "password"}
                  placeholder="re_xxxxxxxxxx"
                  value={emailSettings.api_key}
                  onChange={(e) =>
                    setEmailSettings((prev) => ({ ...prev, api_key: e.target.value }))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowSecrets((prev) => ({ ...prev, api_key: !prev.api_key }))}
                >
                  {showSecrets.api_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from_email">From Email</Label>
              <Input
                id="from_email"
                type="email"
                placeholder="hr@yourcompany.com"
                value={emailSettings.from_email}
                onChange={(e) =>
                  setEmailSettings((prev) => ({ ...prev, from_email: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Must be from a verified domain in Resend
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from_name">From Name</Label>
              <Input
                id="from_name"
                placeholder="Your Company HR"
                value={emailSettings.from_name}
                onChange={(e) =>
                  setEmailSettings((prev) => ({ ...prev, from_name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reply_to_email">Reply-To Email (Optional)</Label>
              <Input
                id="reply_to_email"
                type="email"
                placeholder="careers@yourcompany.com"
                value={emailSettings.reply_to_email}
                onChange={(e) =>
                  setEmailSettings((prev) => ({ ...prev, reply_to_email: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleTestEmail} disabled={isTesting}>
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Test API Key
            </Button>
            <Button onClick={handleSaveEmailConfig} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
