"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useAuth } from "@/lib/auth"

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
  orgName: "Kawadir",
  orgNameAr: "كوادر",
  logoUrl: null,
  primaryColor: "#2563EB",
  secondaryColor: "#3B82F6",
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

/**
 * BrandingProvider - Now uses AuthProvider data instead of fetching independently
 * This eliminates duplicate API calls and race conditions
 */
export function BrandingProvider({ children }: BrandingProviderProps) {
  const { isLoading: authLoading, organization, isAuthenticated } = useAuth()
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding)

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return
    }

    // Not authenticated - use default branding
    if (!isAuthenticated) {
      setBranding({ ...defaultBranding, isLoaded: true })
      return
    }

    // No organization - use default branding
    if (!organization) {
      console.log("BrandingProvider: No organization, using default branding")
      setBranding({ ...defaultBranding, isLoaded: true })
      return
    }

    // Build branding from organization data
    const newBranding: BrandingConfig = {
      orgId: organization.id,
      orgName: organization.name || "Kawadir",
      orgNameAr: organization.name_ar || "كوادر",
      logoUrl: organization.logo_url,
      primaryColor: organization.primary_color || "#2563EB",
      secondaryColor: organization.secondary_color || "#3B82F6",
      accentColor: "#06b6d4",
      isLoaded: true,
    }

    setBranding(newBranding)
    applyBrandingToDOM(newBranding)
    console.log("BrandingProvider: Branding loaded from AuthProvider:", organization.name)
  }, [authLoading, isAuthenticated, organization])

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  )
}

// Apply branding colors as CSS variables
function applyBrandingToDOM(branding: BrandingConfig) {
  const root = document.documentElement

  // Set brand CSS custom properties (hex format for direct use)
  root.style.setProperty("--brand-primary", branding.primaryColor)
  root.style.setProperty("--brand-secondary", branding.secondaryColor)
  root.style.setProperty("--brand-accent", branding.accentColor)

  // Set --primary and --primary-foreground in hex format
  // Tailwind v4 uses var(--primary) directly as a CSS color value,
  // so it must be a valid color (hex), not raw HSL numbers.
  root.style.setProperty("--primary", branding.primaryColor)
  const primaryHSL = hexToHSL(branding.primaryColor)
  root.style.setProperty("--primary-foreground", primaryHSL && primaryHSL.l > 50 ? "#000000" : "#ffffff")

  // Also set the ring color to match primary
  root.style.setProperty("--ring", branding.primaryColor)

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
