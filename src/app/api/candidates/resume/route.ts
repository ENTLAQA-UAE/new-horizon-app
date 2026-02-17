import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { uploadFile } from "@/lib/bunny"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Upload a resume file for a candidate to Bunny Storage.
 * Called from the admin candidates page when creating/editing candidates.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const candidateId = formData.get("candidateId") as string | null

    if (!file || !candidateId) {
      return NextResponse.json(
        { error: "Missing required fields: file, candidateId" },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    // Verify candidate belongs to the organization
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id, org_id")
      .eq("id", candidateId)
      .single()

    if (!candidate || candidate.org_id !== profile.org_id) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    const fileExt = file.name.split(".").pop() || "pdf"
    const fileId = crypto.randomUUID()
    const storagePath = `${profile.org_id}/resumes/${candidateId}/${fileId}.${fileExt}`

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    await uploadFile(storagePath, fileBuffer)

    return NextResponse.json({ storagePath })
  } catch (error) {
    console.error("Resume upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload resume" },
      { status: 500 }
    )
  }
}
