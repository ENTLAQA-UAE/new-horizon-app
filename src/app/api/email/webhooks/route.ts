/**
 * Email Webhook Handler
 *
 * Handles webhooks from email providers for:
 * - Bounces
 * - Complaints (spam reports)
 * - Deliveries
 * - Opens/Clicks (if using provider tracking)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

type WebhookProvider = 'resend' | 'sendgrid' | 'mailgun'

interface WebhookEvent {
  provider: WebhookProvider
  type: 'delivered' | 'bounced' | 'complained' | 'opened' | 'clicked'
  email: string
  messageId?: string
  timestamp: Date
  data: Record<string, unknown>
}

/**
 * Verify Resend webhook signature
 */
function verifyResendSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Verify SendGrid webhook signature
 */
function verifySendGridSignature(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string
): boolean {
  const data = timestamp + payload
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Parse Resend webhook
 */
function parseResendWebhook(body: Record<string, unknown>): WebhookEvent | null {
  const eventType = body.type as string
  const data = body.data as Record<string, unknown>

  if (!eventType || !data) return null

  let type: WebhookEvent['type']
  switch (eventType) {
    case 'email.delivered':
      type = 'delivered'
      break
    case 'email.bounced':
      type = 'bounced'
      break
    case 'email.complained':
      type = 'complained'
      break
    case 'email.opened':
      type = 'opened'
      break
    case 'email.clicked':
      type = 'clicked'
      break
    default:
      return null
  }

  return {
    provider: 'resend',
    type,
    email: data.to as string || (data.email as string),
    messageId: data.email_id as string,
    timestamp: new Date(data.created_at as string || Date.now()),
    data,
  }
}

/**
 * Parse SendGrid webhook
 */
function parseSendGridWebhook(events: Array<Record<string, unknown>>): WebhookEvent[] {
  return events
    .map((event) => {
      const eventType = event.event as string

      let type: WebhookEvent['type'] | null = null
      switch (eventType) {
        case 'delivered':
          type = 'delivered'
          break
        case 'bounce':
          type = 'bounced'
          break
        case 'spamreport':
          type = 'complained'
          break
        case 'open':
          type = 'opened'
          break
        case 'click':
          type = 'clicked'
          break
        default:
          return null
      }

      if (!type) return null

      return {
        provider: 'sendgrid' as const,
        type,
        email: event.email as string,
        messageId: event.sg_message_id as string,
        timestamp: new Date((event.timestamp as number) * 1000),
        data: event,
      }
    })
    .filter((e): e is WebhookEvent => e !== null)
}

/**
 * Parse Mailgun webhook
 */
function parseMailgunWebhook(body: Record<string, unknown>): WebhookEvent | null {
  const eventData = body['event-data'] as Record<string, unknown>
  if (!eventData) return null

  const eventType = eventData.event as string

  let type: WebhookEvent['type']
  switch (eventType) {
    case 'delivered':
      type = 'delivered'
      break
    case 'failed':
    case 'bounced':
      type = 'bounced'
      break
    case 'complained':
      type = 'complained'
      break
    case 'opened':
      type = 'opened'
      break
    case 'clicked':
      type = 'clicked'
      break
    default:
      return null
  }

  return {
    provider: 'mailgun',
    type,
    email: eventData.recipient as string,
    messageId: (eventData.message as Record<string, unknown>)?.headers?.['message-id'] as string,
    timestamp: new Date((eventData.timestamp as number) * 1000),
    data: eventData,
  }
}

/**
 * Process webhook event
 */
async function processEvent(
  supabase: ReturnType<typeof createClient>,
  event: WebhookEvent
): Promise<void> {
  // Find the email log by message ID
  let emailLog = null
  if (event.messageId) {
    const { data } = await supabase
      .from('organization_email_logs')
      .select('id, org_id, to_email')
      .eq('provider_message_id', event.messageId)
      .single()
    emailLog = data
  }

  // If no email log found, try to find by email address
  if (!emailLog && event.email) {
    const { data } = await supabase
      .from('organization_email_logs')
      .select('id, org_id, to_email')
      .eq('to_email', event.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    emailLog = data
  }

  const orgId = emailLog?.org_id

  // Record the event if we have an email log
  if (emailLog) {
    await supabase.from('email_tracking_events').insert({
      org_id: orgId,
      email_log_id: emailLog.id,
      event_type: event.type,
      event_data: event.data,
      occurred_at: event.timestamp.toISOString(),
    })

    // Update email log status
    if (event.type === 'delivered') {
      await supabase
        .from('organization_email_logs')
        .update({ status: 'delivered' })
        .eq('id', emailLog.id)
    } else if (event.type === 'bounced') {
      await supabase
        .from('organization_email_logs')
        .update({
          status: 'bounced',
          bounced_at: event.timestamp.toISOString(),
          bounce_type: (event.data.bounce_type as string) || 'unknown',
        })
        .eq('id', emailLog.id)
    }
  }

  // Handle bounces - add to suppression list
  if (event.type === 'bounced' && event.email && orgId) {
    const bounceData = event.data as Record<string, unknown>
    const bounceType = (bounceData.bounce_type as string) || 'hard'

    // Record bounce
    await supabase.from('email_bounces').insert({
      org_id: orgId,
      email_log_id: emailLog?.id,
      email_address: event.email.toLowerCase(),
      bounce_type: bounceType,
      bounce_subtype: bounceData.bounce_subtype as string,
      diagnostic_code: bounceData.diagnostic_code as string,
      provider: event.provider,
      provider_bounce_id: event.messageId,
    })

    // Add hard bounces to suppression list
    if (bounceType === 'hard') {
      await supabase.from('email_suppression_list').upsert(
        {
          org_id: orgId,
          email_address: event.email.toLowerCase(),
          reason: 'hard_bounce',
          source_email_log_id: emailLog?.id,
        },
        {
          onConflict: 'org_id,email_address',
        }
      )
    }
  }

  // Handle complaints - add to suppression list
  if (event.type === 'complained' && event.email && orgId) {
    await supabase.from('email_suppression_list').upsert(
      {
        org_id: orgId,
        email_address: event.email.toLowerCase(),
        reason: 'complaint',
        source_email_log_id: emailLog?.id,
      },
      {
        onConflict: 'org_id,email_address',
      }
    )
  }

  // Log webhook for debugging
  if (orgId) {
    await supabase.from('integration_webhook_logs').insert({
      org_id: orgId,
      provider: event.provider,
      event_type: event.type,
      payload: event.data,
      processed: true,
      processed_at: new Date().toISOString(),
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get raw body for signature verification
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    // Determine provider from headers or body
    let provider: WebhookProvider = 'resend'
    const userAgent = request.headers.get('user-agent') || ''

    if (userAgent.includes('SendGrid')) {
      provider = 'sendgrid'
    } else if (request.headers.get('x-mailgun-signature')) {
      provider = 'mailgun'
    } else if (body.type?.startsWith('email.')) {
      provider = 'resend'
    }

    // Verify webhook signature (if configured)
    const webhookSecret = process.env[`${provider.toUpperCase()}_WEBHOOK_SECRET`]
    if (webhookSecret) {
      let isValid = false

      switch (provider) {
        case 'resend': {
          const signature = request.headers.get('svix-signature') || ''
          isValid = verifyResendSignature(rawBody, signature, webhookSecret)
          break
        }
        case 'sendgrid': {
          const signature = request.headers.get('x-twilio-email-event-webhook-signature') || ''
          const timestamp = request.headers.get('x-twilio-email-event-webhook-timestamp') || ''
          isValid = verifySendGridSignature(rawBody, signature, timestamp, webhookSecret)
          break
        }
        case 'mailgun': {
          // Mailgun signature verification would go here
          isValid = true // Simplified for now
          break
        }
      }

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Parse events based on provider
    let events: WebhookEvent[] = []

    switch (provider) {
      case 'resend': {
        const event = parseResendWebhook(body)
        if (event) events = [event]
        break
      }
      case 'sendgrid': {
        events = parseSendGridWebhook(Array.isArray(body) ? body : [body])
        break
      }
      case 'mailgun': {
        const event = parseMailgunWebhook(body)
        if (event) events = [event]
        break
      }
    }

    // Process each event
    for (const event of events) {
      try {
        await processEvent(supabase, event)
      } catch (err) {
        console.error('Error processing webhook event:', err)
      }
    }

    return NextResponse.json({ received: true, processed: events.length })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
