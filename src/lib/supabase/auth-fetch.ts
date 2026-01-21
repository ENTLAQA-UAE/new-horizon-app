/**
 * Authenticated Fetch Utility for Supabase
 *
 * This module provides utilities for making authenticated requests to Supabase
 * that bypass the Supabase client which can hang on getSession().
 *
 * The Supabase client's getSession() method can hang indefinitely in certain
 * conditions. This utility retrieves the auth token directly from cookies
 * (where @supabase/ssr stores them) and makes direct REST API calls.
 */

import { createClient } from './client'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Decode a JWT token to extract payload (without verification)
 * Used to get user ID from the access token
 */
function decodeJwt(token: string): { sub?: string; [key: string]: unknown } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    // Base64 decode (handle URL-safe base64)
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(base64)
    return JSON.parse(decoded)
  } catch (e) {
    console.warn('[auth-fetch] Failed to decode JWT:', e)
    return null
  }
}

/**
 * Get the current user ID from the access token
 * This avoids calling auth.getUser() which can hang
 */
export async function getCurrentUserId(): Promise<string | null> {
  const token = await getAccessToken()
  if (!token) return null

  const payload = decodeJwt(token)
  return payload?.sub || null
}

// Cache for access token to avoid repeated getSession timeouts
let cachedAccessToken: string | null = null
let tokenCacheTime: number = 0
const TOKEN_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get the access token from various sources with fallbacks
 *
 * IMPORTANT: Fast methods are tried first to avoid getSession() timeout delays.
 * The token is cached after retrieval to speed up subsequent calls.
 *
 * Order of attempts:
 * 1. Memory cache (fastest)
 * 2. localStorage sb-*-auth-token pattern (fast)
 * 3. jadarat_pending_session in localStorage (fast)
 * 4. Cookies (fast)
 * 5. Supabase client getSession() with 3s timeout (slow - last resort)
 */
export async function getAccessToken(): Promise<string | null> {
  // Method 1: Check memory cache first (fastest)
  if (cachedAccessToken && Date.now() - tokenCacheTime < TOKEN_CACHE_DURATION) {
    return cachedAccessToken
  }

  let accessToken: string | null = null

  // Method 2: Try localStorage sb-*-auth-token pattern (fast)
  if (typeof window !== 'undefined') {
    try {
      const storageKeys = Object.keys(localStorage).filter(
        k => k.startsWith("sb-") && k.endsWith("-auth-token")
      )
      if (storageKeys.length > 0) {
        const storedData = localStorage.getItem(storageKeys[0])
        if (storedData) {
          const parsed = JSON.parse(storedData)
          accessToken = parsed?.access_token || null
          if (accessToken) {
            console.log("[auth-fetch] Token from localStorage sb-* pattern: found")
            cachedAccessToken = accessToken
            tokenCacheTime = Date.now()
            return accessToken
          }
        }
      }
    } catch (e) {
      // Silent fail, try next method
    }

    // Method 3: Try jadarat_pending_session (fast)
    try {
      const pendingSession = localStorage.getItem('jadarat_pending_session')
      if (pendingSession) {
        const parsed = JSON.parse(pendingSession)
        accessToken = parsed?.access_token || null
        if (accessToken) {
          console.log("[auth-fetch] Token from jadarat_pending_session: found")
          cachedAccessToken = accessToken
          tokenCacheTime = Date.now()
          return accessToken
        }
      }
    } catch (e) {
      // Silent fail, try next method
    }

    // Method 4: Try cookies (fast)
    try {
      const cookies = document.cookie.split(';')
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=')
        if (name && name.startsWith('sb-') && name.endsWith('-auth-token')) {
          let decoded = decodeURIComponent(value)
          // Supabase SSR stores as base64-encoded JSON
          if (decoded.startsWith('base64-')) {
            decoded = atob(decoded.replace('base64-', ''))
          }
          const parsed = JSON.parse(decoded)
          accessToken = parsed?.access_token || null
          if (accessToken) {
            console.log("[auth-fetch] Token from cookie:", name)
            cachedAccessToken = accessToken
            tokenCacheTime = Date.now()
            return accessToken
          }
        }
      }
    } catch (e) {
      // Silent fail, try next method
    }
  }

  // Method 5: Try getSession with timeout (slow - last resort)
  try {
    const supabase = createClient()
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("getSession timeout")), 3000)
    )
    const { data: sessionData } = await Promise.race([sessionPromise, timeoutPromise])
    accessToken = sessionData?.session?.access_token || null
    if (accessToken) {
      console.log("[auth-fetch] Token from getSession: found")
      cachedAccessToken = accessToken
      tokenCacheTime = Date.now()
      return accessToken
    }
  } catch (e) {
    console.warn("[auth-fetch] getSession timed out or failed")
  }

  console.warn("[auth-fetch] No access token found from any source")
  return null
}

