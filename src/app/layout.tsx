import type { Metadata } from "next"
import { Toaster } from "sonner"
import { SentryUserProvider } from "@/components/sentry-user-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Jadarat ATS",
    template: "%s | Jadarat ATS",
  },
  description: "AI-Powered Applicant Tracking System for MENA Region",
  keywords: ["ATS", "Recruitment", "HR", "MENA", "Saudi Arabia", "UAE", "Hiring"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background font-sans">
        <SentryUserProvider>
          {children}
        </SentryUserProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
