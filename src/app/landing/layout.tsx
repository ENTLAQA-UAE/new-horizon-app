export const metadata = {
  title: "Kawadir - AI-Powered Recruitment Platform",
  description:
    "Transform your hiring process with Kawadir's intelligent ATS. AI-powered resume screening, smart candidate matching, and collaborative hiring tools built for the MENA region.",
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Load Poppins (EN) and IBM Plex Sans Arabic (AR) from Google Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
      />
      {children}
    </>
  )
}
