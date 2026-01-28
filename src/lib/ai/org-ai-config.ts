// @ts-nocheck
// Note: This file uses tables that require type regeneration
/**
 * Organization-Level AI Configuration Service
 *
 * Each organization configures their own AI provider credentials.
 * Credentials are stored encrypted in the database.
 * Supports: Anthropic Claude, OpenAI, Google Gemini, Perplexity
 */

import { SupabaseClient } from "@supabase/supabase-js"
import { encryptCredentials, decryptCredentials, maskCredentials } from "@/lib/encryption"

export type AIProvider = "anthropic" | "openai" | "gemini" | "perplexity"

export interface AIProviderCredentials {
  anthropic?: {
    api_key: string
  }
  openai?: {
    api_key: string
    organization_id?: string
  }
  gemini?: {
    api_key: string
  }
  perplexity?: {
    api_key: string
  }
}

export interface AIProviderSettings {
  model?: string
  temperature?: number
  max_tokens?: number
  custom_instructions?: string
}

export interface AIConfig {
  id: string
  orgId: string
  provider: AIProvider
  isEnabled: boolean
  isConfigured: boolean
  isVerified: boolean
  isDefaultProvider: boolean
  settings: AIProviderSettings
  providerMetadata: Record<string, unknown>
  verifiedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AIProviderStatus {
  provider: AIProvider
  name: string
  description: string
  isEnabled: boolean
  isConfigured: boolean
  isVerified: boolean
  isDefault: boolean
  defaultModel: string
  availableModels: string[]
  setupGuideUrl: string
  lastUsed?: string
}

// Provider display info and models
const AI_PROVIDER_INFO: Record<AIProvider, {
  name: string
  description: string
  defaultModel: string
  availableModels: string[]
  setupGuideUrl: string
  credentialFields: { key: string; label: string; required: boolean; placeholder: string }[]
}> = {
  anthropic: {
    name: "Anthropic Claude",
    description: "Advanced AI assistant with strong reasoning capabilities",
    defaultModel: "claude-sonnet-4-20250514",
    availableModels: [
      "claude-sonnet-4-20250514",
      "claude-opus-4-20250514",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
    ],
    setupGuideUrl: "https://console.anthropic.com/settings/keys",
    credentialFields: [
      { key: "api_key", label: "API Key", required: true, placeholder: "sk-ant-api..." },
    ],
  },
  openai: {
    name: "OpenAI GPT",
    description: "Powerful language models including GPT-4o",
    defaultModel: "gpt-4o",
    availableModels: [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-4",
      "gpt-3.5-turbo",
    ],
    setupGuideUrl: "https://platform.openai.com/api-keys",
    credentialFields: [
      { key: "api_key", label: "API Key", required: true, placeholder: "sk-..." },
      { key: "organization_id", label: "Organization ID (Optional)", required: false, placeholder: "org-..." },
    ],
  },
  gemini: {
    name: "Google Gemini",
    description: "Google's advanced multimodal AI model",
    defaultModel: "gemini-1.5-pro",
    availableModels: [
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-pro",
    ],
    setupGuideUrl: "https://aistudio.google.com/app/apikey",
    credentialFields: [
      { key: "api_key", label: "API Key", required: true, placeholder: "AI..." },
    ],
  },
  perplexity: {
    name: "Perplexity AI",
    description: "AI with real-time web search capabilities",
    defaultModel: "llama-3.1-sonar-large-128k-online",
    availableModels: [
      "llama-3.1-sonar-large-128k-online",
      "llama-3.1-sonar-small-128k-online",
      "llama-3.1-sonar-huge-128k-online",
    ],
    setupGuideUrl: "https://www.perplexity.ai/settings/api",
    credentialFields: [
      { key: "api_key", label: "API Key", required: true, placeholder: "pplx-..." },
    ],
  },
}

/**
 * Get AI provider info (metadata, models, setup guide)
 */
export function getAIProviderInfo(provider: AIProvider) {
  return AI_PROVIDER_INFO[provider]
}

/**
 * Get all AI provider infos
 */
export function getAllAIProviderInfos() {
  return AI_PROVIDER_INFO
}

/**
 * Get all AI configuration statuses for an organization
 */
export async function getOrgAIConfigs(
  supabase: SupabaseClient,
  orgId: string
): Promise<AIProviderStatus[]> {
  const { data: configs, error } = await supabase
    .from("organization_ai_config")
    .select("*")
    .eq("org_id", orgId)

  if (error) {
    console.error("Error fetching org AI configs:", error)
    return []
  }

  const statuses: AIProviderStatus[] = []

  // Add all providers, marking which ones are configured
  for (const [provider, info] of Object.entries(AI_PROVIDER_INFO)) {
    const config = configs?.find((c) => c.provider === provider)

    statuses.push({
      provider: provider as AIProvider,
      name: info.name,
      description: info.description,
      isEnabled: config?.is_enabled ?? false,
      isConfigured: config?.is_configured ?? false,
      isVerified: config?.is_verified ?? false,
      isDefault: config?.is_default_provider ?? false,
      defaultModel: info.defaultModel,
      availableModels: info.availableModels,
      setupGuideUrl: info.setupGuideUrl,
      lastUsed: config?.last_used_at,
    })
  }

  return statuses
}

/**
 * Get specific AI provider config for an organization
 */
export async function getOrgAIConfig(
  supabase: SupabaseClient,
  orgId: string,
  provider: AIProvider
): Promise<AIConfig | null> {
  const { data: config, error } = await supabase
    .from("organization_ai_config")
    .select("*")
    .eq("org_id", orgId)
    .eq("provider", provider)
    .single()

  if (error || !config) {
    return null
  }

  return {
    id: config.id,
    orgId: config.org_id,
    provider: config.provider,
    isEnabled: config.is_enabled,
    isConfigured: config.is_configured,
    isVerified: config.is_verified,
    isDefaultProvider: config.is_default_provider,
    settings: config.settings || {},
    providerMetadata: config.provider_metadata || {},
    verifiedAt: config.verified_at,
    createdAt: config.created_at,
    updatedAt: config.updated_at,
  }
}

/**
 * Get default AI provider for an organization
 */
export async function getDefaultAIProvider(
  supabase: SupabaseClient,
  orgId: string
): Promise<AIProvider | null> {
  const { data } = await supabase
    .from("organization_ai_config")
    .select("provider")
    .eq("org_id", orgId)
    .eq("is_enabled", true)
    .eq("is_verified", true)
    .eq("is_default_provider", true)
    .single()

  return (data?.provider as AIProvider) || null
}

/**
 * Get decrypted credentials for a specific AI provider
 * Only call this server-side when actually needed
 */
export async function getOrgAICredentials(
  supabase: SupabaseClient,
  orgId: string,
  provider: AIProvider
): Promise<Record<string, string> | null> {
  const { data: config, error } = await supabase
    .from("organization_ai_config")
    .select("credentials_encrypted, is_enabled, is_verified")
    .eq("org_id", orgId)
    .eq("provider", provider)
    .single()

  if (error || !config?.credentials_encrypted) {
    return null
  }

  if (!config.is_enabled) {
    return null
  }

  try {
    return decryptCredentials(config.credentials_encrypted)
  } catch (err) {
    console.error(`Error decrypting ${provider} AI credentials:`, err)
    return null
  }
}

/**
 * Get decrypted credentials for the default AI provider
 */
export async function getDefaultAICredentials(
  supabase: SupabaseClient,
  orgId: string
): Promise<{ provider: AIProvider; credentials: Record<string, string>; settings: AIProviderSettings } | null> {
  const { data: config, error } = await supabase
    .from("organization_ai_config")
    .select("provider, credentials_encrypted, settings")
    .eq("org_id", orgId)
    .eq("is_enabled", true)
    .eq("is_verified", true)
    .eq("is_default_provider", true)
    .single()

  if (error || !config?.credentials_encrypted) {
    return null
  }

  try {
    const credentials = decryptCredentials(config.credentials_encrypted)
    return {
      provider: config.provider as AIProvider,
      credentials,
      settings: config.settings || {},
    }
  } catch (err) {
    console.error("Error decrypting default AI credentials:", err)
    return null
  }
}

/**
 * Save AI credentials for a provider (encrypted)
 */
export async function saveOrgAICredentials(
  supabase: SupabaseClient,
  orgId: string,
  provider: AIProvider,
  credentials: Record<string, string>,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const encryptedCredentials = encryptCredentials(credentials)

    const { error } = await supabase
      .from("organization_ai_config")
      .upsert({
        org_id: orgId,
        provider,
        credentials_encrypted: encryptedCredentials,
        is_configured: true,
        is_verified: false, // Reset verification when credentials change
        updated_at: new Date().toISOString(),
        updated_by: userId,
      }, {
        onConflict: "org_id,provider",
      })

    if (error) {
      console.error("Error saving AI credentials:", error)
      return { success: false, error: "Failed to save credentials" }
    }

    return { success: true }
  } catch (err) {
    console.error("Error encrypting AI credentials:", err)
    return { success: false, error: "Failed to encrypt credentials" }
  }
}

