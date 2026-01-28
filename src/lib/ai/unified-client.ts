/**
 * Unified AI Client
 *
 * Routes AI requests to the correct provider based on organization configuration.
 * Supports: Anthropic Claude, OpenAI, Google Gemini, Perplexity
 */

import { SupabaseClient } from "@supabase/supabase-js"
import { getDefaultAICredentials, logAIUsage, updateAIProviderLastUsed, type AIProvider, type AIProviderSettings } from "./org-ai-config"

export interface AIMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface AICompletionOptions {
  messages: AIMessage[]
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
}

export interface AICompletionResult {
  content: string
  provider: AIProvider
  model: string
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
}

// Default models for each provider
const DEFAULT_MODELS: Record<AIProvider, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  gemini: "gemini-1.5-pro",
  perplexity: "llama-3.1-sonar-large-128k-online",
}

/**
 * Get AI completion using the organization's configured provider
 */
export async function getAICompletion(
  supabase: SupabaseClient,
  orgId: string,
  options: AICompletionOptions,
  context?: {
    feature?: string
    jobId?: string
    applicationId?: string
    candidateId?: string
    triggeredBy: string
  }
): Promise<AICompletionResult> {
  // Get org's default AI provider credentials
  const aiConfig = await getDefaultAICredentials(supabase, orgId)

  if (!aiConfig) {
    throw new Error("No AI provider configured. Please configure an AI provider in Settings > AI Configuration.")
  }

  const { provider, credentials, settings } = aiConfig
  const model = (settings.model as string) || DEFAULT_MODELS[provider]
  const temperature = options.temperature ?? (settings.temperature as number) ?? 0.7
  const maxTokens = options.maxTokens ?? (settings.max_tokens as number) ?? 4096
  const customInstructions = settings.custom_instructions as string

  // Add custom instructions to system prompt if configured
  let systemPrompt = options.systemPrompt || ""
  if (customInstructions) {
    systemPrompt = systemPrompt
      ? `${customInstructions}\n\n${systemPrompt}`
      : customInstructions
  }

  const startTime = Date.now()
  let result: AICompletionResult

  try {
    switch (provider) {
      case "anthropic":
        result = await callAnthropic(credentials, model, options.messages, systemPrompt, maxTokens, temperature)
        break
      case "openai":
        result = await callOpenAI(credentials, model, options.messages, systemPrompt, maxTokens, temperature)
        break
      case "gemini":
        result = await callGemini(credentials, model, options.messages, systemPrompt, maxTokens, temperature)
        break
      case "perplexity":
        result = await callPerplexity(credentials, model, options.messages, systemPrompt, maxTokens, temperature)
        break
      default:
        throw new Error(`Unsupported AI provider: ${provider}`)
    }

    const latencyMs = Date.now() - startTime

    // Log usage
    if (context) {
      await logAIUsage(supabase, orgId, {
        provider,
        model: result.model,
        feature: context.feature || "general",
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        totalTokens: result.totalTokens,
        latencyMs,
        jobId: context.jobId,
        applicationId: context.applicationId,
        candidateId: context.candidateId,
        status: "success",
        triggeredBy: context.triggeredBy,
      })
    }

    // Update last used timestamp
    await updateAIProviderLastUsed(supabase, orgId, provider)

    return result
  } catch (error) {
    const latencyMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    // Log error
    if (context) {
      await logAIUsage(supabase, orgId, {
        provider,
        model,
        feature: context.feature || "general",
        latencyMs,
        status: "error",
        errorMessage,
        triggeredBy: context.triggeredBy,
      })
    }

    throw error
  }
}

/**
 * Call Anthropic Claude API
 */
