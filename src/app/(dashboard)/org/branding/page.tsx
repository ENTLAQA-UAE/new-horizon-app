"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import {
  Loader2,
  Upload,
  Palette,
  Globe,
  Building2,
  Image as ImageIcon,
  Check,
} from "lucide-react"

interface BrandingSettings {
  company_name: string
  company_name_ar: string
  tagline: string
  tagline_ar: string
  logo_url: string
  favicon_url: string
  primary_color: string
  secondary_color: string
  website_url: string
  careers_page_url: string
}

const defaultColors = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#06B6D4", // Cyan
  "#EC4899", // Pink
  "#6366F1", // Indigo
]

export default function BrandingPage() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<BrandingSettings>({
    company_name: "",
    company_name_ar: "",
    tagline: "",
    tagline_ar: "",
    logo_url: "",
    favicon_url: "",
    primary_color: "#3B82F6",
    secondary_color: "#10B981",
    website_url: "",
    careers_page_url: "",
  })

  useEffect(() => {
    async function loadBranding() {
      try {
        // In a real app, this would load from the organization's settings
        // For now, we'll simulate with platform_settings
        const { data, error } = await supabase
          .from("platform_settings")
          .select("*")
          .in("key", [
            "org_company_name",
            "org_company_name_ar",
            "org_tagline",
            "org_tagline_ar",
            "org_logo_url",
            "org_favicon_url",
            "org_primary_color",
            "org_secondary_color",
            "org_website_url",
            "org_careers_page_url",
          ])

        if (error) throw error

        if (data) {
          const settingsMap: Record<string, string> = {}
          data.forEach((s) => {
            try {
              settingsMap[s.key] = typeof s.value === "string" ? JSON.parse(s.value) : s.value
            } catch {
              settingsMap[s.key] = s.value
            }
          })

          setSettings({
            company_name: settingsMap["org_company_name"] || "",
            company_name_ar: settingsMap["org_company_name_ar"] || "",
            tagline: settingsMap["org_tagline"] || "",
            tagline_ar: settingsMap["org_tagline_ar"] || "",
            logo_url: settingsMap["org_logo_url"] || "",
            favicon_url: settingsMap["org_favicon_url"] || "",
            primary_color: settingsMap["org_primary_color"] || "#3B82F6",
            secondary_color: settingsMap["org_secondary_color"] || "#10B981",
            website_url: settingsMap["org_website_url"] || "",
            careers_page_url: settingsMap["org_careers_page_url"] || "",
          })
        }
      } catch (error) {
        console.error("Error loading branding:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadBranding()
  }, [supabase])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updates = [
        { key: "org_company_name", value: settings.company_name },
        { key: "org_company_name_ar", value: settings.company_name_ar },
        { key: "org_tagline", value: settings.tagline },
        { key: "org_tagline_ar", value: settings.tagline_ar },
        { key: "org_logo_url", value: settings.logo_url },
        { key: "org_favicon_url", value: settings.favicon_url },
        { key: "org_primary_color", value: settings.primary_color },
        { key: "org_secondary_color", value: settings.secondary_color },
        { key: "org_website_url", value: settings.website_url },
        { key: "org_careers_page_url", value: settings.careers_page_url },
      ]

      for (const update of updates) {
        const { error } = await supabase.from("platform_settings").upsert(
          {
            key: update.key,
            value: JSON.stringify(update.value),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        )
        if (error) throw error
      }

      toast.success("Branding settings saved successfully")
    } catch (error) {
      console.error("Error saving branding:", error)
      toast.error("Failed to save branding settings")
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
          <h2 className="text-2xl font-bold tracking-tight">Branding</h2>
          <p className="text-muted-foreground">
            Customize your organization&apos;s appearance and identity
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
            <CardDescription>
              Basic information about your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name (English)</Label>
                <Input
                  id="company_name"
                  value={settings.company_name}
                  onChange={(e) =>
                    setSettings({ ...settings, company_name: e.target.value })
                  }
                  placeholder="Acme Corporation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_name_ar">Company Name (Arabic)</Label>
                <Input
                  id="company_name_ar"
                  value={settings.company_name_ar}
                  onChange={(e) =>
                    setSettings({ ...settings, company_name_ar: e.target.value })
                  }
                  placeholder="شركة أكمي"
                  dir="rtl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline (English)</Label>
                <Input
                  id="tagline"
                  value={settings.tagline}
                  onChange={(e) =>
                    setSettings({ ...settings, tagline: e.target.value })
                  }
                  placeholder="Building the future together"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline_ar">Tagline (Arabic)</Label>
                <Input
                  id="tagline_ar"
                  value={settings.tagline_ar}
                  onChange={(e) =>
                    setSettings({ ...settings, tagline_ar: e.target.value })
                  }
                  placeholder="نبني المستقبل معاً"
                  dir="rtl"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo & Favicon */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logo & Favicon
            </CardTitle>
            <CardDescription>
              Upload your company logo and favicon
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <div className="flex gap-2">
                <Input
                  id="logo_url"
                  value={settings.logo_url}
                  onChange={(e) =>
                    setSettings({ ...settings, logo_url: e.target.value })
                  }
                  placeholder="https://example.com/logo.png"
                />
                <Button variant="outline" size="icon" disabled>
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              {settings.logo_url && (
                <div className="mt-2 p-4 bg-muted rounded-lg flex items-center justify-center">
                  <img
                    src={settings.logo_url}
                    alt="Logo preview"
                    className="max-h-16 object-contain"
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="favicon_url">Favicon URL</Label>
              <div className="flex gap-2">
                <Input
                  id="favicon_url"
                  value={settings.favicon_url}
                  onChange={(e) =>
                    setSettings({ ...settings, favicon_url: e.target.value })
                  }
                  placeholder="https://example.com/favicon.ico"
                />
                <Button variant="outline" size="icon" disabled>
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Brand Colors
            </CardTitle>
            <CardDescription>
              Customize your organization&apos;s color scheme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Primary Color</Label>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-border"
                  style={{ backgroundColor: settings.primary_color }}
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) =>
                    setSettings({ ...settings, primary_color: e.target.value })
                  }
                  placeholder="#3B82F6"
                  className="w-32"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded-lg border-2 border-transparent hover:border-foreground/20 relative"
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      setSettings({ ...settings, primary_color: color })
                    }
                  >
                    {settings.primary_color === color && (
                      <Check className="h-4 w-4 text-white absolute inset-0 m-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label>Secondary Color</Label>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-border"
                  style={{ backgroundColor: settings.secondary_color }}
                />
                <Input
                  value={settings.secondary_color}
                  onChange={(e) =>
                    setSettings({ ...settings, secondary_color: e.target.value })
                  }
                  placeholder="#10B981"
                  className="w-32"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded-lg border-2 border-transparent hover:border-foreground/20 relative"
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      setSettings({ ...settings, secondary_color: color })
                    }
                  >
                    {settings.secondary_color === color && (
                      <Check className="h-4 w-4 text-white absolute inset-0 m-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Website Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Website Links
            </CardTitle>
            <CardDescription>
              Configure your website and careers page URLs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="website_url">Company Website</Label>
              <Input
                id="website_url"
                type="url"
                value={settings.website_url}
                onChange={(e) =>
                  setSettings({ ...settings, website_url: e.target.value })
                }
                placeholder="https://www.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="careers_page_url">Careers Page URL</Label>
              <Input
                id="careers_page_url"
                type="url"
                value={settings.careers_page_url}
                onChange={(e) =>
                  setSettings({ ...settings, careers_page_url: e.target.value })
                }
                placeholder="https://www.example.com/careers"
              />
              <p className="text-xs text-muted-foreground">
                This URL will be used for your public job listings page
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            See how your branding will appear on the careers page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 rounded-lg border bg-background">
            <div className="flex items-center gap-4 mb-6">
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt="Company logo"
                  className="h-12 object-contain"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: settings.primary_color }}
                >
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold">
                  {settings.company_name || "Your Company Name"}
                </h3>
                <p className="text-muted-foreground">
                  {settings.tagline || "Your tagline goes here"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                style={{ backgroundColor: settings.primary_color }}
                className="hover:opacity-90"
              >
                View Open Positions
              </Button>
              <Button
                variant="outline"
                style={{
                  borderColor: settings.secondary_color,
                  color: settings.secondary_color,
                }}
              >
                About Us
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
