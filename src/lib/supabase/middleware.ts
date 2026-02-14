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
            supabaseResponse.cookies.set(name, value, options)
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
    '/offers/respond',           // Offer accept/decline landing page
    '/onboarding', // Allow onboarding for authenticated users without org
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

  // Handle auth errors gracefully
  if (userError) {
    console.error('Middleware: Auth error:', userError.message)
    // If there's an auth error on a protected route, redirect to login
    if (!isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  if (!user && !isPublicRoute) {
    // Unauthenticated users on root → serve the landing page
    if (request.nextUrl.pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/landing'
      return NextResponse.rewrite(url)
    }
    // No user, redirect to login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // =====================================================
  // ROLE-BASED ROUTE PROTECTION
  // After auth, enforce role-based access on page routes.
  // API routes handle their own auth separately.
  // =====================================================
  const pathname = request.nextUrl.pathname

  if (user && !pathname.startsWith('/api/') && !isPublicRoute) {
    // Read role from HTTP-only cookie (zero-latency on subsequent requests)
    // Cookie format: "userId:role" — validates user matches to prevent stale cookies after logout
    let userRole: string | null = null
    const roleCookie = request.cookies.get('x-user-role')?.value || null
    if (roleCookie && roleCookie.includes(':')) {
      const [cookieUserId, cookieRole] = roleCookie.split(':')
      if (cookieUserId === user.id) {
        userRole = cookieRole
      }
      // If userId doesn't match, cookie is stale — will be refreshed below
    }

    // If no valid role cookie, query DB once and set cookie for future requests
    if (!userRole) {
      try {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        userRole = roleData?.role || null

        if (userRole) {
          supabaseResponse.cookies.set('x-user-role', `${user.id}:${userRole}`, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 4, // 4 hours
          })
        }
      } catch {
        // DB query failed — skip role enforcement, page-level checks will handle
      }
    }

    // Enforce route-role map
    if (userRole && !isRouteAllowedForRole(pathname, userRole)) {
      const url = request.nextUrl.clone()
      url.pathname = getHomeForRole(userRole)

      // Preserve Supabase auth cookies on redirect
      const redirectResponse = NextResponse.redirect(url)
      for (const cookie of supabaseResponse.cookies.getAll()) {
        redirectResponse.cookies.set(cookie.name, cookie.value)
      }
      return redirectResponse
    }
  }

  // =====================================================
  // SUBDOMAIN / CUSTOM DOMAIN RESOLUTION
  // Resolve org slug from hostname and set x-org-slug header
  // so downstream pages can read it for branded experiences.
  // =====================================================
  const hostname = request.headers.get('host') || ''
  const orgSlug = await resolveOrgSlug(hostname)

  if (orgSlug) {
    // Set header on the response for server components to read
    supabaseResponse.headers.set('x-org-slug', orgSlug)
    // Also set a cookie so client components can read it
    supabaseResponse.cookies.set('x-org-slug', orgSlug, {
      path: '/',
      httpOnly: false, // Client-readable
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 4, // 4 hours
    })
  }

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
