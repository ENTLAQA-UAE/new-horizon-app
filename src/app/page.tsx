"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Sparkles } from "lucide-react"

/**
 * Root Redirect Page
 *
 * This page handles the post-login redirect logic:
 * - super_admin users → /admin (admin dashboard)
 * - org users with org_id → /org (organization dashboard)
 * - users without org_id → /onboarding
 * - unauthenticated users → /login
 *
 * This prevents race conditions by doing a single auth check
 * and redirecting to the final destination immediately.
 */
export default function RootRedirectPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Safety timeout: if redirect takes too long, default to /org
    const safetyTimeoutId = setTimeout(() => {
      console.warn("RootRedirect: Safety timeout reached, defaulting to /org")
      router.replace("/org")
    }, 15000) // 15 second maximum

    async function determineRedirect() {
      const supabase = createClient()

      try {
        // First check if we have magic link tokens in the URL hash
        // Supabase redirects magic links with tokens in the hash fragment:
        // /#access_token=...&refresh_token=...&type=magiclink
        let session = null
        const hash = window.location.hash
        if (hash && hash.includes('access_token')) {
          const hashParams = new URLSearchParams(hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')

          if (accessToken && refreshToken) {
            console.log("RootRedirect: Found tokens in URL hash, establishing session")
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (data.session && !error) {
              session = data.session
              // Clean up the hash from the URL
              window.history.replaceState(null, '', window.location.pathname)
              console.log("RootRedirect: Session established from magic link")
            } else {
              console.warn("RootRedirect: Failed to set session from hash:", error)
            }
          }
        }

        // Then try to get session from pending storage (set by login page)
        if (!session) {
          try {
            const pendingSession = localStorage.getItem('jadarat_pending_session')
            if (pendingSession) {
              const parsed = JSON.parse(pendingSession)
              if (parsed?.access_token && parsed?.user) {
                console.log("RootRedirect: Found pending session from login")
                session = parsed
              }
            }
          } catch (e) {
            console.warn("RootRedirect: Could not read pending session:", e)
          }
        }

        // If no pending session, try getSession with timeout
        if (!session) {
          try {
            const sessionPromise = supabase.auth.getSession()
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("getSession timeout")), 5000)
            )
            const result = await Promise.race([sessionPromise, timeoutPromise])
            session = result.data.session
          } catch (e) {
            console.warn("RootRedirect: getSession timed out, checking localStorage")

            // Try Supabase's localStorage
            const storageKeys = Object.keys(localStorage).filter(
              k => k.startsWith("sb-") && k.endsWith("-auth-token")
            )
            if (storageKeys.length > 0) {
              const storedData = localStorage.getItem(storageKeys[0])
              if (storedData) {
                const parsed = JSON.parse(storedData)
                if (parsed?.access_token && parsed?.user) {
                  session = parsed
                }
              }
            }
          }
        }

        if (!session?.user) {
          console.log("RootRedirect: No session found, redirecting to login")
          router.replace("/login")
          return
        }

        console.log("RootRedirect: Session found for user:", session.user.id)

        // Fetch user's roles and profile to determine redirect destination
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
          console.error("RootRedirect: Missing Supabase configuration")
          router.replace("/login")
          return
        }

        const authHeaders = {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        }

        // Create abort controllers for timeout handling
        const rolesController = new AbortController()
        const profileController = new AbortController()
        const rolesTimeoutId = setTimeout(() => rolesController.abort(), 10000)
        const profileTimeoutId = setTimeout(() => profileController.abort(), 10000)

        // Fetch roles and profile in parallel with timeout
        const [rolesResponse, profileResponse] = await Promise.all([
          fetch(
            `${supabaseUrl}/rest/v1/user_roles?select=role&user_id=eq.${session.user.id}`,
            { headers: authHeaders, signal: rolesController.signal }
          ),
          fetch(
            `${supabaseUrl}/rest/v1/profiles?select=id,org_id&id=eq.${session.user.id}`,
            { headers: authHeaders, signal: profileController.signal }
          )
        ])

        clearTimeout(rolesTimeoutId)
        clearTimeout(profileTimeoutId)

        let roles: string[] = []
        let orgId: string | null = null

        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json()
          roles = rolesData.map((r: { role: string }) => r.role)
          console.log("RootRedirect: User roles:", roles)
        }

        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          if (profileData && profileData.length > 0) {
            orgId = profileData[0].org_id
            console.log("RootRedirect: User org_id:", orgId)
          }
        }

        // Determine redirect destination based on role and org_id
        const isSuperAdmin = roles.includes("super_admin")

        if (isSuperAdmin) {
          console.log("RootRedirect: User is super_admin, redirecting to /admin")
          router.replace("/admin")
        } else if (orgId) {
          console.log("RootRedirect: User has org_id, redirecting to /org")
          router.replace("/org")
        } else {
          console.log("RootRedirect: User needs onboarding, redirecting to /onboarding")
          router.replace("/onboarding")
        }
      } catch (err) {
        console.error("RootRedirect: Error determining redirect:", err)
        const isTimeout = err instanceof Error && err.name === 'AbortError'

        // CRITICAL FIX: If we have a valid session but fetches failed,
        // default to /org instead of /login to prevent infinite redirect loop
        // The org layout will handle proper auth checking
        try {
          const pendingSession = localStorage.getItem('jadarat_pending_session')
          const storageKeys = Object.keys(localStorage).filter(
            k => k.startsWith("sb-") && k.endsWith("-auth-token")
          )
          const hasSession = pendingSession || storageKeys.length > 0

          if (hasSession) {
            console.log("RootRedirect: Fetch failed but session exists, defaulting to /org")
            // Clear the pending session since we're using it
            localStorage.removeItem('jadarat_pending_session')
            router.replace("/org")
            return
          }
        } catch (storageErr) {
          console.warn("RootRedirect: Could not check session storage:", storageErr)
        }

        // Only show error and redirect to login if no session exists
        const errorMessage = isTimeout
          ? "Connection timed out. Please check your internet and try again."
          : "Something went wrong. Please try logging in again."
        setError(errorMessage)
        // Fallback to login after a delay
        setTimeout(() => router.replace("/login"), 2000)
      }
    }

    determineRedirect().finally(() => {
      clearTimeout(safetyTimeoutId)
    })

    return () => {
      clearTimeout(safetyTimeoutId)
    }
  }, [router])

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg animate-pulse"
          style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
        >
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}
