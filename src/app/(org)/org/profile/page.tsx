// @ts-nocheck
"use client"

import { useEffect, useState, useRef } from "react"
import { getAccessToken, supabaseSelect, supabaseUpdate } from "@/lib/supabase/auth-fetch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, User, Mail, Phone, Camera, Save, Upload, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
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
  const { user, refreshAuth } = useAuth()
  const { language } = useI18n()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [formData, setFormData] = useState<Partial<Profile>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      loadProfile(user.id)
    }
  }, [user])

  const loadProfile = async (userId: string) => {
    try {
      // Use direct REST API call to bypass Supabase client's getSession() which hangs
      const { data: profileData, error } = await supabaseSelect<Profile>("profiles", {
        select: "id,first_name,last_name,email,phone,avatar_url",
        filter: [{ column: "id", operator: "eq", value: userId }],
        single: true,
      })

      if (error) {
        console.error("Error loading profile:", error.message)
        toast.error("Failed to load profile")
        return
      }

      if (profileData) {
        setProfile(profileData)
        setFormData(profileData)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      toast.error("Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    setIsSaving(true)
    try {
      // Use direct REST API call to bypass Supabase client's getSession() which hangs
      const { error } = await supabaseUpdate(
        "profiles",
        {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        },
        { column: "id", value: profile.id }
      )

      if (error) throw new Error(error.message)

      toast.success(language === "ar" ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully")
      setProfile({ ...profile, ...formData })
      // Refresh the auth context to update header
      refreshAuth()
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
      // Note: Upload endpoint uses /object/{bucket}/{path}, NOT /object/public/
      const uploadResponse = await fetch(
        `${SUPABASE_URL}/storage/v1/object/${filePath}`,
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

      // Update profile with new avatar URL (using direct REST API)
      const { error } = await supabaseUpdate(
        "profiles",
        {
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        },
        { column: "id", value: profile.id }
      )

      if (error) throw new Error(error.message)

      setProfile({ ...profile, avatar_url: avatarUrl })
      setFormData({ ...formData, avatar_url: avatarUrl })
      toast.success(language === "ar" ? "تم تحديث الصورة الشخصية" : "Profile photo updated")
      // Refresh auth context to update header avatar
      refreshAuth()
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

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error(language === "ar" ? "يرجى إدخال كلمة المرور الحالية" : "Please enter your current password")
      return
    }
    if (!newPassword) {
      toast.error(language === "ar" ? "يرجى إدخال كلمة المرور الجديدة" : "Please enter a new password")
      return
    }
    if (newPassword.length < 8) {
      toast.error(language === "ar" ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل" : "Password must be at least 8 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error(language === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match")
      return
    }

    setIsChangingPassword(true)
    try {
      const supabase = createClient()

      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || "",
        password: currentPassword,
      })

      if (signInError) {
        toast.error(language === "ar" ? "كلمة المرور الحالية غير صحيحة" : "Current password is incorrect")
        return
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      toast.success(language === "ar" ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      console.error("Error changing password:", error)
      toast.error(error.message || (language === "ar" ? "فشل تغيير كلمة المرور" : "Failed to change password"))
    } finally {
      setIsChangingPassword(false)
    }
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

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {language === "ar" ? "تغيير كلمة المرور" : "Change Password"}
          </CardTitle>
          <CardDescription>
            {language === "ar" ? "قم بتحديث كلمة المرور الخاصة بحسابك" : "Update your account password"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_password">
              {language === "ar" ? "كلمة المرور الحالية" : "Current Password"}
            </Label>
            <div className="relative">
              <Input
                id="current_password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={language === "ar" ? "أدخل كلمة المرور الحالية" : "Enter current password"}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_password">
              {language === "ar" ? "كلمة المرور الجديدة" : "New Password"}
            </Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={language === "ar" ? "أدخل كلمة المرور الجديدة" : "Enter new password"}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">
              {language === "ar" ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}
            </Label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={language === "ar" ? "أعد إدخال كلمة المرور الجديدة" : "Re-enter new password"}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Password requirements */}
          {newPassword && (
            <div className="space-y-1.5 text-sm">
              <p className="text-muted-foreground font-medium">
                {language === "ar" ? "متطلبات كلمة المرور:" : "Password requirements:"}
              </p>
              <div className={`flex items-center gap-2 ${newPassword.length >= 8 ? "text-green-600" : "text-muted-foreground"}`}>
                <CheckCircle2 className="h-4 w-4" />
                {language === "ar" ? "8 أحرف على الأقل" : "At least 8 characters"}
              </div>
              {confirmPassword && (
                <div className={`flex items-center gap-2 ${newPassword === confirmPassword ? "text-green-600" : "text-destructive"}`}>
                  <CheckCircle2 className="h-4 w-4" />
                  {language === "ar" ? "كلمات المرور متطابقة" : "Passwords match"}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              {language === "ar" ? "تغيير كلمة المرور" : "Change Password"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
