import crypto from "crypto"
import { getBunnyConfig } from "./config"

/**
 * Generate a signed CDN URL using Bunny Token Authentication V2 (SHA256).
 * Based on the official Bunny CDN Node.js implementation.
 *
 * @param storagePath - The file path within the storage zone (e.g., "{orgId}/resumes/{file}")
 * @param expirationSeconds - How long the URL is valid (default: 300 = 5 minutes)
 * @param userIp - Optional: restrict the URL to this IP's /24 subnet
 * @returns Fully signed CDN URL
 */
export function generateSignedUrl(
  storagePath: string,
  expirationSeconds: number = 300,
  userIp?: string
): string {
  const config = getBunnyConfig()

  const expires = Math.floor(Date.now() / 1000) + expirationSeconds

  // Ensure path starts with /
  const urlPath = storagePath.startsWith("/") ? storagePath : `/${storagePath}`

  const hashableBase =
    config.cdnTokenKey +
    urlPath +
    expires +
    (userIp ?? "")

  let token = Buffer.from(
    crypto.createHash("sha256").update(hashableBase).digest()
  ).toString("base64")

  // URL-safe Base64 encoding
  token = token
    .replace(/\n/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")

  return `${config.cdnBaseUrl}${urlPath}?token=${token}&expires=${expires}`
}
