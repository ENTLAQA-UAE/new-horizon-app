// @ts-nocheck
// Note: Table application_attachments is not in generated types yet
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params
    const supabase = await createClient()

    const { data: attachments, error } = await supabase
      .from("application_attachments")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false })

    if (error) {
      // Table might not exist yet, return empty array
      if (error.code === "42P01") {
        return NextResponse.json({ attachments: [] })
      }
      console.error("Error fetching attachments:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ attachments: attachments || [] })
  } catch (error) {
    console.error("Error in attachments GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
