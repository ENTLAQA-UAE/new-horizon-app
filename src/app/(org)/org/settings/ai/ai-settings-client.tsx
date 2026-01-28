"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toast } from "sonner"
import {
  Brain,
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
  Sparkles,
  Zap,
  FileText,
  Users,
  Copy,
} from "lucide-react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonValue = string | number | boolean | null | { [key: string]: any } | any[]

interface AIConfig {
  id: string
  provider: string
  is_enabled: boolean
  is_configured: boolean
  is_verified: boolean
  is_default_provider: boolean
  settings: JsonValue | null
  provider_metadata: JsonValue | null
  verified_at: string | null
  last_used_at: string | null
}

interface AISettingsClientProps {
  orgId: string
  orgName: string
  aiConfigs: AIConfig[]
}

const AI_PROVIDER_CONFIG = {
  anthropic: {
    name: "Anthropic Claude",
    description: "Advanced AI assistant with strong reasoning capabilities",
    icon: Brain,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    defaultModel: "claude-sonnet-4-20250514",
    models: [
      { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4 (Recommended)" },
      { id: "claude-opus-4-20250514", name: "Claude Opus 4 (Most Capable)" },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
      { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku (Fast)" },
    ],
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "sk-ant-api03-...", required: true },
    ],
    setupSteps: [
      "Go to console.anthropic.com and sign in or create an account",
      "Navigate to Settings > API Keys",
      "Click 'Create Key' and give it a descriptive name",
      "Copy the API key (it starts with 'sk-ant-')",
      "Paste it in the API Key field below",
    ],
    helpUrl: "https://console.anthropic.com/settings/keys",
    helpText: "Get API Key from Anthropic Console",
  },
  openai: {
    name: "OpenAI GPT",
    description: "Powerful language models including GPT-4o",
    icon: Sparkles,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    defaultModel: "gpt-4o",
    models: [
      { id: "gpt-4o", name: "GPT-4o (Recommended)" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini (Fast & Affordable)" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
      { id: "gpt-4", name: "GPT-4" },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo (Budget)" },
    ],
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "sk-proj-...", required: true },
      { key: "organization_id", label: "Organization ID (Optional)", type: "text", placeholder: "org-...", required: false },
    ],
    setupSteps: [
      "Go to platform.openai.com and sign in or create an account",
      "Navigate to API Keys section in the left sidebar",
      "Click 'Create new secret key'",
      "Give your key a name and set permissions",
      "Copy the API key (it starts with 'sk-')",
      "Paste it in the API Key field below",
    ],
    helpUrl: "https://platform.openai.com/api-keys",
    helpText: "Get API Key from OpenAI Platform",
  },
  gemini: {
    name: "Google Gemini",
    description: "Google's advanced multimodal AI model",
    icon: Zap,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    defaultModel: "gemini-1.5-pro",
    models: [
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (Recommended)" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Fast)" },
      { id: "gemini-pro", name: "Gemini Pro" },
    ],
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "AI...", required: true },
    ],
    setupSteps: [
      "Go to aistudio.google.com and sign in with your Google account",
      "Click 'Get API key' in the top right",
      "Select 'Create API key in new project' or choose an existing project",
      "Copy the generated API key",
      "Paste it in the API Key field below",
    ],
    helpUrl: "https://aistudio.google.com/app/apikey",
    helpText: "Get API Key from Google AI Studio",
  },
  perplexity: {
    name: "Perplexity AI",
    description: "AI with real-time web search capabilities",
    icon: Brain,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    defaultModel: "llama-3.1-sonar-large-128k-online",
    models: [
      { id: "llama-3.1-sonar-large-128k-online", name: "Sonar Large (Recommended)" },
      { id: "llama-3.1-sonar-small-128k-online", name: "Sonar Small (Fast)" },
      { id: "llama-3.1-sonar-huge-128k-online", name: "Sonar Huge (Most Capable)" },
    ],
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "pplx-...", required: true },
    ],
    setupSteps: [
      "Go to perplexity.ai and sign in or create an account",
      "Navigate to Settings > API",
      "Click 'Generate' to create a new API key",
      "Copy the API key (it starts with 'pplx-')",
      "Paste it in the API Key field below",
    ],
    helpUrl: "https://www.perplexity.ai/settings/api",
    helpText: "Get API Key from Perplexity Settings",
  },
}

type AIProvider = keyof typeof AI_PROVIDER_CONFIG

