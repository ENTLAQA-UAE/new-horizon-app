/**
 * Client-side upload helper that routes through the server API.
 * All file uploads should use this instead of direct Supabase storage calls.
 */

export async function uploadFile(
  file: File,
  options: {
    bucket?: string
    folder?: string
  } = {}
): Promise<string> {
  const { bucket = "organization-assets", folder = "" } = options

  const formData = new FormData()
  formData.append("file", file)
  formData.append("bucket", bucket)
  if (folder) formData.append("folder", folder)

  const response = await fetch("/api/storage/upload", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || `Upload failed: ${response.status}`)
  }

  const data = await response.json()
  return data.publicUrl
}
