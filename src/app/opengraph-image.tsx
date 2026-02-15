import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Kawadir - AI-Powered Recruitment Platform"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0A1340 0%, #1E3ACC 50%, #2D4CFF 100%)",
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
            background: "rgba(107, 127, 255, 0.2)",
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-30px",
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background: "rgba(124, 77, 255, 0.15)",
            filter: "blur(80px)",
          }}
        />

        {/* Logo icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100px",
            height: "100px",
            borderRadius: "24px",
            background: "linear-gradient(135deg, #2D4CFF 0%, #6B7FFF 100%)",
            boxShadow: "0 20px 60px -10px rgba(45, 76, 255, 0.5)",
            marginBottom: "32px",
          }}
        >
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              fill="white"
              fillOpacity="0.95"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
            <path
              d="M2 12L12 17L22 12"
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
            fontSize: "72px",
            fontWeight: 800,
            color: "white",
            letterSpacing: "-2px",
            marginBottom: "16px",
          }}
        >
          Kawadir
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "28px",
            fontWeight: 500,
            color: "rgba(255, 255, 255, 0.7)",
            letterSpacing: "0.5px",
          }}
        >
          AI-Powered Recruitment Platform
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "32px",
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: "18px",
          }}
        >
          <span>Smart Screening</span>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
          <span>AI Matching</span>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
          <span>Built for MENA</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
