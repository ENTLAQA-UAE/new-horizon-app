// @ts-nocheck
// Note: organization_email_config table columns not in types
/**
 * IMAP Configuration API
 *
 * POST - Save IMAP settings
 * PUT - Trigger email sync
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserAuthInfo } from '@/lib/auth'
import { encryptCredentials } from '@/lib/encryption'
import { testIMAPConnection, syncOrgEmails } from '@/lib/email/imap'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
    const {
      imap_enabled,
      imap_host,
      imap_port,
      imap_username,
      imap_password,
      imap_encryption,
      imap_mailbox,
    } = body

    // Build update object
    const updateData: Record<string, unknown> = {
      imap_enabled: imap_enabled ?? false,
      imap_host: imap_host || null,
      imap_port: imap_port || 993,
      imap_username: imap_username || null,
      imap_encryption: imap_encryption || 'ssl',
      imap_mailbox: imap_mailbox || 'INBOX',
      updated_at: new Date().toISOString(),
    }

    // Encrypt password if provided
    if (imap_password) {
      updateData.imap_password_encrypted = encryptCredentials({ password: imap_password })
    }

    // Test connection if enabling IMAP
    if (imap_enabled && imap_host && imap_username) {
      // Get existing password if not provided
      let password = imap_password
      if (!password) {
        const { data: config } = await supabase
          .from('organization_email_config')
          .select('imap_password_encrypted')
          .eq('org_id', authInfo.orgId)
          .single()

        if (config?.imap_password_encrypted) {
          const { decryptCredentials } = await import('@/lib/encryption')
          const creds = decryptCredentials(config.imap_password_encrypted)
          password = creds.password
        }
      }

      if (password) {
        const testResult = await testIMAPConnection({
          host: imap_host,
          port: imap_port || 993,
          username: imap_username,
          password,
          encryption: imap_encryption || 'ssl',
          mailbox: imap_mailbox || 'INBOX',
        })

        if (!testResult.success) {
          return NextResponse.json(
            { error: `IMAP connection failed: ${testResult.error}` },
            { status: 400 }
          )
        }
      }
    }

    // Update configuration
    const { error } = await supabase
      .from('organization_email_config')
      .update(updateData)
      .eq('org_id', authInfo.orgId)

    if (error) {
      // If no row exists, insert one
      if (error.code === 'PGRST116') {
        await supabase.from('organization_email_config').insert({
          org_id: authInfo.orgId,
          from_email: 'noreply@example.com',
          from_name: 'Organization',
          ...updateData,
        })
      } else {
        throw error
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('IMAP config error:', err)
    return NextResponse.json(
      { error: 'Failed to save IMAP configuration' },
      { status: 500 }
    )
  }
}

export async function PUT() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

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

    // Get last UID for incremental sync
    const { data: config } = await supabase
      .from('organization_email_config')
      .select('imap_last_uid')
      .eq('org_id', authInfo.orgId)
      .single()

    // Trigger sync
    const result = await syncOrgEmails(supabase, authInfo.orgId, {
      sinceUid: config?.imap_last_uid || 0,
      limit: 100, // Process up to 100 emails at a time
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('IMAP sync error:', err)
    return NextResponse.json(
      { error: 'Failed to sync emails' },
      { status: 500 }
    )
  }
}
