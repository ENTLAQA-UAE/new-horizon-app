"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { setSentryUser } from "@/lib/sentry"

interface SentryUserProviderProps {
  children: React.ReactNode
}

/**
 * Provider that automatically sets Sentry user context
 * when the user's authentication state changes.
 *
 * Uses maybeSingle() instead of single() to avoid 400 errors
 * when profile or role doesn't exist.
 */
export function SentryUserProvider({ children }: SentryUserProviderProps) {
  useEffect(() => {
    const supabase = createClient()

    // Get initial user
    const initUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
          setSentryUser(null)
          return
        }

        // Get user profile with org info - use maybeSingle to avoid 400 errors
        const { data: profile } = await supabase
          .from("profiles")
          .select("org_id, first_name, last_name, organizations(name)")
          .eq("id", user.id)
          .maybeSingle()

        // Get user role - use maybeSingle to avoid 400 errors
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle()

        setSentryUser({
          id: user.id,
          email: user.email,
          username: profile ? `${profile.first_name} ${profile.last_name}` : undefined,
          orgId: profile?.org_id || undefined,
          orgName: (profile?.organizations as { name: string })?.name || undefined,
          role: userRole?.role || undefined,
        })
      } catch (error) {
        console.error("SentryUserProvider: Error initializing user:", error)
        setSentryUser(null)
      }
    }

    initUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          try {
            // Get user profile with org info - use maybeSingle to avoid 400 errors
            const { data: profile } = await supabase
              .from("profiles")
              .select("org_id, first_name, last_name, organizations(name)")
              .eq("id", session.user.id)
              .maybeSingle()

            // Get user role - use maybeSingle to avoid 400 errors
            const { data: userRole } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .maybeSingle()

            setSentryUser({
              id: session.user.id,
              email: session.user.email,
              username: profile ? `${profile.first_name} ${profile.last_name}` : undefined,
              orgId: profile?.org_id || undefined,
              orgName: (profile?.organizations as { name: string })?.name || undefined,
              role: userRole?.role || undefined,
            })
          } catch (error) {
            console.error("SentryUserProvider: Error setting user:", error)
          }
        } else if (event === "SIGNED_OUT") {
          setSentryUser(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <>{children}</>
}
