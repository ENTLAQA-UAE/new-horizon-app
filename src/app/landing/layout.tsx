import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kawadir - AI-Powered Recruitment Platform",
  description:
    "Transform your hiring process with Kawadir's intelligent ATS. AI-powered resume screening, smart candidate matching, and collaborative hiring tools built for the MENA region.",
  openGraph: {
    title: "Kawadir - AI-Powered Recruitment Platform",
    description:
      "Transform your hiring process with Kawadir's intelligent ATS. AI-powered resume screening, smart candidate matching, and collaborative hiring tools built for the MENA region.",
    type: "website",
    siteName: "Kawadir",
    locale: "en_US",
    alternateLocale: "ar_AE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kawadir - AI-Powered Recruitment Platform",
    description:
      "Transform your hiring process with Kawadir's intelligent ATS. AI-powered resume screening, smart candidate matching, and collaborative hiring tools built for the MENA region.",
  },
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
