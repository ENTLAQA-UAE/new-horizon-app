import crypto from "crypto"
import { getBunnyConfig } from "./config"

/**
 * Upload a file to Bunny Storage.
 * @param path - The storage path (e.g., "{orgId}/resumes/{candidateId}/{uuid}.pdf")
 * @param fileBuffer - The file content as a Buffer
 * @returns The storage path on success
 */
export async function uploadFile(path: string, fileBuffer: Buffer): Promise<string> {
  const config = getBunnyConfig()
  const checksum = crypto.createHash("sha256").update(fileBuffer).digest("hex")

  const response = await fetch(`${config.storageBaseUrl}/${path}`, {
    method: "PUT",
    headers: {
      AccessKey: config.storageAccessKey,
      "Content-Type": "application/octet-stream",
      Checksum: checksum,
    },
    body: new Blob([fileBuffer]),
  })

  if (response.status !== 201) {
    const body = await response.text().catch(() => "")
    throw new Error(`Bunny Storage upload failed (${response.status}): ${body}`)
  }

  return path
}

/**
 * Delete a file from Bunny Storage.
 */
export async function deleteFile(path: string): Promise<void> {
  const config = getBunnyConfig()

  const response = await fetch(`${config.storageBaseUrl}/${path}`, {
    method: "DELETE",
    headers: { AccessKey: config.storageAccessKey },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(`Bunny Storage delete failed (${response.status}): ${body}`)
  }
}

/**
 * Create the tenant folder structure for a new organization.
 * Bunny Storage creates directories via PUT to a path ending with '/'.
 */
export async function createTenantFolders(orgId: string): Promise<void> {
  const config = getBunnyConfig()
  const folders = [`${orgId}/resumes/`, `${orgId}/documents/`]

  for (const folder of folders) {
    const response = await fetch(`${config.storageBaseUrl}/${folder}`, {
      method: "PUT",
      headers: {
        AccessKey: config.storageAccessKey,
        "Content-Type": "application/octet-stream",
        "Content-Length": "0",
      },
    })

    // 201 = created, 200 = already exists — both are fine
    if (!response.ok && response.status !== 201) {
      console.error(`Failed to create Bunny folder "${folder}": ${response.status}`)
    }
  }
}
