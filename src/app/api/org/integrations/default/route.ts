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
    const { orgId, provider } = await request.json()

    // Verify user is admin
    const { authorized, error } = await verifyOrgAdmin(supabase, user.id, orgId)

    if (!authorized) {
      return NextResponse.json({ error: error || "Not authorized" }, { status: 403 })
    }

    // First, unset all defaults for this org
    await supabase
      .from("organization_integrations")
      .update({ is_default_meeting_provider: false })
      .eq("org_id", orgId)
      .in("provider", ["zoom", "microsoft", "google"])

    // Set the new default
    const { error: updateError } = await supabase
      .from("organization_integrations")
      .update({
        is_default_meeting_provider: true,
        updated_at: new Date().toISOString(),
      })
      .eq("org_id", orgId)
      .eq("provider", provider)

    if (updateError) {
      return NextResponse.json({ error: "Failed to set default" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
