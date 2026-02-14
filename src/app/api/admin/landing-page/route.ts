import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify super_admin role
  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (userRole?.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { blocks, config } = await request.json()

    const serviceClient = createServiceClient()

    // Delete all existing blocks
    const { error: deleteError } = await serviceClient
      .from("landing_page_blocks")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")

    if (deleteError) {
      console.error("Error deleting landing page blocks:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete existing blocks" },
        { status: 500 }
      )
    }

    // Insert new blocks
    if (blocks && blocks.length > 0) {
      const { error: insertError } = await serviceClient
        .from("landing_page_blocks")
        .insert(
          blocks.map((b: any, index: number) => ({
            id: b.id,
            block_type: b.type,
            block_order: index,
            enabled: b.enabled,
            content: b.content,
            styles: b.styles,
          }))
        )

      if (insertError) {
        console.error("Error inserting landing page blocks:", insertError)
        return NextResponse.json(
          { error: "Failed to save blocks" },
          { status: 500 }
        )
      }
    }

    // Save config to platform_settings (pass object directly for JSONB)
    const { error: configError } = await serviceClient
      .from("platform_settings")
      .upsert(
        {
          key: "landing_page_config",
          value: config,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      )

    if (configError) {
      console.error("Error saving landing page config:", configError)
      return NextResponse.json(
        { error: "Failed to save config" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Landing page save error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
