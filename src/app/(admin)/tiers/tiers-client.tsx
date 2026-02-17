"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n"
import { supabaseInsert, supabaseUpdate, supabaseDelete } from "@/lib/supabase/auth-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, MoreHorizontal, Pencil, Trash2, Users, Check, X, Crown, Building } from "lucide-react"
import { KawadirIcon } from "@/components/ui/kawadir-icon"
import { toast } from "sonner"

const SUPPORTED_CURRENCIES = [
  { value: "SAR", label: "SAR (Saudi Riyal)" },
  { value: "USD", label: "USD (US Dollar)" },
  { value: "AED", label: "AED (UAE Dirham)" },
  { value: "EGP", label: "EGP (Egyptian Pound)" },
] as const

interface SubscriptionTier {
  id: string
  name: string
  name_ar: string | null
  price_monthly: number
  price_yearly: number
  currency: string
  max_jobs: number
  max_users: number
  max_candidates: number
  features: Record<string, boolean>
  is_active: boolean
  sort_order: number
  created_at: string
}

interface TiersClientProps {
  tiers: SubscriptionTier[]
  tierStats: Record<string, number>
}

const defaultFeatures = {
  ai_resume_parsing: true,
  ai_candidate_scoring: false,
  custom_pipelines: false,
  api_access: false,
  advanced_analytics: false,
  white_label: false,
  priority_support: false,
  sso_integration: false,
}

