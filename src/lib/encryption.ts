/**
 * Encryption utilities for storing sensitive credentials
 * Uses AES-256-GCM encryption
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto"

const ALGORITHM = "aes-256-gcm"
const KEY_LENGTH = 32
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 32

// Get encryption key from environment or generate from secret
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-secret-key-change-me"
  const salt = process.env.ENCRYPTION_SALT || "jadarat-ats-salt"
  return scryptSync(secret, salt, KEY_LENGTH)
}

/**
 * Encrypt sensitive data (like API keys)
 * Returns base64 encoded string: iv:authTag:encryptedData
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, "utf8", "hex")
  encrypted += cipher.final("hex")

  const authTag = cipher.getAuthTag()

  // Combine iv + authTag + encrypted data
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, "hex"),
  ])

  return combined.toString("base64")
}

/**
 * Decrypt sensitive data
 * Input: base64 encoded string from encrypt()
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey()
  const combined = Buffer.from(encryptedData, "base64")

  // Extract iv, authTag, and encrypted data
  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

/**
 * Encrypt a JSON object containing credentials
 */
export function encryptCredentials(credentials: Record<string, string>): string {
  return encrypt(JSON.stringify(credentials))
}

/**
 * Decrypt credentials back to JSON object
 */
export function decryptCredentials(encryptedCredentials: string): Record<string, string> {
  const decrypted = decrypt(encryptedCredentials)
  return JSON.parse(decrypted)
}

/**
 * Mask an API key for display (show only last 4 characters)
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return "****"
  return "•".repeat(apiKey.length - 4) + apiKey.slice(-4)
}

/**
 * Mask credentials object for safe display
 */
export function maskCredentials(credentials: Record<string, string>): Record<string, string> {
  const masked: Record<string, string> = {}
  for (const [key, value] of Object.entries(credentials)) {
    masked[key] = maskApiKey(value)
  }
  return masked
}
