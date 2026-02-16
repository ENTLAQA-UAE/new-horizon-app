import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton instance to ensure consistent session state across all components
let supabaseClient: SupabaseClient<Database> | null = null

export function createClient(): SupabaseClient<Database> {
  // Return existing client if already created (singleton pattern)
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }

  // Set cookie domain for cross-subdomain auth (e.g. kawadir.io ↔ entlaqa.kawadir.io)
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'kawadir.io'
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      ...(isLocalhost ? {} : { domain: `.${rootDomain}` }),
    },
  })
  return supabaseClient
}

// Reset the singleton - used after logout to ensure fresh state on next login
export function resetSupabaseClient() {
  supabaseClient = null
}

// Clear all auth-related cookies
function clearAuthCookies() {
  if (typeof document === 'undefined') return

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'kawadir.io'

  try {
    const cookies = document.cookie.split(";")
    let clearedCount = 0

    for (const cookie of cookies) {
      const [name] = cookie.split("=")
      const cookieName = name.trim()

      // Clear cookies that match Supabase, auth, or middleware patterns
      if (
        cookieName.startsWith("sb-") ||
        cookieName.startsWith("x-user-") ||
        cookieName.startsWith("x-org-") ||
        cookieName.includes("supabase") ||
        cookieName.includes("auth") ||
        cookieName.includes("token") ||
        cookieName.includes("session") ||
        cookieName.includes("kawadir")
      ) {
        // Clear cookie for multiple domains to ensure removal
        // Must include the root domain (e.g. .kawadir.io) since cookies are set there
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${rootDomain};`
        clearedCount++
      }
    }

    if (clearedCount > 0) {
      console.log('Cleared auth cookies:', clearedCount)
    }
  } catch (e) {
    console.warn('Error clearing cookies:', e)
  }
}

// Clear all Supabase-related storage to ensure clean state
export function clearSupabaseStorage() {
  try {
    // Clear localStorage items that Supabase might use
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('kawadir'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))

    // Clear sessionStorage items
    const sessionKeysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('kawadir'))) {
        sessionKeysToRemove.push(key)
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key))

    // Also clear auth-related cookies
    clearAuthCookies()

    console.log('Cleared Supabase storage:', { localStorage: keysToRemove.length, sessionStorage: sessionKeysToRemove.length })
  } catch (e) {
    console.warn('Error clearing Supabase storage:', e)
  }
}

// Complete cleanup - resets client AND clears storage
export function fullCleanup() {
  clearSupabaseStorage()
  resetSupabaseClient()
}
