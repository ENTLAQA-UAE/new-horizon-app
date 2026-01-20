"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { I18nProvider } from "@/lib/i18n"
import { BrandingProvider } from "@/lib/branding/branding-context"
import { AuthProvider, useAuth, UserRole } from "@/lib/auth"
import { AuthErrorDisplay } from "@/components/auth/auth-error"
import { Loader2, Sparkles } from "lucide-react"
import { useState, useEffect } from "react"

/**
 * Org Layout - For Organization Admin routes
 * Uses centralized AuthProvider for all auth state management
 */
export default function OrgLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <OrgLayoutContent>{children}</OrgLayoutContent>
    </AuthProvider>
  )
}

function OrgLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const {
    isLoading,
    isAuthenticated,
    error,
    primaryRole,
    needsOnboarding,
    refreshAuth,
  } = useAuth()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Handle redirects based on auth state
  useEffect(() => {
    if (isLoading) return

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      console.log("OrgLayout: Not authenticated, redirecting to login")
      router.push("/login")
      return
    }

    // Needs onboarding - redirect to onboarding
    if (needsOnboarding) {
      console.log("OrgLayout: User needs onboarding, redirecting")
      router.push("/onboarding")
      return
    }
  }, [isLoading, isAuthenticated, needsOnboarding, router])

  // Show loading state
  if (isLoading) {
    return <OrgLoadingScreen />
  }

  // Show error state with retry option
  if (error) {
    return <AuthErrorDisplay error={error} onRetry={refreshAuth} />
  }

  // Not authenticated (will redirect via useEffect)
  if (!isAuthenticated) {
    return <OrgLoadingScreen />
  }

  // Needs onboarding (will redirect via useEffect)
  if (needsOnboarding) {
    return <OrgLoadingScreen />
  }

  // Convert primaryRole to sidebar UserRole type
  const sidebarRole = primaryRole as UserRole | undefined

  return (
    <BrandingProvider>
      <I18nProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar
            collapsed={sidebarCollapsed}
            onCollapse={setSidebarCollapsed}
            userRole={sidebarRole}
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

function OrgLoadingScreen() {
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
