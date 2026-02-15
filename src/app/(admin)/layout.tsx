"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { I18nProvider } from "@/lib/i18n"
import { AuthProvider, useAuth, UserRole } from "@/lib/auth"
import { AuthErrorDisplay } from "@/components/auth/auth-error"
import { Loader2 } from "lucide-react"

// Apply default Kawadir branding CSS variables
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
 * Uses centralized AuthProvider for auth state management
 * No BrandingProvider since super admins see platform branding (Kawadir)
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  )
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const {
    isLoading,
    isAuthenticated,
    error,
    isSuperAdmin,
    refreshAuth,
  } = useAuth()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Apply default Kawadir branding on mount
  useEffect(() => {
    applyDefaultBranding()
  }, [])

  // Handle redirects based on auth state
  useEffect(() => {
    if (isLoading) return

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      console.log("AdminLayout: Not authenticated, redirecting to login")
      router.push("/login")
      return
    }

    // Not a super admin - redirect to org
    if (!isSuperAdmin) {
      console.log("AdminLayout: User is not super admin, redirecting to org")
      router.push("/org")
      return
    }
  }, [isLoading, isAuthenticated, isSuperAdmin, router])

  // Show loading state
  if (isLoading) {
    return <AdminLoadingScreen />
  }

  // Show error state with retry option
  if (error) {
    return <AuthErrorDisplay error={error} onRetry={refreshAuth} />
  }

  // Not authenticated (will redirect via useEffect)
  if (!isAuthenticated) {
    return <AdminLoadingScreen />
  }

  // Not super admin (will redirect via useEffect)
  if (!isSuperAdmin) {
    return <AdminLoadingScreen />
  }

  return (
    <I18nProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
          userRole="super_admin"
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

function AdminLoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <img
          src="/kawadir.svg"
          alt="Kawadir"
          className="h-16 object-contain animate-pulse"
        />
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </div>
  )
}
