"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Loader2,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Users,
  Briefcase,
  BarChart3,
  Zap,
  Shield,
  Globe,
  Lock,
  Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface OrgBranding {
  name: string
  logo_url: string | null
  login_image_url: string | null
  primary_color: string
  secondary_color: string
}

interface PlatformBranding {
  platform_logo: string | null
  platform_logo_dark: string | null
}

// Inline Kawadir logo as SVG - no external file needed
function KawadirLogo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn("flex items-center justify-center rounded-2xl", className)}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #2D4CFF 0%, #6B7FFF 100%)",
        boxShadow: "0 8px 32px -8px rgba(45, 76, 255, 0.5)",
      }}
    >
      <svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L2 7L12 12L22 7L12 2Z"
          fill="white"
          fillOpacity="0.9"
        />
        <path
          d="M2 17L12 22L22 17"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
        <path
          d="M2 12L12 17L22 12"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />
      </svg>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginPageContent />
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

function LoginPageContent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [orgBranding, setOrgBranding] = useState<OrgBranding | null>(null)
  const [platformBranding, setPlatformBranding] = useState<PlatformBranding | null>(null)
  const [mounted, setMounted] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read org slug from query param (?org=slug) or from middleware cookie (subdomain/custom domain)
  const orgSlugParam = searchParams.get("org")
  const orgSlug = orgSlugParam || (() => {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(/(?:^|;\s*)x-org-slug=([^;]*)/)
    return match ? decodeURIComponent(match[1]) : null
  })()

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
            if (row.key === "platform_logo" && row.value) {
              settings.platform_logo = JSON.parse(row.value as string)
            }
            if (row.key === "platform_logo_dark" && row.value) {
              settings.platform_logo_dark = JSON.parse(row.value as string)
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

  // Fetch organization branding if org slug is provided
  useEffect(() => {
    async function fetchOrgBranding() {
      if (!orgSlug) return

      try {
        const supabase = createClient()

        // Create a timeout promise
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("Org branding fetch timeout")), 5000)
        )

        // Race between fetch and timeout
        const fetchPromise = supabase
          .from("organizations")
          .select("name, logo_url, login_image_url, primary_color, secondary_color")
          .eq("slug", orgSlug)
          .single()

        const result = await Promise.race([fetchPromise, timeoutPromise])

        if (result && 'data' in result && result.data) {
          setOrgBranding({
            name: result.data.name,
            logo_url: result.data.logo_url,
            primary_color: result.data.primary_color || "#2D4CFF",
            secondary_color: result.data.secondary_color || "#6B7FFF",
            login_image_url: result.data.login_image_url || null,
          })
        }
      } catch (error) {
        console.warn("Failed to fetch org branding:", error)
        // Continue with default branding
      }
    }

    fetchOrgBranding()
  }, [orgSlug])

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
        // Clear pending session from previous login attempt
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

        toast.success("Welcome back!")

        // Use client-side navigation to avoid full page reload
        // The AuthProvider will pick up the session via onAuthStateChange
        router.push("/")
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
              <div className="flex items-center gap-3">
                <img
                  src={orgBranding.logo_url}
                  alt={orgBranding.name}
                  className="h-12 object-contain"
                />
                <div>
                  <h1 className="text-2xl font-bold text-[#1A1A2E]">{orgBranding.name}</h1>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {platformBranding?.platform_logo ? (
                  <img
                    src={platformBranding.platform_logo}
                    alt="Kawadir"
                    className="h-12 object-contain"
                  />
                ) : (
                  <>
                    <KawadirLogo size={44} />
                    <div>
                      <h1
                        className="text-2xl font-bold tracking-tight"
                        style={{
                          background: gradient,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        Kawadir
                      </h1>
                    </div>
                  </>
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
              style={{ background: `${gradient}`, opacity: 0.85 }}
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
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white w-full">
          <div className="max-w-xl">
            {/* Main heading */}
            <h2
              className={cn(
                "text-5xl xl:text-6xl font-bold leading-[1.1] mb-8",
                mounted && "animate-fade-in-up"
              )}
            >
              {orgBranding
                ? `Welcome to ${orgBranding.name}`
                : (
                  <>
                    Hire the best
                    <br />
                    <span className="text-white/90">talent, faster.</span>
                  </>
                )
              }
            </h2>

            <p
              className={cn(
                "text-xl text-white/80 mb-12 leading-relaxed",
                mounted && "animate-fade-in-up"
              )}
              style={{ animationDelay: "100ms" }}
            >
              {orgBranding
                ? "Access your recruitment dashboard and streamline your hiring process with AI-powered tools."
                : "Streamline your recruitment with intelligent automation, collaborative tools, and data-driven insights."
              }
            </p>

            {/* Features (only when no org branding) */}
            {!orgBranding && (
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
            )}

            {/* Stats */}
            {!orgBranding && (
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
            )}

            {/* Org-specific branding badge */}
            {orgBranding && (
              <div
                className={cn(
                  "mt-12 flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-5",
                  mounted && "animate-fade-in-up"
                )}
                style={{ animationDelay: "200ms" }}
              >
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="h-7 w-7" />
                </div>
                <div>
                  <div className="font-semibold text-lg">Powered by Kawadir</div>
                  <div className="text-sm text-white/70">AI-Powered Recruitment Platform</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
