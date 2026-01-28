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

    // Role check
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    const role = userRole?.role
    const allowedRoles = ["super_admin", "hr_manager", "recruiter", "hiring_manager"]
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Use service client to bypass RLS for fetching notes
    const serviceClient = createServiceClient()

    // Fetch notes
    const { data: notes, error } = await serviceClient
      .from("application_notes")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching notes:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!notes || notes.length === 0) {
      return NextResponse.json({ notes: [] })
    }

    // Get unique user IDs from notes
    const userIds = [...new Set(notes.map(note => note.user_id))]

    // Fetch profiles for all note authors
    const { data: profiles } = await serviceClient
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", userIds)

    // Create a map of user_id to profile
    const profileMap = new Map(
      (profiles || []).map(p => [p.id, { first_name: p.first_name, last_name: p.last_name, avatar_url: p.avatar_url }])
    )

    // Attach profiles to notes
    const notesWithProfiles = notes.map(note => ({
      ...note,
      profiles: profileMap.get(note.user_id) || null
    }))

    return NextResponse.json({ notes: notesWithProfiles })
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

    // Role check
    const { data: noteUserRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    const noteRole = noteUserRole?.role
    const noteAllowedRoles = ["super_admin", "hr_manager", "recruiter", "hiring_manager"]
    if (!noteRole || !noteAllowedRoles.includes(noteRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
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
