"use client"

import { useState, useEffect } from "react"
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
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [orgBranding, setOrgBranding] = useState<OrgBranding | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const orgSlug = searchParams.get("org")

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
    { icon: Users, text: "Smart candidate management" },
    { icon: Briefcase, text: "Streamlined job postings" },
    { icon: BarChart3, text: "Powerful analytics" },
  ]

  // Dynamic colors based on org branding
  const primaryColor = orgBranding?.primary_color || "#6366f1"
  const secondaryColor = orgBranding?.secondary_color || "#8b5cf6"
  const gradient = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
  const hasCustomImage = !!orgBranding?.login_image_url

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 xl:px-24 py-12 bg-background">
        <div className="w-full max-w-md mx-auto">
          {/* Logo & Brand */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-8">
              {orgBranding?.logo_url ? (
                <img
                  src={orgBranding.logo_url}
                  alt={orgBranding.name}
                  className="h-12 object-contain"
                />
              ) : (
                <>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ background: gradient }}
                  >
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1
                      className="text-2xl font-bold"
                      style={{
                        background: gradient,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {orgBranding?.name || "Jadarat"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Applicant Tracking System
                    </p>
                  </div>
                </>
              )}
              {orgBranding?.logo_url && (
                <div className="ml-2">
                  <h1 className="text-xl font-bold">{orgBranding.name}</h1>
                </div>
              )}
            </div>

            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-2">
              Sign in to your account to continue
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className={cn(
                  "h-12 px-4 rounded-xl border-2 transition-all duration-200"
                )}
                style={{
                  // @ts-ignore
                  "--tw-ring-color": `${primaryColor}20`,
                }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
                    "h-12 px-4 pr-12 rounded-xl border-2 transition-all duration-200"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full h-12 rounded-xl text-base font-medium text-white",
                "transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              )}
              style={{ background: gradient }}
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Don&apos;t have an account?{" "}
            <Link
              href={orgSlug ? `/signup?org=${orgSlug}` : "/signup"}
              className="font-medium hover:underline"
              style={{ color: primaryColor }}
            >
              Create account
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Hero Image/Graphics */}
      <div
        className="hidden lg:flex lg:flex-1 relative overflow-hidden"
        style={{
          background: hasCustomImage ? undefined : gradient,
        }}
      >
        {/* Custom Image Background */}
        {hasCustomImage && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${orgBranding.login_image_url})` }}
            />
            <div
              className="absolute inset-0"
              style={{ background: `${gradient}`, opacity: 0.7 }}
            />
          </>
        )}

        {/* Decorative elements (only when no custom image) */}
        {!hasCustomImage && (
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
          </div>
        )}

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <div className="max-w-lg">
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
              {orgBranding
                ? `Welcome to ${orgBranding.name}`
                : "Hire the best talent with AI-powered recruitment"
              }
            </h2>
            <p className="text-lg text-white/80 mb-10">
              {orgBranding
                ? "Sign in to access your recruitment dashboard and manage your hiring process."
                : "Streamline your hiring process with intelligent automation, collaborative tools, and data-driven insights."
              }
            </p>

            {/* Features (only when no org branding) */}
            {!orgBranding && (
              <>
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <span className="font-medium">{feature.text}</span>
                      <CheckCircle2 className="h-5 w-5 ml-auto text-white/60" />
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/20">
                  <div>
                    <div className="text-3xl font-bold">500+</div>
                    <div className="text-sm text-white/70">Companies</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">50K+</div>
                    <div className="text-sm text-white/70">Candidates</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">95%</div>
                    <div className="text-sm text-white/70">Satisfaction</div>
                  </div>
                </div>
              </>
            )}

            {/* Org-specific branding badge */}
            {orgBranding && (
              <div className="mt-8 flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">Powered by Jadarat</div>
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
