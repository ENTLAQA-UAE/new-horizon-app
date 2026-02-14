/**
 * Organization Domain Management API
 *
 * GET    — Get current domain configuration (subdomain + custom domain status)
 * POST   — Save subdomain/custom domain settings
 * PUT    — Verify custom domain DNS + Vercel configuration
 * DELETE — Remove custom domain
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserAuthInfo } from '@/lib/auth'
import {
  addDomain,
  removeDomain,
  verifyDomain,
  getDomainConfig,
  checkDomainAvailability,
} from '@/lib/vercel/domain-service'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'kawadir.io'

// System-reserved subdomains that cannot be used
const RESERVED_SUBDOMAINS = ['www', 'api', 'admin', 'app', 'mail', 'smtp', 'ftp', 'ns1', 'ns2']

// Subdomain validation: lowercase alphanumeric + hyphens, 3-63 chars, no leading/trailing hyphens
const SUBDOMAIN_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/

function validateSubdomainName(name: string): string | null {
  if (!name) return 'Subdomain name is required'
  if (name.length < 3) return 'Subdomain must be at least 3 characters'
  if (name.length > 63) return 'Subdomain must be 63 characters or fewer'
  if (!SUBDOMAIN_REGEX.test(name)) return 'Subdomain can only contain lowercase letters, numbers, and hyphens (no leading/trailing hyphens)'
  if (RESERVED_SUBDOMAINS.includes(name)) return `"${name}" is a reserved name and cannot be used`
  return null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authInfo = await getUserAuthInfo(supabase, user.id)
    if (!authInfo?.orgId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    if (authInfo.role !== 'org_admin' && authInfo.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('slug, subdomain_enabled, custom_domain, custom_domain_verified')
      .eq('id', authInfo.orgId)
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({
      slug: org.slug,
      subdomain_enabled: org.subdomain_enabled ?? false,
      subdomain_url: org.subdomain_enabled ? `https://${org.slug}.${ROOT_DOMAIN}` : null,
      custom_domain: org.custom_domain,
      custom_domain_verified: org.custom_domain_verified ?? false,
      root_domain: ROOT_DOMAIN,
    })
  } catch (err) {
    console.error('[domain-api] GET error:', err)
    return NextResponse.json({ error: 'Failed to get domain config' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authInfo = await getUserAuthInfo(supabase, user.id)
    if (!authInfo?.orgId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    if (authInfo.role !== 'org_admin' && authInfo.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    // Get current org data
    const { data: org } = await supabase
      .from('organizations')
      .select('slug, subdomain_enabled, custom_domain, custom_domain_verified')
      .eq('id', authInfo.orgId)
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // ---- ACTION: Check subdomain availability ----
    if (action === 'check_subdomain') {
      const subdomain = (body.subdomain || '').trim().toLowerCase()

      // Validate format
      const validationError = validateSubdomainName(subdomain)
      if (validationError) {
        return NextResponse.json({ available: false, error: validationError }, { status: 400 })
      }

      // Check DB: no other org uses this as their slug (skip self)
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', subdomain)
        .neq('id', authInfo.orgId)
        .limit(1)

      if (existingOrg && existingOrg.length > 0) {
        return NextResponse.json({
          available: false,
          error: 'This subdomain is already taken by another organization',
        })
      }

      // Check Vercel availability
      const subdomainFull = `${subdomain}.${ROOT_DOMAIN}`
      const vercelCheck = await checkDomainAvailability(subdomainFull)
      if (!vercelCheck.available) {
        return NextResponse.json({
          available: false,
          error: vercelCheck.error || 'Subdomain not available',
        })
      }

      return NextResponse.json({ available: true })
    }

    // ---- ACTION: Enable/disable subdomain ----
    if (action === 'toggle_subdomain') {
      const enable = !!body.enabled
      const subdomain = (body.subdomain || org.slug).trim().toLowerCase()

      if (enable) {
        // Validate subdomain name
        const validationError = validateSubdomainName(subdomain)
        if (validationError) {
          return NextResponse.json({ error: validationError }, { status: 400 })
        }

        // Check DB uniqueness (no other org has this slug)
        if (subdomain !== org.slug) {
          const { data: existingOrg } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', subdomain)
            .neq('id', authInfo.orgId)
            .limit(1)

          if (existingOrg && existingOrg.length > 0) {
            return NextResponse.json(
              { error: 'This subdomain is already taken by another organization' },
              { status: 409 }
            )
          }
        }

        const subdomainFull = `${subdomain}.${ROOT_DOMAIN}`

        // Add subdomain to Vercel
        const result = await addDomain(subdomainFull)
        if (!result.success) {
          return NextResponse.json(
            { error: result.error || 'Failed to configure subdomain on Vercel' },
            { status: 502 }
          )
        }

        // Update org: enable subdomain and update slug if changed
        const updateData: Record<string, unknown> = {
          subdomain_enabled: true,
          updated_at: new Date().toISOString(),
        }
        if (subdomain !== org.slug) {
          updateData.slug = subdomain
        }

        await supabase
          .from('organizations')
          .update(updateData)
          .eq('id', authInfo.orgId)

        return NextResponse.json({
          subdomain_enabled: true,
          subdomain_url: `https://${subdomainFull}`,
          slug: subdomain,
        })
      } else {
        // Disable: remove from Vercel
        await removeDomain(`${org.slug}.${ROOT_DOMAIN}`)

        await supabase
          .from('organizations')
          .update({ subdomain_enabled: false, updated_at: new Date().toISOString() })
          .eq('id', authInfo.orgId)

        return NextResponse.json({
          subdomain_enabled: false,
          subdomain_url: null,
        })
      }
    }

    // ---- ACTION: Set custom domain ----
    if (action === 'set_custom_domain') {
      const { domain } = body

      if (!domain) {
        return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
      }

      // Validate domain format
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/
      if (!domainRegex.test(domain)) {
        return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
      }

      // Prevent using kawadir.io subdomains as custom domains
      if (domain.endsWith(`.${ROOT_DOMAIN}`)) {
        return NextResponse.json(
          { error: 'Use the subdomain option for kawadir.io subdomains' },
          { status: 400 }
        )
      }

      // Check uniqueness — no other org should have this domain
      const { data: existing } = await supabase
        .from('organizations')
        .select('id')
        .eq('custom_domain', domain)
        .neq('id', authInfo.orgId)
        .limit(1)

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: 'This domain is already in use by another organization' },
          { status: 409 }
        )
      }

      // Remove old custom domain from Vercel if one exists
      if (org.custom_domain && org.custom_domain !== domain) {
        await removeDomain(org.custom_domain)
      }

      // Add new domain to Vercel
      const result = await addDomain(domain)
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to add domain to Vercel' },
          { status: 502 }
        )
      }

      // Save to DB (unverified until DNS is confirmed)
      await supabase
        .from('organizations')
        .update({
          custom_domain: domain,
          custom_domain_verified: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authInfo.orgId)

      return NextResponse.json({
        custom_domain: domain,
        custom_domain_verified: false,
        dns_records: {
          type: 'CNAME',
          name: domain,
          value: 'cname.vercel-dns.com',
        },
        message: 'Domain added. Configure the DNS record below, then click Verify.',
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('[domain-api] POST error:', err)
    return NextResponse.json({ error: 'Failed to update domain config' }, { status: 500 })
  }
}

export async function PUT() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authInfo = await getUserAuthInfo(supabase, user.id)
    if (!authInfo?.orgId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    if (authInfo.role !== 'org_admin' && authInfo.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('custom_domain')
      .eq('id', authInfo.orgId)
      .single()

    if (!org?.custom_domain) {
      return NextResponse.json({ error: 'No custom domain configured' }, { status: 400 })
    }

    // Verify with Vercel
    const verifyResult = await verifyDomain(org.custom_domain)
    const configResult = await getDomainConfig(org.custom_domain)

    const isVerified = verifyResult.verified && configResult.config && !configResult.config.misconfigured

    await supabase
      .from('organizations')
      .update({
        custom_domain_verified: isVerified,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authInfo.orgId)

    return NextResponse.json({
      domain: org.custom_domain,
      verified: isVerified,
      dns_configured: configResult.config ? !configResult.config.misconfigured : false,
      error: !isVerified
        ? 'DNS not yet configured. Make sure your CNAME record points to cname.vercel-dns.com'
        : undefined,
    })
  } catch (err) {
    console.error('[domain-api] PUT error:', err)
    return NextResponse.json({ error: 'Failed to verify domain' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authInfo = await getUserAuthInfo(supabase, user.id)
    if (!authInfo?.orgId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    if (authInfo.role !== 'org_admin' && authInfo.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('custom_domain')
      .eq('id', authInfo.orgId)
      .single()

    if (org?.custom_domain) {
      await removeDomain(org.custom_domain)
    }

    await supabase
      .from('organizations')
      .update({
        custom_domain: null,
        custom_domain_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authInfo.orgId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[domain-api] DELETE error:', err)
    return NextResponse.json({ error: 'Failed to remove domain' }, { status: 500 })
  }
}
