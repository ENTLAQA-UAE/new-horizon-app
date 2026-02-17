"use client"

import { I18nProvider } from "@/lib/i18n"

/**
 * Auth Layout - Wraps all auth pages with I18nProvider
 * for language switching and RTL support on login, signup,
 * forgot-password, and reset-password pages.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <I18nProvider>
      {children}
    </I18nProvider>
  )
}