export function TiersClient({ tiers: initialTiers, tierStats }: TiersClientProps) {
  const router = useRouter()
  const [tiers, setTiers] = useState(initialTiers)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null)
  const { t } = useI18n()

  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    price_monthly: 0,
    price_yearly: 0,
    currency: "SAR",
    max_jobs: 10,
    max_users: 5,
    max_candidates: 100,
    features: defaultFeatures,
    sort_order: tiers.length + 1,
  })

  const resetForm = () => {
    setFormData({
      name: "",
      name_ar: "",
      price_monthly: 0,
      price_yearly: 0,
      currency: "SAR",
      max_jobs: 10,
      max_users: 5,
      max_candidates: 100,
      features: defaultFeatures,
      sort_order: tiers.length + 1,
    })
  }

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error(t("admin.tiers.enterName"))
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabaseInsert<SubscriptionTier>("subscription_tiers", {
        name: formData.name,
        name_ar: formData.name_ar || null,
        price_monthly: formData.price_monthly,
        price_yearly: formData.price_yearly,
        currency: formData.currency,
        max_jobs: formData.max_jobs,
        max_users: formData.max_users,
        max_candidates: formData.max_candidates,
        features: formData.features,
        sort_order: formData.sort_order,
        is_active: true,
      })

      if (error) throw error

      if (data) {
        setTiers([...tiers, data])
      }
      setIsCreateOpen(false)
      resetForm()
      toast.success(t("admin.tiers.createdSuccess"))
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to create tier")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedTier || !formData.name) return

    setIsLoading(true)
    try {
      const { error } = await supabaseUpdate("subscription_tiers", {
        name: formData.name,
        name_ar: formData.name_ar || null,
        price_monthly: formData.price_monthly,
        price_yearly: formData.price_yearly,
        currency: formData.currency,
        max_jobs: formData.max_jobs,
        max_users: formData.max_users,
        max_candidates: formData.max_candidates,
        features: formData.features,
        sort_order: formData.sort_order,
      }, { column: "id", value: selectedTier.id })

      if (error) throw error

      setTiers(
        tiers.map((t) =>
          t.id === selectedTier.id
            ? { ...t, ...formData, name_ar: formData.name_ar || null, currency: formData.currency }
            : t
        )
      )
      setIsEditOpen(false)
      setSelectedTier(null)
      resetForm()
      toast.success(t("admin.tiers.updatedSuccess"))
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to update tier")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (tier: SubscriptionTier) => {
    try {
      const { error } = await supabaseUpdate("subscription_tiers",
        { is_active: !tier.is_active },
        { column: "id", value: tier.id }
      )

      if (error) throw error

      setTiers(
        tiers.map((t) =>
          t.id === tier.id ? { ...t, is_active: !t.is_active } : t
        )
      )
      toast.success(tier.is_active ? t("admin.tiers.deactivatedSuccess") : t("admin.tiers.activatedSuccess"))
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to update tier")
    }
  }

  const handleDelete = async (tier: SubscriptionTier) => {
    const orgCount = tierStats[tier.id] || 0
    if (orgCount > 0) {
      toast.error(t("admin.tiers.cannotDelete").replace("{count}", String(orgCount)))
      return
    }

    if (!confirm(`Are you sure you want to delete "${tier.name}"?`)) return

    try {
      const { error } = await supabaseDelete("subscription_tiers", { column: "id", value: tier.id })

      if (error) throw error

      setTiers(tiers.filter((t) => t.id !== tier.id))
      toast.success(t("admin.tiers.deletedSuccess"))
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete tier")
    }
  }

  const openEditDialog = (tier: SubscriptionTier) => {
    setSelectedTier(tier)
    setFormData({
      name: tier.name,
      name_ar: tier.name_ar || "",
      price_monthly: tier.price_monthly,
      price_yearly: tier.price_yearly,
      currency: tier.currency || "SAR",
      max_jobs: tier.max_jobs,
      max_users: tier.max_users,
      max_candidates: tier.max_candidates,
      features: tier.features as typeof defaultFeatures,
      sort_order: tier.sort_order,
    })
    setIsEditOpen(true)
  }

  const toggleFeature = (feature: keyof typeof defaultFeatures) => {
    setFormData({
      ...formData,
      features: {
        ...formData.features,
        [feature]: !formData.features[feature],
      },
    })
  }

  const getTierIcon = (tierName: string) => {
    const name = tierName.toLowerCase()
    if (name.includes("enterprise") || name.includes("unlimited")) return <Crown className="h-5 w-5" />
    if (name.includes("professional") || name.includes("pro")) return <KawadirIcon className="h-5 w-5" />
    return <Building className="h-5 w-5" />
  }

  const formatPrice = (price: number, currency: string = "SAR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "SAR",
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("admin.tiers.title")}</h2>
          <p className="text-muted-foreground">
            {t("admin.tiers.subtitle")}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              {t("admin.tiers.addTier")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("admin.tiers.createTier")}</DialogTitle>
              <DialogDescription>
                {t("admin.tiers.createTierDesc")}
              </DialogDescription>
            </DialogHeader>
            <TierForm
              formData={formData}
              setFormData={setFormData}
              toggleFeature={toggleFeature}
              t={t}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                {t("admin.tiers.cancel")}
              </Button>
              <Button onClick={handleCreate} disabled={isLoading}>
                {isLoading ? t("admin.tiers.creating") : t("admin.tiers.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tier Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => (
          <Card key={tier.id} className={!tier.is_active ? "opacity-60" : ""}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getTierIcon(tier.name)}
                  <div>
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(tier)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      {t("admin.tiers.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleActive(tier)}>
                      {tier.is_active ? (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          {t("admin.tiers.deactivate")}
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          {t("admin.tiers.activate")}
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(tier)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("admin.tiers.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold">{formatPrice(tier.price_monthly, tier.currency)}</span>
                <span className="text-muted-foreground">{t("admin.tiers.perMonth")}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatPrice(tier.price_yearly, tier.currency)}{t("admin.tiers.perYear")}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("admin.tiers.organizations")}</span>
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  {tierStats[tier.id] || 0}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("admin.tiers.maxJobs")}</span>
                  <span className="font-medium">
                    {tier.max_jobs === -1 ? t("admin.tiers.unlimited") : tier.max_jobs}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("admin.tiers.maxUsers")}</span>
                  <span className="font-medium">
                    {tier.max_users === -1 ? t("admin.tiers.unlimited") : tier.max_users}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("admin.tiers.maxCandidates")}</span>
                  <span className="font-medium">
                    {tier.max_candidates === -1 ? t("admin.tiers.unlimited") : tier.max_candidates.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs font-medium mb-2">{t("admin.tiers.features")}</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(tier.features || {}).map(([key, enabled]) => (
                    <Badge
                      key={key}
                      variant={enabled ? "default" : "outline"}
                      className="text-xs"
                    >
                      {enabled ? <Check className="h-2 w-2 mr-1" /> : <X className="h-2 w-2 mr-1" />}
                      {key.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Badge variant={tier.is_active ? "default" : "secondary"}>
                  {tier.is_active ? t("admin.tiers.active") : t("admin.tiers.inactive")}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {t("admin.tiers.order")} {tier.sort_order}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tiers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Crown className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">{t("admin.tiers.noTiers")}</h3>
            <p className="text-muted-foreground text-center mt-1">
              {t("admin.tiers.noTiersDesc")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tiers Table (Alternative View) */}
      {tiers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.tiers.allTiersOverview")}</CardTitle>
            <CardDescription>{t("admin.tiers.allTiersOverviewDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.tiers.tier")}</TableHead>
                  <TableHead>{t("admin.tiers.currency")}</TableHead>
                  <TableHead>{t("admin.tiers.monthly")}</TableHead>
                  <TableHead>{t("admin.tiers.yearly")}</TableHead>
                  <TableHead>{t("admin.tiers.jobs")}</TableHead>
                  <TableHead>{t("admin.tiers.users")}</TableHead>
                  <TableHead>{t("admin.tiers.candidates")}</TableHead>
                  <TableHead>{t("admin.tiers.orgs")}</TableHead>
                  <TableHead>{t("admin.tiers.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiers.map((tier) => (
                  <TableRow key={tier.id}>
                    <TableCell className="font-medium">{tier.name}</TableCell>
                    <TableCell>{tier.currency || "SAR"}</TableCell>
                    <TableCell>{formatPrice(tier.price_monthly, tier.currency)}</TableCell>
                    <TableCell>{formatPrice(tier.price_yearly, tier.currency)}</TableCell>
                    <TableCell>{tier.max_jobs === -1 ? "∞" : tier.max_jobs}</TableCell>
                    <TableCell>{tier.max_users === -1 ? "∞" : tier.max_users}</TableCell>
                    <TableCell>{tier.max_candidates === -1 ? "∞" : tier.max_candidates.toLocaleString()}</TableCell>
                    <TableCell>{tierStats[tier.id] || 0}</TableCell>
                    <TableCell>
                      <Badge variant={tier.is_active ? "default" : "secondary"}>
                        {tier.is_active ? t("admin.tiers.active") : t("admin.tiers.inactive")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin.tiers.editTier")}</DialogTitle>
            <DialogDescription>
              {t("admin.tiers.editTierDesc")}
            </DialogDescription>
          </DialogHeader>
          <TierForm
            formData={formData}
            setFormData={setFormData}
            toggleFeature={toggleFeature}
            t={t}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              {t("admin.tiers.cancel")}
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? t("admin.tiers.saving") : t("admin.tiers.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TierForm({
  formData,
  setFormData,
  toggleFeature,
  t,
}: {
  formData: any
  setFormData: (data: any) => void
  toggleFeature: (feature: keyof typeof defaultFeatures) => void
  t: (key: string) => string
}) {
  return (
    <div className="grid gap-6 py-4">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("admin.tiers.nameEn")}</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Professional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name_ar">{t("admin.tiers.nameAr")}</Label>
          <Input
            id="name_ar"
            value={formData.name_ar}
            onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
            placeholder="e.g., احترافي"
            dir="rtl"
          />
        </div>
      </div>

      {/* Currency */}
      <div className="space-y-2">
        <Label htmlFor="currency">{t("admin.tiers.currency")}</Label>
        <Select
          value={formData.currency}
          onValueChange={(value) => setFormData({ ...formData, currency: value })}
        >
          <SelectTrigger id="currency" className="w-48">
            <SelectValue placeholder={t("admin.tiers.selectCurrency")} />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_CURRENCIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price_monthly">{t("admin.tiers.monthlyPrice")} ({formData.currency})</Label>
          <Input
            id="price_monthly"
            type="number"
            value={formData.price_monthly}
            onChange={(e) =>
              setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price_yearly">{t("admin.tiers.yearlyPrice")} ({formData.currency})</Label>
          <Input
            id="price_yearly"
            type="number"
            value={formData.price_yearly}
            onChange={(e) =>
              setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
      </div>

      {/* Limits */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="max_jobs">{t("admin.tiers.maxJobs")}</Label>
          <Input
            id="max_jobs"
            type="number"
            value={formData.max_jobs}
            onChange={(e) =>
              setFormData({ ...formData, max_jobs: parseInt(e.target.value) || 0 })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_users">{t("admin.tiers.maxUsers")}</Label>
          <Input
            id="max_users"
            type="number"
            value={formData.max_users}
            onChange={(e) =>
              setFormData({ ...formData, max_users: parseInt(e.target.value) || 0 })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_candidates">{t("admin.tiers.maxCandidates")}</Label>
          <Input
            id="max_candidates"
            type="number"
            value={formData.max_candidates}
            onChange={(e) =>
              setFormData({ ...formData, max_candidates: parseInt(e.target.value) || 0 })
            }
          />
        </div>
      </div>

      {/* Sort Order */}
      <div className="space-y-2">
        <Label htmlFor="sort_order">{t("admin.tiers.displayOrder")}</Label>
        <Input
          id="sort_order"
          type="number"
          value={formData.sort_order}
          onChange={(e) =>
            setFormData({ ...formData, sort_order: parseInt(e.target.value) || 1 })
          }
          className="w-24"
        />
      </div>

      {/* Features */}
      <div className="space-y-3">
        <Label>{t("admin.tiers.features")}</Label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(formData.features).map(([key, enabled]) => (
            <div
              key={key}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                enabled ? "bg-primary/10 border-primary" : "bg-muted/50"
              }`}
              onClick={() => toggleFeature(key as keyof typeof defaultFeatures)}
            >
              <span className="text-sm capitalize">{key.replace(/_/g, " ")}</span>
              {enabled ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
