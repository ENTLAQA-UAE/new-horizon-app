"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

export interface BrandingConfig {
  orgId: string | null
  orgName: string
  orgNameAr: string | null
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  isLoaded: boolean
}

const defaultBranding: BrandingConfig = {
  orgId: null,
  orgName: "Jadarat",
  orgNameAr: "جدارات",
  logoUrl: null,
  primaryColor: "#6366f1", // Modern indigo
  secondaryColor: "#8b5cf6", // Purple
  accentColor: "#06b6d4", // Cyan
  isLoaded: false,
}

const BrandingContext = createContext<BrandingConfig>(defaultBranding)

export function useBranding() {
  return useContext(BrandingContext)
}

interface BrandingProviderProps {
  children: ReactNode
}

export function BrandingProvider({ children }: BrandingProviderProps) {
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding)

  useEffect(() => {
    async function loadBranding() {
      const supabase = createClient()

      try {
        // Use getSession (cached) instead of getUser (network request) to avoid hanging
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          setBranding({ ...defaultBranding, isLoaded: true })
          return
        }

        const user = session.user

        // Get user's profile to find org_id with timeout
        const profilePromise = supabase
          .from("profiles")
          .select("org_id")
          .eq("id", user.id)
          .single()

        const timeoutPromise = new Promise<{ data: null }>((resolve) =>
          setTimeout(() => resolve({ data: null }), 5000)
        )

        const { data: profile } = await Promise.race([profilePromise, timeoutPromise])

        if (!profile?.org_id) {
          setBranding({ ...defaultBranding, isLoaded: true })
          return
        }

        // Get organization branding
        const { data: org } = await supabase
          .from("organizations")
          .select("id, name, name_ar, logo_url, primary_color, secondary_color")
          .eq("id", profile.org_id)
          .single()

        if (org) {
          const newBranding: BrandingConfig = {
            orgId: org.id,
            orgName: org.name || "Jadarat",
            orgNameAr: org.name_ar || "جدارات",
            logoUrl: org.logo_url,
            primaryColor: org.primary_color || "#6366f1",
            secondaryColor: org.secondary_color || "#8b5cf6",
            accentColor: "#06b6d4",
            isLoaded: true,
          }
          setBranding(newBranding)
          applyBrandingToDOM(newBranding)
        } else {
          setBranding({ ...defaultBranding, isLoaded: true })
        }
      } catch (error) {
        console.error("Error loading branding:", error)
        setBranding({ ...defaultBranding, isLoaded: true })
      }
    }

    loadBranding()
  }, [])

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  )
}

// Apply branding colors as CSS variables
function applyBrandingToDOM(branding: BrandingConfig) {
  const root = document.documentElement

  // Convert hex to HSL for better color manipulation
  const primaryHSL = hexToHSL(branding.primaryColor)
  const secondaryHSL = hexToHSL(branding.secondaryColor)

  // Set CSS custom properties
  root.style.setProperty("--brand-primary", branding.primaryColor)
  root.style.setProperty("--brand-secondary", branding.secondaryColor)
  root.style.setProperty("--brand-accent", branding.accentColor)

  // Set HSL values for Tailwind
  if (primaryHSL) {
    root.style.setProperty("--primary", `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`)
    root.style.setProperty("--primary-foreground", primaryHSL.l > 50 ? "0 0% 0%" : "0 0% 100%")
  }

  // Create gradient variations
  root.style.setProperty("--brand-gradient", `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.secondaryColor} 100%)`)
  root.style.setProperty("--brand-gradient-subtle", `linear-gradient(135deg, ${branding.primaryColor}15 0%, ${branding.secondaryColor}15 100%)`)
}

// Helper to convert hex to HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } | null {
  try {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return null

    let r = parseInt(result[1], 16) / 255
    let g = parseInt(result[2], 16) / 255
    let b = parseInt(result[3], 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6
          break
        case g:
          h = ((b - r) / d + 2) / 6
          break
        case b:
          h = ((r - g) / d + 4) / 6
          break
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    }
  } catch {
    return null
  }
}

export { applyBrandingToDOM }
