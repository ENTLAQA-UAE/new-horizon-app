import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { uploadLimiter, getRateLimitKey, rateLimitResponse } from "@/lib/rate-limit"

const ALLOWED_BUCKETS = ["organization-assets"]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  const rlKey = getRateLimitKey(request)
  const rl = uploadLimiter.check(`upload:${rlKey}`)
  if (!rl.success) return rateLimitResponse(rl)

  try {
    const supabase = await createClient()

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const bucket = (formData.get("bucket") as string) || "organization-assets"
    const folder = (formData.get("folder") as string) || ""

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 })
    }

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json(
        { error: `Bucket '${bucket}' is not allowed.` },
        { status: 400 }
      )
    }

    // Validate file type - only images
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed (JPG, PNG, WebP, SVG)." },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 5MB." },
        { status: 400 }
      )
    }

    const fileExt = file.name.split(".").pop()
    const fileName = folder
      ? `${folder}/${crypto.randomUUID()}.${fileExt}`
      : `${crypto.randomUUID()}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName)

    return NextResponse.json({ publicUrl })
  } catch (error: any) {
    console.error("Storage upload API error:", error)
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred." },
      { status: 500 }
    )
  }
}
