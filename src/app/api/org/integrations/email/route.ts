// @ts-nocheck
/**
 * Email Configuration Save Endpoint
 *
 * Saves email provider configuration for all supported providers:
 * - Resend
 * - SMTP
 * - SendGrid
 * - Mailgun
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { verifyOrgAdmin } from "@/lib/auth"
import { encryptCredentials } from "@/lib/encryption"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      orgId,
      email_provider,
      from_email,
      from_name,
      reply_to_email,
      track_opens,
      track_clicks,
      // Resend
      api_key,
      // SendGrid
      sendgrid_api_key,
      // Mailgun
      mailgun_api_key,
      mailgun_domain,
      mailgun_region,
      // SMTP
      smtp_host,
      smtp_port,
      smtp_username,
      smtp_password,
      smtp_encryption,
    } = body

    if (!orgId || !from_email || !from_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify user is admin
    const { authorized, error } = await verifyOrgAdmin(supabase, user.id, orgId)

    if (!authorized) {
      return NextResponse.json({ error: error || "Not authorized" }, { status: 403 })
    }

    // Use service client to bypass RLS
    const serviceClient = createServiceClient()

    // Build update object
    const updateData: Record<string, unknown> = {
      org_id: orgId,
      email_provider: email_provider || 'resend',
      from_email,
      from_name,
      reply_to_email: reply_to_email || null,
      track_opens: track_opens ?? true,
      track_clicks: track_clicks ?? true,
      updated_at: new Date().toISOString(),
    }

    // Handle provider-specific fields
    const provider = email_provider || 'resend'

    switch (provider) {
      case 'resend':
        if (api_key) {
          updateData.api_key_encrypted = encryptCredentials({ api_key })
          updateData.is_verified = false
          updateData.is_configured = true
        }
        break

      case 'sendgrid':
        if (sendgrid_api_key) {
          updateData.sendgrid_api_key_encrypted = encryptCredentials({ api_key: sendgrid_api_key })
          updateData.is_verified = false
          updateData.is_configured = true
        }
        break

      case 'mailgun':
        if (mailgun_api_key) {
          updateData.mailgun_api_key_encrypted = encryptCredentials({ api_key: mailgun_api_key })
          updateData.is_verified = false
          updateData.is_configured = true
        }
        if (mailgun_domain) {
          updateData.mailgun_domain = mailgun_domain
        }
        if (mailgun_region) {
          updateData.mailgun_region = mailgun_region
        }
        break

      case 'smtp':
        if (smtp_host) {
          updateData.smtp_host = smtp_host
          updateData.is_configured = true
        }
        if (smtp_port) {
          updateData.smtp_port = smtp_port
        }
        if (smtp_username) {
          updateData.smtp_username = smtp_username
        }
        if (smtp_password) {
          updateData.smtp_password_encrypted = encryptCredentials({ password: smtp_password })
          updateData.is_verified = false
        }
        if (smtp_encryption) {
          updateData.smtp_encryption = smtp_encryption
        }
        break
    }

    // Check if config exists
    const { data: existing } = await serviceClient
      .from("organization_email_config")
      .select("id")
      .eq("org_id", orgId)
      .single()

    let result
    if (existing) {
      // Update existing config
      result = await serviceClient
        .from("organization_email_config")
        .update(updateData)
        .eq("org_id", orgId)
    } else {
      // Insert new config
      updateData.created_at = new Date().toISOString()
      result = await serviceClient
        .from("organization_email_config")
        .insert(updateData)
    }

    if (result.error) {
      console.error("Error saving email config:", result.error)
      return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
