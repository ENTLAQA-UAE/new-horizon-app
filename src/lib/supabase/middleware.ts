import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Known root domains (add your production domains here)
const ROOT_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'jadarat-ats.app',
  'jadarat-ats.vercel.app',
  'vercel.app',
]

// Extract subdomain from hostname
function getSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0]

  // Check if this is a known root domain or localhost
  if (ROOT_DOMAINS.some(domain => host === domain || host.endsWith(`.${domain}`))) {
    const parts = host.split('.')

    // For localhost, no subdomain
    if (host === 'localhost' || host === '127.0.0.1') {
      return null
    }

    // For vercel.app, check if there's a subdomain before the project name
    // e.g., acme.jadarat-ats.vercel.app -> acme
    // jadarat-ats.vercel.app -> null
    if (host.endsWith('.vercel.app')) {
      // Pattern: subdomain.project.vercel.app (4 parts)
      if (parts.length >= 4) {
        return parts[0]
      }
      return null
    }

    // For jadarat-ats.app, check for subdomain
    // e.g., acme.jadarat-ats.app -> acme
    if (host.endsWith('.jadarat-ats.app') && parts.length >= 3) {
      return parts[0]
    }
  }

  return null
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

  // Detect subdomain or custom domain and lookup organization
  const hostname = request.headers.get('host') || ''
  const subdomain = getSubdomain(hostname)
  let orgSlug: string | null = null

  // First, try subdomain lookup
  if (subdomain) {
    const { data: org } = await supabase
      .from('organizations')
      .select('slug, subdomain_enabled')
      .eq('slug', subdomain)
      .eq('subdomain_enabled', true)
      .single()

    if (org) {
      orgSlug = org.slug
    }
  }

  // If no subdomain match, try custom domain lookup
  if (!orgSlug) {
    const cleanHostname = hostname.split(':')[0] // Remove port if present
    // Skip known platform domains
    const platformDomains = ['localhost', '127.0.0.1', 'jadarat-ats.app', 'vercel.app']
    const isPlatformDomain = platformDomains.some(d => cleanHostname === d || cleanHostname.endsWith(`.${d}`))

    if (!isPlatformDomain) {
      // This might be a custom domain - look it up
      const { data: org } = await supabase
        .from('organizations')
        .select('slug, custom_domain')
        .eq('custom_domain', cleanHostname)
        .single()

      if (org) {
        orgSlug = org.slug
      }
    }
  }

  // If we found an org, set headers and handle login page
  if (orgSlug) {
    supabaseResponse.headers.set('x-org-slug', orgSlug)

    // For login page, add org parameter if not already there
    if (request.nextUrl.pathname === '/login' && !request.nextUrl.searchParams.has('org')) {
      const url = request.nextUrl.clone()
      url.searchParams.set('org', orgSlug)
      // Rewrite instead of redirect to keep the original URL
      return NextResponse.rewrite(url, {
        headers: supabaseResponse.headers,
      })
    }
  }

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/auth/callback', '/careers', '/api/invites', '/portal']
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (!user && !isPublicRoute && !request.nextUrl.pathname.startsWith('/_next')) {
    // No user, redirect to login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Preserve org context in redirect
    if (orgSlug) {
      url.searchParams.set('org', orgSlug)
    }
    return NextResponse.redirect(url)
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
