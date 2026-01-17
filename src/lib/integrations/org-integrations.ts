/**
 * Organization-Level Integration Service
 *
 * Each organization configures their own API credentials.
 * Credentials are stored encrypted in the database.
 */

import { SupabaseClient } from "@supabase/supabase-js"
import { encryptCredentials, decryptCredentials, maskCredentials } from "@/lib/encryption"

export type IntegrationProvider = "zoom" | "microsoft" | "google" | "resend"

export interface IntegrationCredentials {
  zoom?: {
    client_id: string
    client_secret: string
    webhook_secret?: string
  }
  microsoft?: {
    client_id: string
    client_secret: string
    tenant_id?: string // 'common' for multi-tenant
  }
  google?: {
    client_id: string
    client_secret: string
  }
  resend?: {
    api_key: string
  }
}

export interface IntegrationConfig {
  id: string
  orgId: string
  provider: IntegrationProvider
  isEnabled: boolean
  isConfigured: boolean
  isVerified: boolean
  isDefaultMeetingProvider: boolean
  settings: Record<string, unknown>
  providerMetadata: Record<string, unknown>
  verifiedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface IntegrationStatus {
  provider: IntegrationProvider
  name: string
  description: string
  isEnabled: boolean
  isConfigured: boolean
  isVerified: boolean
  isDefault: boolean
  connectedAccount?: string
  lastUsed?: string
}

// Provider display info
const PROVIDER_INFO: Record<IntegrationProvider, { name: string; description: string }> = {
  zoom: {
    name: "Zoom",
    description: "Video meetings for interviews",
  },
  microsoft: {
    name: "Microsoft 365",
    description: "Teams meetings & Outlook calendar",
  },
  google: {
    name: "Google Workspace",
    description: "Google Meet & Calendar",
  },
  resend: {
    name: "Resend",
    description: "Email notifications to candidates",
  },
}

/**
 * Get all integration statuses for an organization
 */
export async function getOrgIntegrations(
  supabase: SupabaseClient,
  orgId: string
): Promise<IntegrationStatus[]> {
  const { data: integrations, error } = await supabase
    .from("organization_integrations")
    .select("*")
    .eq("org_id", orgId)

  if (error) {
    console.error("Error fetching org integrations:", error)
    return []
  }

  const statuses: IntegrationStatus[] = []

  // Add all providers, marking which ones are configured
  for (const [provider, info] of Object.entries(PROVIDER_INFO)) {
    const integration = integrations?.find((i) => i.provider === provider)

    statuses.push({
      provider: provider as IntegrationProvider,
      name: info.name,
      description: info.description,
      isEnabled: integration?.is_enabled ?? false,
      isConfigured: integration?.is_configured ?? false,
      isVerified: integration?.is_verified ?? false,
      isDefault: integration?.is_default_meeting_provider ?? false,
      connectedAccount: integration?.provider_metadata?.email as string | undefined,
      lastUsed: integration?.last_used_at,
    })
  }

  return statuses
}

/**
 * Get credentials for a specific provider (decrypted)
 * Only call this server-side when actually needed
 */
export async function getOrgCredentials(
  supabase: SupabaseClient,
  orgId: string,
  provider: IntegrationProvider
): Promise<Record<string, string> | null> {
  const { data: integration, error } = await supabase
    .from("organization_integrations")
    .select("credentials_encrypted, is_enabled, is_verified")
    .eq("org_id", orgId)
    .eq("provider", provider)
    .single()

  if (error || !integration?.credentials_encrypted) {
    return null
  }

  if (!integration.is_enabled) {
    return null
  }

  try {
    return decryptCredentials(integration.credentials_encrypted)
  } catch (err) {
    console.error(`Error decrypting ${provider} credentials:`, err)
    return null
  }
}

/**
 * Save credentials for a provider (encrypted)
 */
export async function saveOrgCredentials(
  supabase: SupabaseClient,
  orgId: string,
  provider: IntegrationProvider,
  credentials: Record<string, string>,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const encryptedCredentials = encryptCredentials(credentials)

    const { error } = await supabase
      .from("organization_integrations")
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
      console.error("Error saving credentials:", error)
      return { success: false, error: "Failed to save credentials" }
    }

    return { success: true }
  } catch (err) {
    console.error("Error encrypting credentials:", err)
    return { success: false, error: "Failed to encrypt credentials" }
  }
}

/**
 * Toggle integration enabled/disabled
 */
export async function toggleOrgIntegration(
  supabase: SupabaseClient,
  orgId: string,
  provider: IntegrationProvider,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("organization_integrations")
    .update({
      is_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("org_id", orgId)
    .eq("provider", provider)

  if (error) {
    return { success: false, error: "Failed to update integration" }
  }

  return { success: true }
}

/**
 * Set default meeting provider for organization
 */
export async function setDefaultMeetingProvider(
  supabase: SupabaseClient,
  orgId: string,
  provider: "zoom" | "microsoft" | "google"
): Promise<{ success: boolean; error?: string }> {
  // First, unset all defaults
  await supabase
    .from("organization_integrations")
    .update({ is_default_meeting_provider: false })
    .eq("org_id", orgId)
    .in("provider", ["zoom", "microsoft", "google"])

  // Set the new default
  const { error } = await supabase
    .from("organization_integrations")
    .update({
      is_default_meeting_provider: true,
      updated_at: new Date().toISOString(),
    })
    .eq("org_id", orgId)
    .eq("provider", provider)

  if (error) {
    return { success: false, error: "Failed to set default provider" }
  }

  return { success: true }
}

/**
 * Mark integration as verified after successful test
 */
export async function markIntegrationVerified(
  supabase: SupabaseClient,
  orgId: string,
  provider: IntegrationProvider,
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
    .from("organization_integrations")
    .update(updateData)
    .eq("org_id", orgId)
    .eq("provider", provider)

  return { success: !error }
}

/**
 * Delete integration credentials
 */
export async function deleteOrgIntegration(
  supabase: SupabaseClient,
  orgId: string,
  provider: IntegrationProvider
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("organization_integrations")
    .delete()
    .eq("org_id", orgId)
    .eq("provider", provider)

  if (error) {
    return { success: false, error: "Failed to delete integration" }
  }

  return { success: true }
}

/**
 * Get the default meeting provider for an organization
 */
export async function getDefaultMeetingProvider(
  supabase: SupabaseClient,
  orgId: string
): Promise<"zoom" | "microsoft" | "google" | "none"> {
  const { data } = await supabase
    .from("organization_integrations")
    .select("provider")
    .eq("org_id", orgId)
    .eq("is_enabled", true)
    .eq("is_verified", true)
    .eq("is_default_meeting_provider", true)
    .in("provider", ["zoom", "microsoft", "google"])
    .single()

  return (data?.provider as "zoom" | "microsoft" | "google") || "none"
}
