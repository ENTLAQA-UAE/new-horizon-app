/**
 * Email Open Tracking Endpoint
 *
 * Returns a 1x1 transparent pixel and records the open event
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 1x1 transparent GIF
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

export async function GET(request: NextRequest) {
  const trackingToken = request.nextUrl.searchParams.get('t')

  // Always return the pixel, even if tracking fails
  const response = new NextResponse(TRACKING_PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  })

  if (!trackingToken) {
    return response
  }

  try {
    // Use service role for tracking (no auth required)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get email log by tracking token
    const { data: emailLog, error: fetchError } = await supabase
      .from('organization_email_logs')
      .select('id, org_id, open_count')
      .eq('tracking_token', trackingToken)
      .single()

    if (fetchError || !emailLog) {
      return response
    }

    // Get request info
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
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

    // Record open event
    await supabase.from('email_tracking_events').insert({
      org_id: emailLog.org_id,
      email_log_id: emailLog.id,
      event_type: 'opened',
      ip_address: ip,
      user_agent: userAgent,
      device_type: deviceType,
      event_data: {},
    })

    // Update email log
    const isFirstOpen = !emailLog.open_count || emailLog.open_count === 0
    await supabase
      .from('organization_email_logs')
      .update({
        status: 'opened',
        opened_at: isFirstOpen ? new Date().toISOString() : undefined,
        open_count: (emailLog.open_count || 0) + 1,
      })
      .eq('id', emailLog.id)

  } catch (err) {
    console.error('Error tracking email open:', err)
  }

  return response
}
