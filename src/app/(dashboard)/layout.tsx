"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Sidebar, UserRole } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { I18nProvider } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

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

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

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
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <I18nProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
          userRole={userRole || undefined}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
            {children}
          </main>
        </div>
      </div>
    </I18nProvider>
  )
}
