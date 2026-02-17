"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Loader2,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  UserPlus,
  Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"

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

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupPageSkeleton />}>
      <SignupPageContent />
    </Suspense>
  )
}

function SignupPageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "var(--brand-gradient, linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%))" }}
            >
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>Get started with Kawadir ATS</CardDescription>
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get("code")
  const { t, language, setLanguage, isRTL } = useI18n()
  const getRoleLabel = (role: string) => t(`auth.signup.roleLabels.${role}`) || role

  // Mode: "create_org" or "join_org"
  const [mode, setMode] = useState<"create_org" | "join_org">(codeFromUrl ? "join_org" : "create_org")
  const hasInviteLink = !!codeFromUrl

  // Shared fields
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  // Create org fields
  const [orgName, setOrgName] = useState("")
  const [orgSlug, setOrgSlug] = useState("")

  // Join org fields
  const [inviteCode, setInviteCode] = useState(codeFromUrl || "")
  const [validatingInvite, setValidatingInvite] = useState(false)
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)

  // Auto-generate slug from org name
  useEffect(() => {
    if (orgName) {
      const slug = orgName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
      setOrgSlug(slug)
    } else {
      setOrgSlug("")
    }
  }, [orgName])

  // Validate invite code from URL on mount
  useEffect(() => {
    if (codeFromUrl) {
      validateInviteCode(codeFromUrl)
    }
  }, [codeFromUrl])

  // Debounced invite code validation on manual input
  useEffect(() => {
    // Skip if code came from URL (already validated above)
    if (inviteCode === codeFromUrl) return

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

  const validateInviteCode = async (code: string) => {
    if (!code || code.length < 6) {
      setInviteInfo(null)
      setInviteError(null)
      return
    }

    setValidatingInvite(true)
    setInviteError(null)

    try {
      const response = await fetch(`/api/invites/validate?code=${encodeURIComponent(code)}`, {
        method: "GET",
        headers: { "Accept": "application/json" },
        cache: "no-store",
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        setInviteError("Server returned invalid response")
        setInviteInfo(null)
        return
      }

      const data = await response.json()

      if (!response.ok || !data.valid) {
        setInviteError(data.error || "Invalid invite code")
        setInviteInfo(null)
        return
      }

      setInviteInfo({
        id: data.invite.id,
        email: data.invite.email,
        role: data.invite.role,
        org_id: data.invite.org_id,
        organization: data.invite.organization as { name: string; logo_url: string | null },
      })

      // Pre-fill email
      if (!email && data.invite.email) {
        setEmail(data.invite.email)
      }
    } catch (err) {
      console.error("Invite validation error:", err)
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const globalTimeout = setTimeout(() => {
      toast.warning("Request took too long. Redirecting to login...")
      window.location.href = "/login"
    }, 20000)

    try {
      // Validate based on mode
      if (mode === "create_org" && !orgName.trim()) {
        toast.error("Organization name is required")
        return
      }

      if (mode === "join_org") {
        if (!inviteInfo) {
          toast.error("Please enter a valid invite code")
          return
        }
        if (email.toLowerCase() !== inviteInfo.email.toLowerCase()) {
          toast.error("Email must match the invited email address")
          return
        }
      }

      const payload: Record<string, string> = {
        mode,
        firstName,
        lastName,
        email,
        password,
      }

      if (mode === "create_org") {
        payload.orgName = orgName.trim()
        payload.orgSlug = orgSlug
      } else {
        payload.inviteId = inviteInfo!.id
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || "Signup failed")
        return
      }

      if (mode === "create_org") {
        toast.success(`Account created! Organization "${orgName}" is ready. Please check your email to verify.`)
      } else {
        toast.success(`Account created! You've joined ${inviteInfo!.organization.name}. Please check your email to verify.`)
      }

      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = "/login"
      }, 500)
    } catch (err: any) {
      console.error("Signup error:", err)
      toast.error(err.message || "An unexpected error occurred")
    } finally {
      clearTimeout(globalTimeout)
      setLoading(false)
    }
  }

  const isJoinMode = mode === "join_org"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4" dir={isRTL ? "rtl" : "ltr"}>
      {/* Language Switcher - Floating */}
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

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            {isJoinMode && inviteInfo?.organization.logo_url ? (
              <img
                src={inviteInfo.organization.logo_url}
                alt={inviteInfo.organization.name}
                className="w-12 h-12 rounded-xl object-cover"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "var(--brand-gradient, linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%))" }}
              >
                {isJoinMode ? (
                  <UserPlus className="w-6 h-6 text-white" />
                ) : (
                  <Building2 className="w-6 h-6 text-white" />
                )}
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {isJoinMode && inviteInfo
              ? t("auth.signup.joinOrgName", { orgName: inviteInfo.organization.name })
              : isJoinMode
                ? t("auth.signup.joinOrg")
                : t("auth.signup.createYourOrg")
            }
          </CardTitle>
          <CardDescription>
            {isJoinMode && inviteInfo
              ? t("auth.signup.invitedAs", { role: getRoleLabel(inviteInfo.role) })
              : isJoinMode
                ? t("auth.signup.enterInviteToJoin")
                : t("auth.signup.setupOrgAndAdmin")
            }
          </CardDescription>
        </CardHeader>

        {/* Mode Toggle */}
        <div className="px-6 pb-2">
          <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => !hasInviteLink && setMode("create_org")}
              disabled={hasInviteLink}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
                mode === "create_org"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
                hasInviteLink && mode !== "create_org" && "opacity-50 cursor-not-allowed"
              )}
            >
              <Plus className="h-4 w-4" />
              {t("auth.signup.newOrganization")}
            </button>
            <button
              type="button"
              onClick={() => setMode("join_org")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
                mode === "join_org"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="h-4 w-4" />
              {t("auth.signup.joinExisting")}
            </button>
          </div>
          {hasInviteLink && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              {t("auth.signup.invitedToJoin")}
            </p>
          )}
        </div>

        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            {/* Create Org: Organization Name */}
            {mode === "create_org" && (
              <div className="space-y-2">
                <Label htmlFor="orgName">{t("auth.signup.orgName")}</Label>
                <div className="relative">
                  <Building2 className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                  <Input
                    id="orgName"
                    placeholder={t("auth.signup.orgNamePlaceholder")}
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className={isRTL ? "pr-9" : "pl-9"}
                    required
                    disabled={loading}
                  />
                </div>
                {orgSlug && (
                  <p className="text-xs text-muted-foreground">
                    {t("auth.signup.orgUrl")}: <span className="font-mono text-foreground">{orgSlug}</span>.kawadir.com
                  </p>
                )}
              </div>
            )}

            {/* Join Org: Invite Code */}
            {mode === "join_org" && (
              <div className="space-y-2">
                <Label htmlFor="inviteCode">{t("auth.signup.inviteCode")}</Label>
                <div className="relative">
                  <Users className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                  <Input
                    id="inviteCode"
                    placeholder={t("auth.signup.inviteCodePlaceholder")}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className={cn(
                      isRTL ? "pr-9" : "pl-9",
                      "font-mono uppercase",
                      inviteInfo && "border-green-500 focus-visible:ring-green-500",
                      inviteError && "border-destructive focus-visible:ring-destructive"
                    )}
                    disabled={loading || hasInviteLink}
                    maxLength={10}
                    required
                  />
                  {validatingInvite && (
                    <Loader2 className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground", isRTL ? "left-3" : "right-3")} />
                  )}
                  {inviteInfo && !validatingInvite && (
                    <CheckCircle2 className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-green-500", isRTL ? "left-3" : "right-3")} />
                  )}
                  {inviteError && !validatingInvite && (
                    <AlertCircle className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-destructive", isRTL ? "left-3" : "right-3")} />
                  )}
                </div>
                {inviteInfo && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{t("auth.signup.validInviteFor", { orgName: inviteInfo.organization.name })}</span>
                    <Badge variant="secondary" className="text-xs">
                      {getRoleLabel(inviteInfo.role)}
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
            )}

            {/* Shared Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("auth.signup.firstName")}</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={firstName}
                  autoComplete="given-name"
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t("auth.signup.lastName")}</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={lastName}
                  autoComplete="family-name"
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.signup.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || (isJoinMode && inviteInfo !== null)}
                className={cn(isJoinMode && inviteInfo && "bg-muted")}
              />
              {isJoinMode && inviteInfo && (
                <p className="text-xs text-muted-foreground">
                  {t("auth.signup.emailPreFilled")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.signup.password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("auth.signup.createStrongPassword")}
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || (isJoinMode && inviteCode.length > 0 && !inviteInfo)}
            >
              {loading && <Loader2 className={cn("h-4 w-4 animate-spin", isRTL ? "ml-2" : "mr-2")} />}
              {loading
                ? t("auth.signup.creatingAccount")
                : mode === "create_org"
                  ? t("auth.signup.createOrgAndAccount")
                  : inviteInfo
                    ? t("auth.signup.joinOrgName", { orgName: inviteInfo.organization.name })
                    : t("auth.signup.createAccount")
              }
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {t("auth.signup.haveAccount")}{" "}
              <Link href="/login" className="text-primary hover:underline">
                {t("auth.signup.signIn")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
