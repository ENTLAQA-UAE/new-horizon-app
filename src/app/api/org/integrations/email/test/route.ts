import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Resend } from "resend"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { orgId, apiKey } = await request.json()

    // Verify user is admin
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("org_id", orgId)
      .eq("user_id", user.id)
      .single()

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API key is required" })
    }

    // Test by listing domains
    const resend = new Resend(apiKey)
    const { error } = await resend.domains.list()

    if (error) {
      return NextResponse.json({ success: false, error: error.message })
    }

    // Mark as verified
    await supabase
      .from("organization_email_config")
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("org_id", orgId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Test error:", err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : "Test failed",
    })
  }
}
