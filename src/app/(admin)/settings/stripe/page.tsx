"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Key, Eye, EyeOff, CheckCircle2, XCircle, ArrowLeft } from "lucide-react"
import { supabaseSelect, supabaseInsert, supabaseUpdate } from "@/lib/supabase/auth-fetch"
import Link from "next/link"

interface StripeSettings {
  stripe_secret_key: string
  stripe_publishable_key: string
  stripe_webhook_secret: string
}

export default function StripeSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "error">("unknown")
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)
  const [settings, setSettings] = useState<StripeSettings>({
    stripe_secret_key: "",
    stripe_publishable_key: "",
    stripe_webhook_secret: "",
  })
  const { t } = useI18n()

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabaseSelect<any[]>("platform_settings", {
          select: "*",
          filter: [{ column: "key", operator: "like", value: "stripe_%" }],
        })

        if (error) throw error

        if (data && data.length > 0) {
          const settingsMap: Record<string, string> = {}
          data.forEach((s: any) => {
            let val = s.value
            if (typeof val === "string" && val.startsWith('"') && val.endsWith('"')) {
              try { val = JSON.parse(val) } catch { /* keep as-is */ }
            }
            settingsMap[s.key] = val
          })
          setSettings((prev) => ({
            ...prev,
            stripe_secret_key: settingsMap.stripe_secret_key || "",
            stripe_publishable_key: settingsMap.stripe_publishable_key || "",
            stripe_webhook_secret: settingsMap.stripe_webhook_secret || "",
          }))
          if (settingsMap.stripe_secret_key) {
            setConnectionStatus("connected")
          }
        }
      } catch (error) {
        console.error("Error loading Stripe settings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleSave = async () => {
    if (!settings.stripe_secret_key || !settings.stripe_publishable_key) {
      toast.error(t("admin.stripe.keysRequired"))
      return
    }

    setIsSaving(true)
    try {
      for (const [key, value] of Object.entries(settings)) {
        const settingData = {
          key,
          value: JSON.stringify(value),
          category: "stripe",
          updated_at: new Date().toISOString(),
        }

        const { data: updateData, error: updateError } = await supabaseUpdate(
          "platform_settings",
          { value: settingData.value, category: settingData.category, updated_at: settingData.updated_at },
          { column: "key", value: key }
        )

        if (updateError) throw updateError

        if (!updateData) {
          const { error: insertError } = await supabaseInsert("platform_settings", settingData)
          if (insertError) throw insertError
        }
      }

      setConnectionStatus("connected")
      toast.success(t("admin.stripe.savedSuccess"))
    } catch (error) {
      console.error("Error saving Stripe settings:", error)
      toast.error(t("admin.stripe.saveFailed"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async () => {
    if (!settings.stripe_secret_key) {
      toast.error(t("admin.stripe.enterSecretFirst"))
      return
    }

    setIsTesting(true)
    try {
      const response = await fetch("/api/stripe/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret_key: settings.stripe_secret_key }),
      })

      if (response.ok) {
        setConnectionStatus("connected")
        toast.success(t("admin.stripe.connectionSuccess"))
      } else {
        setConnectionStatus("error")
        toast.error(t("admin.stripe.connectionFailed"))
      }
    } catch {
      setConnectionStatus("error")
      toast.error(t("admin.stripe.testFailed"))
    } finally {
      setIsTesting(false)
    }
  }

  const maskKey = (key: string) => {
    if (!key) return ""
    if (key.length <= 8) return "••••••••"
    return key.substring(0, 7) + "••••••••" + key.substring(key.length - 4)
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
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("admin.stripe.title")}</h2>
          <p className="text-muted-foreground">
            {t("admin.stripe.subtitle")}
          </p>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                {t("admin.stripe.connectionStatus")}
              </CardTitle>
              <CardDescription>
                {t("admin.stripe.connectionStatusDesc")}
              </CardDescription>
            </div>
            <Badge
              variant={connectionStatus === "connected" ? "default" : connectionStatus === "error" ? "destructive" : "secondary"}
              className="flex items-center gap-1"
            >
              {connectionStatus === "connected" ? (
                <><CheckCircle2 className="h-3 w-3" /> {t("admin.stripe.connected")}</>
              ) : connectionStatus === "error" ? (
                <><XCircle className="h-3 w-3" /> {t("admin.stripe.error")}</>
              ) : (
                t("admin.stripe.notConfigured")
              )}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.stripe.apiKeys")}</CardTitle>
          <CardDescription>
            {t("admin.stripe.apiKeysDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Publishable Key */}
          <div className="space-y-2">
            <Label htmlFor="publishable_key">{t("admin.stripe.publishableKey")}</Label>
            <Input
              id="publishable_key"
              type="text"
              value={settings.stripe_publishable_key}
              onChange={(e) =>
                setSettings({ ...settings, stripe_publishable_key: e.target.value })
              }
              placeholder={t("admin.stripe.publishableKeyPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("admin.stripe.publishableKeyDesc")}
            </p>
          </div>

          {/* Secret Key */}
          <div className="space-y-2">
            <Label htmlFor="secret_key">{t("admin.stripe.secretKey")}</Label>
            <div className="relative">
              <Input
                id="secret_key"
                type={showSecretKey ? "text" : "password"}
                value={settings.stripe_secret_key}
                onChange={(e) =>
                  setSettings({ ...settings, stripe_secret_key: e.target.value })
                }
                placeholder={t("admin.stripe.secretKeyPlaceholder")}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowSecretKey(!showSecretKey)}
              >
                {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("admin.stripe.secretKeyDesc")}
            </p>
          </div>

          {/* Webhook Secret */}
          <div className="space-y-2">
            <Label htmlFor="webhook_secret">{t("admin.stripe.webhookSecret")}</Label>
            <div className="relative">
              <Input
                id="webhook_secret"
                type={showWebhookSecret ? "text" : "password"}
                value={settings.stripe_webhook_secret}
                onChange={(e) =>
                  setSettings({ ...settings, stripe_webhook_secret: e.target.value })
                }
                placeholder={t("admin.stripe.webhookSecretPlaceholder")}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
              >
                {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("admin.stripe.webhookSecretDesc")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("admin.stripe.saveSettings")}
        </Button>
        <Button variant="outline" onClick={handleTestConnection} disabled={isTesting}>
          {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("admin.stripe.testConnection")}
        </Button>
      </div>

      {/* Test Mode Guide */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="text-base">{t("admin.stripe.testingPayments")}</CardTitle>
          <CardDescription>
            {t("admin.stripe.testingPaymentsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium mb-1">{t("admin.stripe.step1Title")}</p>
            <p className="text-muted-foreground">
              {t("admin.stripe.step1Desc")}
            </p>
          </div>
          <div>
            <p className="font-medium mb-1">{t("admin.stripe.step2Title")}</p>
            <p className="text-muted-foreground">
              {t("admin.stripe.step2Desc")}
            </p>
            <div className="mt-1.5 space-y-1 font-mono text-xs">
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                <span className="font-semibold text-green-700 dark:text-green-400">{t("admin.stripe.success")}</span>
                <span>4242 4242 4242 4242</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                <span className="font-semibold text-red-700 dark:text-red-400">{t("admin.stripe.decline")}</span>
                <span>4000 0000 0000 0002</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                <span className="font-semibold text-blue-700 dark:text-blue-400">{t("admin.stripe.threeDSecure")}</span>
                <span>4000 0025 0000 3155</span>
              </div>
            </div>
            <p className="text-muted-foreground mt-1.5">
              {t("admin.stripe.step2Note")}
            </p>
          </div>
          <div>
            <p className="font-medium mb-1">{t("admin.stripe.step3Title")}</p>
            <p className="text-muted-foreground">
              {t("admin.stripe.step3Desc")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
