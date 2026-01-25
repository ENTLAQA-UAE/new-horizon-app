import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params
    const supabase = await createClient()

    const { data: interviews, error } = await supabase
      .from("interviews")
      .select("*")
      .eq("application_id", applicationId)
      .order("scheduled_at", { ascending: false })

    if (error) {
      console.error("Error fetching interviews:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ interviews: interviews || [] })
  } catch (error) {
    console.error("Error in interviews GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
