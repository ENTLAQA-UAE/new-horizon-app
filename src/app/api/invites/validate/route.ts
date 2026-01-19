import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * Validate an invite code (public endpoint - no auth required)
 * This uses the service role to bypass RLS for invite validation
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.json(
      { error: "Invite code is required" },
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

  try {
    const { data: invite, error } = await supabase
      .from("team_invites")
      .select(`
        id,
        email,
        role,
        org_id,
        status,
        expires_at,
        organizations:org_id (
          name,
          logo_url
        )
      `)
      .eq("invite_code", code.toUpperCase())
      .single()

    if (error || !invite) {
      return NextResponse.json(
        { valid: false, error: "Invalid invite code" },
        { status: 404 }
      )
    }

    if (invite.status !== "pending") {
      return NextResponse.json(
        { valid: false, error: "This invite has already been used" },
        { status: 400 }
      )
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: "This invite has expired" },
        { status: 400 }
      )
    }

    // Return invite info (limited fields for security)
    return NextResponse.json({
      valid: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        org_id: invite.org_id,
        organization: invite.organizations,
      },
    })
  } catch (err) {
    console.error("Error validating invite:", err)
    return NextResponse.json(
      { error: "Error validating invite code" },
      { status: 500 }
    )
  }
}