/**
 * Get headers for authenticated Supabase REST API requests
 */
export function getAuthHeaders(accessToken: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY || '',
    'Authorization': `Bearer ${accessToken}`,
  }
}

/**
 * Response type for Supabase operations
 */
export interface SupabaseResponse<T> {
  data: T | null
  error: { message: string; code?: string } | null
}

/**
 * Insert a record into a Supabase table using direct fetch
 */
export async function supabaseInsert<T>(
  table: string,
  data: Record<string, unknown>,
  options?: { returning?: boolean }
): Promise<SupabaseResponse<T>> {
  const accessToken = await getAccessToken()

  if (!accessToken) {
    return { data: null, error: { message: "No active session. Please refresh and try again." } }
  }

  try {
    const headers = getAuthHeaders(accessToken)
    if (options?.returning !== false) {
      headers['Prefer'] = 'return=representation'
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[auth-fetch] Insert into ${table} failed:`, errorText)

      // Try to parse error as JSON for better message
      try {
        const errorJson = JSON.parse(errorText)
        return { data: null, error: { message: errorJson.message || errorText, code: errorJson.code } }
      } catch {
        return { data: null, error: { message: errorText || `HTTP ${response.status}` } }
      }
    }

    const result = await response.json()
    // PostgREST returns array for inserts with Prefer: return=representation
    const returnedData = Array.isArray(result) ? result[0] : result
    return { data: returnedData as T, error: null }
  } catch (err) {
    console.error(`[auth-fetch] Insert into ${table} error:`, err)
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : "An unexpected error occurred" }
    }
  }
}

/**
 * Update records in a Supabase table using direct fetch
 */
export async function supabaseUpdate<T>(
  table: string,
  data: Record<string, unknown>,
  filter: { column: string; value: string | number },
  options?: { returning?: boolean }
): Promise<SupabaseResponse<T>> {
  const accessToken = await getAccessToken()

  if (!accessToken) {
    return { data: null, error: { message: "No active session. Please refresh and try again." } }
  }

  try {
    const headers = getAuthHeaders(accessToken)
    if (options?.returning !== false) {
      headers['Prefer'] = 'return=representation'
    }

    const url = `${SUPABASE_URL}/rest/v1/${table}?${filter.column}=eq.${filter.value}`
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[auth-fetch] Update ${table} failed:`, errorText)

      try {
        const errorJson = JSON.parse(errorText)
        return { data: null, error: { message: errorJson.message || errorText, code: errorJson.code } }
      } catch {
        return { data: null, error: { message: errorText || `HTTP ${response.status}` } }
      }
    }

    const result = await response.json()
    const returnedData = Array.isArray(result) ? result[0] : result
    return { data: returnedData as T, error: null }
  } catch (err) {
    console.error(`[auth-fetch] Update ${table} error:`, err)
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : "An unexpected error occurred" }
    }
  }
}

/**
 * Delete records from a Supabase table using direct fetch
 * Supports single filter or multiple filters for composite key deletes
 */
