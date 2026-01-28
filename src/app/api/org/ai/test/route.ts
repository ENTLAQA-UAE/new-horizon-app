// @ts-nocheck
// Note: This file uses tables that require type regeneration
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyOrgAdmin } from "@/lib/auth"
import { markAIProviderVerified, type AIProvider } from "@/lib/ai/org-ai-config"
import { decryptCredentials } from "@/lib/encryption"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { orgId, provider, credentials: providedCredentials } = await request.json()

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

    // Get credentials - either provided or from database
    let credentials: Record<string, string>

    if (providedCredentials) {
      credentials = providedCredentials
    } else {
      // Fetch from database
      const { data: config } = await supabase
        .from("organization_ai_config")
        .select("credentials_encrypted")
        .eq("org_id", orgId)
        .eq("provider", provider)
        .single()

      if (!config?.credentials_encrypted) {
        return NextResponse.json({ error: "No credentials configured" }, { status: 400 })
      }

      try {
        credentials = decryptCredentials(config.credentials_encrypted)
      } catch {
        return NextResponse.json({ error: "Failed to decrypt credentials" }, { status: 500 })
      }
    }

    // Test credentials based on provider
    let result: { success: boolean; model?: string; error?: string }

    switch (provider) {
      case "anthropic":
        result = await testAnthropicCredentials(credentials)
        break
      case "openai":
        result = await testOpenAICredentials(credentials)
        break
      case "gemini":
        result = await testGeminiCredentials(credentials)
        break
      case "perplexity":
        result = await testPerplexityCredentials(credentials)
        break
      default:
        return NextResponse.json({ error: "Unknown provider" }, { status: 400 })
    }

    // If test successful, mark as verified
    if (result.success) {
      await markAIProviderVerified(supabase, orgId, provider, user.id, {
        tested_model: result.model,
        verified_at: new Date().toISOString(),
      })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error("Test error:", err)
    return NextResponse.json({ success: false, error: "Test failed" }, { status: 500 })
  }
}

/**
 * Test Anthropic Claude credentials
 */
async function testAnthropicCredentials(
  credentials: { api_key: string }
): Promise<{ success: boolean; model?: string; error?: string }> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": credentials.api_key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 10,
        messages: [{ role: "user", content: "Hi" }],
      }),
    })

    if (response.ok) {
      return { success: true, model: "claude-sonnet-4-20250514" }
    }

    const errorData = await response.json().catch(() => ({}))

    if (response.status === 401) {
      return { success: false, error: "Invalid API key" }
    }

    if (response.status === 429) {
      // Rate limited but credentials are valid
      return { success: true, model: "claude-sonnet-4-20250514" }
    }

    return {
      success: false,
      error: errorData.error?.message || `API error: ${response.status}`,
    }
  } catch (err) {
    console.error("Anthropic test error:", err)
    return { success: false, error: "Connection failed" }
  }
}

/**
 * Test OpenAI credentials
 */
async function testOpenAICredentials(
  credentials: { api_key: string; organization_id?: string }
): Promise<{ success: boolean; model?: string; error?: string }> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${credentials.api_key}`,
    }

    if (credentials.organization_id) {
      headers["OpenAI-Organization"] = credentials.organization_id
    }

    // Test by listing models (lightweight request)
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers,
    })

    if (response.ok) {
      const data = await response.json()
      // Check if GPT-4 models are available
      const hasGpt4 = data.data?.some((m: { id: string }) =>
        m.id.includes("gpt-4")
      )
      return {
        success: true,
        model: hasGpt4 ? "gpt-4o" : "gpt-3.5-turbo",
      }
    }

    const errorData = await response.json().catch(() => ({}))

    if (response.status === 401) {
      return { success: false, error: "Invalid API key" }
    }

    if (response.status === 429) {
      // Rate limited but credentials are valid
      return { success: true, model: "gpt-4o" }
    }

    return {
      success: false,
      error: errorData.error?.message || `API error: ${response.status}`,
    }
  } catch (err) {
    console.error("OpenAI test error:", err)
    return { success: false, error: "Connection failed" }
  }
}

/**
 * Test Google Gemini credentials
 */
async function testGeminiCredentials(
  credentials: { api_key: string }
): Promise<{ success: boolean; model?: string; error?: string }> {
  try {
    // Test by listing models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${credentials.api_key}`,
      {
        method: "GET",
      }
    )

    if (response.ok) {
      const data = await response.json()
      const hasGemini15 = data.models?.some((m: { name: string }) =>
        m.name.includes("gemini-1.5")
      )
      return {
        success: true,
        model: hasGemini15 ? "gemini-1.5-pro" : "gemini-pro",
      }
    }

    const errorData = await response.json().catch(() => ({}))

    if (response.status === 400 || response.status === 403) {
      return { success: false, error: "Invalid API key" }
    }

    if (response.status === 429) {
      // Rate limited but credentials are valid
      return { success: true, model: "gemini-1.5-pro" }
    }

    return {
      success: false,
      error: errorData.error?.message || `API error: ${response.status}`,
    }
  } catch (err) {
    console.error("Gemini test error:", err)
    return { success: false, error: "Connection failed" }
  }
}

/**
 * Test Perplexity credentials
 */
async function testPerplexityCredentials(
  credentials: { api_key: string }
): Promise<{ success: boolean; model?: string; error?: string }> {
  try {
    // Test with a minimal chat completion
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${credentials.api_key}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 10,
      }),
    })

    if (response.ok) {
      return { success: true, model: "llama-3.1-sonar-large-128k-online" }
    }

    const errorData = await response.json().catch(() => ({}))

    if (response.status === 401) {
      return { success: false, error: "Invalid API key" }
    }

    if (response.status === 429) {
      // Rate limited but credentials are valid
      return { success: true, model: "llama-3.1-sonar-large-128k-online" }
    }

    return {
      success: false,
      error: errorData.error?.message || `API error: ${response.status}`,
    }
  } catch (err) {
    console.error("Perplexity test error:", err)
    return { success: false, error: "Connection failed" }
  }
}
