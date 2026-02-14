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

  supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}

// Reset the singleton - used after logout to ensure fresh state on next login
export function resetSupabaseClient() {
  supabaseClient = null
}

// Clear all auth-related cookies
function clearAuthCookies() {
  if (typeof document === 'undefined') return

  try {
    const cookies = document.cookie.split(";")
    let clearedCount = 0

    for (const cookie of cookies) {
      const [name] = cookie.split("=")
      const cookieName = name.trim()

      // Clear cookies that match Supabase or auth patterns
      if (
        cookieName.startsWith("sb-") ||
        cookieName.includes("supabase") ||
        cookieName.includes("auth") ||
        cookieName.includes("token") ||
        cookieName.includes("session") ||
        cookieName.includes("kawadir")
      ) {
        // Clear cookie for multiple paths and domains to ensure removal
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=;`
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
