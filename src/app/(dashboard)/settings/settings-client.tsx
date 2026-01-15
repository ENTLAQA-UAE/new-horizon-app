"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Settings,
  Globe,
  Shield,
  Bell,
  Database,
  Mail,
  Key,
  Languages,
  Save,
  RefreshCw,
  CheckCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Json } from "@/lib/supabase/types"

interface SettingRecord {
  id: string
  key: string
  value: Json
  description: string | null
  category: string | null
  is_public: boolean | null
  updated_by: string | null
  created_at: string | null
  updated_at: string | null
}

interface SettingsClientProps {
  initialSettings: Record<string, any>
  settingsRecords: SettingRecord[]
}

export function SettingsClient({ initialSettings, settingsRecords }: SettingsClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [settings, setSettings] = useState({
    // General
    app_name: initialSettings.app_name || "Jadarat ATS",
    app_name_ar: initialSettings.app_name_ar || "جدارات",
    support_email: initialSettings.support_email || "support@jadarat.io",
    default_language: initialSettings.default_language || "en",
    default_timezone: initialSettings.default_timezone || "Asia/Riyadh",

    // Security
    session_timeout_minutes: initialSettings.session_timeout_minutes || 30,
    max_login_attempts: initialSettings.max_login_attempts || 5,
    enforce_strong_password: initialSettings.enforce_strong_password ?? true,
    require_2fa_admins: initialSettings.require_2fa_admins ?? false,

    // Notifications
    email_notifications_enabled: initialSettings.email_notifications_enabled ?? true,

    // AI Settings
    ai_provider: initialSettings.ai_provider || "openai",
    ai_resume_parsing_enabled: initialSettings.ai_resume_parsing_enabled ?? true,
    ai_candidate_scoring_enabled: initialSettings.ai_candidate_scoring_enabled ?? true,

    // System
    maintenance_mode: initialSettings.maintenance_mode ?? false,
  })

  const handleSave = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // Update each setting
      const updates = Object.entries(settings).map(async ([key, value]) => {
        const { error } = await supabase
          .from("platform_settings")
          .update({ value: JSON.stringify(value) })
          .eq("key", key)

        if (error) throw error
      })

      await Promise.all(updates)

      setIsSaved(true)
      toast.success("Settings saved successfully")

      setTimeout(() => setIsSaved(false), 3000)
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setIsLoading(false)
    }
  }

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setIsSaved(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Platform Settings</h2>
          <p className="text-muted-foreground">
            Configure global settings for the Jadarat ATS platform
          </p>
        </div>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : isSaved ? (
            <CheckCircle className="mr-2 h-4 w-4" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSaved ? "Saved" : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>General Settings</CardTitle>
            </div>
            <CardDescription>Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="app_name">App Name (English)</Label>
                <Input
                  id="app_name"
                  value={settings.app_name}
                  onChange={(e) => updateSetting("app_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app_name_ar">App Name (Arabic)</Label>
                <Input
                  id="app_name_ar"
                  value={settings.app_name_ar}
                  onChange={(e) => updateSetting("app_name_ar", e.target.value)}
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="support_email">Support Email</Label>
              <Input
                id="support_email"
                type="email"
                value={settings.support_email}
                onChange={(e) => updateSetting("support_email", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Language</Label>
                <Select
                  value={settings.default_language}
                  onValueChange={(value) => updateSetting("default_language", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic (العربية)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select
                  value={settings.default_timezone}
                  onValueChange={(value) => updateSetting("default_timezone", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Riyadh">Riyadh (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Dubai">Dubai (GMT+4)</SelectItem>
                    <SelectItem value="Africa/Cairo">Cairo (GMT+2)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>Authentication and security options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                <Input
                  id="session_timeout"
                  type="number"
                  value={settings.session_timeout_minutes}
                  onChange={(e) =>
                    updateSetting("session_timeout_minutes", parseInt(e.target.value) || 30)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_login_attempts">Max Login Attempts</Label>
                <Input
                  id="max_login_attempts"
                  type="number"
                  value={settings.max_login_attempts}
                  onChange={(e) =>
                    updateSetting("max_login_attempts", parseInt(e.target.value) || 5)
                  }
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <ToggleOption
                label="Enforce Strong Passwords"
                description="Require complex passwords for all users"
                enabled={settings.enforce_strong_password}
                onChange={(enabled) => updateSetting("enforce_strong_password", enabled)}
              />
              <ToggleOption
                label="Require Two-Factor Authentication"
                description="Enforce 2FA for all admin accounts"
                enabled={settings.require_2fa_admins}
                onChange={(enabled) => updateSetting("require_2fa_admins", enabled)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Localization Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              <CardTitle>Localization</CardTitle>
            </div>
            <CardDescription>Language and regional settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">English (EN)</p>
                  <p className="text-sm text-muted-foreground">Left-to-right layout</p>
                </div>
                <Badge variant="default">Default</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Arabic (العربية)</p>
                  <p className="text-sm text-muted-foreground">Right-to-left layout</p>
                </div>
                <Badge variant="secondary">Enabled</Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">Regional Format</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>Date: DD/MM/YYYY</div>
                <div>Currency: SAR</div>
                <div>Number: 1,234.56</div>
                <div>Week Start: Sunday</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>AI Configuration</CardTitle>
            </div>
            <CardDescription>AI service settings and features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>AI Provider</Label>
              <Select
                value={settings.ai_provider}
                onValueChange={(value) => updateSetting("ai_provider", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                  <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                  <SelectItem value="azure">Azure OpenAI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <ToggleOption
                label="AI Resume Parsing"
                description="Automatically extract data from uploaded resumes"
                enabled={settings.ai_resume_parsing_enabled}
                onChange={(enabled) => updateSetting("ai_resume_parsing_enabled", enabled)}
              />
              <ToggleOption
                label="AI Candidate Scoring"
                description="Automatically score candidates based on job requirements"
                enabled={settings.ai_candidate_scoring_enabled}
                onChange={(enabled) => updateSetting("ai_candidate_scoring_enabled", enabled)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Email and notification settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleOption
              label="Email Notifications"
              description="Send system alerts and updates via email"
              enabled={settings.email_notifications_enabled}
              onChange={(enabled) => updateSetting("email_notifications_enabled", enabled)}
            />
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <CardTitle>System</CardTitle>
            </div>
            <CardDescription>System-wide configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleOption
              label="Maintenance Mode"
              description="Put the platform in maintenance mode (only admins can access)"
              enabled={settings.maintenance_mode}
              onChange={(enabled) => updateSetting("maintenance_mode", enabled)}
            />

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email Service</p>
                    <p className="text-sm text-muted-foreground">Resend</p>
                  </div>
                </div>
                <Badge variant="default">Connected</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Database</p>
                    <p className="text-sm text-muted-foreground">Supabase PostgreSQL</p>
                  </div>
                </div>
                <Badge variant="default">Connected</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">CDN & Storage</p>
                    <p className="text-sm text-muted-foreground">Supabase Storage</p>
                  </div>
                </div>
                <Badge variant="default">Connected</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ToggleOption({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string
  description: string
  enabled: boolean
  onChange: (enabled: boolean) => void
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
        enabled ? "bg-primary/10 border-primary" : "bg-muted/50"
      }`}
      onClick={() => onChange(!enabled)}
    >
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div
        className={`w-10 h-6 rounded-full transition-colors ${
          enabled ? "bg-primary" : "bg-muted"
        } relative`}
      >
        <div
          className={`absolute w-4 h-4 rounded-full bg-white top-1 transition-transform ${
            enabled ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </div>
    </div>
  )
}
