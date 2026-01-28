// @ts-nocheck
// Note: This file uses tables that require type regeneration
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyOrgAdmin } from "@/lib/auth"
import { updateOrgAISettings, getAIProviderInfo, type AIProvider, type AIProviderSettings } from "@/lib/ai/org-ai-config"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { orgId, provider, settings } = await request.json()

    if (!orgId || !provider || !settings) {
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

    // Validate settings
    const providerInfo = getAIProviderInfo(provider)
    const validatedSettings: AIProviderSettings = {}

    // Model validation
    if (settings.model) {
      if (!providerInfo.availableModels.includes(settings.model)) {
        return NextResponse.json({
          error: `Invalid model for ${provider}. Available: ${providerInfo.availableModels.join(", ")}`
        }, { status: 400 })
      }
      validatedSettings.model = settings.model
    }

    // Temperature validation (0.0 to 2.0)
    if (settings.temperature !== undefined) {
      const temp = parseFloat(settings.temperature)
      if (isNaN(temp) || temp < 0 || temp > 2) {
        return NextResponse.json({
          error: "Temperature must be between 0 and 2"
        }, { status: 400 })
      }
      validatedSettings.temperature = temp
    }

    // Max tokens validation
    if (settings.max_tokens !== undefined) {
      const tokens = parseInt(settings.max_tokens)
      if (isNaN(tokens) || tokens < 1 || tokens > 100000) {
        return NextResponse.json({
          error: "Max tokens must be between 1 and 100000"
        }, { status: 400 })
      }
      validatedSettings.max_tokens = tokens
    }

    // Custom instructions (optional text)
    if (settings.custom_instructions !== undefined) {
      validatedSettings.custom_instructions = String(settings.custom_instructions).slice(0, 5000)
    }

    // Update settings
    const result = await updateOrgAISettings(supabase, orgId, provider, validatedSettings, user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error updating AI settings:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
