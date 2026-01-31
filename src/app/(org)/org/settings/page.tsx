"use client"

import { useState, useEffect } from "react"
import { supabaseInsert, supabaseUpdate, supabaseSelect, getCurrentUserId } from "@/lib/supabase/auth-fetch"
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
import { useI18n } from "@/lib/i18n"

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
  const { t, language: currentLanguage, isRTL } = useI18n()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
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
        // Get current user's org_id
        const userId = await getCurrentUserId()
        if (!userId) {
          console.error("No user found")
          setIsLoading(false)
          return
        }

        const { data: profileData } = await supabaseSelect<{ org_id: string }[]>(
          "profiles",
          {
            select: "org_id",
            filter: [{ column: "id", operator: "eq", value: userId }],
            limit: 1
          }
        )

        if (!profileData?.[0]?.org_id) {
          console.error("No org_id found")
          setIsLoading(false)
          return
        }

        const orgId = profileData[0].org_id
        setOrganizationId(orgId)

        // Load org-specific settings
        const { data, error } = await supabaseSelect<any[]>("platform_settings", {
          select: "*",
          filter: [{ column: "key", operator: "like", value: `org_settings_%_${orgId}` }]
        })

        if (error) throw error

        if (data && data.length > 0) {
          const settingsMap: Record<string, any> = {}
          data.forEach((s) => {
            // Remove both prefix and org_id suffix: org_settings_currency_uuid -> currency
            const key = s.key.replace(`org_settings_`, "").replace(`_${orgId}`, "")
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
  }, [])

  const handleSave = async () => {
    if (!organizationId) {
      toast.error(t("settings.messages.orgNotFound"))
      return
    }

    setIsSaving(true)
    try {
      const entries = Object.entries(settings)
      for (const [key, value] of entries) {
        // Use org-specific key: org_settings_currency_uuid
        const settingKey = `org_settings_${key}_${organizationId}`
        const settingData = {
          key: settingKey,
          value: JSON.stringify(value),
          updated_at: new Date().toISOString(),
        }

        // Try update first (for existing settings)
        const { data: updateData, error: updateError } = await supabaseUpdate(
          "platform_settings",
          { value: settingData.value, updated_at: settingData.updated_at },
          { column: "key", value: settingKey }
        )

        if (updateError) throw updateError

        // If no row was updated (data is undefined/null), insert instead
        if (!updateData) {
          const { error: insertError } = await supabaseInsert(
            "platform_settings",
            settingData
          )
          if (insertError) throw insertError
        }
      }

      toast.success(t("settings.messages.saved"))
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error(t("settings.messages.saveFailed"))
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
          <h2 className="text-2xl font-bold tracking-tight">{t("settings.org.title")}</h2>
          <p className="text-muted-foreground">
            {t("settings.org.description")}
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("settings.actions.save")}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t("settings.regional.title")}
            </CardTitle>
            <CardDescription>
              {t("settings.regional.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">{t("settings.general.timezone")}</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) =>
                  setSettings({ ...settings, timezone: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("settings.general.selectTimezone")} />
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
              <Label htmlFor="language">{t("settings.general.defaultLanguage")}</Label>
              <Select
                value={settings.language}
                onValueChange={(value) =>
                  setSettings({ ...settings, language: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("settings.general.selectLanguage")} />
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
              <Label htmlFor="date_format">{t("settings.general.dateFormat")}</Label>
              <Select
                value={settings.date_format}
                onValueChange={(value) =>
                  setSettings({ ...settings, date_format: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("settings.general.selectDateFormat")} />
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
                  {t("settings.general.preferredCurrency")}
                </div>
              </Label>
              <Select
                value={settings.currency}
                onValueChange={(value) =>
                  setSettings({ ...settings, currency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("settings.general.selectCurrency")} />
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
                {t("settings.general.currencyDescription")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t("settings.notifications.title")}
            </CardTitle>
            <CardDescription>
              {t("settings.notifications.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("settings.notifications.email")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.notifications.emailDescription")}
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
                <Label>{t("settings.notifications.applicationAlerts")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.notifications.applicationAlertsDescription")}
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
                <Label>{t("settings.notifications.weeklyDigest")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.notifications.weeklyDigestDescription")}
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
              {t("settings.application.title")}
            </CardTitle>
            <CardDescription>
              {t("settings.application.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="auto_reject_days">
                {t("settings.application.autoRejectDays")}
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
                {t("settings.application.autoRejectDescription")}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("settings.application.requireCoverLetter")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.application.requireCoverLetterDescription")}
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
                <Label>{t("settings.application.allowReferrals")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.application.allowReferralsDescription")}
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
              {t("settings.privacy.title")}
            </CardTitle>
            <CardDescription>
              {t("settings.privacy.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("settings.privacy.gdprCompliance")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.privacy.gdprDescription")}
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
                {t("settings.privacy.dataRetentionPeriod")}
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
                {t("settings.privacy.dataRetentionDescription")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t("settings.contact.title")}
            </CardTitle>
            <CardDescription>
              {t("settings.contact.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_email">{t("settings.contact.contactEmail")}</Label>
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
                  {t("settings.contact.contactEmailDescription")}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="support_email">{t("settings.contact.supportEmail")}</Label>
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
                  {t("settings.contact.supportEmailDescription")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
