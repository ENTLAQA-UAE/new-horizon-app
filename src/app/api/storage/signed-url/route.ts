import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { bucket, path } = body

    if (!bucket || !path) {
      return NextResponse.json(
        { error: "Missing bucket or path" },
        { status: 400 }
      )
    }

    // Only allow specific buckets
    const allowedBuckets = ["resumes", "documents", "attachments"]
    if (!allowedBuckets.includes(bucket)) {
      return NextResponse.json(
        { error: "Invalid bucket" },
        { status: 400 }
      )
    }

    // Generate signed URL (valid for 1 hour)
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600)

    if (error) {
      console.error("Error creating signed URL:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ signedUrl: data.signedUrl })
  } catch (error) {
    console.error("Error in signed-url POST:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
