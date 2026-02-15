// @ts-nocheck
// Note: Supabase nested relation queries cause "Type instantiation is excessively deep" error
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Loader2,
  Building2,
  Plus,
  Mail,
  ArrowRight,
  CheckCircle,
  Users,
  Globe,
} from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [step, setStep] = useState<"choice" | "create" | "invite" | "complete">("choice")

  // Create org form
  const [orgName, setOrgName] = useState("")
  const [orgSlug, setOrgSlug] = useState("")
  const [orgIndustry, setOrgIndustry] = useState("")
  const [orgSize, setOrgSize] = useState("")

  // Join via invite
  const [inviteCode, setInviteCode] = useState("")

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    // Check if user already has an organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single()

    if (profile?.org_id) {
      // Already has an org, redirect to dashboard
      router.push("/org")
      return
    }

    setUser(user)
    setIsLoading(false)
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  }

  const handleOrgNameChange = (value: string) => {
    setOrgName(value)
    setOrgSlug(generateSlug(value))
  }

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!orgName || !orgSlug) {
      toast.error("Please enter organization name")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/org/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName,
          slug: orgSlug,
          industry: orgIndustry || null,
          companySize: orgSize || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          toast.error("This organization URL is already taken")
          setIsSubmitting(false)
          return
        }
        throw new Error(result.error || "Failed to create organization")
      }

      setStep("complete")
      toast.success("Organization created successfully!")

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/org")
      }, 2000)
    } catch (error: any) {
      console.error("Error creating organization:", error)
      toast.error(error.message || "Failed to create organization")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleJoinWithInvite = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inviteCode) {
      toast.error("Please enter an invite code")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      // Find the invite - use type assertion to avoid deep type instantiation
      const inviteResult = await supabase
        .from("team_invites")
        .select("*, organizations(id, name)")
        .eq("invite_code", inviteCode)
        .eq("status", "pending")
        .single()
      const invite = inviteResult.data as { id: string; email: string; org_id: string; role: string | null; expires_at: string | null; organizations: { id: string; name: string } | null } | null
      const inviteError = inviteResult.error

      if (inviteError || !invite) {
        toast.error("Invalid or expired invite code")
        setIsSubmitting(false)
        return
      }

      // Check if invite is for this email
      if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
        toast.error("This invite was sent to a different email address")
        setIsSubmitting(false)
        return
      }

      // Check if invite is expired
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        toast.error("This invite has expired")
        setIsSubmitting(false)
        return
      }

      // Update user profile with org_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ org_id: invite.org_id })
        .eq("id", user.id)

      if (profileError) throw profileError

      // Assign the role from the invite
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          org_id: invite.org_id,
          role: invite.role || "recruiter",
        })

      if (roleError) {
        console.error("Role assignment error:", roleError)
      }

      // Update invite status
      await supabase
        .from("team_invites")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
          accepted_by: user.id,
        })
        .eq("id", invite.id)

      setStep("complete")
      toast.success(`Welcome to ${invite.organizations?.name}!`)

      setTimeout(() => {
        router.push("/org")
      }, 2000)
    } catch (error: any) {
      console.error("Error joining organization:", error)
      toast.error(error.message || "Failed to join organization")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (step === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You're all set!</h2>
            <p className="text-muted-foreground mb-4">
              Redirecting you to your dashboard...
            </p>
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div
            className="mx-auto mb-4 w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "var(--brand-gradient, linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%))" }}
          >
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Welcome to Kawadir ATS</CardTitle>
          <CardDescription>
            {step === "choice" && "Let's get you set up with an organization"}
            {step === "create" && "Create your organization"}
            {step === "invite" && "Join with an invite code"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === "choice" && (
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full h-auto py-6 flex flex-col items-center gap-2"
                onClick={() => setStep("create")}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: "var(--brand-gradient-subtle, linear-gradient(135deg, #6366f115 0%, #8b5cf615 100%))" }}
                >
                  <Plus className="w-6 h-6" style={{ color: "var(--brand-primary, #6366f1)" }} />
                </div>
                <span className="font-semibold">Create New Organization</span>
                <span className="text-sm text-muted-foreground">
                  Start fresh with your own company account
                </span>
              </Button>

              <Button
                variant="outline"
                className="w-full h-auto py-6 flex flex-col items-center gap-2"
                onClick={() => setStep("invite")}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: "var(--brand-gradient-subtle, linear-gradient(135deg, #6366f115 0%, #8b5cf615 100%))" }}
                >
                  <Mail className="w-6 h-6" style={{ color: "var(--brand-primary, #6366f1)" }} />
                </div>
                <span className="font-semibold">Join with Invite Code</span>
                <span className="text-sm text-muted-foreground">
                  I have an invite code from my team
                </span>
              </Button>
            </div>
          )}

          {step === "create" && (
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name *</Label>
                <Input
                  id="orgName"
                  placeholder="Acme Corporation"
                  value={orgName}
                  onChange={(e) => handleOrgNameChange(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgSlug">Organization URL</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">careers/</span>
                  <Input
                    id="orgSlug"
                    placeholder="acme-corp"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(generateSlug(e.target.value))}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This will be your public careers page URL
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgIndustry">Industry (Optional)</Label>
                <Input
                  id="orgIndustry"
                  placeholder="Technology, Healthcare, Finance..."
                  value={orgIndustry}
                  onChange={(e) => setOrgIndustry(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgSize">Company Size (Optional)</Label>
                <Input
                  id="orgSize"
                  placeholder="1-10, 11-50, 51-200..."
                  value={orgSize}
                  onChange={(e) => setOrgSize(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("choice")}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Create Organization
                </Button>
              </div>
            </form>
          )}

          {step === "invite" && (
            <form onSubmit={handleJoinWithInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invite Code</Label>
                <Input
                  id="inviteCode"
                  placeholder="Enter your invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  required
                  disabled={isSubmitting}
                  className="font-mono text-center text-lg tracking-wider"
                />
                <p className="text-xs text-muted-foreground">
                  Check your email for the invite code from your team
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("choice")}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Users className="mr-2 h-4 w-4" />
                  )}
                  Join Organization
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
