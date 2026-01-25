// @ts-nocheck
// Note: Tables application_notes and application_activities are not in generated types yet
import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params

    // Use regular client for auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use service client to bypass RLS for fetching notes
    const serviceClient = createServiceClient()

    const { data: notes, error } = await serviceClient
      .from("application_notes")
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching notes:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notes: notes || [] })
  } catch (error) {
    console.error("Error in notes GET:", error)
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

    const { content, is_private = false } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Use service client to bypass RLS for inserting notes
    const serviceClient = createServiceClient()

    // Get user profile for the response
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("first_name, last_name, avatar_url")
      .eq("id", user.id)
      .single()

    // Create the note
    const { data: note, error } = await serviceClient
      .from("application_notes")
      .insert({
        application_id: applicationId,
        user_id: user.id,
        content: content.trim(),
        is_private,
      })
      .select("*")
      .single()

    if (error) {
      console.error("Error creating note:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await serviceClient.from("application_activities").insert({
      application_id: applicationId,
      user_id: user.id,
      activity_type: "note_added",
      description: "Added a note",
    })

    // Return note with profile info
    return NextResponse.json({
      note: {
        ...note,
        profiles: profile
      }
    })
  } catch (error) {
    console.error("Error in notes POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
