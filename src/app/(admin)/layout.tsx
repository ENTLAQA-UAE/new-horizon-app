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

    async function fetchUserRole() {
      const supabase = createClient()

      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Auth timeout")), 10000)
        )

        // Get current user with timeout
        const authPromise = supabase.auth.getUser()
        const { data: { user } } = await Promise.race([authPromise, timeoutPromise]) as Awaited<typeof authPromise>

        if (!user) {
          if (isMounted) {
            router.push("/login")
          }
          return
        }

        // Get user's roles from user_roles table
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)

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
        console.error("Error fetching user role:", error)
        if (isMounted) {
          // On timeout or error, redirect to login
          router.push("/login")
        }
      }
    }

    fetchUserRole()

    return () => {
      isMounted = false
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
