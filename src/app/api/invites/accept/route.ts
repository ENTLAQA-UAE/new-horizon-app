import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

/**
 * Accept an invite code after signup
 * This endpoint is called after the user creates their account
 */
export async function POST(request: NextRequest) {
  try {
    const { inviteId, userId } = await request.json()

    if (!inviteId || !userId) {
      return NextResponse.json(
        { error: "Invite ID and User ID are required" },
        { status: 400 }
      )
    }

    // Use service role to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials")
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the invite
    const { data: invite, error: inviteError } = await supabase
      .from("team_invites")
      .select("*")
      .eq("id", inviteId)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: "Invite not found" },
        { status: 404 }
      )
    }

    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: "This invite has already been used" },
        { status: 400 }
      )
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 400 }
      )
    }

    // Get user email to verify
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId)

    if (userError || !user.user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Verify email matches
    if (user.user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Email does not match invite" },
        { status: 400 }
      )
    }

    // Update profile with org_id
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        org_id: invite.org_id,
      })
      .eq("id", userId)

    if (profileError) {
      console.error("Error updating profile:", profileError)
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      )
    }

    // Create user role
    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert({
        user_id: userId,
        org_id: invite.org_id,
        role: invite.role,
      }, {
        onConflict: "user_id,org_id"
      })

    if (roleError) {
      console.error("Error creating user role:", roleError)
    }

    // Mark invite as accepted
    const { error: updateError } = await supabase
      .from("team_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        accepted_by: userId,
      })
      .eq("id", inviteId)

    if (updateError) {
      console.error("Error updating invite:", updateError)
    }

    return NextResponse.json({
      success: true,
      message: "Invite accepted successfully",
      orgId: invite.org_id,
    })
  } catch (err) {
    console.error("Error accepting invite:", err)
    return NextResponse.json(
      { error: "Error accepting invite" },
      { status: 500 }
    )
  }
}
