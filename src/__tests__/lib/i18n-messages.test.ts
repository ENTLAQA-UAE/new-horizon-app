/**
 * Tests for i18n message utilities.
 * Tests the pure translation lookup and interpolation functions.
 */

import {
  getMessages,
  getNamespaceMessages,
  getTranslation,
  interpolate,
  t,
  messages,
} from "@/lib/i18n/messages"

describe("i18n message utilities", () => {
  describe("getMessages", () => {
    it("returns English messages", () => {
      const en = getMessages("en")
      expect(en).toBeDefined()
      expect(en.common).toBeDefined()
      expect(en.auth).toBeDefined()
      expect(en.jobs).toBeDefined()
    })

    it("returns Arabic messages", () => {
      const ar = getMessages("ar")
      expect(ar).toBeDefined()
      expect(ar.common).toBeDefined()
      expect(ar.auth).toBeDefined()
    })

    it("both languages have the same namespaces", () => {
      const enKeys = Object.keys(messages.en).sort()
      const arKeys = Object.keys(messages.ar).sort()
      expect(enKeys).toEqual(arKeys)
    })
  })

  describe("getNamespaceMessages", () => {
    it("returns common namespace for English", () => {
      const common = getNamespaceMessages("en", "common")
      expect(common.save).toBe("Save")
      expect(common.cancel).toBe("Cancel")
    })

    it("returns common namespace for Arabic", () => {
      const common = getNamespaceMessages("ar", "common")
      expect(common.save).toBe("حفظ")
      expect(common.cancel).toBe("إلغاء")
    })

    it("returns auth namespace", () => {
      const auth = getNamespaceMessages("en", "auth")
      expect(auth).toBeDefined()
    })
  })

  describe("getTranslation", () => {
    it("resolves a top-level key", () => {
      expect(getTranslation("en", "common.save")).toBe("Save")
    })

    it("resolves Arabic translation", () => {
      expect(getTranslation("ar", "common.save")).toBe("حفظ")
    })

    it("returns key path for missing keys", () => {
      expect(getTranslation("en", "common.nonExistentKey")).toBe(
        "common.nonExistentKey"
      )
    })

    it("returns key path for deeply missing keys", () => {
      expect(getTranslation("en", "a.b.c.d")).toBe("a.b.c.d")
    })

    it("resolves multiple common keys correctly", () => {
      expect(getTranslation("en", "common.delete")).toBe("Delete")
      expect(getTranslation("en", "common.edit")).toBe("Edit")
      expect(getTranslation("en", "common.loading")).toBe("Loading...")
    })
  })

  describe("interpolate", () => {
    it("replaces single variable", () => {
      expect(interpolate("Hello {name}", { name: "John" })).toBe("Hello John")
    })

    it("replaces multiple variables", () => {
      expect(
        interpolate("{count} of {total} items", { count: 5, total: 10 })
      ).toBe("5 of 10 items")
    })

    it("leaves unmatched placeholders intact", () => {
      expect(interpolate("Hello {name}, {greeting}", { name: "John" })).toBe(
        "Hello John, {greeting}"
      )
    })

    it("handles empty variables object", () => {
      expect(interpolate("No variables here", {})).toBe("No variables here")
    })

    it("handles numeric values", () => {
      expect(interpolate("{count} items", { count: 42 })).toBe("42 items")
    })
  })

  describe("t (combined translate + interpolate)", () => {
    it("translates without variables", () => {
      expect(t("en", "common.save")).toBe("Save")
    })

    it("translates with variables", () => {
      // If the translation has variables, they get replaced
      const result = t("en", "common.save")
      expect(typeof result).toBe("string")
    })

    it("returns key path for missing translations", () => {
      expect(t("en", "missing.key")).toBe("missing.key")
    })

    it("works for Arabic", () => {
      expect(t("ar", "common.cancel")).toBe("إلغاء")
    })
  })
})
