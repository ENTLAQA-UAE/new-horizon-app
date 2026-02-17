"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { clearTokenCache } from "@/lib/supabase/auth-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  Users,
  BarChart3,
  Zap,
  Shield,
  Globe,
  Lock,
  Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"

export interface OrgBranding {
  name: string
  logo_url: string | null
  favicon_url: string | null
  login_image_url: string | null
  primary_color: string
  secondary_color: string
}

interface PlatformBranding {
  platform_logo: string | null
  platform_logo_dark: string | null
}

// Kawadir logo component using the brand image
function KawadirLogo({ className }: { className?: string }) {
  return (
    <img
      src="/new-logo-light-final.PNG"
      alt="Kawadir"
      className={cn("object-contain w-full max-w-[320px] md:max-w-[380px]", className)}
    />
  )
}

interface LoginContentProps {
  initialOrgBranding: OrgBranding | null
}

export default function LoginContent({ initialOrgBranding }: LoginContentProps) {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginPageInner initialOrgBranding={initialOrgBranding} />
    </Suspense>
  )
}

function LoginPageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC]">
      <div className="flex flex-col items-center gap-4">
        <KawadirLogo className="max-w-[200px] animate-pulse" />
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-[#2563EB]" />
          <span className="text-sm text-[#616161]">Loading...</span>
        </div>
      </div>
    </div>
  )
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function LoginPageInner({ initialOrgBranding }: LoginContentProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [orgBranding, setOrgBranding] = useState<OrgBranding | null>(initialOrgBranding)
  const [platformBranding, setPlatformBranding] = useState<PlatformBranding | null>(null)
  const [mounted, setMounted] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, language, setLanguage, isRTL } = useI18n()

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight

  // Validate email on blur
  const validateEmail = (emailValue: string) => {
    if (!emailValue) {
      setEmailError(null)
      return true
    }
    if (!EMAIL_REGEX.test(emailValue)) {
      setEmailError(t("auth.login.invalidEmail"))
      return false
    }
    setEmailError(null)
    return true
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  // Clear in-memory token cache when landing on login page.
  useEffect(() => {
    clearTokenCache()
  }, [])

  // Redirect already-authenticated users away from login page.
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'kawadir.io'
        const currentHost = window.location.hostname
        const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1'

        if (!isLocalhost && currentHost.endsWith(`.${rootDomain}`) && currentHost !== rootDomain) {
          return
        }

        window.location.href = '/'
      } catch {
        // Silently fail — just show the login form
      }
    }
    checkExistingSession()
  }, [])

  // Fetch platform branding (logo from super admin settings)
  useEffect(() => {
    async function fetchPlatformBranding() {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from("platform_settings")
          .select("key, value")
          .in("key", ["platform_logo", "platform_logo_dark"])

        if (data && data.length > 0) {
          const settings: PlatformBranding = {
            platform_logo: null,
            platform_logo_dark: null,
          }
          data.forEach((row) => {
            let val = row.value as string | null
            if (typeof val === 'string' && val.length >= 2 && val.startsWith('"') && val.endsWith('"')) {
              try { val = JSON.parse(val) } catch { /* keep as-is */ }
            }
            if (row.key === "platform_logo" && val) {
              settings.platform_logo = val
            }
            if (row.key === "platform_logo_dark" && val) {
              settings.platform_logo_dark = val
            }
          })
          if (settings.platform_logo || settings.platform_logo_dark) {
            setPlatformBranding(settings)
          }
        }
      } catch (error) {
        console.warn("Failed to fetch platform branding:", error)
      }
    }

    fetchPlatformBranding()
  }, [])

  // If no initial branding was provided, try fetching from ?org= query param (fallback)
  useEffect(() => {
    if (initialOrgBranding) return

    const orgSlugParam = searchParams.get("org")
    if (!orgSlugParam) return

    async function fetchOrgBranding() {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from("organizations")
          .select("name, logo_url, favicon_url, primary_color, secondary_color, login_image_url")
          .eq("slug", orgSlugParam)
          .single() as { data: { name: string; logo_url: string | null; favicon_url: string | null; primary_color: string | null; secondary_color: string | null; login_image_url: string | null } | null }

        if (data) {
          setOrgBranding({
            name: data.name,
            logo_url: data.logo_url,
            favicon_url: data.favicon_url || null,
            primary_color: data.primary_color || "#2D4CFF",
            secondary_color: data.secondary_color || "#6B7FFF",
            login_image_url: data.login_image_url || null,
          })
        }
      } catch (error) {
        console.warn("Failed to fetch org branding:", error)
      }
    }

    fetchOrgBranding()
  }, [initialOrgBranding, searchParams])

  // Dynamic page title based on org branding
  useEffect(() => {
    if (orgBranding?.name) {
      document.title = `${t("auth.login.signIn")} | ${orgBranding.name}`
    } else {
      document.title = `${t("auth.login.signIn")} | Kawadir ATS`
    }
    return () => {
      document.title = "Kawadir ATS"
    }
  }, [orgBranding?.name, t])

  // Dynamic favicon based on org logo
  useEffect(() => {
    if (!orgBranding?.logo_url) return

    const existingFavicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    const previousHref = existingFavicon?.href || null

    if (existingFavicon) {
      existingFavicon.href = orgBranding.logo_url
    } else {
      const link = document.createElement('link')
      link.rel = 'icon'
      link.href = orgBranding.logo_url
      document.head.appendChild(link)
    }

    return () => {
      const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
      if (favicon) {
        if (previousHref) {
          favicon.href = previousHref
        } else {
          favicon.remove()
        }
      }
    }
  }, [orgBranding?.logo_url])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      return
    }

    if (!password) {
      toast.error(t("auth.login.enterPassword"))
      return
    }

    setLoading(true)

    const maxRetries = 3
    const retryDelays = [1000, 2000, 4000]

    const attemptLogin = async (retryCount: number): Promise<boolean> => {
      try {
        try {
          localStorage.removeItem('kawadir_pending_session')
        } catch (e) {
          console.warn("Could not clear storage:", e)
        }

        const supabase = createClient()

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          const isNetworkError = error.message.toLowerCase().includes('network') ||
            error.message.toLowerCase().includes('fetch') ||
            error.message.toLowerCase().includes('timeout') ||
            error.message.toLowerCase().includes('connection')

          if (isNetworkError && retryCount < maxRetries) {
            console.log(`Login attempt ${retryCount + 1} failed with network error, retrying...`)
            toast.error(`${t("auth.errors.networkError")} (${retryCount + 1}/${maxRetries})`)
            await new Promise(resolve => setTimeout(resolve, retryDelays[retryCount]))
            return attemptLogin(retryCount + 1)
          }

          let errorMessage = error.message
          if (error.message.includes("Invalid login credentials")) {
            errorMessage = t("auth.errors.invalidCredentials")
          } else if (error.message.includes("Email not confirmed")) {
            errorMessage = t("auth.errors.verificationRequired")
          } else if (error.message.includes("Too many requests")) {
            errorMessage = t("auth.errors.tooManyAttempts")
          }

          toast.error(errorMessage)
          return false
        }

        if (!data.session || !data.user) {
          toast.error(t("auth.errors.serverError"))
          return false
        }

        console.log("Login successful for user:", data.user.id)

        try {
          localStorage.setItem('kawadir_pending_session', JSON.stringify(data.session))
          console.log("Login: Session saved to localStorage for post-redirect pickup")
        } catch (e) {
          console.warn("Login: Could not save session to localStorage:", e)
        }

        toast.success(t("auth.login.welcomeToast"))

        try {
          const [roleResult, profileResult] = await Promise.all([
            supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', data.user.id)
              .limit(1),
            supabase
              .from('profiles')
              .select('org_id, organizations(slug)')
              .eq('id', data.user.id)
              .single(),
          ])

          const role = roleResult.data?.[0]?.role
          const org = profileResult.data?.organizations as unknown as { slug: string } | null
          const userOrgSlug = org?.slug

          const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'kawadir.io'
          const currentHost = window.location.hostname
          const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1'

          let currentSubdomain: string | null = null
          if (!isLocalhost && currentHost.endsWith(`.${rootDomain}`)) {
            currentSubdomain = currentHost.replace(`.${rootDomain}`, '')
          }

          if (role === 'super_admin') {
            if (currentSubdomain) {
              window.location.href = `${window.location.protocol}//${rootDomain}/admin`
            } else {
              window.location.href = '/admin'
            }
            return true
          }

          if (userOrgSlug) {
            if (currentSubdomain && currentSubdomain !== userOrgSlug) {
              await supabase.auth.signOut()
              toast.error("This account is not associated with this organization.")
              return false
            }

            if (isLocalhost || currentSubdomain === userOrgSlug) {
              window.location.href = '/org'
            } else {
              window.location.href = `${window.location.protocol}//${userOrgSlug}.${rootDomain}/org`
            }
            return true
          }
        } catch (err) {
          console.warn('Login: Could not determine redirect destination, falling back', err)
        }

        window.location.href = '/'
        return true
      } catch (err) {
        console.error("Login error:", err)

        const isNetworkError = err instanceof TypeError ||
          (err instanceof Error && (
            err.message.toLowerCase().includes('network') ||
            err.message.toLowerCase().includes('fetch') ||
            err.message.toLowerCase().includes('failed')
          ))

        if (isNetworkError && retryCount < maxRetries) {
          console.log(`Login attempt ${retryCount + 1} failed with error, retrying...`)
          toast.error(`${t("auth.errors.networkError")} (${retryCount + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, retryDelays[retryCount]))
          return attemptLogin(retryCount + 1)
        }

        toast.error(t("auth.errors.networkError"))
        return false
      }
    }

    try {
      await attemptLogin(0)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: Zap, text: t("auth.login.features.aiMatching"), delay: "0ms" },
    { icon: Users, text: t("auth.login.features.teamCollab"), delay: "100ms" },
    { icon: BarChart3, text: t("auth.login.features.analytics"), delay: "200ms" },
    { icon: Shield, text: t("auth.login.features.security"), delay: "300ms" },
    { icon: Globe, text: t("auth.login.features.multiLang"), delay: "400ms" },
  ]

  // Dynamic colors based on org branding — defaults match Kawadir blue
  const primaryColor = orgBranding?.primary_color || "#2563EB"
  const secondaryColor = orgBranding?.secondary_color || "#3B82F6"
  const gradient = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 50%, #1E40AF 100%)`
  const hasCustomImage = !!orgBranding?.login_image_url

  if (!mounted) return <LoginPageSkeleton />

  return (
    <div className="min-h-screen flex bg-[#F8F9FC]" dir={isRTL ? "rtl" : "ltr"}>
      {/* Language Switcher - Floating */}
      <div className={cn(
        "fixed top-4 z-50",
        isRTL ? "left-4" : "right-4"
      )}>
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

      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 md:px-8 py-8 sm:py-12 relative">
        {/* Subtle background mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.04] blur-3xl"
            style={{ background: primaryColor }}
          />
          <div
            className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-[0.03] blur-3xl"
            style={{ background: secondaryColor }}
          />
        </div>

        <div className="w-full max-w-[420px] relative z-10 mx-auto">
          {/* Logo & Brand Header */}
          <div className={cn(
            "mb-10",
            mounted && "animate-fade-in-up"
          )}>
            {orgBranding?.logo_url ? (
              <div className="flex justify-center">
                <img
                  src={orgBranding.logo_url}
                  alt={orgBranding.name}
                  className="max-w-[340px] max-h-[180px] object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center">
                {platformBranding?.platform_logo ? (
                  <img
                    src={platformBranding.platform_logo}
                    alt="Kawadir"
                    className="max-w-[320px] md:max-w-[380px] object-contain"
                  />
                ) : (
                  <KawadirLogo />
                )}
              </div>
            )}
          </div>

          {/* Welcome Text */}
          <div className={cn(
            "mb-8",
            mounted && "animate-fade-in-up"
          )} style={{ animationDelay: "80ms" }}>
            <h2 className="text-[32px] font-bold tracking-tight text-[#1A1A2E] leading-tight">
              {t("auth.login.welcomeBack")}
            </h2>
            <p className="text-[#616161] mt-2 text-[15px]">
              {t("auth.login.enterCredentials")}
            </p>
          </div>

          {/* Glass Card Form */}
          <div
            className={cn(
              "rounded-2xl p-6 border border-white/60",
              mounted && "animate-fade-in-up"
            )}
            style={{
              animationDelay: "160ms",
              background: "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 4px 24px -4px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.8) inset",
            }}
          >
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[13px] font-semibold text-[#2C2C2C] uppercase tracking-wider">
                  {t("auth.login.email")}
                </Label>
                <div className="relative">
                  <Mail className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#9E9E9E]",
                    isRTL ? "right-3.5" : "left-3.5"
                  )} />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("auth.login.emailPlaceholder")}
                    value={email}
                    autoComplete="email"
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (emailError) setEmailError(null)
                    }}
                    required
                    disabled={loading}
                    className={cn(
                      "h-12 rounded-xl border bg-white/80 text-[15px]",
                      "placeholder:text-[#9E9E9E] transition-all duration-200",
                      "focus:ring-2 focus:border-transparent focus:bg-white",
                      isRTL ? "pr-11 pl-4" : "pl-11 pr-4",
                      emailError
                        ? "border-red-400 focus:ring-red-100"
                        : "border-[#E0E0E0] hover:border-[#9E9E9E]"
                    )}
                    style={{
                      "--tw-ring-color": emailError ? undefined : `${primaryColor}25`,
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      if (!emailError) e.target.style.borderColor = primaryColor
                    }}
                    onBlur={(e) => {
                      validateEmail(email)
                      e.target.style.borderColor = emailError ? "#f87171" : "#E0E0E0"
                    }}
                  />
                </div>
                {emailError && (
                  <p className="text-[13px] text-red-500 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                    {emailError}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[13px] font-semibold text-[#2C2C2C] uppercase tracking-wider">
                    {t("auth.login.password")}
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-[13px] font-medium transition-colors hover:opacity-80"
                    style={{ color: primaryColor }}
                  >
                    {t("auth.login.forgot")}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#9E9E9E]",
                    isRTL ? "right-3.5" : "left-3.5"
                  )} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.login.passwordPlaceholder")}
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className={cn(
                      "h-12 rounded-xl border border-[#E0E0E0] bg-white/80 text-[15px]",
                      "placeholder:text-[#9E9E9E] transition-all duration-200",
                      "focus:ring-2 focus:border-transparent focus:bg-white",
                      "hover:border-[#9E9E9E]",
                      isRTL ? "pr-11 pl-12" : "pl-11 pr-12"
                    )}
                    style={{
                      "--tw-ring-color": `${primaryColor}25`,
                    } as React.CSSProperties}
                    onFocus={(e) => e.target.style.borderColor = primaryColor}
                    onBlur={(e) => e.target.style.borderColor = "#E0E0E0"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 text-[#9E9E9E] hover:text-[#616161] transition-colors",
                      isRTL ? "left-3.5" : "right-3.5"
                    )}
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full h-12 rounded-xl text-[15px] font-semibold text-white",
                  "transition-all duration-300 hover:shadow-lg hover:-translate-y-[1px]",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
                  "active:translate-y-0"
                )}
                style={{
                  background: gradient,
                  boxShadow: `0 4px 16px -4px ${primaryColor}60`
                }}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {t("auth.login.signIn")}
                    <ArrowIcon className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </div>

          {/* Bottom Section */}
          <div
            className={cn(
              "mt-8 text-center",
              mounted && "animate-fade-in-up"
            )}
            style={{ animationDelay: "320ms" }}
          >
            <p className="text-[13px] text-[#9E9E9E]">
              {t("auth.common.poweredBy")}{" "}
              <span className="font-semibold" style={{ color: primaryColor }}>
                {t("auth.common.kawadir")}
              </span>
              {" "}&middot;{" "}{t("auth.common.aiPoweredRecruitment")}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Creative Brand Panel */}
      <div
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden"
        style={{
          background: hasCustomImage ? undefined : `linear-gradient(160deg, #1E3A8A 0%, #2563EB 40%, #3B82F6 70%, #60A5FA 100%)`,
        }}
      >
        {/* Custom Image Background */}
        {hasCustomImage && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${orgBranding?.login_image_url})` }}
            />
            <div
              className="absolute inset-0"
              style={{ background: gradient, opacity: 0.35 }}
            />
          </>
        )}

        {/* Animated background elements */}
        {!hasCustomImage && (
          <div className="absolute inset-0 overflow-hidden">
            {/* Large floating geometric shapes */}
            <div
              className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full opacity-[0.08] animate-float"
              style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }}
            />
            <div
              className="absolute top-[30%] -left-16 w-[300px] h-[300px] rounded-full opacity-[0.06] animate-float"
              style={{ animationDelay: '1.5s', background: 'radial-gradient(circle, white 0%, transparent 70%)' }}
            />
            <div
              className="absolute bottom-[10%] right-[20%] w-[250px] h-[250px] rounded-full opacity-[0.05] animate-float"
              style={{ animationDelay: '3s', background: 'radial-gradient(circle, white 0%, transparent 70%)' }}
            />

            {/* Subtle dot grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                backgroundSize: '32px 32px',
              }}
            />

            {/* Diagonal lines accent */}
            <div
              className="absolute top-0 right-0 w-full h-full opacity-[0.03]"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, white 40px, white 41px)`,
              }}
            />
          </div>
        )}

        {/* Content */}
        {orgBranding ? (
          <div className="relative z-10" />
        ) : (
          <div className="relative z-10 flex flex-col justify-center px-10 xl:px-16 text-white w-full" dir="ltr">
            <div className="max-w-xl">
              {/* Logo watermark */}
              <div className={cn("mb-8", mounted && "animate-fade-in-up")}>
                <img
                  src="/new-logo-light-final.PNG"
                  alt=""
                  className="w-48 xl:w-56 object-contain brightness-0 invert opacity-90"
                />
              </div>

              <h2
                className={cn(
                  "text-4xl xl:text-5xl font-bold leading-[1.15] mb-6",
                  mounted && "animate-fade-in-up"
                )}
                style={{ animationDelay: "80ms" }}
              >
                {t("auth.login.smarterHiring")}
                <br />
                <span className="text-white/85 font-light">{t("auth.login.poweredByAI")}</span>
              </h2>

              <p
                className={cn(
                  "text-lg xl:text-xl text-white/70 mb-10 leading-relaxed max-w-md",
                  mounted && "animate-fade-in-up"
                )}
                style={{ animationDelay: "160ms" }}
              >
                {t("auth.login.transformPipeline")}
              </p>

              {/* Feature cards */}
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl p-4 transition-all duration-300",
                      "bg-white/[0.08] backdrop-blur-sm border border-white/[0.08]",
                      "hover:bg-white/[0.14] hover:border-white/[0.15] hover:translate-x-1",
                      mounted && "animate-fade-in-up"
                    )}
                    style={{ animationDelay: `${200 + index * 80}ms` }}
                  >
                    <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-[15px]">{feature.text}</span>
                    <CheckCircle2 className="h-4.5 w-4.5 ml-auto text-white/40 flex-shrink-0" />
                  </div>
                ))}
              </div>

              {/* Stats row */}
              <div
                className={cn(
                  "flex items-center gap-6 xl:gap-10 mt-12 pt-8 border-t border-white/10",
                  mounted && "animate-fade-in-up"
                )}
                style={{ animationDelay: "650ms" }}
              >
                {[
                  { value: "500+", label: t("auth.login.stats.companies") },
                  { value: "50K+", label: t("auth.login.stats.candidates") },
                  { value: "95%", label: t("auth.login.stats.satisfaction") },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-3xl xl:text-4xl font-bold tracking-tight">{stat.value}</div>
                    <div className="text-xs text-white/50 mt-1 uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
