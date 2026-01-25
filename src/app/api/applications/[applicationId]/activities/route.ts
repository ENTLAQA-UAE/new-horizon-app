// @ts-nocheck
// Note: Table application_activities is not in generated types yet
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params
    const supabase = await createClient()

    const { data: activities, error } = await supabase
      .from("application_activities")
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name
        )
      `)
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching activities:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ activities: activities || [] })
  } catch (error) {
    console.error("Error in activities GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