export function AISettingsClient({
  orgId,
  orgName,
  aiConfigs: initialConfigs,
}: AISettingsClientProps) {
  const [configs, setConfigs] = useState<AIConfig[]>(initialConfigs)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null)
  const [providerToDelete, setProviderToDelete] = useState<AIProvider | null>(null)
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [settings, setSettings] = useState<Record<string, string | number>>({})
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  // Fetch configs from API
  const fetchConfigs = async () => {
    try {
      const response = await fetch(`/api/org/ai/config?orgId=${orgId}`)
      if (response.ok) {
        const data = await response.json()
        setConfigs(data.configs || [])
      }
    } catch (error) {
      console.error("Failed to fetch AI configs:", error)
    }
  }
  const [isDeleting, setIsDeleting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; model?: string; error?: string } | null>(null)

  const getConfig = (provider: AIProvider) =>
    configs.find((c) => c.provider === provider)

  const handleConfigureClick = (provider: AIProvider) => {
    setSelectedProvider(provider)
    setCredentials({})
    setShowSecrets({})
    setTestResult(null)
    setConfigDialogOpen(true)
  }

  const handleSettingsClick = (provider: AIProvider) => {
    const config = getConfig(provider)
    setSelectedProvider(provider)
    setSettings({
      model: (config?.settings?.model as string) || AI_PROVIDER_CONFIG[provider].defaultModel,
      temperature: (config?.settings?.temperature as number) || 0.7,
      max_tokens: (config?.settings?.max_tokens as number) || 4096,
      custom_instructions: (config?.settings?.custom_instructions as string) || "",
    })
    setSettingsDialogOpen(true)
  }

  const handleSaveCredentials = async () => {
    if (!selectedProvider) return

    // Validate required fields
    const providerConfig = AI_PROVIDER_CONFIG[selectedProvider]
    for (const field of providerConfig.fields) {
      if (field.required && !credentials[field.key]) {
        toast.error(`${field.label} is required`)
        return
      }
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/org/ai/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          provider: selectedProvider,
          credentials,
          // Pass verification status if test was successful
          verified: testResult?.success === true,
          verifiedModel: testResult?.model,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to save credentials")
      }

      // Refresh configs to show updated status
      await fetchConfigs()

      if (testResult?.success) {
        toast.success("Credentials saved and verified successfully!")
        setConfigDialogOpen(false)
        setTestResult(null)
        setCredentials({})
      } else {
        toast.success("Credentials saved. Please test to verify.")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save credentials")
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestCredentials = async () => {
    if (!selectedProvider) return

    setIsTesting(true)
    setTestResult(null)
    try {
      const response = await fetch("/api/org/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          provider: selectedProvider,
          credentials: Object.keys(credentials).length > 0 ? credentials : undefined,
        }),
      })

      const result = await response.json()
      setTestResult(result)

      if (result.success) {
        toast.success(`Connection verified! Model: ${result.model || "Available"}`)
      } else {
        toast.error(result.error || "Connection test failed")
      }
    } catch (error) {
      toast.error("Failed to test credentials")
      setTestResult({ success: false, error: "Connection failed" })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!selectedProvider) return

    setIsSaving(true)
    try {
      const response = await fetch("/api/org/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          provider: selectedProvider,
          settings,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to save settings")
      }

      toast.success("Settings saved successfully")
      setSettingsDialogOpen(false)
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleProvider = async (provider: AIProvider, enabled: boolean) => {
    const config = getConfig(provider)

    if (enabled && !config?.is_verified) {
      toast.error("Please configure and verify credentials first")
      return
    }

    try {
      const response = await fetch("/api/org/ai/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, provider, enabled }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update")
      }

      toast.success(`${AI_PROVIDER_CONFIG[provider].name} ${enabled ? "enabled" : "disabled"}`)
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update provider")
    }
  }

  const handleSetDefaultProvider = async (provider: AIProvider) => {
    try {
      const response = await fetch("/api/org/ai/default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, provider }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to set default")
      }

      toast.success(`${AI_PROVIDER_CONFIG[provider].name} set as default AI provider`)
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to set default provider")
    }
  }

  const handleDeleteClick = (provider: AIProvider) => {
    setProviderToDelete(provider)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!providerToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch("/api/org/ai/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, provider: providerToDelete }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete configuration")
      }

      toast.success(`${AI_PROVIDER_CONFIG[providerToDelete].name} configuration removed`)
      setDeleteDialogOpen(false)
      setProviderToDelete(null)
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete configuration")
    } finally {
      setIsDeleting(false)
    }
  }

  const providerConfig = selectedProvider
    ? AI_PROVIDER_CONFIG[selectedProvider]
    : null

  const hasAnyAIEnabled = configs.some((c) => c.is_enabled && c.is_verified)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Configuration</h1>
        <p className="text-muted-foreground">
          Configure AI providers to enable intelligent features for your organization
        </p>
      </div>

      {/* AI Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Features
          </CardTitle>
          <CardDescription>
            Enable an AI provider to unlock these intelligent features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className={cn(
              "p-4 border rounded-lg",
              hasAnyAIEnabled ? "border-primary/50 bg-primary/5" : "border-dashed"
            )}>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Job Description Generation</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Auto-generate professional job descriptions, requirements, and skills from basic job details.
              </p>
            </div>
            <div className={cn(
              "p-4 border rounded-lg",
              hasAnyAIEnabled ? "border-primary/50 bg-primary/5" : "border-dashed"
            )}>
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-medium">CV Screening & Ranking</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered candidate screening with skill gap analysis and automatic ranking.
              </p>
            </div>
          </div>
          {!hasAnyAIEnabled && (
            <p className="mt-4 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              Configure and enable at least one AI provider below to activate these features.
            </p>
          )}
        </CardContent>
      </Card>

      {/* AI Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Providers</CardTitle>
          <CardDescription>
            Configure your preferred AI provider. You can set up multiple providers and choose a default.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.keys(AI_PROVIDER_CONFIG) as AIProvider[]).map((provider) => {
            const config = AI_PROVIDER_CONFIG[provider]
            const aiConfig = getConfig(provider)
            const Icon = config.icon
            const isEnabled = aiConfig?.is_enabled ?? false
            const isConfigured = aiConfig?.is_configured ?? false
            const isVerified = aiConfig?.is_verified ?? false
            const isDefault = aiConfig?.is_default_provider ?? false

            return (
              <div
                key={provider}
                className={cn(
                  "flex items-center justify-between p-4 border rounded-lg transition-colors",
                  isEnabled ? "border-primary/50 bg-primary/5" : "border-border"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("p-2 rounded-lg", config.bgColor)}>
                    <Icon className={cn("h-5 w-5", config.color)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
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
                      {isConfigured && !isVerified && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                          Needs Verification
                        </Badge>
                      )}
                      {isDefault && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                    {aiConfig?.settings?.model && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Model: {String(aiConfig.settings.model)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Enable/Disable Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {isEnabled ? "Enabled" : "Disabled"}
                    </span>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggleProvider(provider, checked)}
                      disabled={!isConfigured || !isVerified}
                    />
                  </div>

                  {/* Set as Default button */}
                  {isEnabled && isVerified && !isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefaultProvider(provider)}
                    >
                      Set Default
                    </Button>
                  )}

                  {/* Settings button */}
                  {isConfigured && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSettingsClick(provider)}
                    >
                      <Settings2 className="h-4 w-4" />
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

                  {/* Remove button */}
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

      {/* Security Note */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Note
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your API keys are encrypted using AES-256 encryption before being stored.
            We never log or expose your credentials in plain text. Each organization&apos;s
            AI configuration is completely isolated.
          </p>
        </CardContent>
      </Card>

      {/* Configure Credentials Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {providerConfig && (
                <providerConfig.icon className={cn("h-5 w-5", providerConfig.color)} />
              )}
              Configure {providerConfig?.name}
            </DialogTitle>
            <DialogDescription>
              Enter your API credentials to enable AI features.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Setup Guide */}
            <Accordion type="single" collapsible defaultValue="setup">
              <AccordionItem value="setup">
                <AccordionTrigger className="text-sm font-medium">
                  Setup Instructions
                </AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    {providerConfig?.setupSteps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                  {providerConfig?.helpUrl && (
                    <Button
                      variant="link"
                      className="px-0 mt-2"
                      asChild
                    >
                      <a
                        href={providerConfig.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        {providerConfig.helpText}
                      </a>
                    </Button>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Credential Fields */}
            {providerConfig?.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
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

            {/* Test Result */}
            {testResult && (
              <div className={cn(
                "p-3 rounded-lg text-sm",
                testResult.success
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              )}>
                {testResult.success ? (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>Connection verified! Model: {testResult.model || "Available"}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{testResult.error || "Connection failed"}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleTestCredentials}
              disabled={isTesting || !credentials.api_key}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
            <Button
              onClick={handleSaveCredentials}
              disabled={isSaving || !credentials.api_key}
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {providerConfig?.name} Settings
            </DialogTitle>
            <DialogDescription>
              Customize how the AI behaves for your organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select
                value={settings.model as string}
                onValueChange={(value) => setSettings((prev) => ({ ...prev, model: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {providerConfig?.models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <Label htmlFor="temperature">
                Temperature: {settings.temperature}
              </Label>
              <Input
                id="temperature"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.temperature}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))
                }
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Lower = more focused and deterministic. Higher = more creative and varied.
              </p>
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <Label htmlFor="max_tokens">Max Tokens</Label>
              <Input
                id="max_tokens"
                type="number"
                min="100"
                max="100000"
                value={settings.max_tokens}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, max_tokens: parseInt(e.target.value) || 4096 }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Maximum length of AI responses (recommended: 4096)
              </p>
            </div>

            {/* Custom Instructions */}
            <div className="space-y-2">
              <Label htmlFor="custom_instructions">Custom Instructions (Optional)</Label>
              <Textarea
                id="custom_instructions"
                placeholder="Add specific instructions for how the AI should respond..."
                value={settings.custom_instructions as string}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, custom_instructions: e.target.value }))
                }
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                These instructions will be included in all AI requests.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Settings
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
              Remove AI Configuration
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the{" "}
              <strong>
                {providerToDelete
                  ? AI_PROVIDER_CONFIG[providerToDelete]?.name
                  : ""}
              </strong>{" "}
              configuration? This will:
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Delete all saved API credentials for this provider</li>
              <li>Remove it as the default AI provider (if applicable)</li>
              <li>Disable AI features until another provider is configured</li>
            </ul>
            <p className="mt-4 text-sm font-medium">
              You can reconfigure this provider at any time.
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
              Remove Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
