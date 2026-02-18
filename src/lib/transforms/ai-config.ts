/**
 * AI Config Transform Layer
 *
 * Single source of truth for transforming DB rows (snake_case)
 * into typed camelCase interfaces used by all components.
 * Both SSR pages and API routes use these transforms.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonValue = string | number | boolean | null | { [key: string]: any } | any[]

export interface AIConfigView {
  id: string
  provider: string
  isEnabled: boolean
  isConfigured: boolean
  isVerified: boolean
  isDefaultProvider: boolean
  settings: JsonValue | null
  providerMetadata: JsonValue | null
  verifiedAt: string | null
  lastUsedAt: string | null
}

/**
 * Transform a raw DB row from organization_ai_config into a typed AIConfigView.
 * Used by both SSR page.tsx and API routes to ensure identical output.
 */
export function toAIConfigView(row: Record<string, unknown>): AIConfigView {
  return {
    id: (row.id as string) || "",
    provider: (row.provider as string) || "",
    isEnabled: (row.is_enabled as boolean) ?? false,
    isConfigured: (row.is_configured as boolean) ?? false,
    isVerified: (row.is_verified as boolean) ?? false,
    isDefaultProvider: (row.is_default_provider as boolean) ?? false,
    settings: (row.settings as JsonValue) ?? null,
    providerMetadata: (row.provider_metadata as JsonValue) ?? null,
    verifiedAt: (row.verified_at as string) ?? null,
    lastUsedAt: (row.last_used_at as string) ?? null,
  }
}
