"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar, UserRole } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { I18nProvider } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Sparkles } from "lucide-react"

// Apply default Jadarat branding CSS variables
function applyDefaultBranding() {
  if (typeof document !== "undefined") {
    const root = document.documentElement
    root.style.setProperty("--brand-primary", "#6366f1")
    root.style.setProperty("--brand-secondary", "#8b5cf6")
    root.style.setProperty("--brand-accent", "#06b6d4")
    root.style.setProperty("--brand-gradient", "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)")
    root.style.setProperty("--brand-gradient-subtle", "linear-gradient(135deg, #6366f115 0%, #8b5cf615 100%)")
  }
}

/**
 * Admin Layout - For Super Admin routes only
 * No BrandingProvider since super admins see platform branding (Jadarat)
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Apply default Jadarat branding on mount
  useEffect(() => {
    applyDefaultBranding()
  }, [])

  useEffect(() => {
    let isMounted = true
    const supabase = createClient()

    async function fetchUserRole() {
      try {
        // ALWAYS use getUser() to verify with the server - never use cached getSession()
        // This prevents showing wrong user's data after page refresh
        // Add timeout to prevent hanging
        console.log("AdminLayout: Calling getUser()...")

        const getUserPromise = supabase.auth.getUser()
        const getUserTimeoutPromise = new Promise<{ data: { user: null }, error: Error }>((resolve) =>
          setTimeout(() => {
            console.warn("AdminLayout: getUser() timed out after 5 seconds")
            resolve({ data: { user: null }, error: new Error("getUser timeout") })
          }, 5000)
        )

        const { data: { user }, error: authError } = await Promise.race([getUserPromise, getUserTimeoutPromise])
        console.log("AdminLayout: getUser result:", { userId: user?.id, error: authError?.message })

        if (authError || !user) {
          if (isMounted) {
            router.push("/login")
          }
          return
        }

        // Get user's roles from user_roles table with timeout
        const rolesPromise = supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)

        const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: new Error("Roles query timeout") }), 5000)
        )

        const { data: roles } = await Promise.race([rolesPromise, timeoutPromise])

        if (!isMounted) return

        if (roles && roles.length > 0) {
          // Prioritize roles: super_admin > org_admin > others
          const roleList = roles.map(r => r.role)

          if (roleList.includes("super_admin")) {
            setUserRole("super_admin")
            setIsLoading(false)
          } else {
            // Non-super admin users should be redirected to org routes
            router.push("/org")
            return
          }
        } else {
          // No roles assigned, redirect to org
          router.push("/org")
          return
        }
      } catch (error) {
        // Silently handle errors - redirect to login
        if (isMounted) {
          router.push("/login")
        }
      }
    }

    fetchUserRole()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_OUT") {
          router.push("/login")
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          // Re-fetch user role when auth changes
          fetchUserRole()
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router])

  if (isLoading) {
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
        </div>
      </div>
    )
  }

  return (
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
  )
}
