"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { setSentryUser } from "@/lib/sentry"

interface SentryUserProviderProps {
  children: React.ReactNode
}

/**
 * Provider that automatically sets Sentry user context
 * when the user's authentication state changes
 */
export function SentryUserProvider({ children }: SentryUserProviderProps) {
  useEffect(() => {
    const supabase = createClient()

    // Get initial user
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Get user profile with org info
        const { data: profile } = await supabase
          .from("profiles")
          .select("org_id, first_name, last_name, organizations(name)")
          .eq("id", user.id)
          .single()

        // Get user role
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single()

        setSentryUser({
          id: user.id,
          email: user.email,
          username: profile ? `${profile.first_name} ${profile.last_name}` : undefined,
          orgId: profile?.org_id || undefined,
          orgName: (profile?.organizations as { name: string })?.name || undefined,
          role: userRole?.role || undefined,
        })
      } else {
        setSentryUser(null)
      }
    }

    initUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          // Get user profile with org info
          const { data: profile } = await supabase
            .from("profiles")
            .select("org_id, first_name, last_name, organizations(name)")
            .eq("id", session.user.id)
            .single()

          // Get user role
          const { data: userRole } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .single()

          setSentryUser({
            id: session.user.id,
            email: session.user.email,
            username: profile ? `${profile.first_name} ${profile.last_name}` : undefined,
            orgId: profile?.org_id || undefined,
            orgName: (profile?.organizations as { name: string })?.name || undefined,
            role: userRole?.role || undefined,
          })
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
