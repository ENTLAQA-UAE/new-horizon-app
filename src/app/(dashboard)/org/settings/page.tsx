"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  Loader2,
  Settings,
  Bell,
  Globe,
  Mail,
  Clock,
  Shield,
  Calendar,
  DollarSign,
} from "lucide-react"

interface OrgSettings {
  timezone: string
  language: string
  currency: string
  date_format: string
  email_notifications: boolean
  application_alerts: boolean
  weekly_digest: boolean
  auto_reject_days: number
  require_cover_letter: boolean
  allow_referrals: boolean
  gdpr_enabled: boolean
  data_retention_days: number
  contact_email: string
  support_email: string
}

const timezones = [
  { value: "Asia/Riyadh", label: "Riyadh (GMT+3)" },
  { value: "Asia/Dubai", label: "Dubai (GMT+4)" },
  { value: "Asia/Kuwait", label: "Kuwait (GMT+3)" },
  { value: "Africa/Cairo", label: "Cairo (GMT+2)" },
  { value: "Europe/London", label: "London (GMT+0)" },
  { value: "America/New_York", label: "New York (GMT-5)" },
]

const languages = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "both", label: "Both (Bilingual)" },
]

const dateFormats = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
]

const currencies = [
  { value: "SAR", label: "SAR - Saudi Riyal (ر.س)", symbol: "ر.س" },
  { value: "AED", label: "AED - UAE Dirham (د.إ)", symbol: "د.إ" },
  { value: "KWD", label: "KWD - Kuwaiti Dinar (د.ك)", symbol: "د.ك" },
  { value: "QAR", label: "QAR - Qatari Riyal (ر.ق)", symbol: "ر.ق" },
  { value: "BHD", label: "BHD - Bahraini Dinar (.د.ب)", symbol: ".د.ب" },
  { value: "OMR", label: "OMR - Omani Rial (ر.ع.)", symbol: "ر.ع." },
  { value: "EGP", label: "EGP - Egyptian Pound (ج.م)", symbol: "ج.م" },
  { value: "JOD", label: "JOD - Jordanian Dinar (د.أ)", symbol: "د.أ" },
  { value: "USD", label: "USD - US Dollar ($)", symbol: "$" },
  { value: "EUR", label: "EUR - Euro (€)", symbol: "€" },
  { value: "GBP", label: "GBP - British Pound (£)", symbol: "£" },
  { value: "INR", label: "INR - Indian Rupee (₹)", symbol: "₹" },
  { value: "PKR", label: "PKR - Pakistani Rupee (₨)", symbol: "₨" },
]

export default function OrgSettingsPage() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<OrgSettings>({
    timezone: "Asia/Riyadh",
    language: "both",
    currency: "SAR",
    date_format: "DD/MM/YYYY",
    email_notifications: true,
    application_alerts: true,
    weekly_digest: false,
    auto_reject_days: 30,
    require_cover_letter: false,
    allow_referrals: true,
    gdpr_enabled: true,
    data_retention_days: 365,
    contact_email: "",
    support_email: "",
  })

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from("platform_settings")
          .select("*")
          .like("key", "org_settings_%")

        if (error) throw error

        if (data && data.length > 0) {
          const settingsMap: Record<string, any> = {}
          data.forEach((s) => {
            const key = s.key.replace("org_settings_", "")
            try {
              settingsMap[key] = typeof s.value === "string" ? JSON.parse(s.value) : s.value
            } catch {
              settingsMap[key] = s.value
            }
          })

          setSettings((prev) => ({
            ...prev,
            ...settingsMap,
          }))
        }
      } catch (error) {
        console.error("Error loading settings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [supabase])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const entries = Object.entries(settings)
      for (const [key, value] of entries) {
        const { error } = await supabase.from("platform_settings").upsert(
          {
            key: `org_settings_${key}`,
            value: JSON.stringify(value),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        )
        if (error) throw error
      }

      toast.success("Settings saved successfully")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Organization Settings</h2>
          <p className="text-muted-foreground">
            Configure your organization&apos;s preferences and policies
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Regional Settings
            </CardTitle>
            <CardDescription>
              Configure timezone, language, and date format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) =>
                  setSettings({ ...settings, timezone: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Default Language</Label>
              <Select
                value={settings.language}
                onValueChange={(value) =>
                  setSettings({ ...settings, language: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_format">Date Format</Label>
              <Select
                value={settings.date_format}
                onValueChange={(value) =>
                  setSettings({ ...settings, date_format: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  {dateFormats.map((df) => (
                    <SelectItem key={df.value} value={df.value}>
                      {df.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Preferred Currency
                </div>
              </Label>
              <Select
                value={settings.currency}
                onValueChange={(value) =>
                  setSettings({ ...settings, currency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Currency displayed for salaries and compensation
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure email and notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email updates for important events
                </p>
              </div>
              <Switch
                checked={settings.email_notifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, email_notifications: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Application Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when new applications arrive
                </p>
              </div>
              <Switch
                checked={settings.application_alerts}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, application_alerts: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Digest</Label>
                <p className="text-sm text-muted-foreground">
                  Receive a weekly summary of activity
                </p>
              </div>
              <Switch
                checked={settings.weekly_digest}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, weekly_digest: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Application Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Application Policies
            </CardTitle>
            <CardDescription>
              Configure application handling rules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="auto_reject_days">
                Auto-reject after (days)
              </Label>
              <Input
                id="auto_reject_days"
                type="number"
                min="0"
                max="365"
                value={settings.auto_reject_days}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    auto_reject_days: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Automatically reject applications after this many days (0 = disabled)
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Cover Letter</Label>
                <p className="text-sm text-muted-foreground">
                  Make cover letter mandatory for applications
                </p>
              </div>
              <Switch
                checked={settings.require_cover_letter}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, require_cover_letter: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Referrals</Label>
                <p className="text-sm text-muted-foreground">
                  Enable employee referral program
                </p>
              </div>
              <Switch
                checked={settings.allow_referrals}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, allow_referrals: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Compliance
            </CardTitle>
            <CardDescription>
              GDPR and data retention settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>GDPR Compliance</Label>
                <p className="text-sm text-muted-foreground">
                  Enable GDPR compliance features
                </p>
              </div>
              <Switch
                checked={settings.gdpr_enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, gdpr_enabled: checked })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_retention_days">
                Data Retention Period (days)
              </Label>
              <Input
                id="data_retention_days"
                type="number"
                min="30"
                max="2555"
                value={settings.data_retention_days}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    data_retention_days: parseInt(e.target.value) || 365,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                How long to retain candidate data (minimum 30 days)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>
              Email addresses for communications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) =>
                    setSettings({ ...settings, contact_email: e.target.value })
                  }
                  placeholder="hr@company.com"
                />
                <p className="text-xs text-muted-foreground">
                  Primary contact email for candidates
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="support_email">Support Email</Label>
                <Input
                  id="support_email"
                  type="email"
                  value={settings.support_email}
                  onChange={(e) =>
                    setSettings({ ...settings, support_email: e.target.value })
                  }
                  placeholder="support@company.com"
                />
                <p className="text-xs text-muted-foreground">
                  Email for technical support inquiries
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
