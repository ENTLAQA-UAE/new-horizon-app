/**
 * Bunny CDN & Storage configuration.
 * All values are read from environment variables at runtime (server-side only).
 */

export function getBunnyConfig() {
  const storageZone = process.env.BUNNY_STORAGE_ZONE
  const storageAccessKey = process.env.BUNNY_STORAGE_ACCESS_KEY
  const storageRegion = process.env.BUNNY_STORAGE_REGION || ""
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME
  const cdnTokenKey = process.env.BUNNY_CDN_TOKEN_KEY

  if (!storageZone || !storageAccessKey || !cdnHostname || !cdnTokenKey) {
    throw new Error(
      "Missing Bunny configuration. Required env vars: BUNNY_STORAGE_ZONE, BUNNY_STORAGE_ACCESS_KEY, BUNNY_CDN_HOSTNAME, BUNNY_CDN_TOKEN_KEY"
    )
  }

  const regionPrefix = storageRegion ? `${storageRegion}.` : ""

  return {
    storageZone,
    storageAccessKey,
    storageRegion,
    storageBaseUrl: `https://${regionPrefix}storage.bunnycdn.com/${storageZone}`,
    cdnBaseUrl: `https://${cdnHostname}`,
    cdnTokenKey,
  }
}
