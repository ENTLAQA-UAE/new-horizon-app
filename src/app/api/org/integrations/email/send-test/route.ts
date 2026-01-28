// @ts-nocheck
// Note: Type inference issues with provider string type
/**
 * Send Test Email Endpoint
 *
 * Sends a test email to verify the full email configuration is working.
 * This proves that credentials, sender details, and delivery all work correctly.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { verifyOrgAdmin } from "@/lib/auth"
import { decryptCredentials } from "@/lib/encryption"
import { createEmailProvider } from "@/lib/email/providers"
import type { EmailProviderConfig } from "@/lib/email/providers/types"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { orgId, recipientEmail } = await request.json()

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 })
    }

    // Use the user's email if no recipient specified
    const testEmail = recipientEmail || user.email

    if (!testEmail) {
      return NextResponse.json({ error: "No recipient email provided" }, { status: 400 })
    }

    // Verify user is admin
    const { authorized, error } = await verifyOrgAdmin(supabase, user.id, orgId)

    if (!authorized) {
      return NextResponse.json({ error: error || "Not authorized" }, { status: 403 })
    }

    // Get organization's email configuration
    const serviceClient = createServiceClient()
    const { data: config, error: configError } = await serviceClient
      .from("organization_email_config")
      .select("*")
      .eq("org_id", orgId)
      .single()

    if (configError || !config) {
      return NextResponse.json({
        success: false,
        error: "Email configuration not found. Please configure email settings first.",
      })
    }

    const provider = config.email_provider || "resend"

    // Sanitize email addresses - remove angle brackets and extract email
    const sanitizeEmail = (email: string): string => {
      if (!email) return email
      const match = email.match(/<([^>]+)>/) || email.match(/([^\s<>]+@[^\s<>]+)/)
      return match ? match[1].trim() : email.trim()
    }

    const cleanFromEmail = sanitizeEmail(config.from_email)
    const cleanReplyTo = config.reply_to_email ? sanitizeEmail(config.reply_to_email) : undefined

    // Build provider configuration
    let providerConfig: EmailProviderConfig = {
      provider,
      fromEmail: cleanFromEmail,
      fromName: config.from_name,
      replyTo: cleanReplyTo,
      trackOpens: false, // Don't track test emails
      trackClicks: false,
    }

    try {
      switch (provider) {
        case "resend": {
          if (!config.api_key_encrypted) {
            return NextResponse.json({
              success: false,
              error: "Resend API key not configured",
            })
          }
          const credentials = decryptCredentials(config.api_key_encrypted)
          providerConfig.resendApiKey = credentials.api_key
          break
        }

        case "smtp": {
          if (!config.smtp_host) {
            return NextResponse.json({
              success: false,
              error: "SMTP host not configured",
            })
          }
          providerConfig.smtpHost = config.smtp_host
          providerConfig.smtpPort = config.smtp_port || 587
          providerConfig.smtpUsername = config.smtp_username
          providerConfig.smtpEncryption = config.smtp_encryption || "tls"

          if (config.smtp_password_encrypted) {
            const credentials = decryptCredentials(config.smtp_password_encrypted)
            providerConfig.smtpPassword = credentials.password
          }
          break
        }

        case "sendgrid": {
          if (!config.sendgrid_api_key_encrypted) {
            return NextResponse.json({
              success: false,
              error: "SendGrid API key not configured",
            })
          }
          const credentials = decryptCredentials(config.sendgrid_api_key_encrypted)
          providerConfig.sendgridApiKey = credentials.api_key
          break
        }

        case "mailgun": {
          if (!config.mailgun_api_key_encrypted || !config.mailgun_domain) {
            return NextResponse.json({
              success: false,
              error: "Mailgun API key or domain not configured",
            })
          }
          const credentials = decryptCredentials(config.mailgun_api_key_encrypted)
          providerConfig.mailgunApiKey = credentials.api_key
          providerConfig.mailgunDomain = config.mailgun_domain
          providerConfig.mailgunRegion = config.mailgun_region || "us"
          break
        }

        default:
          return NextResponse.json({
            success: false,
            error: `Unknown email provider: ${provider}`,
          })
      }
    } catch (decryptError) {
      console.error("Error decrypting credentials:", decryptError)
      return NextResponse.json({
        success: false,
        error: "Failed to decrypt credentials. Please reconfigure the email settings.",
      })
    }

    // Create provider and send test email
    const emailProvider = createEmailProvider(providerConfig)

    const result = await emailProvider.send({
      to: testEmail,
      subject: "Test Email from Jadarat ATS",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Email Configuration Test</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              <strong>Congratulations!</strong> Your email configuration is working correctly.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #374151;">Configuration Details:</h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
                <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
                  <strong>Provider:</strong> ${provider.charAt(0).toUpperCase() + provider.slice(1)}
                </li>
                <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
                  <strong>From:</strong> ${config.from_name} &lt;${cleanFromEmail}&gt;
                </li>
                <li style="padding: 8px 0;">
                  <strong>Sent at:</strong> ${new Date().toLocaleString()}
                </li>
              </ul>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
              This is a test email sent from Jadarat ATS to verify your email settings.
              You can now use email features like interview invitations, application confirmations, and more.
            </p>
          </div>
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">Sent by Jadarat ATS</p>
          </div>
        </body>
        </html>
      `,
      text: `
Email Configuration Test

Congratulations! Your email configuration is working correctly.

Configuration Details:
- Provider: ${provider.charAt(0).toUpperCase() + provider.slice(1)}
- From: ${config.from_name} <${cleanFromEmail}>
- Sent at: ${new Date().toLocaleString()}

This is a test email sent from Jadarat ATS to verify your email settings.
You can now use email features like interview invitations, application confirmations, and more.
      `.trim(),
    })

    if (result.success) {
      // Update verification status
      await serviceClient
        .from("organization_email_config")
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("org_id", orgId)

      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
        messageId: result.messageId,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || "Failed to send test email",
      })
    }
  } catch (err) {
    console.error("Send test email error:", err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to send test email",
    })
  }
}
