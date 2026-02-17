import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { uploadFile, deleteFile } from "@/lib/bunny"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Parse form data
    let formData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
    }

    const file = formData.get("file") as File | null
    const name = formData.get("name") as string | null
    const applicationId = formData.get("applicationId") as string | null
    const documentType = formData.get("documentType") as string | null
    const organizationId = formData.get("organizationId") as string | null

    // Validate required fields
    if (!file || !name || !applicationId || !documentType) {
      return NextResponse.json(
        { error: "Missing required fields: file, name, applicationId, documentType" },
        { status: 400 }
      )
    }

    // Verify organization matches
    if (organizationId && organizationId !== profile.org_id) {
      return NextResponse.json({ error: "Organization mismatch" }, { status: 403 })
    }

    // Verify application belongs to the organization
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, org_id, candidate_id")
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    if (application.org_id !== profile.org_id) {
      return NextResponse.json({ error: "Application does not belong to your organization" }, { status: 403 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    // Upload file to Bunny Storage under tenant folder
    const fileExt = file.name.split(".").pop() || "pdf"
    const fileId = crypto.randomUUID()
    const storagePath = `${profile.org_id}/documents/${applicationId}/${fileId}-${documentType}.${fileExt}`

    const fileBuffer = Buffer.from(await file.arrayBuffer())

    try {
      await uploadFile(storagePath, fileBuffer)
    } catch (uploadError) {
      console.error("Bunny Storage upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      )
    }

    // Create attachment record — store the Bunny storage path (not a public URL)
    const { data: attachment, error: insertError } = await supabase
      .from("application_attachments")
      .insert({
        application_id: applicationId,
        uploaded_by: user.id,
        file_name: name,
        file_type: documentType,
        file_url: storagePath,
        file_size: file.size,
        mime_type: file.type,
        description: `${documentType.replace(/_/g, " ")} - Uploaded by recruiter`,
      })
      .select("id, file_url")
      .single()

    if (insertError) {
      console.error("Database insert error:", insertError)
      // Clean up the uploaded file from Bunny
      await deleteFile(storagePath).catch((err) =>
        console.error("Failed to clean up Bunny file:", err)
      )
      return NextResponse.json(
        { error: "Failed to save document record" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      id: attachment.id,
      file_url: attachment.file_url,
    })
  } catch (error) {
    console.error("Document upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
