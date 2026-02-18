/**
 * Integration Transform Layer
 *
 * Single source of truth for transforming DB rows (snake_case)
 * into typed camelCase interfaces used by all components.
 * Both SSR pages and API routes use these transforms.
 */

export interface IntegrationView {
  id: string
  provider: string
  isEnabled: boolean
  isConfigured: boolean
  isVerified: boolean
  isDefaultMeetingProvider: boolean
  providerMetadata: Record<string, unknown> | null
  verifiedAt: string | null
}

/**
 * Transform a raw DB row from organization_integrations into a typed IntegrationView.
 * Used by both SSR page.tsx and API routes to ensure identical output.
 */
export function toIntegrationView(row: Record<string, unknown>): IntegrationView {
  return {
    id: (row.id as string) || "",
    provider: (row.provider as string) || "",
    isEnabled: (row.is_enabled as boolean) ?? false,
    isConfigured: (row.is_configured as boolean) ?? false,
    isVerified: (row.is_verified as boolean) ?? false,
    isDefaultMeetingProvider: (row.is_default_meeting_provider as boolean) ?? false,
    providerMetadata: (row.provider_metadata as Record<string, unknown>) ?? null,
    verifiedAt: (row.verified_at as string) ?? null,
  }
}

export interface MeetingProviderView {
  provider: string
  isDefaultMeetingProvider: boolean
}

/**
 * Transform a meeting integration row (used in interviews page).
 */
export function toMeetingProviderView(row: Record<string, unknown>): MeetingProviderView {
  return {
    provider: (row.provider as string) || "",
    isDefaultMeetingProvider: (row.is_default_meeting_provider as boolean) ?? false,
  }
}
