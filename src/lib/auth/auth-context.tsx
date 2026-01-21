"use client"

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react"
import { createClient, fullCleanup, resetSupabaseClient } from "@/lib/supabase/client"
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
const AUTH_USER_KEY = "jadarat_auth_user_id"

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
        // Try getSession with a short timeout - it might hang if trying to refresh
        console.log("AuthProvider: No session provided, trying getSession...")
        try {
          const getSessionPromise = supabase.auth.getSession()
          const sessionTimeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("getSession timeout")), 3000)
          )

          const sessionResult = await Promise.race([getSessionPromise, sessionTimeoutPromise])
          session = sessionResult.data.session
          console.log("AuthProvider: getSession completed, session:", session ? "exists" : "null")
        } catch (sessionError) {
          console.warn("AuthProvider: getSession timed out, trying to retrieve session from storage")

          // First try our pending session key (set by login page before redirect)
          // This handles the race condition where redirect happens before Supabase persists
          try {
            const pendingSession = localStorage.getItem('jadarat_pending_session')
            if (pendingSession) {
              const parsed = JSON.parse(pendingSession)
              if (parsed?.access_token && parsed?.user) {
                console.log("AuthProvider: Found pending session from login, using it")
                session = parsed as Session
                // Clear it after use to avoid stale sessions
                localStorage.removeItem('jadarat_pending_session')
              }
            }
          } catch (pendingError) {
            console.warn("AuthProvider: Could not retrieve pending session:", pendingError)
          }

          // If no pending session, try Supabase's localStorage key
          // Supabase stores the session in localStorage with a key like sb-<project-ref>-auth-token
          if (!session) {
            try {
              const storageKeys = Object.keys(localStorage).filter(k => k.startsWith("sb-") && k.endsWith("-auth-token"))
              if (storageKeys.length > 0) {
                const storedData = localStorage.getItem(storageKeys[0])
                if (storedData) {
                  const parsed = JSON.parse(storedData)
                  if (parsed?.access_token && parsed?.user) {
                    console.log("AuthProvider: Found session in localStorage, using it")
                    session = parsed as Session
                  }
                }
              }
            } catch (storageError) {
              console.warn("AuthProvider: Could not retrieve session from storage:", storageError)
            }
          }

          // If we still don't have a session, set unauthenticated state instead of leaving loading forever
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

      // Step 2: Fetch profile using raw fetch (Supabase client was timing out)
      let profile: UserProfile | null = null
      let profileError: AuthError | null = null

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const authHeaders = {
        'apikey': supabaseKey || '',
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      }

      console.log("AuthProvider: Supabase URL:", supabaseUrl)
      console.log("AuthProvider: Fetching profile for user:", user.id)

      if (supabaseUrl && supabaseKey) {
        try {
          const profileStart = Date.now()

          // Add timeout to profile fetch to prevent hanging
          const profileController = new AbortController()
          const profileTimeoutId = setTimeout(() => profileController.abort(), 10000)

          const profileResponse = await fetch(
            `${supabaseUrl}/rest/v1/profiles?select=id,email,first_name,last_name,avatar_url,org_id&id=eq.${user.id}`,
            { headers: authHeaders, signal: profileController.signal }
          )

          clearTimeout(profileTimeoutId)

          console.log("AuthProvider: Profile fetch response:", {
            status: profileResponse.status,
            time: Date.now() - profileStart + 'ms'
          })

          if (profileResponse.ok) {
            const profileData = await profileResponse.json()
            if (profileData && profileData.length > 0) {
              profile = profileData[0] as UserProfile
              console.log("AuthProvider: Profile loaded:", { id: profile.id, org_id: profile.org_id })
            } else {
              console.log("AuthProvider: No profile found for user")
              profileError = {
                code: "PROFILE_NOT_FOUND",
                message: "User profile not found. Please contact support.",
              }
            }
          } else {
            console.warn("AuthProvider: Profile fetch failed with status:", profileResponse.status)
            profileError = {
              code: "PROFILE_FETCH_ERROR",
              message: "Failed to load user profile. Please try again.",
              details: `Status: ${profileResponse.status}`
            }
          }
        } catch (profileFetchErr) {
          console.error("AuthProvider: Profile fetch error:", profileFetchErr)
          const isTimeout = profileFetchErr instanceof Error && profileFetchErr.name === 'AbortError'
          profileError = {
            code: isTimeout ? "NETWORK_ERROR" : "PROFILE_FETCH_ERROR",
            message: isTimeout
              ? "Profile loading timed out. Please check your connection and try again."
              : "Failed to load user profile. Please try again.",
            details: profileFetchErr instanceof Error ? profileFetchErr.message : String(profileFetchErr)
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

      // Step 3: Fetch user roles using raw fetch
      let roles: UserRole[] = []
      console.log("AuthProvider: Fetching roles for user:", user.id)

      if (supabaseUrl && supabaseKey) {
        try {
          const rolesStart = Date.now()

          // Add timeout to roles fetch to prevent hanging
          const rolesController = new AbortController()
          const rolesTimeoutId = setTimeout(() => rolesController.abort(), 10000)

          const rolesResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_roles?select=role&user_id=eq.${user.id}`,
            { headers: authHeaders, signal: rolesController.signal }
          )

          clearTimeout(rolesTimeoutId)

          console.log("AuthProvider: Roles fetch response:", {
            status: rolesResponse.status,
            time: Date.now() - rolesStart + 'ms'
          })

          if (rolesResponse.ok) {
            const rolesData = await rolesResponse.json()
            if (rolesData && rolesData.length > 0) {
              roles = rolesData.map((r: { role: string }) => r.role as UserRole)
              console.log("AuthProvider: User roles found:", roles)
            } else {
              console.warn("AuthProvider: No roles found for user - will use default behavior")
            }
          } else {
            console.warn("AuthProvider: Roles fetch failed with status:", rolesResponse.status)
          }
        } catch (rolesFetchErr) {
          const isTimeout = rolesFetchErr instanceof Error && rolesFetchErr.name === 'AbortError'
          console.error("AuthProvider: Roles fetch error:", isTimeout ? "Timeout" : rolesFetchErr)
        }
      }

      // Step 4: Fetch organization if user has org_id using raw fetch
      let organization: UserOrganization | null = null

      if (profile?.org_id && supabaseUrl && supabaseKey) {
        console.log("AuthProvider: Fetching organization:", profile.org_id)
        try {
          const orgStart = Date.now()

          // Add timeout to org fetch to prevent hanging
          const orgController = new AbortController()
          const orgTimeoutId = setTimeout(() => orgController.abort(), 10000)

          const orgResponse = await fetch(
            `${supabaseUrl}/rest/v1/organizations?select=id,name,name_ar,slug,logo_url,primary_color,secondary_color&id=eq.${profile.org_id}`,
            { headers: authHeaders, signal: orgController.signal }
          )

          clearTimeout(orgTimeoutId)

          console.log("AuthProvider: Org fetch response:", {
            status: orgResponse.status,
            time: Date.now() - orgStart + 'ms'
          })

          if (orgResponse.ok) {
            const orgData = await orgResponse.json()
            if (orgData && orgData.length > 0) {
              organization = orgData[0] as UserOrganization
              console.log("AuthProvider: Organization loaded:", organization.name)
            } else {
              console.log("AuthProvider: No organization found for id:", profile.org_id)
            }
          } else {
            console.warn("AuthProvider: Org fetch failed with status:", orgResponse.status)
          }
        } catch (orgFetchError) {
          const isTimeout = orgFetchError instanceof Error && orgFetchError.name === 'AbortError'
          console.error("AuthProvider: Org fetch error:", isTimeout ? "Timeout" : orgFetchError)
        }
      } else if (!profile?.org_id) {
        console.log("AuthProvider: No org_id in profile, skipping org fetch")
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

      // Sign out with timeout (don't wait too long)
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

    // CRITICAL: Full cleanup - clear ALL storage and reset Supabase client singleton
    // This ensures next login starts with completely fresh state
    try {
      fullCleanup()
      sessionStorage.removeItem(AUTH_USER_KEY)
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
              isOrgAdmin: false,
              isSuperAdmin: false,
              needsOnboarding: false,
            })
          }
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
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
