// @ts-nocheck
// Note: This file uses tables that require type regeneration
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyOrgAdmin } from "@/lib/auth"
import { deleteOrgAIConfig, type AIProvider } from "@/lib/ai/org-ai-config"

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

    // Delete provider config
    const result = await deleteOrgAIConfig(supabase, orgId, provider)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error deleting AI config:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
