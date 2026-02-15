import { encrypt, decrypt, encryptCredentials, decryptCredentials, maskApiKey, maskCredentials } from "@/lib/encryption"

describe("encrypt / decrypt", () => {
  it("encrypts and decrypts a string correctly", () => {
    const plaintext = "sk-test-key-12345"
    const encrypted = encrypt(plaintext)
    const decrypted = decrypt(encrypted)

    expect(decrypted).toBe(plaintext)
    expect(encrypted).not.toBe(plaintext)
  })

  it("produces different ciphertext each time (random IV)", () => {
    const plaintext = "same-input"
    const enc1 = encrypt(plaintext)
    const enc2 = encrypt(plaintext)

    expect(enc1).not.toBe(enc2)
    expect(decrypt(enc1)).toBe(plaintext)
    expect(decrypt(enc2)).toBe(plaintext)
  })

  it("handles empty strings", () => {
    const encrypted = encrypt("")
    expect(decrypt(encrypted)).toBe("")
  })

  it("handles unicode characters", () => {
    const plaintext = "مفتاح-سري-123"
    const encrypted = encrypt(plaintext)
    expect(decrypt(encrypted)).toBe(plaintext)
  })

  it("fails to decrypt with tampered data", () => {
    const encrypted = encrypt("test")
    // Tamper with the base64 data
    const tampered = encrypted.slice(0, -4) + "AAAA"
    expect(() => decrypt(tampered)).toThrow()
  })
})

describe("encryptCredentials / decryptCredentials", () => {
  it("encrypts and decrypts a credentials object", () => {
    const creds = {
      api_key: "sk-test-12345",
      api_secret: "secret-67890",
    }

    const encrypted = encryptCredentials(creds)
    const decrypted = decryptCredentials(encrypted)

    expect(decrypted).toEqual(creds)
  })
})

describe("maskApiKey", () => {
  it("masks a key showing only last 4 chars", () => {
    const masked = maskApiKey("sk-test-api-key-12345")
    expect(masked).toMatch(/2345$/)
    expect(masked).not.toContain("sk-test")
  })

  it("returns **** for short keys", () => {
    expect(maskApiKey("short")).toBe("****")
    expect(maskApiKey("")).toBe("****")
  })

  it("returns **** for empty input", () => {
    expect(maskApiKey("")).toBe("****")
  })
})

describe("maskCredentials", () => {
  it("masks all values in a credentials object", () => {
    const creds = {
      api_key: "sk-test-12345",
      secret: "very-secret-key",
    }
    const masked = maskCredentials(creds)

    expect(masked.api_key).toMatch(/2345$/)
    expect(masked.api_key).not.toContain("sk-test")
    expect(masked.secret).toMatch(/-key$/)
  })
})
