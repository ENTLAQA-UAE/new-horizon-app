"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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
import { Plus, MoreHorizontal, Pencil, Trash2, Users, Check, X, Crown, Sparkles, Building } from "lucide-react"
import { toast } from "sonner"

interface SubscriptionTier {
  id: string
  name: string
  name_ar: string | null
  price_monthly: number
  price_yearly: number
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
  const supabase = createClient()
  const [tiers, setTiers] = useState(initialTiers)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    price_monthly: 0,
    price_yearly: 0,
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
      max_jobs: 10,
      max_users: 5,
      max_candidates: 100,
      features: defaultFeatures,
      sort_order: tiers.length + 1,
    })
  }

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error("Please enter a tier name")
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("subscription_tiers")
        .insert({
          name: formData.name,
          name_ar: formData.name_ar || null,
          price_monthly: formData.price_monthly,
          price_yearly: formData.price_yearly,
          max_jobs: formData.max_jobs,
          max_users: formData.max_users,
          max_candidates: formData.max_candidates,
          features: formData.features,
          sort_order: formData.sort_order,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      setTiers([...tiers, data])
      setIsCreateOpen(false)
      resetForm()
      toast.success("Subscription tier created successfully")
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
      const { error } = await supabase
        .from("subscription_tiers")
        .update({
          name: formData.name,
          name_ar: formData.name_ar || null,
          price_monthly: formData.price_monthly,
          price_yearly: formData.price_yearly,
          max_jobs: formData.max_jobs,
          max_users: formData.max_users,
          max_candidates: formData.max_candidates,
          features: formData.features,
          sort_order: formData.sort_order,
        })
        .eq("id", selectedTier.id)

      if (error) throw error

      setTiers(
        tiers.map((t) =>
          t.id === selectedTier.id
            ? { ...t, ...formData, name_ar: formData.name_ar || null }
            : t
        )
      )
      setIsEditOpen(false)
      setSelectedTier(null)
      resetForm()
      toast.success("Subscription tier updated successfully")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to update tier")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (tier: SubscriptionTier) => {
    try {
      const { error } = await supabase
        .from("subscription_tiers")
        .update({ is_active: !tier.is_active })
        .eq("id", tier.id)

      if (error) throw error

      setTiers(
        tiers.map((t) =>
          t.id === tier.id ? { ...t, is_active: !t.is_active } : t
        )
      )
      toast.success(`Tier ${tier.is_active ? "deactivated" : "activated"} successfully`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to update tier")
    }
  }

  const handleDelete = async (tier: SubscriptionTier) => {
    const orgCount = tierStats[tier.id] || 0
    if (orgCount > 0) {
      toast.error(`Cannot delete tier with ${orgCount} active organization(s)`)
      return
    }

    if (!confirm(`Are you sure you want to delete "${tier.name}"?`)) return

    try {
      const { error } = await supabase
        .from("subscription_tiers")
        .delete()
        .eq("id", tier.id)

      if (error) throw error

      setTiers(tiers.filter((t) => t.id !== tier.id))
      toast.success("Subscription tier deleted successfully")
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
    if (name.includes("professional") || name.includes("pro")) return <Sparkles className="h-5 w-5" />
    return <Building className="h-5 w-5" />
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Subscription Tiers</h2>
          <p className="text-muted-foreground">
            Manage pricing plans and feature access for organizations
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Subscription Tier</DialogTitle>
              <DialogDescription>
                Create a new subscription tier with pricing and feature limits.
              </DialogDescription>
            </DialogHeader>
            <TierForm
              formData={formData}
              setFormData={setFormData}
              toggleFeature={toggleFeature}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Tier"}
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
                    {tier.name_ar && (
                      <p className="text-sm text-muted-foreground" dir="rtl">
                        {tier.name_ar}
                      </p>
                    )}
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
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleActive(tier)}>
                      {tier.is_active ? (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(tier)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold">{formatPrice(tier.price_monthly)}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatPrice(tier.price_yearly)}/year
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Organizations</span>
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  {tierStats[tier.id] || 0}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Jobs</span>
                  <span className="font-medium">
                    {tier.max_jobs === -1 ? "Unlimited" : tier.max_jobs}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Users</span>
                  <span className="font-medium">
                    {tier.max_users === -1 ? "Unlimited" : tier.max_users}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Candidates</span>
                  <span className="font-medium">
                    {tier.max_candidates === -1 ? "Unlimited" : tier.max_candidates.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs font-medium mb-2">Features</p>
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
                  {tier.is_active ? "Active" : "Inactive"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Order: {tier.sort_order}
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
            <h3 className="text-lg font-semibold">No subscription tiers</h3>
            <p className="text-muted-foreground text-center mt-1">
              Create your first subscription tier to start onboarding organizations.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tiers Table (Alternative View) */}
      {tiers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Tiers Overview</CardTitle>
            <CardDescription>Detailed comparison of all subscription tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead>Yearly</TableHead>
                  <TableHead>Jobs</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Candidates</TableHead>
                  <TableHead>Orgs</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiers.map((tier) => (
                  <TableRow key={tier.id}>
                    <TableCell className="font-medium">{tier.name}</TableCell>
                    <TableCell>{formatPrice(tier.price_monthly)}</TableCell>
                    <TableCell>{formatPrice(tier.price_yearly)}</TableCell>
                    <TableCell>{tier.max_jobs === -1 ? "∞" : tier.max_jobs}</TableCell>
                    <TableCell>{tier.max_users === -1 ? "∞" : tier.max_users}</TableCell>
                    <TableCell>{tier.max_candidates === -1 ? "∞" : tier.max_candidates.toLocaleString()}</TableCell>
                    <TableCell>{tierStats[tier.id] || 0}</TableCell>
                    <TableCell>
                      <Badge variant={tier.is_active ? "default" : "secondary"}>
                        {tier.is_active ? "Active" : "Inactive"}
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
            <DialogTitle>Edit Subscription Tier</DialogTitle>
            <DialogDescription>
              Update the subscription tier details and features.
            </DialogDescription>
          </DialogHeader>
          <TierForm
            formData={formData}
            setFormData={setFormData}
            toggleFeature={toggleFeature}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
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
}: {
  formData: any
  setFormData: (data: any) => void
  toggleFeature: (feature: keyof typeof defaultFeatures) => void
}) {
  return (
    <div className="grid gap-6 py-4">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name (English)</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Professional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name_ar">Name (Arabic)</Label>
          <Input
            id="name_ar"
            value={formData.name_ar}
            onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
            placeholder="e.g., احترافي"
            dir="rtl"
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price_monthly">Monthly Price (SAR)</Label>
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
          <Label htmlFor="price_yearly">Yearly Price (SAR)</Label>
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
          <Label htmlFor="max_jobs">Max Jobs (-1 for unlimited)</Label>
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
          <Label htmlFor="max_users">Max Users (-1 for unlimited)</Label>
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
          <Label htmlFor="max_candidates">Max Candidates (-1 for unlimited)</Label>
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
        <Label htmlFor="sort_order">Display Order</Label>
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
        <Label>Features</Label>
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
