// @ts-nocheck
/**
 * Delete Organization Integration Endpoint
 *
 * Removes an integration configuration completely, allowing for reconfiguration.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { verifyOrgAdmin } from "@/lib/auth"

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { orgId, provider } = await request.json()

    if (!orgId || !provider) {
      return NextResponse.json(
        { error: "Organization ID and provider are required" },
        { status: 400 }
      )
    }

    // Verify user is admin
    const { authorized, error } = await verifyOrgAdmin(supabase, user.id, orgId)

    if (!authorized) {
      return NextResponse.json({ error: error || "Not authorized" }, { status: 403 })
    }

    // Use service client to bypass RLS
    const serviceClient = createServiceClient()

    // Check if this is the default provider
    const { data: integration } = await serviceClient
      .from("organization_integrations")
      .select("is_default_meeting_provider")
      .eq("org_id", orgId)
      .eq("provider", provider)
      .single()

    // Delete the integration
    const { error: deleteError } = await serviceClient
      .from("organization_integrations")
      .delete()
      .eq("org_id", orgId)
      .eq("provider", provider)

    if (deleteError) {
      console.error("Error deleting integration:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete integration" },
        { status: 500 }
      )
    }

    // If this was the default provider, try to set another verified provider as default
    if (integration?.is_default_meeting_provider) {
      const { data: otherProviders } = await serviceClient
        .from("organization_integrations")
        .select("provider")
        .eq("org_id", orgId)
        .eq("is_verified", true)
        .eq("is_enabled", true)
        .limit(1)

      if (otherProviders && otherProviders.length > 0) {
        await serviceClient
          .from("organization_integrations")
          .update({ is_default_meeting_provider: true })
          .eq("org_id", orgId)
          .eq("provider", otherProviders[0].provider)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${provider} integration removed successfully`,
    })
  } catch (err) {
    console.error("Delete integration error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete integration" },
      { status: 500 }
    )
  }
}
