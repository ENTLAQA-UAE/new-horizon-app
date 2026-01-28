// @ts-nocheck
// Note: email_domain_records table not in Supabase types
/**
 * Email Settings Page
 *
 * Comprehensive email configuration including:
 * - Email provider selection (Resend, SMTP, SendGrid, Mailgun)
 * - IMAP configuration for email sync
 * - Domain verification
 * - Email logs viewer
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EmailSettingsClient } from './email-settings-client'

export const metadata: Metadata = {
  title: 'Email Settings | Jadarat ATS',
  description: 'Configure email settings for your organization',
}

export default async function EmailSettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's profile and role
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) {
    redirect('/org')
  }

  // Check if user is org_admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (userRole?.role !== 'org_admin' && userRole?.role !== 'super_admin') {
    redirect('/org')
  }

  // Get email configuration
  const { data: emailConfig } = await supabase
    .from('organization_email_config')
    .select('*')
    .eq('org_id', profile.org_id)
    .single()

  // Get domain records
  const { data: domainRecords } = await supabase
    .from('email_domain_records')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('record_type')

  // Get organization info
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', profile.org_id)
    .single()

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Email Settings</h1>
        <p className="text-gray-500 mt-1">
          Configure email delivery and synchronization for {org?.name}
        </p>
      </div>

      <EmailSettingsClient
        orgId={profile.org_id}
        initialConfig={emailConfig}
        domainRecords={domainRecords || []}
      />
    </div>
  )
}
