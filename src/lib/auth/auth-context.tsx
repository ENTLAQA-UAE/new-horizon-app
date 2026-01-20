"use client"

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
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

  // Main auth loading function
  const loadAuth = useCallback(async () => {
    // Prevent concurrent loads
    if (loadingRef.current) {
      console.log("AuthProvider: Load already in progress, skipping")
      return
    }

    loadingRef.current = true
    console.log("AuthProvider: Starting auth load...")

    const supabase = createClient()

    try {
      // Step 1: Get session first (fast, cached) then try to validate with getUser()
      // getUser() can timeout in some environments, so we use getSession() as primary
      // and getUser() as optional validation with timeout
      const { data: { session } } = await supabase.auth.getSession()

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

      // We have a session - use session.user initially
      let user = session.user
      console.log("AuthProvider: Session found for user:", user.id)

      // Try to validate with getUser() but with a timeout
      // This ensures RLS works correctly but doesn't block forever
      try {
        const getUserPromise = supabase.auth.getUser()
        const timeoutPromise = new Promise<{ data: { user: null }, error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error("getUser timeout")), 5000)
        )

        const { data: userData, error: userError } = await Promise.race([
          getUserPromise,
          timeoutPromise
        ])

        if (userError) {
          console.warn("AuthProvider: getUser() validation failed:", userError.message)
          // Session might be invalid - clear and redirect to login
          if (userError.message.includes("invalid") || userError.message.includes("expired")) {
            try { sessionStorage.removeItem(AUTH_USER_KEY) } catch {}
            if (mountedRef.current) {
              setState(prev => ({
                ...prev,
                isLoading: false,
                isAuthenticated: false,
                error: {
                  code: "SESSION_EXPIRED",
                  message: "Your session has expired. Please log in again.",
                  details: userError.message
                }
              }))
            }
            loadingRef.current = false
            return
          }
          // For other errors, continue with session user
          console.log("AuthProvider: Continuing with session user despite getUser error")
        } else if (userData?.user) {
          // Use validated user from getUser()
          user = userData.user
          console.log("AuthProvider: User validated with getUser()")
        }
      } catch (timeoutError) {
        // getUser() timed out - continue with session user
        console.warn("AuthProvider: getUser() timed out, using session user")
      }

      console.log("AuthProvider: User validated:", user.id)

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

      // Step 2: Fetch profile (with retry logic)
      let profile: UserProfile | null = null
      let profileError: AuthError | null = null

      console.log("AuthProvider: Fetching profile for user:", user.id)
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, email, first_name, last_name, avatar_url, org_id")
            .eq("id", user.id)
            .maybeSingle()

          if (error) {
            console.warn(`AuthProvider: Profile fetch attempt ${attempt} failed:`, error.message, error.code, error.details)
            if (attempt < 3) {
              await new Promise(r => setTimeout(r, 300 * attempt))
            } else {
              profileError = {
                code: "PROFILE_FETCH_ERROR",
                message: "Unable to load your profile. Please try again.",
                details: error.message
              }
            }
          } else if (data) {
            profile = data as UserProfile
            console.log("AuthProvider: Profile loaded:", { id: profile.id, org_id: profile.org_id })
            break
          } else {
            // No profile found - this is a valid state for new users
            console.log("AuthProvider: No profile found for user")
            break
          }
        } catch (fetchError) {
          console.error(`AuthProvider: Profile fetch attempt ${attempt} threw:`, fetchError)
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 300 * attempt))
          }
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

      // Step 3: Fetch user roles
      let roles: UserRole[] = []
      console.log("AuthProvider: Fetching roles for user:", user.id)

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)

      console.log("AuthProvider: Roles query result:", {
        rolesData,
        rolesError: rolesError?.message,
        rolesCount: rolesData?.length
      })

      if (rolesError) {
        console.warn("AuthProvider: Roles fetch error:", rolesError.message, rolesError)
        // Don't fail completely - user might just need onboarding
      } else if (rolesData && rolesData.length > 0) {
        roles = rolesData.map(r => r.role as UserRole)
        console.log("AuthProvider: User roles found:", roles)
      } else {
        console.warn("AuthProvider: No roles found for user - will use default behavior")
      }

      // Step 4: Fetch organization if user has org_id
      let organization: UserOrganization | null = null

      if (profile?.org_id) {
        console.log("AuthProvider: Fetching organization:", profile.org_id)
        try {
          const { data: orgData, error: orgError } = await supabase
            .from("organizations")
            .select("id, name, name_ar, slug, logo_url, primary_color, secondary_color")
            .eq("id", profile.org_id)
            .maybeSingle()

          if (orgError) {
            console.warn("AuthProvider: Org fetch error:", orgError.message, orgError.code, orgError.details)
          } else if (orgData) {
            organization = orgData as UserOrganization
            console.log("AuthProvider: Organization loaded:", organization.name)
          } else {
            console.log("AuthProvider: No organization found for id:", profile.org_id)
          }
        } catch (orgFetchError) {
          console.error("AuthProvider: Org fetch threw:", orgFetchError)
        }
      } else {
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
    const supabase = createClient()

    try {
      // Clear storage first
      try {
        sessionStorage.removeItem(AUTH_USER_KEY)
        // Clear any other auth-related storage
        const keysToRemove = Object.keys(sessionStorage).filter(k =>
          k.startsWith("jadarat_") || k.startsWith("sb-")
        )
        keysToRemove.forEach(k => sessionStorage.removeItem(k))

        const localKeysToRemove = Object.keys(localStorage).filter(k =>
          k.startsWith("sb-")
        )
        localKeysToRemove.forEach(k => localStorage.removeItem(k))
      } catch {}

      // Sign out with timeout
      const signOutPromise = supabase.auth.signOut({ scope: 'global' })
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Sign out timeout")), 3000)
      )

      await Promise.race([signOutPromise, timeoutPromise]).catch(() => {})
    } catch (error) {
      console.error("AuthProvider: Sign out error:", error)
    }

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
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          // Reload auth data on sign in or token refresh
          // Don't force reset loadingRef - let the current load complete first
          // This prevents race conditions with multiple concurrent loads
          console.log("AuthProvider: Auth event triggering reload, loadingRef:", loadingRef.current)
          if (!loadingRef.current) {
            await loadAuth()
          } else {
            console.log("AuthProvider: Skipping reload - load already in progress")
          }
        }
      }
    )

    return () => {
      mountedRef.current = false
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