export async function supabaseDelete(
  table: string,
  filter: { column: string; value: string | number } | { column: string; value: string | number }[]
): Promise<SupabaseResponse<null>> {
  const accessToken = await getAccessToken()

  if (!accessToken) {
    return { data: null, error: { message: "No active session. Please refresh and try again." } }
  }

  try {
    const headers = getAuthHeaders(accessToken)

    // Build query string from filter(s)
    const filters = Array.isArray(filter) ? filter : [filter]
    const queryParts = filters.map(f => `${f.column}=eq.${f.value}`)
    const url = `${SUPABASE_URL}/rest/v1/${table}?${queryParts.join('&')}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[auth-fetch] Delete from ${table} failed:`, errorText)

      try {
        const errorJson = JSON.parse(errorText)
        return { data: null, error: { message: errorJson.message || errorText, code: errorJson.code } }
      } catch {
        return { data: null, error: { message: errorText || `HTTP ${response.status}` } }
      }
    }

    return { data: null, error: null }
  } catch (err) {
    console.error(`[auth-fetch] Delete from ${table} error:`, err)
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : "An unexpected error occurred" }
    }
  }
}

/**
 * Select records from a Supabase table using direct fetch
 */
export async function supabaseSelect<T>(
  table: string,
  options?: {
    select?: string
    filter?: { column: string; operator: string; value: string | number | boolean }[]
    order?: { column: string; ascending?: boolean }
    limit?: number
    single?: boolean
  }
): Promise<SupabaseResponse<T>> {
  const accessToken = await getAccessToken()

  if (!accessToken) {
    return { data: null, error: { message: "No active session. Please refresh and try again." } }
  }

  try {
    const headers = getAuthHeaders(accessToken)
    if (options?.single) {
      headers['Accept'] = 'application/vnd.pgrst.object+json'
    }

    let url = `${SUPABASE_URL}/rest/v1/${table}`
    const params = new URLSearchParams()

    if (options?.select) {
      params.set('select', options.select)
    }

    if (options?.filter) {
      for (const f of options.filter) {
        params.set(f.column, `${f.operator}.${f.value}`)
      }
    }

    if (options?.order) {
      const dir = options.order.ascending === false ? 'desc' : 'asc'
      params.set('order', `${options.order.column}.${dir}`)
    }

    if (options?.limit) {
      params.set('limit', options.limit.toString())
    }

    const queryString = params.toString()
    if (queryString) {
      url += `?${queryString}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[auth-fetch] Select from ${table} failed:`, errorText)

      try {
        const errorJson = JSON.parse(errorText)
        return { data: null, error: { message: errorJson.message || errorText, code: errorJson.code } }
      } catch {
        return { data: null, error: { message: errorText || `HTTP ${response.status}` } }
      }
    }

    const result = await response.json()
    return { data: result as T, error: null }
  } catch (err) {
    console.error(`[auth-fetch] Select from ${table} error:`, err)
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : "An unexpected error occurred" }
    }
  }
}

/**
 * Execute a raw query (for RPC calls)
 */
export async function supabaseRpc<T>(
  functionName: string,
  params?: Record<string, unknown>
): Promise<SupabaseResponse<T>> {
  const accessToken = await getAccessToken()

  if (!accessToken) {
    return { data: null, error: { message: "No active session. Please refresh and try again." } }
  }

  try {
    const headers = getAuthHeaders(accessToken)

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
      method: 'POST',
      headers,
      body: params ? JSON.stringify(params) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[auth-fetch] RPC ${functionName} failed:`, errorText)

      try {
        const errorJson = JSON.parse(errorText)
        return { data: null, error: { message: errorJson.message || errorText, code: errorJson.code } }
      } catch {
        return { data: null, error: { message: errorText || `HTTP ${response.status}` } }
      }
    }

    const result = await response.json()
    return { data: result as T, error: null }
  } catch (err) {
    console.error(`[auth-fetch] RPC ${functionName} error:`, err)
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : "An unexpected error occurred" }
    }
  }
}
