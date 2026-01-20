"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { I18nProvider } from "@/lib/i18n"
import { BrandingProvider } from "@/lib/branding/branding-context"
import { AuthProvider, useAuth } from "@/lib/auth/auth-context"
import { Loader2, Sparkles } from "lucide-react"
import { useState } from "react"

/**
 * Inner layout component that uses the auth context
 */
function OrgLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, isLoading } = useAuth()

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

  // Map the role from auth context to sidebar role type
  const userRole = user?.role || "recruiter"

  return (
    <BrandingProvider>
      <I18nProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar
            collapsed={sidebarCollapsed}
            onCollapse={setSidebarCollapsed}
            userRole={userRole}
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

/**
 * Org Layout - For Organization routes
 * Uses AuthProvider for reliable server-verified authentication
 */
export default function OrgLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider redirectToLoginOnUnauthenticated={true}>
      <OrgLayoutInner>{children}</OrgLayoutInner>
    </AuthProvider>
  )
}
