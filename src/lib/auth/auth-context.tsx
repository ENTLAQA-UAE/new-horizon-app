"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

export type UserRole = "super_admin" | "org_admin" | "hr_manager" | "recruiter" | "hiring_manager" | "interviewer"

interface AuthUser {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  orgId: string | null
  role: UserRole
  roles: string[]
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  refreshUser: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
  redirectToLoginOnUnauthenticated?: boolean
}

export function AuthProvider({ children, redirectToLoginOnUnauthenticated = true }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    try {
      setError(null)
      console.log("AuthProvider: Fetching user from server...")

      // Call our server-side API to get verified user
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include", // Important: include cookies
        cache: "no-store", // Don't cache this request
      })

      const data = await response.json()
      console.log("AuthProvider: Server response:", data)

      if (response.status === 401 || !data.user) {
        console.log("AuthProvider: Not authenticated")
        setUser(null)
        if (redirectToLoginOnUnauthenticated && typeof window !== "undefined") {
          window.location.href = "/login"
        }
        return
      }

      if (data.error) {
        console.error("AuthProvider: Error from server:", data.error)
        setError(data.error)
        setUser(null)
        return
      }

      console.log("AuthProvider: User loaded:", data.user.id, data.user.role)
      setUser(data.user)
    } catch (err) {
      console.error("AuthProvider: Fetch error:", err)
      setError("Failed to verify authentication")
      // On error, still try to show page
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [redirectToLoginOnUnauthenticated])

  const signOut = useCallback(async () => {
    try {
      const supabase = createClient()

      // Clear all storage
      try {
        // Clear localStorage
        const localKeysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes("supabase") || key.includes("sb-"))) {
            localKeysToRemove.push(key)
          }
        }
        localKeysToRemove.forEach(key => localStorage.removeItem(key))

        // Clear sessionStorage
        const sessionKeysToRemove: string[] = []
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (key) {
            sessionKeysToRemove.push(key)
          }
        }
        sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key))
      } catch (e) {
        console.warn("Storage clear error:", e)
      }

      // Sign out from Supabase
      await supabase.auth.signOut({ scope: "global" }).catch(() => {})

      // Clear user state
      setUser(null)

      // Full page reload to clear all state
      window.location.href = "/login"
    } catch (err) {
      console.error("Sign out error:", err)
      // Force redirect anyway
      window.location.href = "/login"
    }
  }, [])

  useEffect(() => {
    fetchUser()

    // Listen for auth state changes from Supabase
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        console.log("AuthProvider: Auth event:", event)
        if (event === "SIGNED_OUT") {
          setUser(null)
          if (redirectToLoginOnUnauthenticated) {
            window.location.href = "/login"
          }
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          // Re-fetch user when auth changes
          fetchUser()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUser, redirectToLoginOnUnauthenticated])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        refreshUser: fetchUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
