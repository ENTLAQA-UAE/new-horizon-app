"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Sidebar, UserRole } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { I18nProvider } from "@/lib/i18n"
import { BrandingProvider } from "@/lib/branding/branding-context"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Sparkles } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
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
          router.push("/login")
          return
        }

        // Get user's roles from user_roles table
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)

        if (roles && roles.length > 0) {
          // Prioritize roles: super_admin > org_admin > others
          const roleList = roles.map(r => r.role)

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
            setUserRole("recruiter") // Default
          }
        } else {
          // No roles assigned, default to recruiter
          setUserRole("recruiter")
        }
      } catch (error) {
        console.error("Error fetching user role:", error)
        // On timeout or error, redirect to login
        router.push("/login")
        return
      }

      setIsLoading(false)
    }

    fetchUserRole()
  }, [router])

  // Redirect based on role and current path
  useEffect(() => {
    if (isLoading || !userRole) return

    const isSuperAdminRoute = pathname === "/" ||
      pathname.startsWith("/organizations") ||
      pathname.startsWith("/users") ||
      pathname.startsWith("/tiers") ||
      pathname.startsWith("/billing") ||
      pathname.startsWith("/email-templates") ||
      pathname.startsWith("/audit-logs") ||
      pathname.startsWith("/settings")

    const isOrgRoute = pathname.startsWith("/org")

    // Super admin trying to access org routes is OK (for testing)
    // But org users should NOT access super admin routes
    if (userRole !== "super_admin" && isSuperAdminRoute && !isOrgRoute) {
      router.push("/org")
    }
  }, [userRole, pathname, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg animate-pulse"
            style={{ background: "var(--brand-gradient)" }}
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