/**
 * Update AI provider settings (model, temperature, etc.)
 */
export async function updateOrgAISettings(
  supabase: SupabaseClient,
  orgId: string,
  provider: AIProvider,
  settings: AIProviderSettings,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("organization_ai_config")
    .update({
      settings,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("org_id", orgId)
    .eq("provider", provider)

  if (error) {
    return { success: false, error: "Failed to update settings" }
  }

  return { success: true }
}

/**
 * Toggle AI provider enabled/disabled
 */
export async function toggleOrgAIProvider(
  supabase: SupabaseClient,
  orgId: string,
  provider: AIProvider,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("organization_ai_config")
    .update({
      is_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("org_id", orgId)
    .eq("provider", provider)

  if (error) {
    return { success: false, error: "Failed to update AI provider" }
  }

  return { success: true }
}

/**
 * Set default AI provider for organization
 */
export async function setDefaultAIProvider(
  supabase: SupabaseClient,
  orgId: string,
  provider: AIProvider
): Promise<{ success: boolean; error?: string }> {
  // First, unset all defaults
  await supabase
    .from("organization_ai_config")
    .update({ is_default_provider: false })
    .eq("org_id", orgId)

  // Set the new default
  const { error } = await supabase
    .from("organization_ai_config")
    .update({
      is_default_provider: true,
      updated_at: new Date().toISOString(),
    })
    .eq("org_id", orgId)
    .eq("provider", provider)

  if (error) {
    return { success: false, error: "Failed to set default AI provider" }
  }

  return { success: true }
}

/**
 * Mark AI provider as verified after successful test
 */
export async function markAIProviderVerified(
  supabase: SupabaseClient,
  orgId: string,
  provider: AIProvider,
  userId: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean }> {
  const updateData: Record<string, unknown> = {
    is_verified: true,
    verified_at: new Date().toISOString(),
    verified_by: userId,
    updated_at: new Date().toISOString(),
  }

  if (metadata) {
    updateData.provider_metadata = metadata
  }

  const { error } = await supabase
    .from("organization_ai_config")
    .update(updateData)
    .eq("org_id", orgId)
    .eq("provider", provider)

  return { success: !error }
}

/**
 * Delete AI provider configuration
 */
export async function deleteOrgAIConfig(
  supabase: SupabaseClient,
  orgId: string,
  provider: AIProvider
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("organization_ai_config")
    .delete()
    .eq("org_id", orgId)
    .eq("provider", provider)

  if (error) {
    return { success: false, error: "Failed to delete AI configuration" }
  }

  return { success: true }
}

/**
 * Update last used timestamp for AI provider
 */
export async function updateAIProviderLastUsed(
  supabase: SupabaseClient,
  orgId: string,
  provider: AIProvider
): Promise<void> {
  await supabase
    .from("organization_ai_config")
    .update({ last_used_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .eq("provider", provider)
}

/**
 * Log AI API usage
 */
export async function logAIUsage(
  supabase: SupabaseClient,
  orgId: string,
  data: {
    provider: AIProvider
    model: string
    feature: string
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
    latencyMs?: number
    jobId?: string
    applicationId?: string
    candidateId?: string
    status?: "success" | "error" | "rate_limited"
    errorMessage?: string
    errorCode?: string
    triggeredBy: string
  }
): Promise<void> {
  await supabase
    .from("organization_ai_logs")
    .insert({
      org_id: orgId,
      provider: data.provider,
      model: data.model,
      feature: data.feature,
      input_tokens: data.inputTokens,
      output_tokens: data.outputTokens,
      total_tokens: data.totalTokens,
      latency_ms: data.latencyMs,
      job_id: data.jobId,
      application_id: data.applicationId,
      candidate_id: data.candidateId,
      status: data.status || "success",
      error_message: data.errorMessage,
      error_code: data.errorCode,
      triggered_by: data.triggeredBy,
    })
}

/**
 * Check if organization has AI configured and enabled
 */
export async function orgHasAIEnabled(
  supabase: SupabaseClient,
  orgId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("organization_ai_config")
    .select("id")
    .eq("org_id", orgId)
    .eq("is_enabled", true)
    .eq("is_verified", true)
    .limit(1)
    .single()

  return !!data
}
