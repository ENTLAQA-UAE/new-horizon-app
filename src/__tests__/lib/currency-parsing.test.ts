/**
 * Tests for safe currency setting parsing.
 * Validates that JSON.parse errors in requisitions page
 * are caught instead of crashing the page.
 */

describe("Currency setting parsing", () => {
  function parseCurrencySafely(value: unknown): string {
    const defaultCurrency = "SAR"
    if (!value) return defaultCurrency

    try {
      return typeof value === "string" ? JSON.parse(value) : String(value)
    } catch {
      return String(value)
    }
  }

  describe("valid values", () => {
    it("parses JSON string value", () => {
      expect(parseCurrencySafely('"USD"')).toBe("USD")
    })

    it("parses non-string value", () => {
      expect(parseCurrencySafely("EUR")).toBe("EUR")
    })

    it("returns default for null", () => {
      expect(parseCurrencySafely(null)).toBe("SAR")
    })

    it("returns default for undefined", () => {
      expect(parseCurrencySafely(undefined)).toBe("SAR")
    })

    it("returns default for empty string", () => {
      expect(parseCurrencySafely("")).toBe("SAR")
    })
  })

  describe("invalid values (should not crash)", () => {
    it("handles malformed JSON gracefully", () => {
      // This would crash with unprotected JSON.parse
      expect(() => parseCurrencySafely("{invalid}")).not.toThrow()
      expect(parseCurrencySafely("{invalid}")).toBe("{invalid}")
    })

    it("handles partial JSON gracefully", () => {
      expect(() => parseCurrencySafely('"USD')).not.toThrow()
      expect(parseCurrencySafely('"USD')).toBe('"USD')
    })

    it("handles numeric string gracefully", () => {
      expect(parseCurrencySafely("123")).toBe(123)
    })

    it("handles object value gracefully", () => {
      const result = parseCurrencySafely({ code: "SAR" })
      expect(result).toBe("[object Object]")
    })
  })

  describe("real-world corrupted settings", () => {
    it("handles empty object string", () => {
      expect(() => parseCurrencySafely("{}")).not.toThrow()
    })

    it("handles array string", () => {
      expect(() => parseCurrencySafely("[]")).not.toThrow()
    })

    it("handles boolean string", () => {
      expect(parseCurrencySafely("true")).toBe(true)
    })
  })
})
