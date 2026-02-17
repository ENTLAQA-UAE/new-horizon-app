// @ts-nocheck
// Note: candidate_documents table types not yet generated
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Extract bucket name and file path from a Supabase storage public URL
function parseSupabaseStorageUrl(url: string): { bucket: string; path: string } | null {
  try {
    const parsed = new URL(url)
    // Pattern: /storage/v1/object/public/{bucket}/{...path}
    const match = parsed.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/)
    if (match) {
      return { bucket: match[1], path: decodeURIComponent(match[2]) }
    }
    return null
  } catch {
    return null
  }
}

// Infer content type from file extension
function getContentType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
  }
  return mimeTypes[ext || ""] || "application/octet-stream"
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's org
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const orgId = profile.org_id
    let fileUrl: string | null = null
    let fileName: string = "document"

    // 1. Check candidate_documents table
    if (!id.startsWith("resume-") && !id.startsWith("att-")) {
      const { data: doc } = await supabase
        .from("candidate_documents")
        .select("file_url, file_name, org_id")
        .eq("id", id)
        .single()

      if (doc && doc.org_id === orgId) {
        fileUrl = doc.file_url
        fileName = doc.file_name || "document"
      }
    }

    // 2. Check candidate resumes
    if (!fileUrl && id.startsWith("resume-")) {
      const candidateId = id.replace("resume-", "")
      const { data: candidate } = await supabase
        .from("candidates")
        .select("resume_url, first_name, last_name, org_id")
        .eq("id", candidateId)
        .single()

      if (candidate && candidate.org_id === orgId && candidate.resume_url) {
        fileUrl = candidate.resume_url
        fileName = `${candidate.first_name}_${candidate.last_name}_Resume`
      }
    }

    // 3. Check application attachments
    if (!fileUrl && id.startsWith("att-")) {
      const attachmentId = id.replace("att-", "")
      const { data: attachment } = await supabase
        .from("application_attachments")
        .select(`
          file_url,
          file_name,
          applications!inner (
            org_id
          )
        `)
        .eq("id", attachmentId)
        .single()

      if (attachment) {
        const appOrgId = (attachment.applications as any)?.org_id
        if (appOrgId === orgId) {
          fileUrl = attachment.file_url
          fileName = attachment.file_name || "attachment"
        }
      }
    }

    if (!fileUrl) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Determine the download URL (signed for security, or fallback to public)
    let downloadUrl = fileUrl
    const storageInfo = parseSupabaseStorageUrl(fileUrl)
    if (storageInfo) {
      const allowedBuckets = ["resumes", "documents", "attachments"]
      if (allowedBuckets.includes(storageInfo.bucket)) {
        const { data: signedData } = await supabase.storage
          .from(storageInfo.bucket)
          .createSignedUrl(storageInfo.path, 300) // 5 minutes

        if (signedData?.signedUrl) {
          downloadUrl = signedData.signedUrl
        }
      }
    }

    // Proxy the file through our domain instead of redirecting to Supabase
    const fileResponse = await fetch(downloadUrl)

    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch file" },
        { status: fileResponse.status }
      )
    }

    const fileBuffer = await fileResponse.arrayBuffer()
    const contentType =
      fileResponse.headers.get("content-type") || getContentType(fileName)

    // Sanitize filename for Content-Disposition header
    const safeName = fileName.replace(/[^\w\s.-]/g, "_")

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${safeName}"`,
        "Content-Length": String(fileBuffer.byteLength),
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error("Error in files GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
