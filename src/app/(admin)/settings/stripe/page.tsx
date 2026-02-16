"use client"

import { useState, useEffect } from "react"
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
      toast.error("Secret Key and Publishable Key are required")
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
      toast.success("Stripe settings saved successfully")
    } catch (error) {
      console.error("Error saving Stripe settings:", error)
      toast.error("Failed to save Stripe settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async () => {
    if (!settings.stripe_secret_key) {
      toast.error("Please enter a Secret Key first")
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
        toast.success("Stripe connection successful!")
      } else {
        setConnectionStatus("error")
        toast.error("Stripe connection failed. Check your API key.")
      }
    } catch {
      setConnectionStatus("error")
      toast.error("Failed to test connection")
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
          <h2 className="text-2xl font-bold tracking-tight">Stripe Integration</h2>
          <p className="text-muted-foreground">
            Configure Stripe payment processing for subscription billing
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
                Connection Status
              </CardTitle>
              <CardDescription>
                Current Stripe API connection status
              </CardDescription>
            </div>
            <Badge
              variant={connectionStatus === "connected" ? "default" : connectionStatus === "error" ? "destructive" : "secondary"}
              className="flex items-center gap-1"
            >
              {connectionStatus === "connected" ? (
                <><CheckCircle2 className="h-3 w-3" /> Connected</>
              ) : connectionStatus === "error" ? (
                <><XCircle className="h-3 w-3" /> Error</>
              ) : (
                "Not Configured"
              )}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Enter your Stripe API keys. You can find these in your Stripe Dashboard under Developers &gt; API Keys.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Publishable Key */}
          <div className="space-y-2">
            <Label htmlFor="publishable_key">Publishable Key</Label>
            <Input
              id="publishable_key"
              type="text"
              value={settings.stripe_publishable_key}
              onChange={(e) =>
                setSettings({ ...settings, stripe_publishable_key: e.target.value })
              }
              placeholder="pk_live_..."
            />
            <p className="text-xs text-muted-foreground">
              Used in the browser to create checkout sessions. Starts with pk_live_ or pk_test_
            </p>
          </div>

          {/* Secret Key */}
          <div className="space-y-2">
            <Label htmlFor="secret_key">Secret Key</Label>
            <div className="relative">
              <Input
                id="secret_key"
                type={showSecretKey ? "text" : "password"}
                value={settings.stripe_secret_key}
                onChange={(e) =>
                  setSettings({ ...settings, stripe_secret_key: e.target.value })
                }
                placeholder="sk_live_..."
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
              Used on the server to process payments. Starts with sk_live_ or sk_test_. Keep this secret!
            </p>
          </div>

          {/* Webhook Secret */}
          <div className="space-y-2">
            <Label htmlFor="webhook_secret">Webhook Signing Secret</Label>
            <div className="relative">
              <Input
                id="webhook_secret"
                type={showWebhookSecret ? "text" : "password"}
                value={settings.stripe_webhook_secret}
                onChange={(e) =>
                  setSettings({ ...settings, stripe_webhook_secret: e.target.value })
                }
                placeholder="whsec_..."
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
              Used to verify webhook events from Stripe. Found in Stripe Dashboard under Developers &gt; Webhooks.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
        <Button variant="outline" onClick={handleTestConnection} disabled={isTesting}>
          {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Test Connection
        </Button>
      </div>
    </div>
  )
}
