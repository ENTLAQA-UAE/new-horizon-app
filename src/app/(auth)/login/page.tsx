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
} from "lucide-react"
import { cn } from "@/lib/utils"

interface OrgBranding {
  name: string
  logo_url: string | null
  login_image_url: string | null
  primary_color: string
  secondary_color: string
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
    <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse"
          style={{ background: "var(--brand-gradient, linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%))" }}
        >
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--brand-primary, #6366f1)" }} />
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      </div>
    </div>
  )
}

function LoginPageContent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [orgBranding, setOrgBranding] = useState<OrgBranding | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
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
        setOrgBranding({
          ...data,
          login_image_url: (data as Record<string, unknown>).login_image_url as string | null ?? null,
        })
      }
    }

    fetchOrgBranding()
  }, [orgSlug])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success("Welcome back!")
      router.push("/")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
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
  const primaryColor = orgBranding?.primary_color || "#6366f1"
  const secondaryColor = orgBranding?.secondary_color || "#8b5cf6"
  const gradient = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
  const hasCustomImage = !!orgBranding?.login_image_url

  if (!mounted) return <LoginPageSkeleton />

  return (
    <div className="min-h-screen flex bg-[#fafbfc]">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 xl:px-24 py-12 relative">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-40 -left-40 w-80 h-80 rounded-full opacity-[0.03]"
            style={{ background: gradient }}
          />
          <div
            className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-[0.05]"
            style={{ background: gradient }}
          />
        </div>

        <div className="w-full max-w-md mx-auto relative z-10">
          {/* Logo & Brand */}
          <div className="mb-10">
            <div className={cn(
              "flex items-center gap-4 mb-10",
              mounted && "animate-fade-in-up"
            )}>
              {orgBranding?.logo_url ? (
                <img
                  src={orgBranding.logo_url}
                  alt={orgBranding.name}
                  className="h-12 object-contain"
                />
              ) : (
                <>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl"
                    style={{
                      background: gradient,
                      boxShadow: `0 10px 40px -10px ${primaryColor}80`
                    }}
                  >
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1
                      className="text-3xl font-bold tracking-tight"
                      style={{
                        background: gradient,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {orgBranding?.name || "Jadarat"}
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">
                      AI-Powered Recruitment Platform
                    </p>
                  </div>
                </>
              )}
              {orgBranding?.logo_url && (
                <div className="ml-2">
                  <h1 className="text-2xl font-bold text-gray-900">{orgBranding.name}</h1>
                </div>
              )}
            </div>

            <div className={cn(
              mounted && "animate-fade-in-up"
            )} style={{ animationDelay: "100ms" }}>
              <h2 className="text-4xl font-bold tracking-tight text-gray-900">
                Welcome back
              </h2>
              <p className="text-gray-500 mt-3 text-lg">
                Sign in to continue to your dashboard
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div
              className={cn(
                "space-y-2",
                mounted && "animate-fade-in-up"
              )}
              style={{ animationDelay: "200ms" }}
            >
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className={cn(
                  "h-13 px-4 rounded-xl border-2 border-gray-200 bg-white",
                  "focus:ring-4 transition-all duration-200 text-base"
                )}
                style={{
                  "--tw-ring-color": `${primaryColor}15`,
                } as React.CSSProperties}
                onFocus={(e) => e.target.style.borderColor = primaryColor}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>

            <div
              className={cn(
                "space-y-2",
                mounted && "animate-fade-in-up"
              )}
              style={{ animationDelay: "300ms" }}
            >
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: primaryColor }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className={cn(
                    "h-13 px-4 pr-12 rounded-xl border-2 border-gray-200 bg-white",
                    "focus:ring-4 transition-all duration-200 text-base"
                  )}
                  style={{
                    "--tw-ring-color": `${primaryColor}15`,
                  } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = primaryColor}
                  onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div
              className={cn(mounted && "animate-fade-in-up")}
              style={{ animationDelay: "400ms" }}
            >
              <Button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full h-13 rounded-xl text-base font-semibold text-white",
                  "transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                )}
                style={{
                  background: gradient,
                  boxShadow: `0 8px 30px -10px ${primaryColor}80`
                }}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign in to dashboard
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </div>
          </form>

          {/* Sign Up Link */}
          <p
            className={cn(
              "text-center text-sm text-gray-500 mt-8",
              mounted && "animate-fade-in-up"
            )}
            style={{ animationDelay: "500ms" }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href={orgSlug ? `/signup?org=${orgSlug}` : "/signup"}
              className="font-semibold transition-colors hover:opacity-80"
              style={{ color: primaryColor }}
            >
              Create an account
            </Link>
          </p>

          {/* Trust badges */}
          <div
            className={cn(
              "mt-12 pt-8 border-t border-gray-200",
              mounted && "animate-fade-in-up"
            )}
            style={{ animationDelay: "600ms" }}
          >
            <p className="text-xs text-gray-400 text-center mb-4">TRUSTED BY LEADING COMPANIES</p>
            <div className="flex items-center justify-center gap-8 opacity-40">
              <div className="h-6 w-20 bg-gray-400 rounded" />
              <div className="h-6 w-24 bg-gray-400 rounded" />
              <div className="h-6 w-16 bg-gray-400 rounded" />
            </div>
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
                  <div className="font-semibold text-lg">Powered by Jadarat</div>
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
