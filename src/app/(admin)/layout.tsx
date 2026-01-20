"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { I18nProvider } from "@/lib/i18n"
import { AuthProvider, useAuth } from "@/lib/auth/auth-context"
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
 * Inner layout component that uses the auth context
 */
function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Apply default Jadarat branding on mount
  useEffect(() => {
    applyDefaultBranding()
  }, [])

  // Redirect non-super-admins to org routes
  useEffect(() => {
    if (!isLoading && user && user.role !== "super_admin") {
      console.log("AdminLayout: User is not super_admin, redirecting to org")
      router.push("/org")
    }
  }, [isLoading, user, router])

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

  // Don't render if not super_admin (will redirect)
  if (user?.role !== "super_admin") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
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

/**
 * Admin Layout - For Super Admin routes only
 * Uses AuthProvider for reliable server-verified authentication
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider redirectToLoginOnUnauthenticated={true}>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthProvider>
  )
}
