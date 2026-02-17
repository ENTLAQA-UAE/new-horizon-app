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
    icon: "/new-favicon-final.PNG",
    apple: "/new-favicon-final.PNG",
  },
  openGraph: {
    title: "Kawadir - AI-Powered Recruitment Platform",
    description: "Transform your hiring process with Kawadir's intelligent ATS. AI-powered resume screening, smart candidate matching, and collaborative hiring tools built for the MENA region.",
    type: "website",
    siteName: "Kawadir",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kawadir - AI-Powered Recruitment Platform",
    description: "Transform your hiring process with Kawadir's intelligent ATS. AI-powered resume screening, smart candidate matching, and collaborative hiring tools built for the MENA region.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Load Poppins (English) and IBM Plex Sans Arabic (Arabic) */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700;800&display=swap"
        />
      </head>
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
