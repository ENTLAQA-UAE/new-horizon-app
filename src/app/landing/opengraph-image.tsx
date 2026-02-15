import { ImageResponse } from "next/og"

export const runtime = "edge"

export const alt = "Kawadir - AI-Powered Recruitment Platform"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2D4CFF 0%, #1E3ACC 50%, #2D4CFF 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-50px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-30px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(124,77,255,0.15)",
          }}
        />

        {/* Logo icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80px",
            height: "80px",
            borderRadius: "20px",
            background: "rgba(255,255,255,0.15)",
            marginBottom: "24px",
          }}
        >
          <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
            <path d="M16 6L6 11.5L16 17L26 11.5L16 6Z" fill="white" fillOpacity="0.95" />
            <path
              d="M6 20.5L16 26L26 20.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
            <path
              d="M6 16L16 21.5L26 16"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
          </svg>
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "white",
            letterSpacing: "-1px",
            marginBottom: "8px",
          }}
        >
          Kawadir
        </div>

        {/* Arabic name */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 600,
            color: "rgba(255,255,255,0.7)",
            marginBottom: "32px",
          }}
        >
          كوادر
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: "rgba(255,255,255,0.85)",
            maxWidth: "700px",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          AI-Powered Recruitment Platform
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.5)",
            marginTop: "12px",
          }}
        >
          Built for the MENA Region
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
