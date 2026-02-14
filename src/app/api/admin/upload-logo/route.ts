import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify the user is authenticated and is a super admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      )
    }

    // Check super admin role
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (userRole?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only super admins can upload platform logos." },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const type = formData.get("type") as string | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided." },
        { status: 400 }
      )
    }

    if (!type || !["light", "dark"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid logo type. Must be 'light' or 'dark'." },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Please select an image file." },
        { status: 400 }
      )
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be less than 2MB." },
        { status: 400 }
      )
    }

    const fileExt = file.name.split(".").pop()
    const fileName = `platform-logo-${type}-${Date.now()}.${fileExt}`
    const filePath = `platform/${fileName}`

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(filePath, buffer, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) {
      console.error("Logo upload error:", uploadError)

      // If bucket doesn't exist, try to create it and retry
      if (uploadError.message?.includes("not found") || uploadError.message?.includes("Bucket")) {
        // Try creating the bucket
        const { error: bucketError } = await supabase.storage.createBucket("logos", {
          public: true,
        })

        if (bucketError && !bucketError.message?.includes("already exists")) {
          return NextResponse.json(
            { error: `Storage setup failed: ${bucketError.message}` },
            { status: 500 }
          )
        }

        // Retry upload
        const { error: retryError } = await supabase.storage
          .from("logos")
          .upload(filePath, buffer, {
            upsert: true,
            contentType: file.type,
          })

        if (retryError) {
          return NextResponse.json(
            { error: `Upload failed after bucket creation: ${retryError.message}` },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json(
          { error: `Upload failed: ${uploadError.message}` },
          { status: 500 }
        )
      }
    }

    const { data: { publicUrl } } = supabase.storage
      .from("logos")
      .getPublicUrl(filePath)

    return NextResponse.json({ publicUrl })
  } catch (error: any) {
    console.error("Logo upload API error:", error)
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred." },
      { status: 500 }
    )
  }
}
