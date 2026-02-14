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
  Image,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Json } from "@/lib/supabase/types"
import { useRef } from "react"

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
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [settings, setSettings] = useState({
    // General
    app_name: initialSettings.app_name || "Kawadir ATS",
    app_name_ar: initialSettings.app_name_ar || "جدارات",
    support_email: initialSettings.support_email || "support@kawadir.io",
    default_language: initialSettings.default_language || "en",
    default_timezone: initialSettings.default_timezone || "Asia/Riyadh",

    // Platform Branding
    platform_logo: initialSettings.platform_logo || "",
    platform_logo_dark: initialSettings.platform_logo_dark || "",

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

    // Localization
    arabic_enabled: initialSettings.arabic_enabled ?? true,
    date_format: initialSettings.date_format || "DD/MM/YYYY",
    currency: initialSettings.currency || "SAR",
    number_format: initialSettings.number_format || "1,234.56",
    week_start: initialSettings.week_start || "sunday",
  })

  const handleSave = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const now = new Date().toISOString()

      // Batch all settings into a single upsert call to avoid
      // AbortError from flooding the Supabase client with parallel requests
      const rows = Object.entries(settings).map(([key, value]) => ({
        key,
        value: JSON.stringify(value),
        updated_at: now,
      }))

      const { error } = await supabase
        .from("platform_settings")
        .upsert(rows, { onConflict: 'key' })

      if (error) throw error

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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'light' | 'dark') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB")
      return
    }

    setIsUploadingLogo(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Upload failed (${response.status})`)
      }

      const settingKey = type === 'light' ? 'platform_logo' : 'platform_logo_dark'
      updateSetting(settingKey, result.publicUrl)

      // Auto-save the logo URL to database immediately so it persists on refresh
      try {
        const supabase = createClient()
        await supabase
          .from("platform_settings")
          .upsert(
            { key: settingKey, value: JSON.stringify(result.publicUrl), updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          )
      } catch (saveErr) {
        console.error("Failed to auto-save logo setting:", saveErr)
      }

      toast.success("Logo uploaded and saved")
    } catch (error: any) {
      console.error("Error uploading logo:", error)
      toast.error(error?.message || "Failed to upload logo. Please try again.")
    } finally {
      setIsUploadingLogo(false)
      if (logoInputRef.current) {
        logoInputRef.current.value = ''
      }
    }
  }

  const removeLogo = async (type: 'light' | 'dark') => {
    const settingKey = type === 'light' ? 'platform_logo' : 'platform_logo_dark'
    updateSetting(settingKey, '')

    // Auto-save removal to database
    try {
      const supabase = createClient()
      await supabase
        .from("platform_settings")
        .upsert(
          { key: settingKey, value: JSON.stringify(''), updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )
    } catch (saveErr) {
      console.error("Failed to auto-save logo removal:", saveErr)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Platform Settings</h2>
          <p className="text-muted-foreground">
            Configure global settings for the Kawadir ATS platform
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

      {/* Platform Branding - Full width at top */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            <CardTitle>Platform Branding</CardTitle>
          </div>
          <CardDescription>Upload your logo to display on the login page and landing page</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label>Platform Logo (Light Mode)</Label>
              <p className="text-xs text-muted-foreground">
                Shown on the login page. Recommended: PNG with transparent background, max 2MB
              </p>
              <div className="flex items-center gap-4">
                {settings.platform_logo ? (
                  <div className="relative group">
                    <div className="w-[200px] h-[60px] border rounded-lg flex items-center justify-center bg-white p-2">
                      <img
                        src={settings.platform_logo}
                        alt="Platform Logo"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <button
                      onClick={() => removeLogo('light')}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-[200px] h-[60px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground">
                    <Image className="h-6 w-6 mb-1" />
                    <span className="text-xs">No logo set</span>
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e, 'light')}
                    className="hidden"
                    id="logo-upload-light"
                    disabled={isUploadingLogo}
                  />
                  <label htmlFor="logo-upload-light">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUploadingLogo}
                      asChild
                    >
                      <span className="cursor-pointer">
                        {isUploadingLogo ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Upload Logo
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Platform Logo (Dark Mode)</Label>
              <p className="text-xs text-muted-foreground">
                Optional: Used when dark mode is active. Leave empty to use the light logo.
              </p>
              <div className="flex items-center gap-4">
                {settings.platform_logo_dark ? (
                  <div className="relative group">
                    <div className="w-[200px] h-[60px] border rounded-lg flex items-center justify-center bg-gray-900 p-2">
                      <img
                        src={settings.platform_logo_dark}
                        alt="Platform Logo (Dark)"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <button
                      onClick={() => removeLogo('dark')}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-[200px] h-[60px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-gray-100 dark:bg-gray-800">
                    <Image className="h-6 w-6 mb-1" />
                    <span className="text-xs">No logo set</span>
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e, 'dark')}
                    className="hidden"
                    id="logo-upload-dark"
                    disabled={isUploadingLogo}
                  />
                  <label htmlFor="logo-upload-dark">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUploadingLogo}
                      asChild
                    >
                      <span className="cursor-pointer">
                        {isUploadingLogo ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Upload Logo
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    <SelectValue placeholder="Select language">
                      {settings.default_language === "en" ? "English" :
                       settings.default_language === "ar" ? "Arabic (العربية)" :
                       "Select language"}
                    </SelectValue>
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
                    <SelectValue placeholder="Select timezone">
                      {settings.default_timezone === "Asia/Riyadh" ? "Riyadh (GMT+3)" :
                       settings.default_timezone === "Asia/Dubai" ? "Dubai (GMT+4)" :
                       settings.default_timezone === "Africa/Cairo" ? "Cairo (GMT+2)" :
                       settings.default_timezone === "UTC" ? "UTC" :
                       "Select timezone"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Riyadh">Riyadh (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Dubai">Dubai (GMT+4)</SelectItem>
                    <SelectItem value="Africa/Cairo">Cairo (GMT+2)</SelectItem>
                    <SelectItem value="Asia/Kuwait">Kuwait (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Bahrain">Bahrain (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Qatar">Qatar (GMT+3)</SelectItem>
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
              <div
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  settings.default_language === "en" ? "bg-primary/10 border-primary" : "bg-muted/50"
                }`}
                onClick={() => updateSetting("default_language", "en")}
              >
                <div>
                  <p className="font-medium">English (EN)</p>
                  <p className="text-sm text-muted-foreground">Left-to-right layout</p>
                </div>
                <Badge variant={settings.default_language === "en" ? "default" : "secondary"}>
                  {settings.default_language === "en" ? "Default" : "Enabled"}
                </Badge>
              </div>

              <div
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  settings.default_language === "ar" ? "bg-primary/10 border-primary" : "bg-muted/50"
                }`}
                onClick={() => updateSetting("default_language", "ar")}
              >
                <div>
                  <p className="font-medium">Arabic (العربية)</p>
                  <p className="text-sm text-muted-foreground">Right-to-left layout</p>
                </div>
                <Badge variant={settings.default_language === "ar" ? "default" : "secondary"}>
                  {settings.default_language === "ar" ? "Default" : "Enabled"}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <p className="text-sm font-medium">Regional Format</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Date Format</Label>
                  <Select
                    value={settings.date_format}
                    onValueChange={(value) => updateSetting("date_format", value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue>{settings.date_format}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Currency</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(value) => updateSetting("currency", value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue>{settings.currency}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">SAR (Saudi Riyal)</SelectItem>
                      <SelectItem value="AED">AED (UAE Dirham)</SelectItem>
                      <SelectItem value="EGP">EGP (Egyptian Pound)</SelectItem>
                      <SelectItem value="KWD">KWD (Kuwaiti Dinar)</SelectItem>
                      <SelectItem value="QAR">QAR (Qatari Riyal)</SelectItem>
                      <SelectItem value="BHD">BHD (Bahraini Dinar)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Number Format</Label>
                  <Select
                    value={settings.number_format}
                    onValueChange={(value) => updateSetting("number_format", value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue>{settings.number_format}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1,234.56">1,234.56 (Comma/Period)</SelectItem>
                      <SelectItem value="1.234,56">1.234,56 (Period/Comma)</SelectItem>
                      <SelectItem value="1 234.56">1 234.56 (Space/Period)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Week Starts</Label>
                  <Select
                    value={settings.week_start}
                    onValueChange={(value) => updateSetting("week_start", value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue>
                        {settings.week_start === "sunday" ? "Sunday" :
                         settings.week_start === "monday" ? "Monday" :
                         settings.week_start === "saturday" ? "Saturday" : "Sunday"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunday">Sunday</SelectItem>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="saturday">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Configuration - Now Per-Organization */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>AI Configuration</CardTitle>
            </div>
            <CardDescription>AI settings are now configured per-organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                AI configuration has been moved to organization-level settings. Each organization can now configure their own AI provider (Claude, OpenAI, Gemini, or Perplexity) with their own API credentials.
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                Organization admins can configure AI in: <strong>Settings → AI Configuration</strong>
              </p>
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
