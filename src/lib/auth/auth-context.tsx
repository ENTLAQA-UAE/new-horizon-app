"use client"

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react"
import { createClient, fullCleanup, resetSupabaseClient } from "@/lib/supabase/client"
import { clearTokenCache } from "@/lib/supabase/auth-fetch"
import { User, Session } from "@supabase/supabase-js"

// User role types - centralized definition
export type UserRole = "super_admin" | "org_admin" | "hr_manager" | "recruiter" | "hiring_manager" | "interviewer"

// Profile data structure
export interface UserProfile {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  org_id: string | null
}

// Organization data structure
export interface UserOrganization {
  id: string
  name: string
  name_ar: string | null
  slug: string | null
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
}

// Complete auth state
export interface AuthState {
  // Auth status
  isLoading: boolean
  isAuthenticated: boolean
  error: AuthError | null

  // User data
  user: User | null
  session: Session | null
  profile: UserProfile | null
  organization: UserOrganization | null
  roles: UserRole[]
  primaryRole: UserRole | null
  departments: string[]

  // Computed properties
  isOrgAdmin: boolean
  isSuperAdmin: boolean
  needsOnboarding: boolean

  // Actions
  refreshAuth: () => Promise<void>
  signOut: () => Promise<void>
}

// Auth error types for better error handling
export type AuthErrorCode =
  | "NO_SESSION"
  | "SESSION_ERROR"
  | "SESSION_EXPIRED"
  | "PROFILE_NOT_FOUND"
  | "PROFILE_FETCH_ERROR"
  | "ROLES_FETCH_ERROR"
  | "ORG_FETCH_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR"

export interface AuthError {
  code: AuthErrorCode
  message: string
  details?: string
}

const defaultAuthState: AuthState = {
  isLoading: true,
  isAuthenticated: false,
  error: null,
  user: null,
  session: null,
  profile: null,
  organization: null,
  roles: [],
  primaryRole: null,
  departments: [],
  isOrgAdmin: false,
  isSuperAdmin: false,
  needsOnboarding: false,
  refreshAuth: async () => {},
  signOut: async () => {},
}

const AuthContext = createContext<AuthState>(defaultAuthState)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Storage key for user tracking
const AUTH_USER_KEY = "kawadir_auth_user_id"

