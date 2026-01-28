// @ts-nocheck
// Note: This file uses tables that require type regeneration
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyOrgAdmin } from "@/lib/auth"
import { toggleOrgAIProvider, type AIProvider } from "@/lib/ai/org-ai-config"

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

    if (!orgId || !provider || typeof enabled !== "boolean") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate provider
    const validProviders: AIProvider[] = ["anthropic", "openai", "gemini", "perplexity"]
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ error: "Invalid AI provider" }, { status: 400 })
    }

    // Verify user is admin of this org
    const { authorized, error } = await verifyOrgAdmin(supabase, user.id, orgId)

    if (!authorized) {
      return NextResponse.json({ error: error || "Not authorized" }, { status: 403 })
    }

    // Check if provider is configured and verified before enabling
    if (enabled) {
      const { data: config } = await supabase
        .from("organization_ai_config")
        .select("is_configured, is_verified")
        .eq("org_id", orgId)
        .eq("provider", provider)
        .single()

      if (!config?.is_configured) {
        return NextResponse.json({
          error: "Please configure credentials first"
        }, { status: 400 })
      }

      if (!config?.is_verified) {
        return NextResponse.json({
          error: "Please test and verify credentials first"
        }, { status: 400 })
      }
    }

    // Toggle provider
    const result = await toggleOrgAIProvider(supabase, orgId, provider, enabled)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error toggling AI provider:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
