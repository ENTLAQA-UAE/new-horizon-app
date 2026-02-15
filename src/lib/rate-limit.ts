/**
 * In-memory rate limiter for API routes.
 *
 * Uses a sliding-window counter stored in a Map. Entries are lazily
 * cleaned up whenever a new request arrives, so memory stays bounded.
 *
 * Usage in a route handler:
 *   import { rateLimit } from '@/lib/rate-limit'
 *
 *   const limiter = rateLimit({ interval: 60_000, limit: 20 })
 *
 *   export async function POST(request: Request) {
 *     const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
 *     const { success, remaining } = limiter.check(ip)
 *     if (!success) {
 *       return new Response('Too many requests', { status: 429 })
 *     }
 *     // ...
 *   }
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitOptions {
  /** Window size in milliseconds (default 60 000 = 1 minute) */
  interval?: number
  /** Max requests per window (default 20) */
  limit?: number
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

export function rateLimit(options: RateLimitOptions = {}) {
  const interval = options.interval ?? 60_000
  const limit = options.limit ?? 20
  const store = new Map<string, RateLimitEntry>()

  // Purge expired entries every 5 minutes to prevent unbounded growth
  const CLEANUP_INTERVAL = 5 * 60_000
  let lastCleanup = Date.now()

  function cleanup() {
    const now = Date.now()
    if (now - lastCleanup < CLEANUP_INTERVAL) return
    lastCleanup = now
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) {
        store.delete(key)
      }
    }
  }

  function check(key: string): RateLimitResult {
    cleanup()

    const now = Date.now()
    const entry = store.get(key)

    // No entry or window expired → start fresh
    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + interval })
      return { success: true, limit, remaining: limit - 1, resetAt: now + interval }
    }

    // Within window
    entry.count++
    const remaining = Math.max(0, limit - entry.count)
    return {
      success: entry.count <= limit,
      limit,
      remaining,
      resetAt: entry.resetAt,
    }
  }

  return { check }
}

// =====================================================
// Pre-configured limiters for common use cases
// =====================================================

/** General API limiter: 30 requests per minute */
export const apiLimiter = rateLimit({ interval: 60_000, limit: 30 })

/** Auth endpoints: 10 requests per minute (stricter) */
export const authLimiter = rateLimit({ interval: 60_000, limit: 10 })

/** File upload limiter: 15 uploads per minute */
export const uploadLimiter = rateLimit({ interval: 60_000, limit: 15 })

/** AI endpoints: 10 requests per minute (expensive) */
export const aiLimiter = rateLimit({ interval: 60_000, limit: 10 })

/**
 * Helper to create a 429 response with standard headers.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetAt),
        'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
      },
    }
  )
}

/**
 * Extract a rate-limit key from a request (IP-based).
 */
export function getRateLimitKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return ip
}
