// @ts-nocheck
/**
 * Email Provider Test Endpoint
 *
 * Tests email provider configuration for all supported providers:
 * - Resend: Tests API key by listing domains
 * - SMTP: Tests connection using nodemailer verify
 * - SendGrid: Tests API key validity
 * - Mailgun: Tests API key and domain
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { verifyOrgAdmin } from "@/lib/auth"
import { decryptCredentials } from "@/lib/encryption"
import { testEmailProvider } from "@/lib/email/providers"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { orgId } = await request.json()

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

    const provider = config.email_provider

    // Build provider configuration based on provider type
    let providerConfig: Record<string, unknown> = {
      fromEmail: config.from_email || "test@example.com",
      fromName: config.from_name || "Test",
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

    // Test the provider
    const testResult = await testEmailProvider(provider, providerConfig)

    if (testResult.success) {
      // Mark as verified
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
        message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} connection verified successfully!`,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: testResult.error || "Connection test failed",
      })
    }
  } catch (err) {
    console.error("Test error:", err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : "Test failed",
    })
  }
}
