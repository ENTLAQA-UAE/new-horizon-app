import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyOrgAdmin } from "@/lib/auth"
import { encryptCredentials } from "@/lib/encryption"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { orgId, api_key, from_email, from_name, reply_to_email } = await request.json()

    if (!orgId || !from_email || !from_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify user is admin
    const { authorized, error } = await verifyOrgAdmin(supabase, user.id, orgId)

    if (!authorized) {
      return NextResponse.json({ error: error || "Not authorized" }, { status: 403 })
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      org_id: orgId,
      from_email,
      from_name,
      reply_to_email: reply_to_email || null,
      updated_at: new Date().toISOString(),
    }

    // Only update API key if provided (not empty)
    if (api_key) {
      updateData.api_key_encrypted = encryptCredentials({ api_key })
      updateData.is_verified = false // Reset verification when key changes
    }

    const { error: updateError } = await supabase
      .from("organization_email_config")
      .upsert(updateData, {
        onConflict: "org_id",
      })

    if (updateError) {
      console.error("Error saving email config:", updateError)
      return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
