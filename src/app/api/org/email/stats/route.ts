/**
 * Email Analytics/Stats API
 *
 * Returns email statistics for an organization
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserAuthInfo } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org
    const authInfo = await getUserAuthInfo(supabase, user.id)
    if (!authInfo?.orgId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const orgId = authInfo.orgId

    // Get query params for date range
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30', 10)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get total emails sent
    const { count: totalSent } = await supabase
      .from('organization_email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('created_at', startDate.toISOString())

    // Get emails by status
    const { data: statusCounts } = await supabase
      .from('organization_email_logs')
      .select('status')
      .eq('org_id', orgId)
      .gte('created_at', startDate.toISOString())

    const byStatus: Record<string, number> = {}
    statusCounts?.forEach((row) => {
      byStatus[row.status] = (byStatus[row.status] || 0) + 1
    })

    // Get open rate
    const opened = byStatus['opened'] || 0
    const clicked = byStatus['clicked'] || 0
    const delivered = (byStatus['delivered'] || 0) + opened + clicked
    const bounced = byStatus['bounced'] || 0
    const failed = byStatus['failed'] || 0

    const openRate = delivered > 0 ? ((opened + clicked) / delivered) * 100 : 0
    const clickRate = (opened + clicked) > 0 ? (clicked / (opened + clicked)) * 100 : 0
    const bounceRate = totalSent ? (bounced / totalSent) * 100 : 0
    const deliveryRate = totalSent ? (delivered / totalSent) * 100 : 0

    // Get recent activity (last 7 days by day)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentLogs } = await supabase
      .from('organization_email_logs')
      .select('created_at, status')
      .eq('org_id', orgId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    // Group by day
    const dailyStats: Record<
      string,
      { sent: number; delivered: number; opened: number; clicked: number; bounced: number }
    > = {}

    recentLogs?.forEach((log) => {
      const day = new Date(log.created_at).toISOString().split('T')[0]
      if (!dailyStats[day]) {
        dailyStats[day] = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 }
      }
      dailyStats[day].sent++
      if (['delivered', 'opened', 'clicked'].includes(log.status)) {
        dailyStats[day].delivered++
      }
      if (log.status === 'opened') dailyStats[day].opened++
      if (log.status === 'clicked') dailyStats[day].clicked++
      if (log.status === 'bounced') dailyStats[day].bounced++
    })

    // Convert to array
    const dailyActivity = Object.entries(dailyStats)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Get top performing emails (by open rate)
    const { data: topEmails } = await supabase
      .from('organization_email_logs')
      .select('id, subject, to_email, status, open_count, click_count, created_at')
      .eq('org_id', orgId)
      .gte('created_at', startDate.toISOString())
      .order('open_count', { ascending: false })
      .limit(10)

    // Get suppression list count
    const { count: suppressedCount } = await supabase
      .from('email_suppression_list')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('is_active', true)

    // Get bounce breakdown
    const { data: bounces } = await supabase
      .from('email_bounces')
      .select('bounce_type')
      .eq('org_id', orgId)
      .gte('created_at', startDate.toISOString())

    const bounceBreakdown: Record<string, number> = {}
    bounces?.forEach((b) => {
      bounceBreakdown[b.bounce_type] = (bounceBreakdown[b.bounce_type] || 0) + 1
    })

    return NextResponse.json({
      period: { days, startDate: startDate.toISOString() },
      summary: {
        totalSent: totalSent || 0,
        delivered,
        opened: opened + clicked,
        clicked,
        bounced,
        failed,
        suppressed: suppressedCount || 0,
      },
      rates: {
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100,
      },
      byStatus,
      bounceBreakdown,
      dailyActivity,
      topEmails: topEmails || [],
    })
  } catch (err) {
    console.error('Email stats error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch email stats' },
      { status: 500 }
    )
  }
}
