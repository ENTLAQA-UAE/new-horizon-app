"use client"

import { useState, useEffect, useRef } from "react"
import { supabaseUpdate, supabaseSelect, getAccessToken } from "@/lib/supabase/auth-fetch"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Monitor,
  Sparkles,
  Info,
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default function BrandingPage() {
  const { profile, organization, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false)
  const [isUploadingLoginImage, setIsUploadingLoginImage] = useState(false)
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
  })

  // Get organization ID from auth context
  const organizationId = profile?.org_id || null

  // Generate careers page URL based on slug
  const getCareersPageUrl = (slug: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/careers/${slug}`
    }
    return `/careers/${slug}`
  }

  // Initialize settings from auth context organization data
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return
    }

    // If no organization in auth context, we're done loading
    if (!organization || !organizationId) {
      setIsLoading(false)
      return
    }

    // Use organization data from auth context (already loaded by parent layout)
    // Then fetch additional fields not in auth context (login_image_url, custom_domain)
    async function loadAdditionalBrandingData() {
      try {
        // Fetch additional branding fields not in auth context using auth-fetch helper
        const { data } = await supabaseSelect<{ login_image_url?: string; custom_domain?: string }>(
          "organizations",
          {
            select: "login_image_url, custom_domain",
            filter: [{ column: "id", operator: "eq", value: organizationId }],
            single: true,
          }
        )

        setSettings({
          company_name: organization.name || "",
          company_name_ar: organization.name_ar || "",
          slug: organization.slug || "",
          tagline: "",
          tagline_ar: "",
          logo_url: organization.logo_url || "",
          favicon_url: "",
          login_image_url: data?.login_image_url || "",
          primary_color: organization.primary_color || "#6366F1",
          secondary_color: organization.secondary_color || "#8B5CF6",
          website_url: data?.custom_domain || "",
          careers_page_url: getCareersPageUrl(organization.slug || ""),
        })
      } catch (error) {
        console.error("Error loading additional branding:", error)
        // Still set what we have from auth context
        setSettings({
          company_name: organization.name || "",
          company_name_ar: organization.name_ar || "",
          slug: organization.slug || "",
          tagline: "",
          tagline_ar: "",
          logo_url: organization.logo_url || "",
          favicon_url: "",
          login_image_url: "",
          primary_color: organization.primary_color || "#6366F1",
          secondary_color: organization.secondary_color || "#8B5CF6",
          website_url: "",
          careers_page_url: getCareersPageUrl(organization.slug || ""),
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadAdditionalBrandingData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, organization, organizationId])

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
      const accessToken = await getAccessToken()
      if (!accessToken) { toast.error("Session expired. Please refresh."); return }

      const fileExt = file.name.split('.').pop()
      const fileName = `${organizationId}/logo.${fileExt}`

      const uploadFormData = new FormData()
      uploadFormData.append('', file)
      const uploadResponse = await fetch(
        `${SUPABASE_URL}/storage/v1/object/organization-assets/${fileName}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': SUPABASE_ANON_KEY || '',
            'x-upsert': 'true',
          },
          body: uploadFormData,
        }
      )

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text()
        throw new Error(errText || `Upload failed: ${uploadResponse.status}`)
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/organization-assets/${fileName}`
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
      const accessToken = await getAccessToken()
      if (!accessToken) { toast.error("Session expired. Please refresh."); return }

      const fileExt = file.name.split('.').pop()
      const fileName = `${organizationId}/favicon.${fileExt}`

      const uploadFormData = new FormData()
      uploadFormData.append('', file)
      const uploadResponse = await fetch(
        `${SUPABASE_URL}/storage/v1/object/organization-assets/${fileName}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': SUPABASE_ANON_KEY || '',
            'x-upsert': 'true',
          },
          body: uploadFormData,
        }
      )

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text()
        throw new Error(errText || `Upload failed: ${uploadResponse.status}`)
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/organization-assets/${fileName}`
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
      const accessToken = await getAccessToken()
      if (!accessToken) { toast.error("Session expired. Please refresh."); return }

      const fileExt = file.name.split('.').pop()
      const fileName = `${organizationId}/login-image.${fileExt}`

      const uploadFormData = new FormData()
      uploadFormData.append('', file)
      const uploadResponse = await fetch(
        `${SUPABASE_URL}/storage/v1/object/organization-assets/${fileName}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': SUPABASE_ANON_KEY || '',
            'x-upsert': 'true',
          },
          body: uploadFormData,
        }
      )

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text()
        if (errText.includes('row-level security') || errText.includes('policy')) {
          toast.error("Permission denied. Please contact support to enable file uploads.")
        } else if (errText.includes('bucket')) {
          toast.error("Storage not configured. Please contact support.")
        } else {
          toast.error(`Upload failed: ${errText || uploadResponse.status}`)
        }
        return
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/organization-assets/${fileName}`
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
      const { error } = await supabaseUpdate("organizations", {
        name: settings.company_name,
        name_ar: settings.company_name_ar || null,
        logo_url: settings.logo_url || null,
        login_image_url: settings.login_image_url || null,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        custom_domain: settings.website_url || null,
        updated_at: new Date().toISOString(),
      }, { column: "id", value: organizationId })

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

        {/* Website Links */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
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
                className="rounded-xl"
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
                    className="bg-muted/50 pr-10 rounded-xl"
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
                  className="rounded-xl"
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This URL is auto-generated based on your organization slug
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
