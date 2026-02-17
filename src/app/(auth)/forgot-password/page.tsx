"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Loader2,
  ArrowLeft,
  Mail,
  CheckCircle2,
  Globe,
} from "lucide-react"
import { KawadirIcon } from "@/components/ui/kawadir-icon"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"

function KawadirLogo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl"
      style={{
        width: size, height: size,
        background: "linear-gradient(135deg, #2D4CFF 0%, #6B7FFF 100%)",
        boxShadow: "0 6px 24px -6px rgba(45, 76, 255, 0.4)",
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

interface OrgBranding {
  name: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordSkeleton />}>
      <ForgotPasswordContent />
    </Suspense>
  )
}

function ForgotPasswordSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC]">
      <div className="flex flex-col items-center gap-4">
        <KawadirLogo size={48} />
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-[#2D4CFF]" />
          <span className="text-sm text-[#616161]">Loading...</span>
        </div>
      </div>
    </div>
  )
}

function ForgotPasswordContent() {
  const { t, language, setLanguage, isRTL } = useI18n()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [orgBranding, setOrgBranding] = useState<OrgBranding | null>(null)
  const [mounted, setMounted] = useState(false)
  const searchParams = useSearchParams()
  const orgSlug = searchParams.get("org")

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch organization branding if org slug is provided
  useEffect(() => {
    async function fetchOrgBranding() {
      if (!orgSlug) return

      const supabase = createClient()
      const { data } = await supabase
        .from("organizations")
        .select("name, logo_url, primary_color, secondary_color")
        .eq("slug", orgSlug)
        .single()

      if (data) {
        setOrgBranding(data)
      }
    }

    fetchOrgBranding()
  }, [orgSlug])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    setLoading(true)

    try {
      // Use custom API endpoint that sends email via notification system
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          redirectUrl: `${window.location.origin}/reset-password`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email")
      }

      setEmailSent(true)
      toast.success("Password reset email sent!")
    } catch (error: any) {
      console.error("Reset password error:", error)
      toast.error(error.message || "Failed to send reset email")
    } finally {
      setLoading(false)
    }
  }

  // Brand colors
  const primaryColor = orgBranding?.primary_color || "#2D4CFF"
  const secondaryColor = orgBranding?.secondary_color || "#6B7FFF"
  const brandGradient = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
  const brandName = orgBranding?.name || "Kawadir"

  if (!mounted) {
    return <ForgotPasswordSkeleton />
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen flex bg-[#F5F5F5]">
      {/* Language Switcher */}
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

      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              {orgBranding?.logo_url ? (
                <img
                  src={orgBranding.logo_url}
                  alt={brandName}
                  className="h-12 w-auto object-contain"
                />
              ) : (
                <KawadirLogo size={44} />
              )}
              <div>
                <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {brandName}
                </h1>
                <p className="text-sm text-gray-500">{t("auth.forgotPassword.platformSubtitle")}</p>
              </div>
            </div>
          </div>

          {!emailSent ? (
            <>
              {/* Heading */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {t("auth.forgotPassword.title")}
                </h2>
                <p className="text-gray-600">
                  {t("auth.forgotPassword.subtitle")}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    {t("auth.forgotPassword.emailAddress")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("auth.forgotPassword.emailPlaceholder")}
                    value={email}
                    autoComplete="email"
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-base border-gray-200 focus:border-transparent transition-all duration-200"
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
                    <Mail className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />
                  )}
                  {loading ? t("auth.forgotPassword.sending") : t("auth.forgotPassword.sendLink")}
                </Button>

                <div className="text-center">
                  <Link
                    href={orgSlug ? `/login?org=${orgSlug}` : "/login"}
                    className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                    style={{ color: primaryColor }}
                  >
                    <ArrowLeft className={cn("h-4 w-4", isRTL && "rotate-180")} />
                    {t("auth.forgotPassword.backToLogin")}
                  </Link>
                </div>
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
                  {t("auth.forgotPassword.checkEmail")}
                </h2>
                <p className="text-gray-600 mb-8">
                  {t("auth.forgotPassword.emailSent")}<br />
                  <strong className="text-gray-900">{email}</strong>
                </p>

                <div className="space-y-4">
                  <Button
                    onClick={() => setEmailSent(false)}
                    variant="outline"
                    className="w-full h-12"
                  >
                    {t("auth.forgotPassword.didntReceive")}
                  </Button>

                  <Link
                    href={orgSlug ? `/login?org=${orgSlug}` : "/login"}
                    className="inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors hover:opacity-80 w-full"
                    style={{ color: primaryColor }}
                  >
                    <ArrowLeft className={cn("h-4 w-4", isRTL && "rotate-180")} />
                    {t("auth.forgotPassword.backToLogin")}
                  </Link>
                </div>
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
            <Mail className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">
            {t("auth.forgotPassword.secureReset")}
          </h2>
          <p className="text-lg text-white/80 max-w-md mx-auto">
            {t("auth.forgotPassword.secureResetDesc")}
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
