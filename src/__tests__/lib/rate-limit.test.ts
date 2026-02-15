import { rateLimit, getRateLimitKey, rateLimitResponse } from "@/lib/rate-limit"

describe("rateLimit", () => {
  it("allows requests within the limit", () => {
    const limiter = rateLimit({ interval: 60_000, limit: 3 })

    const r1 = limiter.check("user1")
    const r2 = limiter.check("user1")
    const r3 = limiter.check("user1")

    expect(r1.success).toBe(true)
    expect(r1.remaining).toBe(2)
    expect(r2.success).toBe(true)
    expect(r2.remaining).toBe(1)
    expect(r3.success).toBe(true)
    expect(r3.remaining).toBe(0)
  })

  it("blocks requests over the limit", () => {
    const limiter = rateLimit({ interval: 60_000, limit: 2 })

    limiter.check("user1")
    limiter.check("user1")
    const r3 = limiter.check("user1")

    expect(r3.success).toBe(false)
    expect(r3.remaining).toBe(0)
  })

  it("tracks different keys independently", () => {
    const limiter = rateLimit({ interval: 60_000, limit: 1 })

    const r1 = limiter.check("user1")
    const r2 = limiter.check("user2")

    expect(r1.success).toBe(true)
    expect(r2.success).toBe(true)

    // user1 is now over limit, but user2 is at the limit
    const r3 = limiter.check("user1")
    expect(r3.success).toBe(false)
  })

  it("resets after the interval expires", () => {
    jest.useFakeTimers()

    const limiter = rateLimit({ interval: 1000, limit: 1 })

    const r1 = limiter.check("user1")
    expect(r1.success).toBe(true)

    const r2 = limiter.check("user1")
    expect(r2.success).toBe(false)

    // Advance time past the interval
    jest.advanceTimersByTime(1100)

    const r3 = limiter.check("user1")
    expect(r3.success).toBe(true)

    jest.useRealTimers()
  })

  it("returns correct limit and resetAt values", () => {
    const limiter = rateLimit({ interval: 60_000, limit: 10 })
    const result = limiter.check("user1")

    expect(result.limit).toBe(10)
    expect(result.remaining).toBe(9)
    expect(result.resetAt).toBeGreaterThan(Date.now())
  })

  it("uses default options when none provided", () => {
    const limiter = rateLimit()
    const result = limiter.check("user1")

    expect(result.limit).toBe(20)
    expect(result.remaining).toBe(19)
    expect(result.success).toBe(true)
  })
})

describe("getRateLimitKey", () => {
  it("extracts IP from x-forwarded-for header", () => {
    const mockHeaders = new Map([["x-forwarded-for", "1.2.3.4, 5.6.7.8"]])
    const request = { headers: { get: (key: string) => mockHeaders.get(key) || null } } as any
    expect(getRateLimitKey(request)).toBe("1.2.3.4")
  })

  it("returns 'unknown' when no forwarded header", () => {
    const request = { headers: { get: () => null } } as any
    expect(getRateLimitKey(request)).toBe("unknown")
  })
})

describe("rateLimitResponse", () => {
  const OriginalResponse = globalThis.Response

  beforeAll(() => {
    // Polyfill Response if not available (jsdom)
    if (typeof globalThis.Response === "undefined") {
      globalThis.Response = class MockResponse {
        status: number
        headers: Map<string, string>
        private body: string

        constructor(body: string, init: { status?: number; headers?: Record<string, string> } = {}) {
          this.body = body
          this.status = init.status || 200
          this.headers = new Map(Object.entries(init.headers || {}))
        }

        async json() {
          return JSON.parse(this.body)
        }
      } as any
    }
  })

  afterAll(() => {
    if (OriginalResponse) {
      globalThis.Response = OriginalResponse
    }
  })

  it("returns a 429 response with correct headers", async () => {
    const result = {
      success: false,
      limit: 10,
      remaining: 0,
      resetAt: Date.now() + 30_000,
    }
    const response = rateLimitResponse(result)

    expect(response.status).toBe(429)
    expect(response.headers.get("X-RateLimit-Limit")).toBe("10")
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0")
    expect(response.headers.get("Retry-After")).toBeTruthy()

    const body = await response.json()
    expect(body.error).toContain("Too many requests")
  })
})
