"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient, fullCleanup } from "@/lib/supabase/client"
import { clearTokenCache } from "@/lib/supabase/auth-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Loader2,
  ArrowRight,
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

// Kawadir logo component using the brand SVG
function KawadirLogo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/kawadir.svg"
      alt="Kawadir"
      className={cn("object-contain", className)}
      style={{ height: size }}
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
        <KawadirLogo size={48} className="animate-pulse" />
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-[#2D4CFF]" />
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

  // Validate email on blur
  const validateEmail = (emailValue: string) => {
    if (!emailValue) {
      setEmailError(null)
      return true
    }
    if (!EMAIL_REGEX.test(emailValue)) {
      setEmailError("Please enter a valid email address")
      return false
    }
    setEmailError(null)
    return true
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  // Clean up stale auth state and optionally redirect already-authenticated users.
  // This ensures that after a logout, no leftover tokens or cookies
  // prevent logging in with a different account.
  useEffect(() => {
    // Always clear cached tokens and pending sessions when landing on /login.
    // This prevents stale data from a previous account interfering with a new login.
    try {
      clearTokenCache()
      localStorage.removeItem('kawadir_pending_session')
    } catch {
      // Ignore cleanup errors
    }

    // Check if the user has a genuine active session (not stale cookies).
    // If so, redirect them away from the login page.
    async function checkExistingSession() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'kawadir.io'
        const currentHost = window.location.hostname
        const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1'

        // On an org subdomain, don't redirect — let the user re-login if needed
        if (!isLocalhost && currentHost.endsWith(`.${rootDomain}`) && currentHost !== rootDomain) {
          return
        }

        // On main domain or localhost, redirect to home (middleware/RootRedirect handles the rest)
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
            // Strip extra quotes from previously double-encoded values
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
    if (initialOrgBranding) return // Already have server-side branding

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
      document.title = `Login | ${orgBranding.name}`
    } else {
      document.title = "Login | Kawadir ATS"
    }
    return () => {
      document.title = "Kawadir ATS"
    }
  }, [orgBranding?.name])

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

    // Validate email before submission
    if (!validateEmail(email)) {
      return
    }

    if (!password) {
      toast.error("Please enter your password")
      return
    }

    setLoading(true)

    // Retry configuration for network failures
    const maxRetries = 3
    const retryDelays = [1000, 2000, 4000] // exponential backoff

    const attemptLogin = async (retryCount: number): Promise<boolean> => {
      try {
        // Clear all previous auth state before login attempt.
        // This ensures signing in with a different account starts completely fresh.
        try {
          clearTokenCache()
          fullCleanup()
        } catch (e) {
          console.warn("Could not clear storage:", e)
        }

        const supabase = createClient()

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          // Check if it's a network error that might benefit from retry
          const isNetworkError = error.message.toLowerCase().includes('network') ||
            error.message.toLowerCase().includes('fetch') ||
            error.message.toLowerCase().includes('timeout') ||
            error.message.toLowerCase().includes('connection')

          if (isNetworkError && retryCount < maxRetries) {
            console.log(`Login attempt ${retryCount + 1} failed with network error, retrying...`)
            toast.error(`Connection issue. Retrying... (${retryCount + 1}/${maxRetries})`)
            await new Promise(resolve => setTimeout(resolve, retryDelays[retryCount]))
            return attemptLogin(retryCount + 1)
          }

          // Map common error messages to user-friendly messages
          let errorMessage = error.message
          if (error.message.includes("Invalid login credentials")) {
            errorMessage = "Invalid email or password. Please try again."
          } else if (error.message.includes("Email not confirmed")) {
            errorMessage = "Please verify your email before logging in."
          } else if (error.message.includes("Too many requests")) {
            errorMessage = "Too many login attempts. Please wait a moment and try again."
          }

          toast.error(errorMessage)
          return false
        }

        // Verify we got a valid session
        if (!data.session || !data.user) {
          toast.error("Login failed - no session created. Please try again.")
          return false
        }

        console.log("Login successful for user:", data.user.id)

        // CRITICAL: Save session to localStorage BEFORE any redirect.
        // This prevents the race condition where AuthProvider can't find the session
        // because Supabase hasn't persisted it yet when the new page loads.
        try {
          localStorage.setItem('kawadir_pending_session', JSON.stringify(data.session))
          console.log("Login: Session saved to localStorage for post-redirect pickup")
        } catch (e) {
          console.warn("Login: Could not save session to localStorage:", e)
        }

        toast.success("Welcome back!")

        // Fetch user's role and org to redirect directly to the correct subdomain.
        // Using window.location.href (full navigation) instead of router.push
        // because cross-subdomain redirects fail with client-side navigation.
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

          // Detect if we're on an org subdomain (not main domain, not localhost)
          let currentSubdomain: string | null = null
          if (!isLocalhost && currentHost.endsWith(`.${rootDomain}`)) {
            currentSubdomain = currentHost.replace(`.${rootDomain}`, '')
          }

          if (role === 'super_admin') {
            // Super admins should not log in from org subdomains
            if (currentSubdomain) {
              window.location.href = `${window.location.protocol}//${rootDomain}/admin`
            } else {
              window.location.href = '/admin'
            }
            return true
          }

          if (userOrgSlug) {
            // If on an org subdomain, validate the user belongs to THIS org
            if (currentSubdomain && currentSubdomain !== userOrgSlug) {
              // User is logging into the wrong org subdomain — reject
              await supabase.auth.signOut()
              toast.error("This account is not associated with this organization.")
              return false
            }

            // On correct subdomain or localhost → go to /org
            if (isLocalhost || currentSubdomain === userOrgSlug) {
              window.location.href = '/org'
            } else {
              // On main domain (no subdomain) → redirect to user's org subdomain
              window.location.href = `${window.location.protocol}//${userOrgSlug}.${rootDomain}/org`
            }
            return true
          }
        } catch (err) {
          console.warn('Login: Could not determine redirect destination, falling back', err)
        }

        // Fallback: full page navigation to root (middleware will handle redirect)
        window.location.href = '/'
        return true
      } catch (err) {
        console.error("Login error:", err)

        // Check if it's a network error that might benefit from retry
        const isNetworkError = err instanceof TypeError ||
          (err instanceof Error && (
            err.message.toLowerCase().includes('network') ||
            err.message.toLowerCase().includes('fetch') ||
            err.message.toLowerCase().includes('failed')
          ))

        if (isNetworkError && retryCount < maxRetries) {
          console.log(`Login attempt ${retryCount + 1} failed with error, retrying...`)
          toast.error(`Connection issue. Retrying... (${retryCount + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, retryDelays[retryCount]))
          return attemptLogin(retryCount + 1)
        }

        toast.error("Unable to connect. Please check your internet connection and try again.")
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
    { icon: Zap, text: "AI-powered candidate matching", delay: "0ms" },
    { icon: Users, text: "Smart team collaboration", delay: "100ms" },
    { icon: BarChart3, text: "Advanced analytics & insights", delay: "200ms" },
    { icon: Shield, text: "Enterprise-grade security", delay: "300ms" },
    { icon: Globe, text: "Multi-language support", delay: "400ms" },
  ]

  // Dynamic colors based on org branding
  const primaryColor = orgBranding?.primary_color || "#2D4CFF"
  const secondaryColor = orgBranding?.secondary_color || "#6B7FFF"
  const gradient = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
  const hasCustomImage = !!orgBranding?.login_image_url

  if (!mounted) return <LoginPageSkeleton />

  return (
    <div className="min-h-screen flex bg-[#F8F9FC]">
      {/* Left Side - Ultra Modern Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative">
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

        <div className="w-full max-w-[420px] relative z-10">
          {/* Logo & Brand Header */}
          <div className={cn(
            "mb-12",
            mounted && "animate-fade-in-up"
          )}>
            {orgBranding?.logo_url ? (
              <div className="flex justify-center">
                <img
                  src={orgBranding.logo_url}
                  alt={orgBranding.name}
                  className="max-w-[280px] max-h-[160px] object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center">
                {platformBranding?.platform_logo ? (
                  <img
                    src={platformBranding.platform_logo}
                    alt="Kawadir"
                    className="h-24 object-contain"
                  />
                ) : (
                  <KawadirLogo size={96} />
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
              Welcome back
            </h2>
            <p className="text-[#616161] mt-2 text-[15px]">
              Enter your credentials to access your dashboard
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
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#9E9E9E]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    autoComplete="email"
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (emailError) setEmailError(null)
                    }}
                    required
                    disabled={loading}
                    className={cn(
                      "h-12 pl-11 pr-4 rounded-xl border bg-white/80 text-[15px]",
                      "placeholder:text-[#9E9E9E] transition-all duration-200",
                      "focus:ring-2 focus:border-transparent focus:bg-white",
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
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-[13px] font-medium transition-colors hover:opacity-80"
                    style={{ color: primaryColor }}
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#9E9E9E]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className={cn(
                      "h-12 pl-11 pr-12 rounded-xl border border-[#E0E0E0] bg-white/80 text-[15px]",
                      "placeholder:text-[#9E9E9E] transition-all duration-200",
                      "focus:ring-2 focus:border-transparent focus:bg-white",
                      "hover:border-[#9E9E9E]"
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
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9E9E9E] hover:text-[#616161] transition-colors"
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
                    Sign in
                    <ArrowRight className="h-4 w-4" />
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
              Powered by{" "}
              <span className="font-semibold" style={{ color: primaryColor }}>
                Kawadir
              </span>
              {" "}&middot;{" "}AI-Powered Recruitment
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Hero Image/Graphics */}
      <div
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden"
        style={{
          background: hasCustomImage ? undefined : gradient,
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
              style={{ background: `${gradient}`, opacity: 0.35 }}
            />
          </>
        )}

        {/* Animated background elements */}
        {!hasCustomImage && (
          <div className="absolute inset-0 overflow-hidden">
            {/* Floating orbs */}
            <div className="absolute top-[10%] left-[10%] w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
            <div className="absolute top-[50%] left-[50%] w-64 h-64 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />

            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>
        )}

        {/* Content */}
        {orgBranding ? (
          /* Org-branded: just the login image background, no overlay content */
          <div className="relative z-10" />
        ) : (
          /* Default Kawadir: full marketing content */
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white w-full">
            <div className="max-w-xl">
              <h2
                className={cn(
                  "text-5xl xl:text-6xl font-bold leading-[1.1] mb-8",
                  mounted && "animate-fade-in-up"
                )}
              >
                Hire the best
                <br />
                <span className="text-white/90">talent, faster.</span>
              </h2>

              <p
                className={cn(
                  "text-xl text-white/80 mb-12 leading-relaxed",
                  mounted && "animate-fade-in-up"
                )}
                style={{ animationDelay: "100ms" }}
              >
                Streamline your recruitment with intelligent automation, collaborative tools, and data-driven insights.
              </p>

              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 transition-all hover:bg-white/15",
                      mounted && "animate-fade-in-up"
                    )}
                    style={{ animationDelay: feature.delay }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <span className="font-medium text-lg">{feature.text}</span>
                    <CheckCircle2 className="h-5 w-5 ml-auto text-white/60" />
                  </div>
                ))}
              </div>

              <div
                className={cn(
                  "grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-white/20",
                  mounted && "animate-fade-in-up"
                )}
                style={{ animationDelay: "500ms" }}
              >
                <div>
                  <div className="text-4xl font-bold">500+</div>
                  <div className="text-sm text-white/70 mt-1">Companies</div>
                </div>
                <div>
                  <div className="text-4xl font-bold">50K+</div>
                  <div className="text-sm text-white/70 mt-1">Candidates</div>
                </div>
                <div>
                  <div className="text-4xl font-bold">95%</div>
                  <div className="text-sm text-white/70 mt-1">Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
