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
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordSkeleton />}>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordSkeleton() {
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

function ResetPasswordContent() {
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
  const searchParams = useSearchParams()

  useEffect(() => {
    setMounted(true)

    // Handle the auth session from URL hash (access_token)
    const handleAuthSession = async () => {
      const supabase = createClient()

      // Check if there's a hash fragment with tokens
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        // Parse the hash parameters
        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken) {
          try {
            // Set the session using the tokens from the URL
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
              // Clear the hash from URL for cleaner look
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
      } else {
        // No hash, check if there's already an active session
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setSessionReady(true)
        } else {
          setSessionError('No valid reset session found. Please request a new password reset link.')
        }
      }
    }

    handleAuthSession()
  }, [])

  // Brand colors - defined early for loading/error states
  const primaryColor = "#6366f1"
  const secondaryColor = "#8b5cf6"
  const brandGradient = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`

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

  if (!mounted) {
    return <ResetPasswordSkeleton />
  }

  // Show loading while establishing session
  if (!sessionReady && !sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: brandGradient }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: primaryColor }} />
            <span className="text-sm text-gray-500">Verifying reset link...</span>
          </div>
        </div>
      </div>
    )
  }

  // Show error if session could not be established
  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">
        <div className="max-w-md text-center px-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "#fef2f2" }}
          >
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Reset Link Invalid
          </h2>
          <p className="text-gray-600 mb-6">
            {sessionError}
          </p>
          <Link href="/forgot-password">
            <Button
              className="w-full h-12 text-base font-semibold text-white border-0"
              style={{ background: brandGradient }}
            >
              Request New Reset Link
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[#fafbfc]">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: brandGradient }}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
                  Jadarat
                </h1>
                <p className="text-sm text-gray-500">AI-Powered Recruitment Platform</p>
              </div>
            </div>
          </div>

          {!success ? (
            <>
              {/* Heading */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Set new password
                </h2>
                <p className="text-gray-600">
                  Your new password must be at least 8 characters long.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 text-base pr-12 border-gray-200 focus:border-transparent transition-all duration-200"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 text-base pr-12 border-gray-200 focus:border-transparent transition-all duration-200"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  <p className="text-sm text-gray-500">Password must contain:</p>
                  <ul className="text-sm space-y-1">
                    <li className={cn(
                      "flex items-center gap-2",
                      password.length >= 8 ? "text-green-600" : "text-gray-400"
                    )}>
                      <CheckCircle2 className="h-4 w-4" />
                      At least 8 characters
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
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Lock className="mr-2 h-5 w-5" />
                  )}
                  {loading ? "Updating..." : "Reset password"}
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
                  Password reset!
                </h2>
                <p className="text-gray-600 mb-8">
                  Your password has been successfully updated.<br />
                  Redirecting you to sign in...
                </p>

                <Link href="/login">
                  <Button
                    className="w-full h-12 text-base font-semibold text-white border-0"
                    style={{ background: brandGradient }}
                  >
                    Continue to sign in
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500">
              Powered by{" "}
              <span className="font-semibold" style={{ color: primaryColor }}>
                Jadarat ATS
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
            Almost there!
          </h2>
          <p className="text-lg text-white/80 max-w-md mx-auto">
            Create a strong password to keep your account secure. We recommend using a mix of letters, numbers, and symbols.
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
