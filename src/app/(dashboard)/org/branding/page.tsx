"use client"

import { useState, useEffect, useRef } from "react"
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
  X,
  Link as LinkIcon,
} from "lucide-react"

interface BrandingSettings {
  company_name: string
  company_name_ar: string
  slug: string
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
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)
  const [settings, setSettings] = useState<BrandingSettings>({
    company_name: "",
    company_name_ar: "",
    slug: "",
    tagline: "",
    tagline_ar: "",
    logo_url: "",
    favicon_url: "",
    primary_color: "#3B82F6",
    secondary_color: "#10B981",
    website_url: "",
    careers_page_url: "",
  })

  // Generate careers page URL based on slug
  const getCareersPageUrl = (slug: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/careers/${slug}`
    }
    return `/careers/${slug}`
  }

  useEffect(() => {
    async function loadBranding() {
      try {
        // Get current user's organization
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from("profiles")
          .select("org_id")
          .eq("id", user.id)
          .single()

        const orgId = profile?.org_id
        if (!orgId) {
          console.error("User has no organization")
          setIsLoading(false)
          return
        }

        setOrganizationId(orgId)

        // Load organization branding
        const { data: org, error } = await supabase
          .from("organizations")
          .select("name, name_ar, slug, logo_url, primary_color, secondary_color, custom_domain")
          .eq("id", orgId)
          .single()

        if (error) throw error

        if (org) {
          setSettings({
            company_name: org.name || "",
            company_name_ar: org.name_ar || "",
            slug: org.slug || "",
            tagline: "",
            tagline_ar: "",
            logo_url: org.logo_url || "",
            favicon_url: "",
            primary_color: org.primary_color || "#3B82F6",
            secondary_color: org.secondary_color || "#10B981",
            website_url: org.custom_domain || "",
            careers_page_url: getCareersPageUrl(org.slug || ""),
          })
        }
      } catch (error) {
        console.error("Error loading branding:", error)
        toast.error("Failed to load branding settings")
      } finally {
        setIsLoading(false)
      }
    }

    loadBranding()
  }, [supabase])

  // Handle logo file upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !organizationId) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file")
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB")
      return
    }

    setIsUploadingLogo(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${organizationId}/logo.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(fileName)

      setSettings({ ...settings, logo_url: publicUrl })
      toast.success("Logo uploaded successfully")
    } catch (error) {
      console.error("Error uploading logo:", error)
      toast.error("Failed to upload logo")
    } finally {
      setIsUploadingLogo(false)
    }
  }

  // Handle favicon file upload
  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !organizationId) return

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'image/x-icon') {
      toast.error("Please upload an image or .ico file")
      return
    }

    // Validate file size (max 500KB)
    if (file.size > 500 * 1024) {
      toast.error("Favicon must be less than 500KB")
      return
    }

    setIsUploadingFavicon(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${organizationId}/favicon.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(fileName)

      setSettings({ ...settings, favicon_url: publicUrl })
      toast.success("Favicon uploaded successfully")
    } catch (error) {
      console.error("Error uploading favicon:", error)
      toast.error("Failed to upload favicon")
    } finally {
      setIsUploadingFavicon(false)
    }
  }

  // Remove logo
  const handleRemoveLogo = () => {
    setSettings({ ...settings, logo_url: "" })
  }

  // Remove favicon
  const handleRemoveFavicon = () => {
    setSettings({ ...settings, favicon_url: "" })
  }

  const handleSave = async () => {
    if (!organizationId) {
      toast.error("Organization not found")
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          name: settings.company_name,
          name_ar: settings.company_name_ar || null,
          logo_url: settings.logo_url || null,
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          custom_domain: settings.website_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", organizationId)

      if (error) throw error

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
              Upload your company logo and favicon or provide a URL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Hidden file inputs */}
            <input
              type="file"
              ref={logoInputRef}
              onChange={handleLogoUpload}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={faviconInputRef}
              onChange={handleFaviconUpload}
              accept="image/*,.ico"
              className="hidden"
            />

            {/* Logo Section */}
            <div className="space-y-3">
              <Label>Company Logo</Label>
              {settings.logo_url ? (
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <img
                    src={settings.logo_url}
                    alt="Logo preview"
                    className="max-h-16 max-w-32 object-contain"
                  />
                  <div className="flex-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Replace
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveLogo}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="h-8 w-8 mx-auto text-muted-foreground animate-spin" />
                    ) : (
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    )}
                    <p className="mt-2 text-sm text-muted-foreground">
                      Click to upload logo (max 2MB)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={settings.logo_url}
                      onChange={(e) =>
                        setSettings({ ...settings, logo_url: e.target.value })
                      }
                      placeholder="Enter logo URL"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Favicon Section */}
            <div className="space-y-3">
              <Label>Favicon</Label>
              {settings.favicon_url ? (
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <img
                    src={settings.favicon_url}
                    alt="Favicon preview"
                    className="h-8 w-8 object-contain"
                  />
                  <span className="text-sm text-muted-foreground truncate flex-1">
                    {settings.favicon_url.split('/').pop()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={isUploadingFavicon}
                  >
                    {isUploadingFavicon ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Replace
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFavicon}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => faviconInputRef.current?.click()}
                  >
                    {isUploadingFavicon ? (
                      <Loader2 className="h-6 w-6 mx-auto text-muted-foreground animate-spin" />
                    ) : (
                      <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Click to upload favicon (max 500KB)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={settings.favicon_url}
                      onChange={(e) =>
                        setSettings({ ...settings, favicon_url: e.target.value })
                      }
                      placeholder="Enter favicon URL"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => faviconInputRef.current?.click()}
                      disabled={isUploadingFavicon}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
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
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    id="careers_page_url"
                    type="url"
                    value={settings.slug ? getCareersPageUrl(settings.slug) : ""}
                    readOnly
                    className="bg-muted pr-10"
                  />
                  <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (settings.slug) {
                      navigator.clipboard.writeText(getCareersPageUrl(settings.slug))
                      toast.success("Careers URL copied to clipboard")
                    }
                  }}
                  disabled={!settings.slug}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This URL is auto-generated based on your organization slug. Share this link for your public job listings page.
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
