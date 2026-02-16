import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

// =====================================================
// SUBDOMAIN / CUSTOM DOMAIN RESOLUTION
// Extracts org slug from hostname for multi-tenant routing.
// =====================================================
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'kawadir.io'
const RESERVED_SUBDOMAINS = ['www', 'api', 'admin', 'app', 'mail', 'smtp', 'ftp', 'ns1', 'ns2']

/**
 * Extract org slug from the request hostname.
 * Returns null if this is the root domain or a system subdomain.
 */
async function resolveOrgSlug(hostname: string): Promise<string | null> {
  // Strip port for local dev (e.g., localhost:3000)
  const host = hostname.split(':')[0]

  // Check for subdomain: slug.kawadir.io
  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = host.replace(`.${ROOT_DOMAIN}`, '')
    if (subdomain && !RESERVED_SUBDOMAINS.includes(subdomain) && !subdomain.includes('.')) {
      return subdomain
    }
    return null
  }

  // Root domain or www — no org
  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) {
    return null
  }

  // Localhost / dev — no org resolution
  if (host === 'localhost' || host === '127.0.0.1') {
    return null
  }

  // Custom domain — lookup in DB using service client (bypasses RLS)
  try {
    const serviceClient = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data } = await serviceClient
      .from('organizations')
      .select('slug, custom_domain_verified')
      .eq('custom_domain', host)
      .single()

    if (data?.slug && data.custom_domain_verified) {
      return data.slug
    }
  } catch {
    // DB lookup failed — skip org resolution
  }

  return null
}

// =====================================================
// ROUTE-ROLE MAP
// Defines which roles can access which page routes.
// Ordered most-specific first — first match wins.
// super_admin bypasses all checks.
// This is a UX-level guard; API-level auth is separate.
// =====================================================
const routeRoleMap: { path: string; roles: string[] }[] = [
  // Org settings (specific sub-routes first)
  { path: '/org/settings/notifications', roles: ['hr_manager'] },
  { path: '/org/settings/integrations', roles: ['org_admin'] },
  { path: '/org/settings/email', roles: ['org_admin'] },
  { path: '/org/settings/domain', roles: ['org_admin'] },
  { path: '/org/settings', roles: ['org_admin'] },

  // Org admin only
  { path: '/org/team', roles: ['org_admin'] },
  { path: '/org/departments', roles: ['org_admin'] },
  { path: '/org/branding', roles: ['org_admin'] },
  { path: '/org/career-page', roles: ['org_admin'] },

  // HR manager only (configuration)
  { path: '/org/pipelines', roles: ['hr_manager'] },
  { path: '/org/workflows', roles: ['hr_manager'] },
  { path: '/org/offers/templates', roles: ['hr_manager'] },
  { path: '/org/scorecard-templates', roles: ['hr_manager'] },
  { path: '/org/screening-questions', roles: ['hr_manager'] },
  { path: '/org/vacancy-settings', roles: ['hr_manager'] },

  // Analytics (all org roles except hiring_manager)
  { path: '/org/analytics', roles: ['org_admin', 'hr_manager', 'recruiter', 'interviewer'] },

  // ATS core routes
  { path: '/org/jobs', roles: ['hr_manager', 'recruiter', 'hiring_manager'] },
  { path: '/org/candidates', roles: ['hr_manager', 'recruiter', 'hiring_manager'] },
  { path: '/org/applications', roles: ['hr_manager', 'recruiter', 'hiring_manager'] },
  { path: '/org/requisitions', roles: ['hr_manager', 'recruiter', 'hiring_manager'] },
  { path: '/org/offers', roles: ['hr_manager', 'recruiter'] },

  // Interviews (widest ATS access)
  { path: '/org/interviews', roles: ['hr_manager', 'recruiter', 'hiring_manager', 'interviewer'] },
  { path: '/org/scorecards', roles: ['hr_manager', 'recruiter', 'hiring_manager', 'interviewer'] },

  // Documents
  { path: '/org/documents', roles: ['hr_manager', 'recruiter'] },

  // Org dashboard (all org roles — catch-all for /org)
  { path: '/org', roles: ['org_admin', 'hr_manager', 'recruiter', 'hiring_manager', 'interviewer'] },

  // Platform routes (super_admin only)
  { path: '/admin', roles: ['super_admin'] },
  { path: '/organizations', roles: ['super_admin'] },
  { path: '/users', roles: ['super_admin'] },
  { path: '/tiers', roles: ['super_admin'] },
  { path: '/billing', roles: ['super_admin'] },
  { path: '/audit-logs', roles: ['super_admin'] },
  { path: '/settings', roles: ['super_admin'] },
]

