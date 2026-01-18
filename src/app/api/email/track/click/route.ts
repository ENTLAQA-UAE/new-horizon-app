/**
 * Email Click Tracking Endpoint
 *
 * Records the click event and redirects to the original URL
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const trackingToken = request.nextUrl.searchParams.get('t')
  const encodedUrl = request.nextUrl.searchParams.get('url')

  // Decode the original URL
  const originalUrl = encodedUrl ? decodeURIComponent(encodedUrl) : null

  // If no URL, redirect to home
  if (!originalUrl) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Validate URL to prevent open redirect attacks
  try {
    const parsed = new URL(originalUrl)
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  } catch {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Track the click if we have a token
  if (trackingToken) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Get email log by tracking token
      const { data: emailLog, error: fetchError } = await supabase
        .from('organization_email_logs')
        .select('id, org_id, click_count')
        .eq('tracking_token', trackingToken)
        .single()

      if (!fetchError && emailLog) {
        // Get request info
        const ip =
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'

        // Detect device type
        let deviceType = 'desktop'
        if (/mobile/i.test(userAgent)) {
          deviceType = 'mobile'
        } else if (/tablet|ipad/i.test(userAgent)) {
          deviceType = 'tablet'
        }

        // Record click event
        await supabase.from('email_tracking_events').insert({
          org_id: emailLog.org_id,
          email_log_id: emailLog.id,
          event_type: 'clicked',
          ip_address: ip,
          user_agent: userAgent,
          device_type: deviceType,
          link_url: originalUrl,
          event_data: { url: originalUrl },
        })

        // Update email log
        const isFirstClick = !emailLog.click_count || emailLog.click_count === 0
        await supabase
          .from('organization_email_logs')
          .update({
            status: 'clicked',
            clicked_at: isFirstClick ? new Date().toISOString() : undefined,
            click_count: (emailLog.click_count || 0) + 1,
          })
          .eq('id', emailLog.id)
      }
    } catch (err) {
      console.error('Error tracking email click:', err)
    }
  }

  // Redirect to the original URL
  return NextResponse.redirect(originalUrl)
}
