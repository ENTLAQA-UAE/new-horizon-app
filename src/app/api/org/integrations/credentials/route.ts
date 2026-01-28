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
    const { orgId, provider, credentials } = await request.json()

    if (!orgId || !provider || !credentials) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify user is admin of this org
    const { authorized, error } = await verifyOrgAdmin(supabase, user.id, orgId)

    if (!authorized) {
      return NextResponse.json({ error: error || "Not authorized" }, { status: 403 })
    }

    // Encrypt credentials
    const encryptedCredentials = encryptCredentials(credentials)

    // Upsert integration
    const { error: updateError } = await supabase
      .from("organization_integrations")
      .upsert({
        org_id: orgId,
        provider,
        credentials_encrypted: encryptedCredentials,
        is_configured: true,
        is_verified: false, // Reset verification when credentials change
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      }, {
        onConflict: "org_id,provider",
      })

    if (updateError) {
      console.error("Error saving credentials:", updateError)
      return NextResponse.json({ error: "Failed to save credentials" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