async function callAnthropic(
  credentials: Record<string, string>,
  model: string,
  messages: AIMessage[],
  systemPrompt: string,
  maxTokens: number,
  temperature: number
): Promise<AICompletionResult> {
  const anthropicMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }))

  // Combine system messages with the provided system prompt
  const systemMessages = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n")

  const fullSystemPrompt = [systemPrompt, systemMessages].filter(Boolean).join("\n\n")

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": credentials.api_key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: fullSystemPrompt || undefined,
      messages: anthropicMessages,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `Anthropic API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.content[0]?.text || ""

  return {
    content,
    provider: "anthropic",
    model,
    inputTokens: data.usage?.input_tokens,
    outputTokens: data.usage?.output_tokens,
    totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  credentials: Record<string, string>,
  model: string,
  messages: AIMessage[],
  systemPrompt: string,
  maxTokens: number,
  temperature: number
): Promise<AICompletionResult> {
  const openaiMessages = []

  // Add system prompt if present
  if (systemPrompt) {
    openaiMessages.push({ role: "system", content: systemPrompt })
  }

  // Add all messages
  for (const m of messages) {
    openaiMessages.push({ role: m.role, content: m.content })
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${credentials.api_key}`,
  }

  if (credentials.organization_id) {
    headers["OpenAI-Organization"] = credentials.organization_id
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: openaiMessages,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content || ""

  return {
    content,
    provider: "openai",
    model,
    inputTokens: data.usage?.prompt_tokens,
    outputTokens: data.usage?.completion_tokens,
    totalTokens: data.usage?.total_tokens,
  }
}

/**
 * Call Google Gemini API
 */
async function callGemini(
  credentials: Record<string, string>,
  model: string,
  messages: AIMessage[],
  systemPrompt: string,
  maxTokens: number,
  temperature: number
): Promise<AICompletionResult> {
  // Convert messages to Gemini format
  const geminiContents = []

  // Add system prompt as first user message if present
  const allMessages = systemPrompt
    ? [{ role: "user" as const, content: systemPrompt }, ...messages]
    : messages

  for (const m of allMessages) {
    geminiContents.push({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${credentials.api_key}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: geminiContents,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature,
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

  return {
    content,
    provider: "gemini",
    model,
    inputTokens: data.usageMetadata?.promptTokenCount,
    outputTokens: data.usageMetadata?.candidatesTokenCount,
    totalTokens: data.usageMetadata?.totalTokenCount,
  }
}

/**
 * Call Perplexity API
 */
async function callPerplexity(
  credentials: Record<string, string>,
  model: string,
  messages: AIMessage[],
  systemPrompt: string,
  maxTokens: number,
  temperature: number
): Promise<AICompletionResult> {
  const perplexityMessages = []

  // Add system prompt if present
  if (systemPrompt) {
    perplexityMessages.push({ role: "system", content: systemPrompt })
  }

  // Add all messages
  for (const m of messages) {
    perplexityMessages.push({ role: m.role, content: m.content })
  }

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${credentials.api_key}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: perplexityMessages,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `Perplexity API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content || ""

  return {
    content,
    provider: "perplexity",
    model,
    inputTokens: data.usage?.prompt_tokens,
    outputTokens: data.usage?.completion_tokens,
    totalTokens: data.usage?.total_tokens,
  }
}

/**
 * Parse JSON from AI response (handles markdown code blocks)
 */
export function parseJSONFromAI<T>(text: string): T {
  let jsonText = text.trim()

  // Remove markdown code blocks
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.slice(7)
  }
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.slice(3)
  }
  if (jsonText.endsWith("```")) {
    jsonText = jsonText.slice(0, -3)
  }
  jsonText = jsonText.trim()

  try {
    return JSON.parse(jsonText) as T
  } catch (error) {
    console.error("Failed to parse AI JSON response:", text)
    throw new Error("Failed to parse AI response as JSON")
  }
}

/**
 * Check if organization has AI configured
 */
export async function hasAIConfigured(
  supabase: SupabaseClient,
  orgId: string
): Promise<boolean> {
  const aiConfig = await getDefaultAICredentials(supabase, orgId)
  return aiConfig !== null
}
