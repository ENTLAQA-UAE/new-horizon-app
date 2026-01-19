"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Building2, Users, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface InviteInfo {
  id: string
  email: string
  role: string
  org_id: string
  organization: {
    name: string
    logo_url: string | null
  }
}

const roleLabels: Record<string, string> = {
  org_admin: "Admin",
  hr_manager: "HR Manager",
  recruiter: "Recruiter",
  hiring_manager: "Hiring Manager",
  interviewer: "Interviewer",
}

// Main signup page wrapped with Suspense
export default function SignupPage() {
  return (
    <Suspense fallback={<SignupPageSkeleton />}>
      <SignupPageContent />
    </Suspense>
  )
}

// Loading skeleton
function SignupPageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>Get started with Jadarat ATS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 bg-muted animate-pulse rounded-md" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-muted animate-pulse rounded-md" />
            <div className="h-10 bg-muted animate-pulse rounded-md" />
          </div>
          <div className="h-10 bg-muted animate-pulse rounded-md" />
          <div className="h-10 bg-muted animate-pulse rounded-md" />
        </CardContent>
        <CardFooter>
          <div className="w-full h-10 bg-muted animate-pulse rounded-md" />
        </CardFooter>
      </Card>
    </div>
  )
}

function SignupPageContent() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [validatingInvite, setValidatingInvite] = useState(false)
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for invite code in URL params
  useEffect(() => {
    const codeFromUrl = searchParams.get("code")
    if (codeFromUrl) {
      setInviteCode(codeFromUrl)
      validateInviteCode(codeFromUrl)
    }
  }, [searchParams])

  // Validate invite code using API endpoint (bypasses RLS)
  const validateInviteCode = async (code: string) => {
    if (!code || code.length < 6) {
      setInviteInfo(null)
      setInviteError(null)
      return
    }

    setValidatingInvite(true)
    setInviteError(null)

    try {
      const response = await fetch(`/api/invites/validate?code=${encodeURIComponent(code)}`)
      const data = await response.json()

      if (!response.ok || !data.valid) {
        setInviteError(data.error || "Invalid invite code")
        setInviteInfo(null)
        return
      }

      // Valid invite found
      setInviteInfo({
        id: data.invite.id,
        email: data.invite.email,
        role: data.invite.role,
        org_id: data.invite.org_id,
        organization: data.invite.organization as { name: string; logo_url: string | null },
      })

      // Pre-fill email if empty
      if (!email && data.invite.email) {
        setEmail(data.invite.email)
      }
    } catch (err) {
      console.error("Invite validation error:", err)
      // Check if it's a network error
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setInviteError("Network error - please check your connection")
      } else {
        setInviteError("Error validating invite code - please try again")
      }
      setInviteInfo(null)
    } finally {
      setValidatingInvite(false)
    }
  }

  // Debounced invite code validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inviteCode) {
        validateInviteCode(inviteCode)
      } else {
        setInviteInfo(null)
        setInviteError(null)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [inviteCode])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Global timeout - force redirect after 20 seconds no matter what
    const globalTimeout = setTimeout(() => {
      console.error("Global timeout reached - forcing redirect")
      toast.warning("Request took too long. Redirecting to login...")
      window.location.href = "/login"
    }, 20000)

    let shouldRedirect = false

    try {
      const supabase = createClient()

      // If using invite, verify email matches
      if (inviteInfo && email.toLowerCase() !== inviteInfo.email.toLowerCase()) {
        toast.error("Email must match the invited email address")
        return
      }

      // Create user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      })

      if (signUpError) {
        toast.error(signUpError.message)
        return
      }

      // Check if user was actually created
      if (!authData?.user) {
        toast.error("Failed to create account. Please try again.")
        return
      }

      // Check for fake signups (user exists, email confirmation enabled)
      if (authData.user.identities && authData.user.identities.length === 0) {
        toast.error("An account with this email already exists. Please sign in instead.")
        return
      }

      // User created successfully - set flag to redirect
      shouldRedirect = true

      // If invite code provided, join the organization via API
      if (inviteInfo) {
        try {
          const acceptResponse = await fetch("/api/invites/accept", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inviteId: inviteInfo.id,
              userId: authData.user.id,
            }),
          })

          if (acceptResponse.ok) {
            toast.success(`Account created! You've joined ${inviteInfo.organization.name}. Check your email to verify.`)
          } else {
            const acceptData = await acceptResponse.json().catch(() => ({}))
            console.error("Error accepting invite:", acceptData.error)
            toast.warning(`Account created but couldn't join organization. Please contact your admin.`)
          }
        } catch (acceptErr) {
          console.error("Error accepting invite:", acceptErr)
          toast.warning("Account created but couldn't join organization. Please contact your admin.")
        }
      } else {
        toast.success("Account created! Please check your email to verify.")
      }
    } catch (err: any) {
      console.error("Signup error:", err)
      toast.error(err.message || "An unexpected error occurred")
    } finally {
      clearTimeout(globalTimeout)
      setLoading(false)

      // Redirect if signup was successful
      if (shouldRedirect) {
        // Small delay to show toast
        setTimeout(() => {
          window.location.href = "/login"
        }, 500)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            {inviteInfo?.organization.logo_url ? (
              <img
                src={inviteInfo.organization.logo_url}
                alt={inviteInfo.organization.name}
                className="w-12 h-12 rounded-xl object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {inviteInfo ? `Join ${inviteInfo.organization.name}` : "Create an Account"}
          </CardTitle>
          <CardDescription>
            {inviteInfo
              ? `You've been invited to join as ${roleLabels[inviteInfo.role] || inviteInfo.role}`
              : "Get started with Jadarat ATS"
            }
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            {/* Invite Code Field */}
            <div className="space-y-2">
              <Label htmlFor="inviteCode">
                Invite Code <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="inviteCode"
                  placeholder="Enter invite code (e.g., 2XEVN2HL)"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className={cn(
                    "pl-9 font-mono uppercase",
                    inviteInfo && "border-green-500 focus-visible:ring-green-500",
                    inviteError && "border-destructive focus-visible:ring-destructive"
                  )}
                  disabled={loading}
                  maxLength={10}
                />
                {validatingInvite && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {inviteInfo && !validatingInvite && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
                {inviteError && !validatingInvite && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                )}
              </div>
              {inviteInfo && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Valid invite for {inviteInfo.organization.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {roleLabels[inviteInfo.role] || inviteInfo.role}
                  </Badge>
                </div>
              )}
              {inviteError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {inviteError}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || (inviteInfo !== null)}
                className={cn(inviteInfo && "bg-muted")}
              />
              {inviteInfo && (
                <p className="text-xs text-muted-foreground">
                  Email is pre-filled from your invite
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading || (inviteCode.length > 0 && !inviteInfo)}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {inviteInfo ? `Join ${inviteInfo.organization.name}` : "Create Account"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
