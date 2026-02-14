/**
 * Vercel Domain Service
 *
 * Manages custom domains on the Vercel project via the Vercel REST API.
 * Used to auto-configure subdomains (slug.kawadir.io) and custom domains.
 *
 * Required env vars:
 *   VERCEL_API_TOKEN  — Bearer token for Vercel API
 *   VERCEL_PROJECT_ID — Project ID from Vercel dashboard
 *   VERCEL_TEAM_ID    — (Optional) Team ID if project belongs to a team
 */

const VERCEL_API_URL = 'https://api.vercel.com'

function getVercelHeaders(): HeadersInit {
  const token = process.env.VERCEL_API_TOKEN
  if (!token) throw new Error('VERCEL_API_TOKEN is not configured')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

function getProjectId(): string {
  const id = process.env.VERCEL_PROJECT_ID
  if (!id) throw new Error('VERCEL_PROJECT_ID is not configured')
  return id
}

function getTeamQuery(): string {
  const teamId = process.env.VERCEL_TEAM_ID
  return teamId ? `?teamId=${teamId}` : ''
}

export interface VercelDomain {
  name: string
  verified: boolean
  configured: boolean
  error?: { code: string; message: string }
}

export interface VercelDomainConfig {
  misconfigured: boolean
  aValues?: string[]
  cnameValue?: string
}

/**
 * Add a domain to the Vercel project.
 * For subdomains like slug.kawadir.io, Vercel auto-configures them
 * if the wildcard *.kawadir.io is already added.
 * For custom domains, the user must configure DNS manually.
 */
export async function addDomain(domain: string): Promise<{
  success: boolean
  domain?: VercelDomain
  error?: string
}> {
  try {
    const projectId = getProjectId()
    const teamQuery = getTeamQuery()

    const response = await fetch(
      `${VERCEL_API_URL}/v10/projects/${projectId}/domains${teamQuery}`,
      {
        method: 'POST',
        headers: getVercelHeaders(),
        body: JSON.stringify({ name: domain }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      // Domain already exists is not an error for our use case
      if (data.error?.code === 'domain_already_in_use') {
        return {
          success: true,
          domain: { name: domain, verified: true, configured: true },
        }
      }
      return {
        success: false,
        error: data.error?.message || `Vercel API error: ${response.status}`,
      }
    }

    return {
      success: true,
      domain: {
        name: data.name,
        verified: data.verified ?? false,
        configured: !data.misconfigured,
      },
    }
  } catch (err) {
    console.error('[vercel-domain] addDomain error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to add domain to Vercel',
    }
  }
}

/**
 * Remove a domain from the Vercel project.
 */
export async function removeDomain(domain: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const projectId = getProjectId()
    const teamQuery = getTeamQuery()

    const response = await fetch(
      `${VERCEL_API_URL}/v10/projects/${projectId}/domains/${domain}${teamQuery}`,
      {
        method: 'DELETE',
        headers: getVercelHeaders(),
      }
    )

    if (!response.ok) {
      const data = await response.json()
      // Domain not found is fine — already removed
      if (response.status === 404) {
        return { success: true }
      }
      return {
        success: false,
        error: data.error?.message || `Vercel API error: ${response.status}`,
      }
    }

    return { success: true }
  } catch (err) {
    console.error('[vercel-domain] removeDomain error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to remove domain from Vercel',
    }
  }
}

/**
 * Get the DNS configuration status for a domain on Vercel.
 * Returns whether the domain is correctly configured.
 */
export async function getDomainConfig(domain: string): Promise<{
  success: boolean
  config?: VercelDomainConfig
  error?: string
}> {
  try {
    const projectId = getProjectId()
    const teamQuery = getTeamQuery()

    const response = await fetch(
      `${VERCEL_API_URL}/v6/domains/${domain}/config${teamQuery}`,
      {
        method: 'GET',
        headers: getVercelHeaders(),
      }
    )

    if (!response.ok) {
      const data = await response.json()
      return {
        success: false,
        error: data.error?.message || `Vercel API error: ${response.status}`,
      }
    }

    const data = await response.json()

    return {
      success: true,
      config: {
        misconfigured: data.misconfigured ?? true,
        aValues: data.aValues,
        cnameValue: data.cnames?.[0]?.value,
      },
    }
  } catch (err) {
    console.error('[vercel-domain] getDomainConfig error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to get domain config',
    }
  }
}

/**
 * Verify a domain on Vercel (triggers DNS check).
 */
export async function verifyDomain(domain: string): Promise<{
  success: boolean
  verified: boolean
  error?: string
}> {
  try {
    const projectId = getProjectId()
    const teamQuery = getTeamQuery()

    const response = await fetch(
      `${VERCEL_API_URL}/v10/projects/${projectId}/domains/${domain}/verify${teamQuery}`,
      {
        method: 'POST',
        headers: getVercelHeaders(),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        verified: false,
        error: data.error?.message || `Vercel API error: ${response.status}`,
      }
    }

    return {
      success: true,
      verified: data.verified ?? false,
    }
  } catch (err) {
    console.error('[vercel-domain] verifyDomain error:', err)
    return {
      success: false,
      verified: false,
      error: err instanceof Error ? err.message : 'Failed to verify domain',
    }
  }
}