// Helper function to clear all auth-related cookies
function clearAuthCookies() {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'kawadir.io'

  try {
    const cookies = document.cookie.split(";")

    for (const cookie of cookies) {
      const [name] = cookie.split("=")
      const cookieName = name.trim()

      // Clear cookies that match Supabase, auth, or middleware patterns
      if (
        cookieName.startsWith("sb-") ||
        cookieName.startsWith("x-user-") ||
        cookieName.startsWith("x-org-") ||
        cookieName.includes("supabase") ||
        cookieName.includes("auth") ||
        cookieName.includes("token") ||
        cookieName.includes("session") ||
        cookieName.includes("kawadir")
      ) {
        // Clear cookie for multiple domains to ensure removal
        // Must include the root domain (e.g. .kawadir.io) since cookies are set there
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${rootDomain};`
        console.log("AuthProvider: Cleared cookie:", cookieName)
      }
    }
  } catch (e) {
    console.warn("AuthProvider: Error clearing cookies:", e)
  }
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<Omit<AuthState, "refreshAuth" | "signOut">>({
    isLoading: true,
    isAuthenticated: false,
    error: null,
    user: null,
    session: null,
    profile: null,
    organization: null,
    roles: [],
    primaryRole: null,
    departments: [],
    isOrgAdmin: false,
    isSuperAdmin: false,
    needsOnboarding: false,
  })

  const loadingRef = useRef(false)
  const mountedRef = useRef(true)

  // Determine primary role from roles array
  const getPrimaryRole = (roles: UserRole[]): UserRole | null => {
    const rolePriority: UserRole[] = [
      "super_admin",
      "org_admin",
      "hr_manager",
      "recruiter",
      "hiring_manager",
      "interviewer"
    ]

    for (const role of rolePriority) {
      if (roles.includes(role)) {
        return role
      }
    }
    return null
  }

  // Helper function to check if a JWT token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      // exp is in seconds, Date.now() is in milliseconds. Add 30s buffer.
      return payload.exp && (payload.exp * 1000) < (Date.now() + 30000)
    } catch {
      return true // Treat decode failures as expired
    }
  }

  // Main auth loading function - now accepts optional session from auth state change
  const loadAuth = useCallback(async (providedSession?: Session | null) => {
    // Prevent concurrent loads
    if (loadingRef.current) {
      console.log("AuthProvider: Load already in progress, skipping")
      return
    }

    loadingRef.current = true
    console.log("AuthProvider: Starting auth load...", providedSession ? "with provided session" : "fetching session")

    const supabase = createClient()

    try {
      // Use provided session from auth state change, or try to get it
      let session = providedSession ?? null

      if (!session) {
        // OPTIMIZATION: Check localStorage sources FIRST (fast) before calling getSession() (slow)
        // This avoids the 3-second timeout delay when we already have a valid session in storage

        // Method 1: Try kawadir_pending_session first (set by login page before redirect)
        // This handles the race condition where redirect happens before Supabase persists
        try {
          const pendingSession = localStorage.getItem('kawadir_pending_session')
          if (pendingSession) {
            const parsed = JSON.parse(pendingSession)
            if (parsed?.access_token && parsed?.user && !isTokenExpired(parsed.access_token)) {
              console.log("AuthProvider: Found valid pending session from login, using it")
              session = parsed as Session
            } else if (parsed?.access_token && isTokenExpired(parsed.access_token)) {
              console.log("AuthProvider: Pending session expired, clearing it")
              localStorage.removeItem('kawadir_pending_session')
            }
          }
        } catch (e) {
          // Silent fail, try next method
        }

        // Method 2: Try Supabase's localStorage key (sb-<project-ref>-auth-token)
        if (!session) {
          try {
            const storageKeys = Object.keys(localStorage).filter(k => k.startsWith("sb-") && k.endsWith("-auth-token"))
            if (storageKeys.length > 0) {
              const storedData = localStorage.getItem(storageKeys[0])
              if (storedData) {
                const parsed = JSON.parse(storedData)
                if (parsed?.access_token && parsed?.user && !isTokenExpired(parsed.access_token)) {
                  console.log("AuthProvider: Found valid session in Supabase localStorage, using it")
                  session = parsed as Session
                }
              }
            }
          } catch (e) {
            // Silent fail, try next method
          }
        }

        // Method 3: Only call getSession() if no valid localStorage session found
        // This is the slow path (can timeout) so we try it last
        if (!session) {
          console.log("AuthProvider: No localStorage session found, trying getSession()...")
          try {
            const getSessionPromise = supabase.auth.getSession()
            const sessionTimeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("getSession timeout")), 3000)
            )

            const sessionResult = await Promise.race([getSessionPromise, sessionTimeoutPromise])
            session = sessionResult.data.session
            console.log("AuthProvider: getSession completed, session:", session ? "exists" : "null")
          } catch (sessionError) {
            // getSession timed out - this is expected when Supabase client is slow
            // We've already checked localStorage above, so if we're here, there's no session
            console.log("AuthProvider: getSession timed out, no session available")
          }
        }

        // If we found a session from localStorage, sync to Supabase client in background
        // This is non-blocking and non-critical since we're already using the session directly
        if (session && !providedSession) {
          const setSessionPromise = supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token || '',
          })
          Promise.race([
            setSessionPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000))
          ]).then(() => {
            console.log("AuthProvider: Session synced to Supabase client")
          }).catch(() => {
            // Non-critical: session is already being used directly
            // Don't log warning - this is expected behavior in some environments
          })
        }

        // If we still don't have a session, set unauthenticated state
        if (!session) {
          console.log("AuthProvider: No session available, setting unauthenticated state")
          if (mountedRef.current) {
            setState(prev => ({
              ...prev,
              isLoading: false,
              isAuthenticated: false,
              user: null,
              session: null,
              profile: null,
              organization: null,
              roles: [],
              primaryRole: null,
              error: null,
            }))
          }
          loadingRef.current = false
          return
        }
      }

      if (!session) {
        console.log("AuthProvider: No session found")
        try { sessionStorage.removeItem(AUTH_USER_KEY) } catch {}

        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            isAuthenticated: false,
            user: null,
            session: null,
            profile: null,
            organization: null,
            roles: [],
            primaryRole: null,
            error: null,
          }))
        }
        loadingRef.current = false
        return
      }

      // We have a session - use session.user
      const user = session.user
      console.log("AuthProvider: Session found for user:", user.id)

      // Skip getUser() validation entirely - it hangs in this environment
      // The session from auth state change is already validated by Supabase
      console.log("AuthProvider: Using session user directly (skipping getUser validation)")

      // Check for user change and trigger reload if needed
      try {
        const storedUserId = sessionStorage.getItem(AUTH_USER_KEY)
        if (storedUserId && storedUserId !== user.id) {
          console.warn("AuthProvider: User changed, reloading page")
          sessionStorage.setItem(AUTH_USER_KEY, user.id)
          window.location.reload()
          return
        }
        sessionStorage.setItem(AUTH_USER_KEY, user.id)
      } catch {}

      // Step 2: Fetch profile, roles, and org in PARALLEL for faster loading
      let profile: UserProfile | null = null
      let profileError: AuthError | null = null
      let roles: UserRole[] = []
      let organization: UserOrganization | null = null
      let departments: string[] = []

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const authHeaders = {
        'apikey': supabaseKey || '',
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      }

      console.log("AuthProvider: Supabase URL:", supabaseUrl)
      console.log("AuthProvider: Fetching profile and roles in parallel for user:", user.id)

      if (supabaseUrl && supabaseKey) {
        const parallelStart = Date.now()

        // Create fetch functions for parallel execution
        const fetchProfile = async (): Promise<{ profile: UserProfile | null; error: AuthError | null }> => {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 8000)

            const response = await fetch(
              `${supabaseUrl}/rest/v1/profiles?select=id,email,first_name,last_name,avatar_url,org_id&id=eq.${user.id}`,
              { headers: authHeaders, signal: controller.signal }
            )

            clearTimeout(timeoutId)

            if (response.ok) {
              const data = await response.json()
              if (data && data.length > 0) {
                return { profile: data[0] as UserProfile, error: null }
              }
              return { profile: null, error: { code: "PROFILE_NOT_FOUND", message: "User profile not found." } }
            }
            return { profile: null, error: { code: "PROFILE_FETCH_ERROR", message: "Failed to load profile.", details: `Status: ${response.status}` } }
          } catch (err) {
            const isTimeout = err instanceof Error && err.name === 'AbortError'
            return { profile: null, error: { code: isTimeout ? "NETWORK_ERROR" : "PROFILE_FETCH_ERROR", message: isTimeout ? "Profile loading timed out." : "Failed to load profile." } }
          }
        }

        const fetchRoles = async (): Promise<UserRole[]> => {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 8000)

            const response = await fetch(
              `${supabaseUrl}/rest/v1/user_roles?select=role&user_id=eq.${user.id}`,
              { headers: authHeaders, signal: controller.signal }
            )

            clearTimeout(timeoutId)

            if (response.ok) {
              const data = await response.json()
              if (data && data.length > 0) {
                return data.map((r: { role: string }) => r.role as UserRole)
              }
            }
            return []
          } catch {
            return []
          }
        }

        const fetchOrg = async (orgId: string): Promise<UserOrganization | null> => {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 8000)

            const response = await fetch(
              `${supabaseUrl}/rest/v1/organizations?select=id,name,name_ar,slug,logo_url,primary_color,secondary_color&id=eq.${orgId}`,
              { headers: authHeaders, signal: controller.signal }
            )

            clearTimeout(timeoutId)

            if (response.ok) {
              const data = await response.json()
              if (data && data.length > 0) {
                return data[0] as UserOrganization
              }
            }
            return null
          } catch {
            return null
          }
        }

        const fetchDepartments = async (userId: string, orgId: string): Promise<string[]> => {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 8000)

            const response = await fetch(
              `${supabaseUrl}/rest/v1/user_role_departments?select=department_id&user_id=eq.${userId}&org_id=eq.${orgId}`,
              { headers: authHeaders, signal: controller.signal }
            )

            clearTimeout(timeoutId)

            if (response.ok) {
              const data = await response.json()
              if (data && data.length > 0) {
                return data.map((d: { department_id: string }) => d.department_id)
              }
            }
            return []
          } catch {
            return []
          }
        }

        // Execute profile and roles fetch in parallel
        const [profileResult, rolesResult] = await Promise.all([
          fetchProfile(),
          fetchRoles()
        ])

        profile = profileResult.profile
        profileError = profileResult.error
        roles = rolesResult

        console.log("AuthProvider: Parallel fetch completed in", Date.now() - parallelStart + 'ms', {
          hasProfile: !!profile,
          rolesCount: roles.length
        })

        // Fetch org and departments if we have profile with org_id
        if (profile?.org_id) {
          console.log("AuthProvider: Fetching organization:", profile.org_id)
          const [orgResult, deptResult] = await Promise.all([
            fetchOrg(profile.org_id),
            roles.includes("hiring_manager" as UserRole)
              ? fetchDepartments(user.id, profile.org_id)
              : Promise.resolve([]),
          ])
          organization = orgResult
          departments = deptResult
          if (organization) {
            console.log("AuthProvider: Organization loaded:", organization.name)
          }
        }
      } else {
        profileError = {
          code: "UNKNOWN_ERROR",
          message: "Missing Supabase configuration. Please contact support.",
        }
      }

      // If profile fetch completely failed (network error), show error
      if (profileError && !profile) {
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            isAuthenticated: true,
            user,
            session,
            error: profileError,
          }))
        }
        loadingRef.current = false
        return
      }

      // Compute derived state
      const primaryRole = getPrimaryRole(roles)
      const isSuperAdmin = roles.includes("super_admin")
      const isOrgAdmin = roles.includes("org_admin") || isSuperAdmin

      // User needs onboarding if they have no org_id and no super_admin role
      const needsOnboarding = !profile?.org_id && !isSuperAdmin

      console.log("AuthProvider: Auth loaded successfully", {
        userId: user.id,
        hasProfile: !!profile,
        orgId: profile?.org_id,
        roles,
        primaryRole,
        needsOnboarding,
      })

      // Save session to kawadir_pending_session as a backup for page refreshes
      // This ensures we have a reliable fallback when getSession() times out
      try {
        localStorage.setItem('kawadir_pending_session', JSON.stringify(session))
        console.log("AuthProvider: Session backed up to localStorage")
      } catch (e) {
        console.warn("AuthProvider: Could not backup session:", e)
      }

      if (mountedRef.current) {
        setState({
          isLoading: false,
          isAuthenticated: true,
          error: null,
          user,
          session,
          profile,
          organization,
          roles,
          primaryRole,
          departments,
          isOrgAdmin,
          isSuperAdmin,
          needsOnboarding,
        })
      }
    } catch (error) {
      console.error("AuthProvider: Unexpected error:", error)
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: {
            code: "UNKNOWN_ERROR",
            message: "An unexpected error occurred. Please refresh the page.",
            details: error instanceof Error ? error.message : String(error)
          }
        }))
      }
    } finally {
      loadingRef.current = false
    }
  }, [])

  // Sign out function
  const signOut = useCallback(async () => {
    console.log("AuthProvider: Signing out...")

    // CRITICAL: Reset loading flag first to prevent re-login issues
    loadingRef.current = false

    try {
      const supabase = createClient()

      // Sign out with scope: 'local' — clears local session without a slow server roundtrip
      // The JWT will expire naturally on the server (short-lived tokens)
      const signOutPromise = supabase.auth.signOut({ scope: 'local' })
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Sign out timeout")), 2000)
      )

      await Promise.race([signOutPromise, timeoutPromise]).catch((e) => {
        console.warn("AuthProvider: Sign out timed out or failed:", e)
      })
    } catch (error) {
      console.error("AuthProvider: Sign out error:", error)
    }

    // CRITICAL: Full cleanup - clear ALL storage, cookies, and reset Supabase client singleton
    // This ensures next login starts with completely fresh state
    try {
      clearTokenCache() // Clear auth-fetch token cache
      fullCleanup()
      sessionStorage.removeItem(AUTH_USER_KEY)

      // Clear all auth-related cookies
      clearAuthCookies()
    } catch (e) {
      console.warn("AuthProvider: Cleanup error:", e)
    }

    console.log("AuthProvider: Sign out complete, redirecting to login...")

    // Always redirect to login with full page reload
    window.location.href = "/login"
  }, [])

  // Refresh auth function
  const refreshAuth = useCallback(async () => {
    loadingRef.current = false // Reset loading flag to allow refresh
    await loadAuth()
  }, [loadAuth])

  // Initial load and auth state listener
  useEffect(() => {
    mountedRef.current = true
    const supabase = createClient()

    // Safety timeout: if auth loading takes too long, set not authenticated
    // This prevents infinite loading state
    const safetyTimeoutId = setTimeout(() => {
      // Use setState with callback to check current state (avoids stale closure)
      setState(prev => {
        if (mountedRef.current && prev.isLoading) {
          console.warn("AuthProvider: Safety timeout reached, setting unauthenticated state")
          loadingRef.current = false
          return {
            ...prev,
            isLoading: false,
            isAuthenticated: false,
            error: {
              code: "NETWORK_ERROR" as const,
              message: "Authentication timed out. Please try logging in again.",
            }
          }
        }
        return prev
      })
    }, 20000) // 20 second maximum

    // Load auth on mount
    loadAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("AuthProvider: Auth event:", event)

        if (event === "SIGNED_OUT") {
          try { sessionStorage.removeItem(AUTH_USER_KEY) } catch {}
          if (mountedRef.current) {
            setState({
              isLoading: false,
              isAuthenticated: false,
              error: null,
              user: null,
              session: null,
              profile: null,
              organization: null,
              roles: [],
              primaryRole: null,
              departments: [],
              isOrgAdmin: false,
              isSuperAdmin: false,
              needsOnboarding: false,
            })
          }
        } else if (event === "TOKEN_REFRESHED") {
          // Token refreshed — just update the session without refetching profile/roles/org
          // User data hasn't changed, only the JWT was renewed
          if (session && mountedRef.current) {
            console.log("AuthProvider: Token refreshed, updating session only")
            setState(prev => ({
              ...prev,
              session,
              user: session.user,
            }))
            try {
              localStorage.setItem('kawadir_pending_session', JSON.stringify(session))
            } catch {}
          }
        } else if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          // Use the session from the auth state change event directly
          // This avoids the getSession() call which can hang
          console.log("AuthProvider: Auth event with session, loadingRef:", loadingRef.current, "session:", session ? "exists" : "null")
          if (session) {
            // We have a valid session from the event - use it directly
            loadingRef.current = false // Reset to allow loading with the new session
            await loadAuth(session)
          } else if (!loadingRef.current) {
            // No session in event, try loading normally
            await loadAuth()
          } else {
            console.log("AuthProvider: Skipping - load already in progress")
          }
        }
      }
    )

    return () => {
      mountedRef.current = false
      clearTimeout(safetyTimeoutId)
      subscription.unsubscribe()
    }
  }, [loadAuth])

  const value: AuthState = {
    ...state,
    refreshAuth,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
