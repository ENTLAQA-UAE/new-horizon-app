// @ts-nocheck
// Note: Table application_activities is not in generated types yet
import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params
    const supabase = await createClient()
    const body = await request.json()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { activity_type, description, metadata = {} } = body

    if (!activity_type) {
      return NextResponse.json({ error: "Activity type is required" }, { status: 400 })
    }

    // Use service client to bypass RLS for inserting activities
    const serviceClient = createServiceClient()

    // Create the activity
    const { data: activity, error } = await serviceClient
      .from("application_activities")
      .insert({
        application_id: applicationId,
        user_id: user.id,
        activity_type,
        description: description || activity_type.replace(/_/g, " "),
        metadata,
      })
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name
        )
      `)
      .single()

    if (error) {
      console.error("Error creating activity:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ activity })
  } catch (error) {
    console.error("Error in activities POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
