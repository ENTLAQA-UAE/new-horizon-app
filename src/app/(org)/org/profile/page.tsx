"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { getAccessToken } from "@/lib/supabase/auth-fetch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, User, Mail, Phone, Camera, Save, Upload } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { useI18n } from "@/lib/i18n"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  avatar_url: string | null
}

export default function ProfilePage() {
  const { refreshProfile } = useAuth()
  const { language } = useI18n()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [formData, setFormData] = useState<Partial<Profile>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone, avatar_url")
        .eq("id", user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFormData(profileData)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      toast.error(language === "ar" ? "فشل تحميل الملف الشخصي" : "Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) throw error

      toast.success(language === "ar" ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully")
      setProfile({ ...profile, ...formData })
      // Refresh the auth context to update header
      refreshProfile?.()
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error(language === "ar" ? "فشل تحديث الملف الشخصي" : "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(language === "ar" ? "يرجى اختيار ملف صورة" : "Please select an image file")
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(language === "ar" ? "حجم الصورة يجب أن يكون أقل من 2 ميجابايت" : "Image size must be less than 2MB")
      return
    }

    setIsUploading(true)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        throw new Error("Not authenticated")
      }

      const fileExt = file.name.split(".").pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload using direct REST API (bypasses getSession hang)
      const uploadResponse = await fetch(
        `${SUPABASE_URL}/storage/v1/object/public/${filePath}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: SUPABASE_ANON_KEY,
            "x-upsert": "true",
          },
          body: file,
        }
      )

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        throw new Error(`Upload failed: ${errorText}`)
      }

      // Get public URL
      const avatarUrl = `${SUPABASE_URL}/storage/v1/object/public/${filePath}`

      // Update profile with new avatar URL
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) throw error

      setProfile({ ...profile, avatar_url: avatarUrl })
      setFormData({ ...formData, avatar_url: avatarUrl })
      toast.success(language === "ar" ? "تم تحديث الصورة الشخصية" : "Profile photo updated")
      // Refresh auth context to update header avatar
      refreshProfile?.()
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast.error(language === "ar" ? "فشل تحميل الصورة" : "Failed to upload photo")
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const getInitials = () => {
    const first = formData.first_name?.[0] || ""
    const last = formData.last_name?.[0] || ""
    return (first + last).toUpperCase() || "U"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {language === "ar" ? "الملف الشخصي غير موجود" : "Profile not found"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {language === "ar" ? "الملف الشخصي" : "Profile"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "إدارة معلوماتك الشخصية" : "Manage your personal information"}
          </p>
        </div>
      </div>

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {language === "ar" ? "الصورة الشخصية" : "Profile Photo"}
          </CardTitle>
          <CardDescription>
            {language === "ar" ? "قم بتحميل صورة شخصية لحسابك" : "Upload a profile photo for your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-border">
                <AvatarImage src={formData.avatar_url || ""} alt="Profile" />
                <AvatarFallback
                  className="text-2xl font-semibold text-white"
                  style={{ background: `var(--brand-gradient)` }}
                >
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                ref={fileInputRef}
                disabled={isUploading}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {language === "ar" ? "تحميل صورة" : "Upload Photo"}
              </Button>
              <p className="text-xs text-muted-foreground">
                {language === "ar" ? "JPG, PNG أو GIF. الحد الأقصى 2 ميجابايت" : "JPG, PNG or GIF. Max 2MB"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {language === "ar" ? "المعلومات الشخصية" : "Personal Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                {language === "ar" ? "الاسم الأول" : "First Name"}
              </Label>
              <Input
                id="first_name"
                value={formData.first_name || ""}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder={language === "ar" ? "أدخل الاسم الأول" : "Enter first name"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">
                {language === "ar" ? "اسم العائلة" : "Last Name"}
              </Label>
              <Input
                id="last_name"
                value={formData.last_name || ""}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder={language === "ar" ? "أدخل اسم العائلة" : "Enter last name"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {language === "ar" ? "البريد الإلكتروني" : "Email"}
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              {language === "ar" ? "لا يمكن تغيير البريد الإلكتروني" : "Email cannot be changed"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {language === "ar" ? "رقم الهاتف" : "Phone Number"}
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone || ""}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+966 5X XXX XXXX"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {language === "ar" ? "حفظ التغييرات" : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
