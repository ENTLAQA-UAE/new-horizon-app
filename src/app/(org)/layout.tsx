"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar, UserRole } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { I18nProvider } from "@/lib/i18n"
import { BrandingProvider } from "@/lib/branding/branding-context"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Sparkles } from "lucide-react"

/**
 * Org Layout - For Organization Admin routes
 * Includes BrandingProvider to apply organization-specific branding
 */
export default function OrgLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true
    const supabase = createClient()

    // Safety timeout - always show page after 8 seconds max
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn("Safety timeout triggered - showing page with default role")
        setUserRole("recruiter")
        setIsLoading(false)
      }
    }, 8000)

    async function fetchUserRole() {
      console.log("OrgLayout: Starting fetchUserRole...")

      try {
        // First try to get session (fast, cached) to check if we have any auth
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          console.log("OrgLayout: No session found, redirecting to login")
          if (isMounted) {
            router.push("/login")
          }
          return
        }

        // We have a session, use the session user directly for faster loading
        const user = session.user
        console.log("OrgLayout: Session user:", user.id)

        if (!user) {
          console.log("OrgLayout: No user in session, redirecting to login")
          if (isMounted) {
            router.push("/login")
          }
          return
        }

        // Get user's roles from user_roles table with timeout
        console.log("OrgLayout: Fetching roles for user:", user.id)
        const rolesPromise = supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)

        const rolesTimeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
          setTimeout(() => {
            console.warn("OrgLayout: roles query timed out")
            resolve({ data: null, error: new Error("Roles query timeout") })
          }, 5000)
        )

        const { data: roles, error: rolesError } = await Promise.race([rolesPromise, rolesTimeoutPromise])
        console.log("OrgLayout: Roles result:", { roles, error: rolesError?.message })

        if (!isMounted) return

        if (roles && roles.length > 0) {
          const roleList = roles.map(r => r.role)
          console.log("OrgLayout: User roles:", roleList)

          if (roleList.includes("super_admin")) {
            setUserRole("super_admin")
          } else if (roleList.includes("org_admin")) {
            setUserRole("org_admin")
          } else if (roleList.includes("hr_manager")) {
            setUserRole("hr_manager")
          } else if (roleList.includes("recruiter")) {
            setUserRole("recruiter")
          } else if (roleList.includes("hiring_manager")) {
            setUserRole("hiring_manager")
          } else if (roleList.includes("interviewer")) {
            setUserRole("interviewer")
          } else {
            setUserRole("recruiter")
          }
        } else {
          console.log("OrgLayout: No roles found, using default")
          setUserRole("recruiter")
        }

        console.log("OrgLayout: Setting isLoading to false")
        setIsLoading(false)
      } catch (error) {
        console.error("OrgLayout: Error in fetchUserRole:", error)
        if (isMounted) {
          setUserRole("recruiter")
          setIsLoading(false)
        }
      }
    }

    fetchUserRole()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        console.log("OrgLayout: Auth event:", event)
        if (event === "SIGNED_OUT") {
          router.push("/login")
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          fetchUserRole()
        }
      }
    )

    return () => {
      isMounted = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg animate-pulse"
            style={{ background: "var(--brand-gradient, linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%))" }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <BrandingProvider>
      <I18nProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar
            collapsed={sidebarCollapsed}
            onCollapse={setSidebarCollapsed}
            userRole={userRole || undefined}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
              <div className="animate-fade-in-up">
                {children}
              </div>
            </main>
          </div>
        </div>
      </I18nProvider>
    </BrandingProvider>
  )
}
