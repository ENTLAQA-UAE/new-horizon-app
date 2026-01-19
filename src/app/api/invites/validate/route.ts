import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Helper to create JSON response with proper headers
function jsonResponse(data: object, status: number = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  })
}

/**
 * Validate an invite code (public endpoint - no auth required)
 * This uses the service role to bypass RLS for invite validation
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return jsonResponse({ valid: false, error: "Invite code is required" }, 400)
  }

  // Use service role to bypass RLS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials")
    return jsonResponse({ valid: false, error: "Server configuration error" }, 500)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // First, get the invite without the join to ensure it exists
    const { data: invite, error: inviteError } = await supabase
      .from("team_invites")
      .select("id, email, role, org_id, status, expires_at")
      .eq("invite_code", code.toUpperCase())
      .single()

    if (inviteError) {
      console.error("Invite query error:", inviteError)
      return jsonResponse({ valid: false, error: "Invalid invite code" }, 404)
    }

    if (!invite) {
      return jsonResponse({ valid: false, error: "Invalid invite code" }, 404)
    }

    // Check status - treat NULL as pending for backwards compatibility
    if (invite.status && invite.status !== "pending") {
      return jsonResponse({ valid: false, error: "This invite has already been used" }, 400)
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return jsonResponse({ valid: false, error: "This invite has expired" }, 400)
    }

    // Get organization info separately to avoid join issues
    let organization = null
    if (invite.org_id) {
      const { data: org } = await supabase
        .from("organizations")
        .select("name, logo_url")
        .eq("id", invite.org_id)
        .single()
      organization = org
    }

    // Return invite info (limited fields for security)
    return jsonResponse({
      valid: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        org_id: invite.org_id,
        organization: organization,
      },
    })
  } catch (err: any) {
    console.error("Error validating invite:", err?.message || err)
    return jsonResponse({ valid: false, error: "Server error validating invite" }, 500)
  }
}
