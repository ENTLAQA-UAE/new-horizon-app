"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
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
  Monitor,
  Sparkles,
  Info,
  ExternalLink,
  Copy,
  Server,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

interface BrandingSettings {
  company_name: string
  company_name_ar: string
  slug: string
  tagline: string
  tagline_ar: string
  logo_url: string
  favicon_url: string
  login_image_url: string
  primary_color: string
  secondary_color: string
  website_url: string
  careers_page_url: string
  subdomain_enabled: boolean
}

const defaultColors = [
  "#6366F1", // Indigo
  "#8B5CF6", // Purple
  "#3B82F6", // Blue
  "#06B6D4", // Cyan
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
]

export default function BrandingPage() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false)
  const [isUploadingLoginImage, setIsUploadingLoginImage] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)
  const loginImageInputRef = useRef<HTMLInputElement>(null)
  const [loginImageError, setLoginImageError] = useState(false)
  const [settings, setSettings] = useState<BrandingSettings>({
    company_name: "",
    company_name_ar: "",
    slug: "",
    tagline: "",
    tagline_ar: "",
    logo_url: "",
    favicon_url: "",
    login_image_url: "",
    primary_color: "#6366F1",
    secondary_color: "#8B5CF6",
    website_url: "",
    careers_page_url: "",
    subdomain_enabled: false,
  })
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [newSlug, setNewSlug] = useState("")

  // Generate careers page URL based on slug
  const getCareersPageUrl = (slug: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/careers/${slug}`
    }
    return `/careers/${slug}`
  }

  // Generate subdomain URL
  const getSubdomainUrl = (slug: string) => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      // For localhost, show what it would look like in production
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `https://${slug}.jadarat-ats.app`
      }
      // Extract the main domain (e.g., jadarat-ats.vercel.app -> jadarat-ats.vercel.app)
      const parts = hostname.split('.')
      // If already on a subdomain, get the root domain
      const rootDomain = parts.length > 2 ? parts.slice(-2).join('.') : hostname
      return `https://${slug}.${rootDomain}`
    }
    return `https://${slug}.jadarat-ats.app`
  }

  // Check slug availability
  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null)
      return
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(slug)) {
      setSlugAvailable(false)
      return
    }

    setIsCheckingSlug(true)
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .neq("id", organizationId)
        .single()

      // If no data found, slug is available
      setSlugAvailable(!data && !error?.message?.includes('multiple'))
    } catch {
      setSlugAvailable(true)
    } finally {
      setIsCheckingSlug(false)
    }
  }

  // Update slug
  const handleUpdateSlug = async () => {
    if (!newSlug || !slugAvailable || !organizationId) return

    try {
      const { error } = await supabase
        .from("organizations")
        .update({ slug: newSlug, updated_at: new Date().toISOString() })
        .eq("id", organizationId)

      if (error) throw error

      setSettings({ ...settings, slug: newSlug })
      setNewSlug("")
      setSlugAvailable(null)
      toast.success("Subdomain updated successfully")
    } catch (error) {
      console.error("Error updating slug:", error)
      toast.error("Failed to update subdomain")
    }
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
          // Cast to include optional fields that may exist in DB but not in types yet
          const orgData = org as typeof org & {
            login_image_url?: string | null
            subdomain_enabled?: boolean
          }
          setSettings({
            company_name: org.name || "",
            company_name_ar: org.name_ar || "",
            slug: org.slug || "",
            tagline: "",
            tagline_ar: "",
            logo_url: org.logo_url || "",
            favicon_url: "",
            login_image_url: orgData.login_image_url || "",
            primary_color: org.primary_color || "#6366F1",
            secondary_color: org.secondary_color || "#8B5CF6",
            website_url: org.custom_domain || "",
            careers_page_url: getCareersPageUrl(org.slug || ""),
            subdomain_enabled: orgData.subdomain_enabled || false,
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

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file")
      return
    }

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

    if (!file.type.startsWith('image/') && file.type !== 'image/x-icon') {
      toast.error("Please upload an image or .ico file")
      return
    }

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

  // Handle login image upload
  const handleLoginImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !organizationId) {
      if (!organizationId) toast.error("Organization not found. Please refresh the page.")
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file")
      return
    }

    // Max 5MB for login image
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    setIsUploadingLoginImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${organizationId}/login-image.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        console.error("Storage upload error:", uploadError)
        if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('policy')) {
          toast.error("Permission denied. Please contact support to enable file uploads.")
        } else if (uploadError.message?.includes('bucket')) {
          toast.error("Storage not configured. Please contact support.")
        } else {
          toast.error(`Upload failed: ${uploadError.message || 'Unknown error'}`)
        }
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(fileName)

      setSettings({ ...settings, login_image_url: publicUrl })
      setLoginImageError(false) // Reset error state on successful upload
      toast.success("Login image uploaded successfully")
    } catch (error) {
      console.error("Error uploading login image:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast.error(`Failed to upload: ${errorMessage}`)
    } finally {
      setIsUploadingLoginImage(false)
    }
  }

  const handleRemoveLogo = () => {
    setSettings({ ...settings, logo_url: "" })
  }

  const handleRemoveFavicon = () => {
    setSettings({ ...settings, favicon_url: "" })
  }

  const handleRemoveLoginImage = () => {
    setSettings({ ...settings, login_image_url: "" })
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
          login_image_url: settings.login_image_url || null,
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          custom_domain: settings.website_url || null,
          subdomain_enabled: settings.subdomain_enabled,
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
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-brand"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company Information */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
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
                  className="rounded-xl"
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
                  className="rounded-xl"
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
                  className="rounded-xl"
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
                  className="rounded-xl"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo & Favicon */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
              Logo & Favicon
            </CardTitle>
            <CardDescription>
              Upload your company logo and favicon
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
              <div className="flex items-center justify-between">
                <Label>Company Logo</Label>
                <Badge variant="secondary" className="text-xs">
                  Recommended: 200x60px
                </Badge>
              </div>
              {settings.logo_url ? (
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
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
                    className="rounded-lg"
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
                    className="rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
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
              )}
            </div>

            {/* Favicon Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Favicon</Label>
                <Badge variant="secondary" className="text-xs">
                  32x32px or 64x64px
                </Badge>
              </div>
              {settings.favicon_url ? (
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
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
                    className="rounded-lg"
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
                    className="rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
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
              )}
            </div>
          </CardContent>
        </Card>

        {/* Login Page Image */}
        <Card className="modern-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
              Login Page Image
            </CardTitle>
            <CardDescription>
              Customize the image shown on the right side of your login page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              ref={loginImageInputRef}
              onChange={handleLoginImageUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Upload Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium">Recommended dimensions</p>
                    <p className="text-blue-600 dark:text-blue-400">1920 x 1080px (16:9 ratio) or 1200 x 1600px (3:4 portrait)</p>
                  </div>
                </div>

                {settings.login_image_url && !loginImageError ? (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden border">
                      <img
                        src={settings.login_image_url}
                        alt="Login image preview"
                        className="w-full h-48 object-cover"
                        onError={() => {
                          setLoginImageError(true)
                          toast.error("Failed to load image. The image may have been deleted or is inaccessible.")
                        }}
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => loginImageInputRef.current?.click()}
                          disabled={isUploadingLoginImage}
                          className="rounded-lg shadow-lg"
                        >
                          {isUploadingLoginImage ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          Replace
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={handleRemoveLoginImage}
                          className="rounded-lg shadow-lg"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This image will appear on the right side of your login page
                    </p>
                  </div>
                ) : settings.login_image_url && loginImageError ? (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden border bg-muted/50 p-8 text-center">
                      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">Image failed to load</p>
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loginImageInputRef.current?.click()}
                          disabled={isUploadingLoginImage}
                          className="rounded-lg"
                        >
                          {isUploadingLoginImage ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          Upload New Image
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            handleRemoveLoginImage()
                            setLoginImageError(false)
                          }}
                          className="rounded-lg"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => loginImageInputRef.current?.click()}
                  >
                    {isUploadingLoginImage ? (
                      <Loader2 className="h-10 w-10 mx-auto text-muted-foreground animate-spin" />
                    ) : (
                      <div className="space-y-3">
                        <div
                          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                          style={{ background: "var(--brand-gradient-subtle)" }}
                        >
                          <ImageIcon className="h-8 w-8" style={{ color: "var(--brand-primary)" }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Upload login page image</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG or WebP (max 5MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Preview Section */}
              <div className="space-y-3">
                <Label>Login Page Preview</Label>
                <div className="border rounded-xl overflow-hidden bg-background">
                  <div className="flex h-64">
                    {/* Left side - Form preview */}
                    <div className="flex-1 p-4 flex flex-col justify-center">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {settings.logo_url ? (
                            <img src={settings.logo_url} alt="" className="h-6 object-contain" />
                          ) : (
                            <div
                              className="w-6 h-6 rounded-lg flex items-center justify-center"
                              style={{ background: "var(--brand-gradient)" }}
                            >
                              <Sparkles className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <span className="text-xs font-bold gradient-text">
                            {settings.company_name || "Your Company"}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="h-2 bg-muted rounded w-20" />
                          <div className="h-6 bg-muted rounded-lg" />
                          <div className="h-6 bg-muted rounded-lg" />
                          <div
                            className="h-6 rounded-lg"
                            style={{ background: "var(--brand-gradient)" }}
                          />
                        </div>
                      </div>
                    </div>
                    {/* Right side - Image preview */}
                    <div
                      className="flex-1 relative"
                      style={{
                        background: settings.login_image_url && !loginImageError
                          ? `url(${settings.login_image_url}) center/cover`
                          : "var(--brand-gradient)"
                      }}
                    >
                      {(!settings.login_image_url || loginImageError) && (
                        <div className="absolute inset-0 flex items-center justify-center text-white/50">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand Colors */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
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
                  className="w-12 h-12 rounded-xl border-2 border-border shadow-inner"
                  style={{ backgroundColor: settings.primary_color }}
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) =>
                    setSettings({ ...settings, primary_color: e.target.value })
                  }
                  placeholder="#6366F1"
                  className="w-32 rounded-xl font-mono"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    className="w-9 h-9 rounded-xl border-2 border-transparent hover:border-foreground/20 relative transition-all hover:scale-110"
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      setSettings({ ...settings, primary_color: color })
                    }
                  >
                    {settings.primary_color.toLowerCase() === color.toLowerCase() && (
                      <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label>Secondary Color</Label>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl border-2 border-border shadow-inner"
                  style={{ backgroundColor: settings.secondary_color }}
                />
                <Input
                  value={settings.secondary_color}
                  onChange={(e) =>
                    setSettings({ ...settings, secondary_color: e.target.value })
                  }
                  placeholder="#8B5CF6"
                  className="w-32 rounded-xl font-mono"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    className="w-9 h-9 rounded-xl border-2 border-transparent hover:border-foreground/20 relative transition-all hover:scale-110"
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      setSettings({ ...settings, secondary_color: color })
                    }
                  >
                    {settings.secondary_color.toLowerCase() === color.toLowerCase() && (
                      <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subdomain Configuration */}
        <Card className="modern-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
              Subdomain Configuration
            </CardTitle>
            <CardDescription>
              Set up a custom subdomain for your organization&apos;s login and career pages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable Subdomain */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="space-y-1">
                <Label className="text-base font-medium">Enable Subdomain Access</Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to access your portal via a custom subdomain
                </p>
              </div>
              <Switch
                checked={settings.subdomain_enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, subdomain_enabled: checked })
                }
              />
            </div>

            {settings.subdomain_enabled && (
              <>
                {/* Current Subdomain */}
                <div className="space-y-3">
                  <Label>Your Subdomain URL</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <Input
                        value={settings.slug ? getSubdomainUrl(settings.slug) : ""}
                        readOnly
                        className="bg-muted/50 pr-24 rounded-xl font-mono text-sm"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {settings.subdomain_enabled && settings.slug && (
                          <Badge className="bg-emerald-500 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (settings.slug) {
                          navigator.clipboard.writeText(getSubdomainUrl(settings.slug))
                          toast.success("Subdomain URL copied to clipboard")
                        }
                      }}
                      disabled={!settings.slug}
                      className="rounded-xl gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (settings.slug) {
                          window.open(getSubdomainUrl(settings.slug), "_blank")
                        }
                      }}
                      disabled={!settings.slug}
                      className="rounded-xl gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Visit
                    </Button>
                  </div>
                </div>

                {/* Change Subdomain */}
                <div className="space-y-3 pt-4 border-t">
                  <Label>Change Subdomain</Label>
                  <p className="text-sm text-muted-foreground">
                    Your subdomain must be lowercase, contain only letters, numbers, and hyphens
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <Input
                        value={newSlug}
                        onChange={(e) => {
                          const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                          setNewSlug(value)
                          checkSlugAvailability(value)
                        }}
                        placeholder="your-company"
                        className="rounded-xl pr-10"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isCheckingSlug && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        {!isCheckingSlug && slugAvailable === true && newSlug && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                        {!isCheckingSlug && slugAvailable === false && newSlug && (
                          <AlertCircle className="h-4 w-4 text-rose-500" />
                        )}
                      </div>
                    </div>
                    <span className="text-muted-foreground">.jadarat-ats.app</span>
                    <Button
                      onClick={handleUpdateSlug}
                      disabled={!newSlug || !slugAvailable || isCheckingSlug}
                      className="rounded-xl"
                      style={{ background: "var(--brand-gradient)" }}
                    >
                      Update
                    </Button>
                  </div>
                  {newSlug && slugAvailable === false && (
                    <p className="text-sm text-rose-500">
                      This subdomain is already taken or invalid. Please try another.
                    </p>
                  )}
                  {newSlug && slugAvailable === true && (
                    <p className="text-sm text-emerald-600">
                      This subdomain is available!
                    </p>
                  )}
                </div>

                {/* Info Box */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">How it works</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-400">
                      <li>Users can access your login page at <strong>{settings.slug || "your-subdomain"}.jadarat-ats.app/login</strong></li>
                      <li>Your careers page will be available at <strong>{settings.slug || "your-subdomain"}.jadarat-ats.app/careers</strong></li>
                      <li>All your branding (logo, colors, login image) will be displayed</li>
                    </ul>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Custom Domain Configuration */}
        <Card className="modern-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
              Custom Domain
            </CardTitle>
            <CardDescription>
              Use your own domain for a fully white-labeled experience (e.g., careers.yourcompany.com)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Custom Domain Input */}
            <div className="space-y-3">
              <Label>Your Custom Domain</Label>
              <div className="flex items-center gap-3">
                <Input
                  value={settings.website_url}
                  onChange={(e) => setSettings({ ...settings, website_url: e.target.value })}
                  placeholder="careers.yourcompany.com"
                  className="rounded-xl font-mono"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (settings.website_url) {
                      window.open(`https://${settings.website_url.replace(/^https?:\/\//, '')}`, "_blank")
                    }
                  }}
                  disabled={!settings.website_url}
                  className="rounded-xl gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Test
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your domain without https:// (e.g., careers.yourcompany.com)
              </p>
            </div>

            {/* DNS Instructions */}
            {settings.website_url && (
              <div className="space-y-4 pt-4 border-t">
                <Label className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  DNS Configuration Required
                </Label>
                <div className="bg-muted/50 rounded-xl p-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Add the following DNS records to your domain provider:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium">Type</th>
                          <th className="text-left py-2 px-3 font-medium">Name</th>
                          <th className="text-left py-2 px-3 font-medium">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 px-3">
                            <Badge variant="outline">CNAME</Badge>
                          </td>
                          <td className="py-2 px-3 font-mono text-xs">
                            {settings.website_url.replace(/^https?:\/\//, '').split('.')[0]}
                          </td>
                          <td className="py-2 px-3 font-mono text-xs">
                            cname.vercel-dns.com
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      DNS changes can take up to 48 hours to propagate. After adding the record,
                      contact support to complete domain verification.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <p className="font-medium mb-1">Custom Domain Benefits</p>
                <ul className="list-disc list-inside space-y-1 text-amber-600 dark:text-amber-400">
                  <li>Fully white-labeled login and careers pages</li>
                  <li>Your own SSL certificate (automatically provisioned)</li>
                  <li>No Jadarat branding visible to candidates</li>
                  <li>Professional appearance for your organization</li>
                </ul>
              </div>
            </div>

            {/* Careers Page URL */}
            <div className="space-y-3 pt-4 border-t">
              <Label>Default Careers Page URL</Label>
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Input
                    value={settings.slug ? getCareersPageUrl(settings.slug) : ""}
                    readOnly
                    className="bg-muted/50 pr-10 rounded-xl font-mono text-sm"
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
                  className="rounded-xl gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This is your default careers page URL. You can also use your custom domain if configured.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle>Career Page Preview</CardTitle>
          <CardDescription>
            See how your branding will appear on the careers page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 rounded-xl border bg-background">
            <div className="flex items-center gap-4 mb-6">
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt="Company logo"
                  className="h-12 object-contain"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--brand-gradient)" }}
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
                style={{ background: "var(--brand-gradient)" }}
                className="hover:opacity-90 rounded-xl"
              >
                View Open Positions
              </Button>
              <Button
                variant="outline"
                style={{
                  borderColor: settings.secondary_color,
                  color: settings.secondary_color,
                }}
                className="rounded-xl"
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
