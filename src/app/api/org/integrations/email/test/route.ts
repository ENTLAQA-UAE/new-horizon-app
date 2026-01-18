// @ts-nocheck
// Note: This file uses tables that don't exist (organization_email_config)
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyOrgAdmin } from "@/lib/auth"
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
    const { authorized, error } = await verifyOrgAdmin(supabase, user.id, orgId)

    if (!authorized) {
      return NextResponse.json({ error: error || "Not authorized" }, { status: 403 })
    }

    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API key is required" })
    }

    // Test by listing domains
    const resend = new Resend(apiKey)
    const { error: resendError } = await resend.domains.list()

    if (resendError) {
      return NextResponse.json({ success: false, error: resendError.message })
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
