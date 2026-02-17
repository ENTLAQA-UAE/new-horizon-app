// @ts-nocheck
// Note: candidate_documents table types not yet generated
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
    const candidateId = formData.get("candidateId") as string | null

    // Validate required fields
    if (!file || !name || !candidateId) {
      return NextResponse.json(
        { error: "Missing required fields: file, name, candidateId" },
        { status: 400 }
      )
    }

    // Verify candidate belongs to the organization
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("id, org_id")
      .eq("id", candidateId)
      .single()

    if (candidateError || !candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    if (candidate.org_id !== profile.org_id) {
      return NextResponse.json({ error: "Candidate does not belong to your organization" }, { status: 403 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop() || "pdf"
    const fileName = `${profile.org_id}/${candidateId}/${Date.now()}-${name.replace(/[^a-zA-Z0-9]/g, "_")}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName)

    const fileUrl = urlData?.publicUrl

    if (!fileUrl) {
      return NextResponse.json(
        { error: "Failed to get file URL" },
        { status: 500 }
      )
    }

    // Create candidate_documents record
    const { data: document, error: insertError } = await supabase
      .from("candidate_documents")
      .insert({
        org_id: profile.org_id,
        candidate_id: candidateId,
        file_name: name,
        file_url: fileUrl,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id,
      })
      .select("id, file_url")
      .single()

    if (insertError) {
      console.error("Database insert error:", insertError)
      // Try to delete the uploaded file
      await supabase.storage.from("documents").remove([fileName])
      return NextResponse.json(
        { error: "Failed to save document record" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      id: document.id,
      file_url: document.file_url,
    })
  } catch (error) {
    console.error("Document upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
