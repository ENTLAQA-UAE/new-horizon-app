import type { Metadata } from "next"
import { Toaster } from "sonner"
import { SentryUserProvider } from "@/components/sentry-user-provider"
import { ThemeProvider } from "@/lib/theme/theme-context"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Kawadir ATS",
    template: "%s | Kawadir ATS",
  },
  description: "AI-Powered Applicant Tracking System for MENA Region",
  keywords: ["ATS", "Recruitment", "HR", "MENA", "Saudi Arabia", "UAE", "Hiring"],
  icons: {
    icon: "/kawadir.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background font-sans">
        <ThemeProvider>
          <SentryUserProvider>
            {children}
          </SentryUserProvider>
        </ThemeProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
