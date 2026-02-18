"use client"

import { useState, useEffect, useCallback } from "react"
import { supabaseSelect, getCurrentUserId } from "@/lib/supabase/auth-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Loader2,
  Globe,
  Link2,
  Copy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Trash2,
  RefreshCw,
  Server,
} from "lucide-react"

interface DomainConfig {
  slug: string
  subdomain_enabled: boolean
  subdomain_url: string | null
  custom_domain: string | null
  custom_domain_verified: boolean
  root_domain: string
}

export default function DomainSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [config, setConfig] = useState<DomainConfig | null>(null)
  const [customDomainInput, setCustomDomainInput] = useState("")
  const [subdomainInput, setSubdomainInput] = useState("")
  const [subdomainAvailability, setSubdomainAvailability] = useState<{
    checked: boolean
    available: boolean | null
    error: string | null
  }>({ checked: false, available: null, error: null })
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false)
  const [isTogglingSubdomain, setIsTogglingSubdomain] = useState(false)
  const [isSavingDomain, setIsSavingDomain] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/org/domain")
      if (!response.ok) throw new Error("Failed to load")
      const data = await response.json()
      setConfig(data)
      setSubdomainInput(data.slug || "")
      if (data.custom_domain) {
        setCustomDomainInput(data.custom_domain)
      }
    } catch (err) {
      console.error("Failed to load domain config:", err)
      toast.error("Failed to load domain settings")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      toast.success("Copied to clipboard")
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error("Failed to copy")
    }
  }

  const handleCheckSubdomain = async () => {
    const name = subdomainInput.trim().toLowerCase()
    if (!name) {
      setSubdomainAvailability({ checked: true, available: false, error: "Subdomain name is required" })
      return
    }

    setIsCheckingSubdomain(true)
    setSubdomainAvailability({ checked: false, available: null, error: null })

    try {
      const response = await fetch("/api/org/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check_subdomain", subdomain: name }),
      })

      const data = await response.json()

      if (data.available) {
        setSubdomainAvailability({ checked: true, available: true, error: null })
      } else {
        setSubdomainAvailability({ checked: true, available: false, error: data.error || "Not available" })
      }
    } catch {
      setSubdomainAvailability({ checked: true, available: false, error: "Failed to check availability" })
    } finally {
      setIsCheckingSubdomain(false)
    }
  }

  const handleToggleSubdomain = async (enabled: boolean) => {
    const subdomain = subdomainInput.trim().toLowerCase()

    // Require availability check before enabling
    if (enabled && !subdomainAvailability.available) {
      toast.error("Please check subdomain availability first")
      return
    }

    setIsTogglingSubdomain(true)
    try {
      const response = await fetch("/api/org/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_subdomain", enabled, subdomain }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to update")

      setConfig((prev) =>
        prev
          ? {
              ...prev,
              slug: data.slug || prev.slug,
              subdomain_enabled: data.subdomain_enabled,
              subdomain_url: data.subdomain_url,
            }
          : prev
      )
      // Reset availability state after successful enable
      if (enabled) {
        setSubdomainAvailability({ checked: false, available: null, error: null })
      }
      toast.success(enabled ? "Subdomain enabled" : "Subdomain disabled")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle subdomain")
    } finally {
      setIsTogglingSubdomain(false)
    }
  }

  const handleSetCustomDomain = async () => {
    const domain = customDomainInput.trim().toLowerCase()
    if (!domain) {
      toast.error("Please enter a domain")
      return
    }

    setIsSavingDomain(true)
    try {
      const response = await fetch("/api/org/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_custom_domain", domain }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to save domain")

      setConfig((prev) =>
        prev
          ? {
              ...prev,
              custom_domain: data.custom_domain,
              custom_domain_verified: data.custom_domain_verified,
            }
          : prev
      )
      toast.success("Domain saved. Configure DNS records, then verify.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save domain")
    } finally {
      setIsSavingDomain(false)
    }
  }

  const handleVerifyDomain = async () => {
    setIsVerifying(true)
    try {
      const response = await fetch("/api/org/domain", { method: "PUT" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Verification failed")

      setConfig((prev) =>
        prev ? { ...prev, custom_domain_verified: data.verified } : prev
      )

      if (data.verified) {
        toast.success("Domain verified successfully!")
      } else {
        toast.error(data.error || "DNS not yet configured. Please check your DNS records.")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleRemoveDomain = async () => {
    setIsRemoving(true)
    try {
      const response = await fetch("/api/org/domain", { method: "DELETE" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to remove")

      setConfig((prev) =>
        prev
          ? { ...prev, custom_domain: null, custom_domain_verified: false }
          : prev
      )
      setCustomDomainInput("")
      toast.success("Custom domain removed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove domain")
    } finally {
      setIsRemoving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load domain settings</p>
      </div>
    )
  }

  const subdomainUrl = `https://${config.slug}.${config.root_domain}`

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Domain Management</h2>
        <p className="text-muted-foreground">
          Configure your organization&apos;s subdomain and custom domain
        </p>
      </div>

      {/* Subdomain Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Subdomain
          </CardTitle>
          <CardDescription>
            Enable a subdomain for your organization. Your login and career pages will
            be accessible at your chosen subdomain.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subdomain name input (shown when NOT yet enabled) */}
          {!config.subdomain_enabled && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="subdomain_name">Subdomain Name</Label>
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 items-center">
                    <Input
                      id="subdomain_name"
                      placeholder="your-org-name"
                      value={subdomainInput}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                        setSubdomainInput(val)
                        // Reset availability when input changes
                        setSubdomainAvailability({ checked: false, available: null, error: null })
                      }}
                      disabled={isCheckingSubdomain || isTogglingSubdomain}
                      className="rounded-r-none"
                    />
                    <span className="inline-flex items-center rounded-r-md border border-l-0 bg-muted px-3 py-2 text-sm text-muted-foreground h-10 whitespace-nowrap">
                      .{config.root_domain}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleCheckSubdomain}
                    disabled={isCheckingSubdomain || !subdomainInput.trim()}
                  >
                    {isCheckingSubdomain ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Check
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Lowercase letters, numbers, and hyphens only. Minimum 3 characters.
                </p>
              </div>

              {/* Availability result */}
              {subdomainAvailability.checked && (
                <div className={`flex items-center gap-2 text-sm rounded-md px-3 py-2 ${
                  subdomainAvailability.available
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {subdomainAvailability.available ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                      <span><strong>{subdomainInput}.{config.root_domain}</strong> is available!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{subdomainAvailability.error}</span>
                    </>
                  )}
                </div>
              )}

              {/* Enable button */}
              <Button
                onClick={() => handleToggleSubdomain(true)}
                disabled={
                  isTogglingSubdomain ||
                  !subdomainInput.trim() ||
                  !subdomainAvailability.available
                }
                className="w-full"
              >
                {isTogglingSubdomain ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Configuring...
                  </>
                ) : (
                  "Enable Subdomain"
                )}
              </Button>
            </div>
          )}

          {/* Active subdomain display (shown when enabled) */}
          {config.subdomain_enabled && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Your subdomain URL</span>
                  </div>
                  <Badge variant="success" className="text-xs">Active</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-md bg-background px-3 py-2 text-sm font-mono border">
                    {subdomainUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(subdomainUrl, "subdomain")}
                  >
                    {copied === "subdomain" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={subdomainUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This subdomain is auto-configured and ready to use immediately.
                </p>
              </div>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => handleToggleSubdomain(false)}
                disabled={isTogglingSubdomain}
              >
                {isTogglingSubdomain ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Disable Subdomain
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Domain Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Custom Domain
          </CardTitle>
          <CardDescription>
            Connect your own domain (e.g., <strong>hire.yourcompany.com</strong>) to your organization.
            You&apos;ll need to configure DNS records at your domain provider.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Domain Input */}
          <div className="space-y-2">
            <Label htmlFor="custom_domain">Domain Name</Label>
            <div className="flex gap-2">
              <Input
                id="custom_domain"
                placeholder="hire.yourcompany.com"
                value={customDomainInput}
                onChange={(e) => setCustomDomainInput(e.target.value)}
                disabled={isSavingDomain}
              />
              <Button
                onClick={handleSetCustomDomain}
                disabled={isSavingDomain || !customDomainInput.trim()}
              >
                {isSavingDomain ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : config.custom_domain ? (
                  "Update"
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>

          {/* DNS Instructions — shown when domain is saved */}
          {config.custom_domain && (
            <>
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                {config.custom_domain_verified ? (
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Pending DNS Configuration
                  </Badge>
                )}
              </div>

              {/* DNS Records Table */}
              {!config.custom_domain_verified && (
                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                  <p className="text-sm font-medium">
                    Add this DNS record at your domain provider:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Type</th>
                          <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Name</th>
                          <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Value</th>
                          <th className="text-left py-2 font-medium text-muted-foreground">TTL</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2 pr-4">
                            <Badge variant="outline">CNAME</Badge>
                          </td>
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-1">
                              <code className="text-xs bg-background px-2 py-1 rounded border">
                                {config.custom_domain}
                              </code>
                              <button
                                onClick={() => handleCopy(config.custom_domain!, "dns-name")}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {copied === "dns-name" ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-1">
                              <code className="text-xs bg-background px-2 py-1 rounded border">
                                cname.vercel-dns.com
                              </code>
                              <button
                                onClick={() => handleCopy("cname.vercel-dns.com", "dns-value")}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {copied === "dns-value" ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-2">
                            <code className="text-xs bg-background px-2 py-1 rounded border">3600</code>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    DNS changes can take up to 48 hours to propagate, but usually happen within minutes.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleVerifyDomain}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Verify DNS
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={handleRemoveDomain}
                  disabled={isRemoving}
                >
                  {isRemoving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Remove Domain
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
