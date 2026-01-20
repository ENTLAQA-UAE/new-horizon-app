"use client"

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react"
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

// Track user ID across page loads to detect user switches
const USER_ID_KEY = "jadarat_current_user_id"

export function BrandingProvider({ children }: BrandingProviderProps) {
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding)
  const loadingRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()

    async function loadBranding() {
      // Prevent concurrent loads
      if (loadingRef.current) return
      loadingRef.current = true

      try {
        // Use getSession for fast initial check
        const { data: { session } } = await supabase.auth.getSession()
        console.log("Branding: Session check:", { userId: session?.user?.id })

        if (!session?.user) {
          // Clear stored user ID when not authenticated
          try { sessionStorage.removeItem(USER_ID_KEY) } catch {}
          setBranding({ ...defaultBranding, isLoaded: true })
          loadingRef.current = false
          return
        }

        const user = session.user

        // Check if user ID changed from what we had before
        try {
          const storedUserId = sessionStorage.getItem(USER_ID_KEY)
          if (storedUserId && storedUserId !== user.id) {
            console.warn("User changed! Clearing state and reloading...", {
              stored: storedUserId,
              current: user.id,
            })
            // Different user detected - clear everything and reload
            sessionStorage.setItem(USER_ID_KEY, user.id)
            window.location.reload()
            return
          }
          // Store current user ID
          sessionStorage.setItem(USER_ID_KEY, user.id)
        } catch (e) {
          // sessionStorage might not be available
        }

        // Get user's profile to find org_id with retry logic
        let profile = null
        let attempts = 0
        const maxAttempts = 3

        while (!profile && attempts < maxAttempts) {
          attempts++
          const { data, error: profileError } = await supabase
            .from("profiles")
            .select("org_id")
            .eq("id", user.id)
            .single()

          if (profileError) {
            console.warn(`Profile fetch attempt ${attempts} failed:`, profileError.message)
            if (attempts < maxAttempts) {
              await new Promise(r => setTimeout(r, 500 * attempts))
            }
          } else {
            profile = data
          }
        }

        if (!profile?.org_id) {
          console.log("User has no org_id, using default branding")
          setBranding({ ...defaultBranding, isLoaded: true })
          loadingRef.current = false
          return
        }

        // Get organization branding
        const { data: org, error: orgError } = await supabase
          .from("organizations")
          .select("id, name, name_ar, logo_url, primary_color, secondary_color")
          .eq("id", profile.org_id)
          .single()

        if (orgError) {
          console.error("Org fetch error:", orgError.message)
          setBranding({ ...defaultBranding, isLoaded: true })
          loadingRef.current = false
          return
        }

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
          console.log("Branding loaded:", org.name)
        } else {
          setBranding({ ...defaultBranding, isLoaded: true })
        }
      } catch (error) {
        console.error("Error loading branding:", error)
        setBranding({ ...defaultBranding, isLoaded: true })
      } finally {
        loadingRef.current = false
      }
    }

    loadBranding()

    // Listen for auth state changes to refresh branding when user logs in/out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Branding auth event:", event)

        if (event === "SIGNED_OUT") {
          try { sessionStorage.removeItem(USER_ID_KEY) } catch {}
          setBranding({ ...defaultBranding, isLoaded: true })
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          // On sign in, store new user ID and reload branding
          if (session?.user?.id) {
            try { sessionStorage.setItem(USER_ID_KEY, session.user.id) } catch {}
          }
          setBranding({ ...defaultBranding, isLoaded: false })
          loadingRef.current = false
          loadBranding()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
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
