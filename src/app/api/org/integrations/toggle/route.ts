import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyOrgAdmin } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { orgId, provider, enabled } = await request.json()

    // Verify user is admin
    const { authorized, error } = await verifyOrgAdmin(supabase, user.id, orgId)

    if (!authorized) {
      return NextResponse.json({ error: error || "Not authorized" }, { status: 403 })
    }

    const { error: updateError } = await supabase
      .from("organization_integrations")
      .update({
        is_enabled: enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("org_id", orgId)
      .eq("provider", provider)

    if (updateError) {
      return NextResponse.json({ error: "Failed to update" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