/**
 * Check if a route is allowed for a given role.
 * Routes not in the map are allowed by default.
 */
function isRouteAllowedForRole(pathname: string, role: string): boolean {
  if (role === 'super_admin') return true

  for (const route of routeRoleMap) {
    if (pathname === route.path || pathname.startsWith(route.path + '/')) {
      return route.roles.includes(role)
    }
  }

  // Route not in map — allow through (e.g. onboarding, unknown pages)
  return true
}

/**
 * Get the appropriate home page for a role (used for redirect on denied access)
 */
function getHomeForRole(role: string): string {
  switch (role) {
    case 'super_admin': return '/admin'
    case 'candidate': return '/portal'
    default: return '/org'
  }
}

export async function updateSession(request: NextRequest) {
  // Compute cookie domain for cross-subdomain auth
  // (e.g. cookies set on kawadir.io must also be readable on entlaqa.kawadir.io)
  const reqHostname = request.headers.get('host') || ''
  const reqHost = reqHostname.split(':')[0]
  const isLocalDev = reqHost === 'localhost' || reqHost === '127.0.0.1'
  const cookieDomain = isLocalDev ? undefined : `.${ROOT_DOMAIN}`

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              ...(cookieDomain ? { domain: cookieDomain } : {}),
            })
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // the auth check. A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // Use getSession() for fast route protection (reads from cookies, no network call).
  // This is a UX-level guard — actual security is enforced by Supabase RLS policies
  // which validate the JWT on every database query.
  let user = null
  let userError = null as Error | null

  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    user = session?.user ?? null
    userError = error
  } catch {
    user = null
  }

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/auth/callback',
    '/careers',
    '/portal/login',
    '/portal/auth',
    '/api/invites',
    '/api/careers',
    '/api/auth/forgot-password', // Password reset API endpoint
    '/api/auth/reset-password',  // Password reset confirmation endpoint
    '/api/offers/respond',       // Offer accept/decline API (token-based, no auth)
    '/api/health',               // Health check endpoint (monitoring)
    '/offers/respond',           // Offer accept/decline landing page
    '/landing',    // Public landing page
  ]

  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Skip auth check for static files and Next.js internals
  const isStaticOrInternal =
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon') ||
    request.nextUrl.pathname.includes('.')

  if (isStaticOrInternal) {
    return supabaseResponse
  }

  // =====================================================
  // SUBDOMAIN / CUSTOM DOMAIN RESOLUTION
  // Resolve org slug from hostname BEFORE any redirects
  // so the cookie is set on every response (including redirects).
  // =====================================================
  const orgSlug = await resolveOrgSlug(reqHostname)

  // Helper: copy the x-org-slug cookie onto any response we create
  function applyOrgSlug(response: NextResponse) {
    if (orgSlug) {
      response.headers.set('x-org-slug', orgSlug)
      response.cookies.set('x-org-slug', orgSlug, {
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 4,
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      })
    }
    return response
  }

  // Handle auth errors gracefully
  if (userError) {
    console.error('Middleware: Auth error:', userError.message)
    // If there's an auth error on a protected route, redirect to login
    if (!isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return applyOrgSlug(NextResponse.redirect(url))
    }
    return applyOrgSlug(supabaseResponse)
  }

  // Redirect /landing to / so the landing page is only accessible at the root URL
  if (request.nextUrl.pathname === '/landing' || request.nextUrl.pathname.startsWith('/landing/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return applyOrgSlug(NextResponse.redirect(url))
  }

  if (!user && !isPublicRoute) {
    // Org subdomain/custom domain → always redirect to login
    if (orgSlug) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return applyOrgSlug(NextResponse.redirect(url))
    }
    // Unauthenticated users on root (main domain) → serve the landing page
    if (request.nextUrl.pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/landing'
      return applyOrgSlug(NextResponse.rewrite(url))
    }
    // No user, redirect to login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return applyOrgSlug(NextResponse.redirect(url))
  }

  // =====================================================
  // ROLE-BASED ROUTE PROTECTION
  // After auth, enforce role-based access on page routes.
  // API routes handle their own auth separately.
  // =====================================================
  const pathname = request.nextUrl.pathname
  const protocol = process.env.NODE_ENV === 'production' ? 'https:' : request.nextUrl.protocol

  // Helper: build a redirect response that preserves Supabase auth cookies
  function redirectWithCookies(url: string | URL) {
    const redirectResponse = NextResponse.redirect(url)
    for (const { name, value, ...options } of supabaseResponse.cookies.getAll()) {
      redirectResponse.cookies.set(name, value, options)
    }
    return redirectResponse
  }

  if (user && !pathname.startsWith('/api/') && !isPublicRoute) {
    // -------------------------------------------------
    // Resolve user role + org slug (from cookies or DB)
    // Cookie format: "userId:role:orgSlug"
    // -------------------------------------------------
    let userRole: string | null = null
    let userOrgSlug: string | null = null

    const roleCookie = request.cookies.get('x-user-role')?.value || null
    if (roleCookie) {
      const parts = roleCookie.split(':')
      if (parts.length >= 2 && parts[0] === user.id) {
        userRole = parts[1]
        userOrgSlug = parts[2] || null
      }
    }

    // If no valid cookie, query DB once and set cookie for future requests
    if (!userRole) {
      try {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .limit(1)

        if (roleError) {
          console.error('Middleware: user_roles query failed:', roleError.message)
        }
        userRole = roleData?.[0]?.role || null
      } catch (err) {
        console.error('Middleware: user_roles query exception:', err)
      }

      // Also resolve the user's org slug from profiles → organizations
      if (userRole && userRole !== 'super_admin') {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('org_id, organizations(slug)')
            .eq('id', user.id)
            .single()

          if (profileError) {
            console.error('Middleware: profile query failed:', profileError.message)
          }
          if (profileData?.organizations) {
            const org = profileData.organizations as unknown as { slug: string }
            userOrgSlug = org.slug || null
          }
        } catch (err) {
          console.error('Middleware: profile query exception:', err)
        }
      }

      // Cache role + org slug in a single cookie
      if (userRole) {
        const cookieValue = userOrgSlug
          ? `${user.id}:${userRole}:${userOrgSlug}`
          : `${user.id}:${userRole}`
        supabaseResponse.cookies.set('x-user-role', cookieValue, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 4, // 4 hours
          ...(cookieDomain ? { domain: cookieDomain } : {}),
        })
      }
    }

    // -------------------------------------------------
    // Super admins: always redirect to /admin on main domain
    // -------------------------------------------------
    if (userRole === 'super_admin') {
      if (orgSlug) {
        // On an org subdomain → redirect to main domain /admin
        const mainUrl = new URL(`${protocol}//${ROOT_DOMAIN}/admin`)
        return redirectWithCookies(mainUrl)
      }
      // On main domain at root → redirect to /admin directly (skip client-side redirect)
      if (pathname === '/') {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return redirectWithCookies(url)
      }
    }

    // -------------------------------------------------
    // Org members: enforce subdomain boundaries
    // -------------------------------------------------
    const isOrgRole = userRole && !['super_admin', 'candidate'].includes(userRole)

    if (isOrgRole && userOrgSlug) {
      // On the main domain → redirect to their org subdomain
      if (!orgSlug) {
        const orgUrl = new URL(`${protocol}//${userOrgSlug}.${ROOT_DOMAIN}${pathname}`)
        orgUrl.search = request.nextUrl.search
        return redirectWithCookies(orgUrl)
      }

      // On the WRONG org subdomain → redirect to their own
      if (orgSlug !== userOrgSlug) {
        const orgUrl = new URL(`${protocol}//${userOrgSlug}.${ROOT_DOMAIN}/org`)
        return redirectWithCookies(orgUrl)
      }
    }

    // Enforce route-role map
    if (userRole && !isRouteAllowedForRole(pathname, userRole)) {
      const url = request.nextUrl.clone()
      url.pathname = getHomeForRole(userRole)
      return applyOrgSlug(redirectWithCookies(url))
    }
  }

  // Apply org slug cookie/header to the final supabase response
  applyOrgSlug(supabaseResponse)

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
