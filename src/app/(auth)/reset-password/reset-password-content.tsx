"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Loader2,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import type { OrgBranding } from "./page"

function KawadirLogo({ size = 40, primaryColor, secondaryColor }: { size?: number; primaryColor?: string; secondaryColor?: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl"
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, ${primaryColor || "#2D4CFF"} 0%, ${secondaryColor || "#6B7FFF"} 100%)`,
        boxShadow: `0 6px 24px -6px ${primaryColor || "rgba(45, 76, 255, 0.4)"}66`,
      }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" fillOpacity="0.9" />
        <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      </svg>
    </div>
  )
}

interface ResetPasswordContentProps {
  initialOrgBranding: OrgBranding | null
}

export default function ResetPasswordContent({ initialOrgBranding }: ResetPasswordContentProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const router = useRouter()
  const { t, language, setLanguage, isRTL } = useI18n()

  const orgBranding = initialOrgBranding
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight

  // Brand colors
  const primaryColor = orgBranding?.primary_color || "#2D4CFF"
  const secondaryColor = orgBranding?.secondary_color || "#6B7FFF"
  const brandGradient = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
  const brandName = orgBranding?.name || "Kawadir"

  useEffect(() => {
    setMounted(true)

    // Handle the auth session from OTP query params, hash tokens, or existing session
    const handleAuthSession = async () => {
      const supabase = createClient()

      // Method 1a: Hashed token in query params (from custom password reset emails)
      const params = new URLSearchParams(window.location.search)
      const tokenHash = params.get('token_hash')
      const otpType = params.get('type')

      if (tokenHash) {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: (otpType as 'recovery' | 'email') || 'recovery',
          })

          if (error) {
            console.error('Token hash verification error:', error)
            setSessionError(error.message)
            return
          }

          if (data.session) {
            setSessionReady(true)
            window.history.replaceState(null, '', window.location.pathname)
          } else {
            setSessionError('Reset link has expired. Please request a new one.')
          }
        } catch (err: any) {
          console.error('Failed to verify reset link:', err)
          setSessionError(err.message || 'Failed to verify reset link')
        }
        return
      }

      // Method 1b: Raw OTP token in query params (from admin-generated invite links)
      const otpToken = params.get('token')
      const otpEmail = params.get('email')

      if (otpToken && otpEmail) {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            email: otpEmail,
            token: otpToken,
            type: (otpType as 'recovery' | 'email') || 'recovery',
          })

          if (error) {
            console.error('OTP verification error:', error)
            setSessionError(error.message)
            return
          }

          if (data.session) {
            setSessionReady(true)
            window.history.replaceState(null, '', window.location.pathname)
          } else {
            setSessionError('Invite link has expired. Please request a new one.')
          }
        } catch (err: any) {
          console.error('Failed to verify invite link:', err)
          setSessionError(err.message || 'Failed to verify invite link')
        }
        return
      }

      // Method 2a: Hash fragment with error (from Supabase redirect on expired/invalid token)
      const hash = window.location.hash
      if (hash && hash.includes('error=')) {
        const hashParams = new URLSearchParams(hash.substring(1))
        const errorCode = hashParams.get('error_code') || hashParams.get('error')
        const errorDesc = hashParams.get('error_description')?.replace(/\+/g, ' ')

        if (errorCode === 'otp_expired' || errorCode === 'access_denied') {
          setSessionError(errorDesc || 'Your password reset link has expired. Please request a new one.')
        } else {
          setSessionError(errorDesc || 'An error occurred with your reset link. Please request a new one.')
        }
        window.history.replaceState(null, '', window.location.pathname)
        return
      }

      // Method 2b: Hash fragment with tokens (from Supabase email redirects)
      if (hash && hash.includes('access_token')) {
        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken) {
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            })

            if (error) {
              console.error('Session error:', error)
              setSessionError(error.message)
              return
            }

            if (data.session) {
              setSessionReady(true)
              window.history.replaceState(null, '', window.location.pathname)
            } else {
              setSessionError('Reset link has expired. Please request a new one.')
            }
          } catch (err: any) {
            console.error('Failed to establish session:', err)
            setSessionError(err.message || 'Failed to verify reset link')
          }
        } else {
          setSessionError('Invalid or expired reset link')
        }
        return
      }

      // Method 3: Check for existing active session
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setSessionReady(true)
      } else {
        setSessionError('No valid reset session found. Please request a new password reset link.')
      }
    }

    handleAuthSession()
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password) {
      toast.error("Please enter a new password")
      return
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        throw error
      }

      setSuccess(true)
      toast.success("Password updated successfully!")

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (error: any) {
      console.error("Reset password error:", error)
      toast.error(error.message || "Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  // Language switcher component (reused across states)
  const LanguageSwitcher = () => (
    <div className={cn("fixed top-4 z-50", isRTL ? "left-4" : "right-4")}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setLanguage(language === "en" ? "ar" : "en")}
        className="h-10 w-10 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-white shadow-sm"
        title={language === "en" ? "العربية" : "English"}
      >
        <Globe className="h-5 w-5 text-gray-600" />
      </Button>
    </div>
  )

  // Logo component (reused across states)
  const BrandLogo = ({ size = 48 }: { size?: number }) => (
    orgBranding?.logo_url ? (
      <img src={orgBranding.logo_url} alt={brandName} className="h-12 w-auto object-contain" />
    ) : (
      <KawadirLogo size={size} primaryColor={primaryColor} secondaryColor={secondaryColor} />
    )
  )

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="flex flex-col items-center gap-4">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: primaryColor }} />
            <span className="text-sm text-[#616161]">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  // Show loading while establishing session
  if (!sessionReady && !sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]" dir={isRTL ? "rtl" : "ltr"}>
        <LanguageSwitcher />
        <div className="flex flex-col items-center gap-4">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: primaryColor }} />
            <span className="text-sm text-gray-500">{t("auth.resetPassword.verifyingLink")}</span>
          </div>
        </div>
      </div>
    )
  }

  // Show error if session could not be established
  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]" dir={isRTL ? "rtl" : "ltr"}>
        <LanguageSwitcher />
        <div className="max-w-md text-center px-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "#fef2f2" }}
          >
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t("auth.resetPassword.linkExpired")}
          </h2>
          <p className="text-gray-600 mb-6">
            {sessionError}
          </p>
          <Link href="/forgot-password">
            <Button
              className="w-full h-12 text-base font-semibold text-white border-0"
              style={{ background: brandGradient }}
            >
              {t("auth.resetPassword.requestNew")}
              <ArrowIcon className={cn("h-5 w-5", isRTL ? "mr-2" : "ml-2")} />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[#F5F5F5]" dir={isRTL ? "rtl" : "ltr"}>
      <LanguageSwitcher />

      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <BrandLogo size={44} />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {brandName}
                </h1>
                <p className="text-sm text-gray-500">{t("auth.resetPassword.platformSubtitle")}</p>
              </div>
            </div>
          </div>

          {!success ? (
            <>
              {/* Heading */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {t("auth.resetPassword.title")}
                </h2>
                <p className="text-gray-600">
                  {t("auth.resetPassword.subtitle")}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">
                    {t("auth.resetPassword.newPassword")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.resetPassword.newPasswordPlaceholder")}
                      value={password}
                      autoComplete="new-password"
                      onChange={(e) => setPassword(e.target.value)}
                      className={cn(
                        "h-12 text-base border-gray-200 focus:border-transparent transition-all duration-200",
                        isRTL ? "pl-12 pr-4" : "pr-12 pl-4"
                      )}
                      style={{
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                      onFocus={(e) => {
                        e.target.style.boxShadow = `0 0 0 3px ${primaryColor}20`
                        e.target.style.borderColor = primaryColor
                      }}
                      onBlur={(e) => {
                        e.target.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)"
                        e.target.style.borderColor = "#e5e7eb"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600",
                        isRTL ? "left-3" : "right-3"
                      )}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                    {t("auth.resetPassword.confirmPassword")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t("auth.resetPassword.confirmPasswordPlaceholder")}
                      value={confirmPassword}
                      autoComplete="new-password"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={cn(
                        "h-12 text-base border-gray-200 focus:border-transparent transition-all duration-200",
                        isRTL ? "pl-12 pr-4" : "pr-12 pl-4"
                      )}
                      style={{
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                      onFocus={(e) => {
                        e.target.style.boxShadow = `0 0 0 3px ${primaryColor}20`
                        e.target.style.borderColor = primaryColor
                      }}
                      onBlur={(e) => {
                        e.target.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)"
                        e.target.style.borderColor = "#e5e7eb"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600",
                        isRTL ? "left-3" : "right-3"
                      )}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password requirements */}
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">{t("auth.resetPassword.passwordMustContain")}</p>
                  <ul className="text-sm space-y-1">
                    <li className={cn(
                      "flex items-center gap-2",
                      password.length >= 8 ? "text-green-600" : "text-gray-400"
                    )}>
                      <CheckCircle2 className="h-4 w-4" />
                      {t("auth.resetPassword.passwordRequirement")}
                    </li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 text-base font-semibold text-white border-0 transition-all duration-200 hover:opacity-90 hover:scale-[1.01]"
                  style={{ background: brandGradient }}
                >
                  {loading ? (
                    <Loader2 className={cn("h-5 w-5 animate-spin", isRTL ? "ml-2" : "mr-2")} />
                  ) : (
                    <Lock className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />
                  )}
                  {loading ? t("auth.resetPassword.resetting") : t("auth.resetPassword.resetPassword")}
                </Button>
              </form>
            </>
          ) : (
            <>
              {/* Success state */}
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: `${primaryColor}15` }}
                >
                  <CheckCircle2 className="w-8 h-8" style={{ color: primaryColor }} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {t("auth.resetPassword.success")}
                </h2>
                <p className="text-gray-600 mb-8">
                  {t("auth.resetPassword.successMessage")}<br />
                  {t("auth.resetPassword.redirecting")}
                </p>

                <Link href="/login">
                  <Button
                    className="w-full h-12 text-base font-semibold text-white border-0"
                    style={{ background: brandGradient }}
                  >
                    {t("auth.resetPassword.continueToSignIn")}
                    <ArrowIcon className={cn("h-5 w-5", isRTL ? "mr-2" : "ml-2")} />
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500">
              {t("auth.common.poweredBy")}{" "}
              <span className="font-semibold" style={{ color: primaryColor }}>
                {t("auth.common.kawadirATS")}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div
        className="hidden lg:flex lg:flex-1 items-center justify-center relative overflow-hidden"
        style={{ background: brandGradient }}
      >
        <div className="relative z-10 text-center text-white px-12">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">
            {t("auth.resetPassword.almostThere")}
          </h2>
          <p className="text-lg text-white/80 max-w-md mx-auto">
            {t("auth.resetPassword.almostThereDesc")}
          </p>
        </div>

        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }}
          />
        </div>
      </div>
    </div>
  )
}
