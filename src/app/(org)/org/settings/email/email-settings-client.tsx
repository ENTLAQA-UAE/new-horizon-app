'use client'

/**
 * Email Settings Client Component
 *
 * Handles all email configuration UI interactions
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Mail,
  Server,
  Shield,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Loader2,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type EmailProvider = 'resend' | 'smtp' | 'sendgrid' | 'mailgun'

interface EmailConfig {
  id?: string
  org_id: string
  email_provider: EmailProvider
  api_key_encrypted?: string
  sendgrid_api_key_encrypted?: string
  mailgun_api_key_encrypted?: string
  from_email: string
  from_name: string
  reply_to_email?: string
  smtp_host?: string
  smtp_port?: number
  smtp_username?: string
  smtp_password_encrypted?: string
  smtp_encryption?: string
  mailgun_domain?: string
  mailgun_region?: string
  imap_enabled?: boolean
  imap_host?: string
  imap_port?: number
  imap_username?: string
  imap_encryption?: string
  imap_mailbox?: string
  track_opens?: boolean
  track_clicks?: boolean
  domain?: string
  domain_verified?: boolean
  spf_verified?: boolean
  dkim_verified?: boolean
  dmarc_verified?: boolean
  is_enabled?: boolean
  is_verified?: boolean
  is_configured?: boolean
}

interface DomainRecord {
  id: string
  record_type: string
  record_name: string
  record_value: string
  is_verified: boolean
  last_checked_at?: string
}

interface Props {
  orgId: string
  initialConfig: EmailConfig | null
  domainRecords: DomainRecord[]
}

export function EmailSettingsClient({ orgId, initialConfig, domainRecords: initialRecords }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('provider')
  const [loading, setLoading] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [sendingTestEmail, setSendingTestEmail] = useState(false)
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false)
  const [testEmailRecipient, setTestEmailRecipient] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [provider, setProvider] = useState<EmailProvider>(initialConfig?.email_provider || 'resend')
  const [apiKey, setApiKey] = useState('')
  const [fromEmail, setFromEmail] = useState(initialConfig?.from_email || '')
  const [fromName, setFromName] = useState(initialConfig?.from_name || '')
  const [replyTo, setReplyTo] = useState(initialConfig?.reply_to_email || '')
  const [showApiKey, setShowApiKey] = useState(false)

  // SMTP settings
  const [smtpHost, setSmtpHost] = useState(initialConfig?.smtp_host || '')
  const [smtpPort, setSmtpPort] = useState(initialConfig?.smtp_port?.toString() || '587')
  const [smtpUsername, setSmtpUsername] = useState(initialConfig?.smtp_username || '')
  const [smtpPassword, setSmtpPassword] = useState('')
  const [smtpEncryption, setSmtpEncryption] = useState(initialConfig?.smtp_encryption || 'tls')

  // Mailgun settings
  const [mailgunDomain, setMailgunDomain] = useState('')
  const [mailgunRegion, setMailgunRegion] = useState<'us' | 'eu'>('us')

  // IMAP settings
  const [imapEnabled, setImapEnabled] = useState(initialConfig?.imap_enabled || false)
  const [imapHost, setImapHost] = useState(initialConfig?.imap_host || '')
  const [imapPort, setImapPort] = useState(initialConfig?.imap_port?.toString() || '993')
  const [imapUsername, setImapUsername] = useState(initialConfig?.imap_username || '')
  const [imapPassword, setImapPassword] = useState('')
  const [imapEncryption, setImapEncryption] = useState(initialConfig?.imap_encryption || 'ssl')
  const [imapMailbox, setImapMailbox] = useState(initialConfig?.imap_mailbox || 'INBOX')

  // Tracking settings
  const [trackOpens, setTrackOpens] = useState(initialConfig?.track_opens ?? true)
  const [trackClicks, setTrackClicks] = useState(initialConfig?.track_clicks ?? true)

  // Domain verification
  const [domain, setDomain] = useState(initialConfig?.domain || '')
  const [domainRecords, setDomainRecords] = useState<DomainRecord[]>(initialRecords)
  const [verifyingDomain, setVerifyingDomain] = useState(false)

  // Email enabled
  const [isEnabled, setIsEnabled] = useState(initialConfig?.is_enabled || false)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleSaveProvider = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const payload: Record<string, unknown> = {
        orgId,
        email_provider: provider,
        from_email: fromEmail,
        from_name: fromName,
        reply_to_email: replyTo || null,
        track_opens: trackOpens,
        track_clicks: trackClicks,
      }

      // Add provider-specific fields
      if (provider === 'resend' && apiKey) {
        payload.api_key = apiKey
      } else if (provider === 'sendgrid' && apiKey) {
        payload.sendgrid_api_key = apiKey
      } else if (provider === 'mailgun' && apiKey) {
        payload.mailgun_api_key = apiKey
        payload.mailgun_domain = mailgunDomain
        payload.mailgun_region = mailgunRegion
      } else if (provider === 'smtp') {
        payload.smtp_host = smtpHost
        payload.smtp_port = parseInt(smtpPort)
        payload.smtp_username = smtpUsername
        payload.smtp_encryption = smtpEncryption
        if (smtpPassword) {
          payload.smtp_password = smtpPassword
        }
      }

      const response = await fetch('/api/org/integrations/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save email settings')
      }

      showMessage('success', 'Email settings saved successfully')
      router.refresh()
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    setMessage(null)

    try {
      const response = await fetch('/api/org/integrations/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Connection test failed')
      }

      showMessage('success', 'Connection test successful!')
      router.refresh()
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Connection test failed')
    } finally {
      setTestingConnection(false)
    }
  }

  const handleOpenTestEmailDialog = () => {
    setTestEmailRecipient('')
    setTestEmailDialogOpen(true)
  }

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient || !testEmailRecipient.includes('@')) {
      showMessage('error', 'Please enter a valid email address')
      return
    }

    setSendingTestEmail(true)
    setMessage(null)

    try {
      const response = await fetch('/api/org/integrations/email/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, recipientEmail: testEmailRecipient }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send test email')
      }

      showMessage('success', data.message || `Test email sent successfully to ${testEmailRecipient}!`)
      setTestEmailDialogOpen(false)
      setTestEmailRecipient('')
      router.refresh()
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to send test email')
    } finally {
      setSendingTestEmail(false)
    }
  }

  const handleToggleEnabled = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/org/integrations/email/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, enabled: !isEnabled }),
      })

      if (!response.ok) {
        throw new Error('Failed to toggle email')
      }

      setIsEnabled(!isEnabled)
      showMessage('success', isEnabled ? 'Email disabled' : 'Email enabled')
      router.refresh()
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to toggle')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveIMAP = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/org/email/imap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          imap_enabled: imapEnabled,
          imap_host: imapHost,
          imap_port: parseInt(imapPort),
          imap_username: imapUsername,
          imap_password: imapPassword || undefined,
          imap_encryption: imapEncryption,
          imap_mailbox: imapMailbox,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save IMAP settings')
      }

      showMessage('success', 'IMAP settings saved')
      router.refresh()
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to save IMAP settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSetDomain = async () => {
    if (!domain) return
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/org/email/domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set domain')
      }

      setDomainRecords(data.records?.map((r: { type: string; name: string; value: string }) => ({
        id: r.name,
        record_type: r.type,
        record_name: r.name,
        record_value: r.value,
        is_verified: false,
      })) || [])

      showMessage('success', 'Domain set. Add the DNS records shown below.')
      router.refresh()
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to set domain')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyDomain = async () => {
    setVerifyingDomain(true)
    setMessage(null)

    try {
      const response = await fetch('/api/org/email/domain', {
        method: 'PUT',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      if (data.verified) {
        showMessage('success', 'Domain verified successfully!')
      } else {
        showMessage('error', 'Domain not fully verified. Check the records below.')
      }

      router.refresh()
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setVerifyingDomain(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showMessage('success', 'Copied to clipboard')
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <Card className={cn(
        'border-l-4',
        isEnabled && initialConfig?.is_verified
          ? 'border-l-green-500 bg-green-50'
          : 'border-l-yellow-500 bg-yellow-50'
      )}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isEnabled && initialConfig?.is_verified ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              <div>
                <p className="font-medium">
                  {isEnabled && initialConfig?.is_verified
                    ? 'Email is configured and active'
                    : 'Email requires configuration'}
                </p>
                <p className="text-sm text-gray-600">
                  {isEnabled && initialConfig?.is_verified
                    ? `Sending via ${provider.toUpperCase()} from ${initialConfig?.from_email}`
                    : 'Complete the setup to enable email sending'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="email-enabled" className="text-sm">
                {isEnabled ? 'Enabled' : 'Disabled'}
              </Label>
              <Switch
                id="email-enabled"
                checked={isEnabled}
                onCheckedChange={handleToggleEnabled}
                disabled={loading || !initialConfig?.is_verified}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="provider" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Provider
          </TabsTrigger>
          <TabsTrigger value="imap" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            IMAP Sync
          </TabsTrigger>
          <TabsTrigger value="domain" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Domain
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Provider Configuration */}
        <TabsContent value="provider" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Provider</CardTitle>
              <CardDescription>
                Choose how emails are sent from your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={provider} onValueChange={(v) => setProvider(v as EmailProvider)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resend">Resend (Recommended)</SelectItem>
                    <SelectItem value="smtp">SMTP Server</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="mailgun">Mailgun</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* API Key for Resend/SendGrid/Mailgun */}
              {['resend', 'sendgrid', 'mailgun'].includes(provider) && (
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="relative">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={initialConfig?.api_key_encrypted ? '••••••••••••' : 'Enter API key'}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Mailgun specific */}
              {provider === 'mailgun' && (
                <>
                  <div className="space-y-2">
                    <Label>Mailgun Domain</Label>
                    <Input
                      value={mailgunDomain}
                      onChange={(e) => setMailgunDomain(e.target.value)}
                      placeholder="mg.yourdomain.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Region</Label>
                    <Select value={mailgunRegion} onValueChange={(v) => setMailgunRegion(v as 'us' | 'eu')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us">US</SelectItem>
                        <SelectItem value="eu">EU</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* SMTP Configuration */}
              {provider === 'smtp' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>SMTP Host</Label>
                    <Input
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      placeholder="587"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      value={smtpUsername}
                      onChange={(e) => setSmtpUsername(e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Encryption</Label>
                    <Select value={smtpEncryption} onValueChange={setSmtpEncryption}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tls">TLS (Recommended)</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Sender Configuration */}
              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Sender Details</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>From Email *</Label>
                    <Input
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      placeholder="hr@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>From Name *</Label>
                    <Input
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      placeholder="Company HR"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Reply-To Email (optional)</Label>
                    <Input
                      value={replyTo}
                      onChange={(e) => setReplyTo(e.target.value)}
                      placeholder="support@company.com"
                    />
                  </div>
                </div>
              </div>

              {/* Tracking Settings */}
              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Tracking</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Track Opens</Label>
                      <p className="text-sm text-gray-500">Know when recipients open your emails</p>
                    </div>
                    <Switch checked={trackOpens} onCheckedChange={setTrackOpens} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Track Clicks</Label>
                      <p className="text-sm text-gray-500">Track link clicks in your emails</p>
                    </div>
                    <Switch checked={trackClicks} onCheckedChange={setTrackClicks} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={handleSaveProvider} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Settings
                </Button>
                <Button variant="outline" onClick={handleTestConnection} disabled={testingConnection}>
                  {testingConnection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Test Connection
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleOpenTestEmailDialog}
                  disabled={!initialConfig}
                  title={!initialConfig ? 'Save settings first' : 'Send a test email to verify configuration'}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IMAP Sync */}
        <TabsContent value="imap" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>IMAP Email Sync</CardTitle>
                  <CardDescription>
                    Sync incoming emails to track candidate communications
                  </CardDescription>
                </div>
                <Switch checked={imapEnabled} onCheckedChange={setImapEnabled} />
              </div>
            </CardHeader>
            {imapEnabled && (
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>IMAP Host</Label>
                    <Input
                      value={imapHost}
                      onChange={(e) => setImapHost(e.target.value)}
                      placeholder="imap.example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input
                      value={imapPort}
                      onChange={(e) => setImapPort(e.target.value)}
                      placeholder="993"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      value={imapUsername}
                      onChange={(e) => setImapUsername(e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={imapPassword}
                      onChange={(e) => setImapPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Encryption</Label>
                    <Select value={imapEncryption} onValueChange={setImapEncryption}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ssl">SSL (Recommended)</SelectItem>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Mailbox</Label>
                    <Input
                      value={imapMailbox}
                      onChange={(e) => setImapMailbox(e.target.value)}
                      placeholder="INBOX"
                    />
                  </div>
                </div>

                <Button onClick={handleSaveIMAP} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save IMAP Settings
                </Button>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Domain Verification */}
        <TabsContent value="domain" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Domain Verification</CardTitle>
              <CardDescription>
                Verify your domain to improve email deliverability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-3">
                <Input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="yourdomain.com"
                  className="flex-1"
                />
                <Button onClick={handleSetDomain} disabled={loading || !domain}>
                  Set Domain
                </Button>
              </div>

              {domainRecords.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">DNS Records</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleVerifyDomain}
                      disabled={verifyingDomain}
                    >
                      {verifyingDomain && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Verify Records
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {domainRecords.map((record) => (
                      <div
                        key={record.id}
                        className={cn(
                          'p-4 rounded-lg border',
                          record.is_verified ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={record.is_verified ? 'default' : 'secondary'}>
                                {record.record_type}
                              </Badge>
                              {record.is_verified ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            <p className="text-sm font-medium">{record.record_name}</p>
                            <p className="text-xs text-gray-600 font-mono break-all">
                              {record.record_value}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(record.record_value)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Add these DNS records to your domain registrar. DNS changes may take up to 48 hours to propagate.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <EmailAnalyticsDashboard />
        </TabsContent>
      </Tabs>

      {/* Send Test Email Dialog */}
      <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Test Email
            </DialogTitle>
            <DialogDescription>
              Enter the email address where you want to receive the test email.
              This will verify that your email configuration is working correctly.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email-recipient">Recipient Email</Label>
              <Input
                id="test-email-recipient"
                type="email"
                placeholder="your-email@example.com"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !sendingTestEmail) {
                    handleSendTestEmail()
                  }
                }}
              />
            </div>
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-1">The test email will include:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Confirmation that your configuration works</li>
                <li>Provider details ({provider.toUpperCase()})</li>
                <li>Sender information ({fromEmail || 'Not set'})</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setTestEmailDialogOpen(false)}
              disabled={sendingTestEmail}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendTestEmail}
              disabled={sendingTestEmail || !testEmailRecipient}
            >
              {sendingTestEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EmailAnalyticsDashboard() {
  const [stats, setStats] = useState<{
    summary: {
      totalSent: number
      delivered: number
      opened: number
      clicked: number
      bounced: number
    }
    rates: {
      deliveryRate: number
      openRate: number
      clickRate: number
      bounceRate: number
    }
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useState(() => {
    fetch('/api/org/email/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          No email analytics available yet
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.summary.totalSent}</div>
            <p className="text-sm text-gray-500">Total Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.rates.deliveryRate}%</div>
            <p className="text-sm text-gray-500">Delivery Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.rates.openRate}%</div>
            <p className="text-sm text-gray-500">Open Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.rates.clickRate}%</div>
            <p className="text-sm text-gray-500">Click Rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Summary (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Delivered</span>
              <span className="font-medium">{stats.summary.delivered}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Opened</span>
              <span className="font-medium">{stats.summary.opened}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Clicked</span>
              <span className="font-medium">{stats.summary.clicked}</span>
            </div>
            <div className="flex justify-between items-center text-red-600">
              <span>Bounced</span>
              <span className="font-medium">{stats.summary.bounced}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
