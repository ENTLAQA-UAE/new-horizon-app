"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabaseInsert, supabaseUpdate, supabaseDelete } from "@/lib/supabase/auth-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Plus,
  Search,
  MoreHorizontal,
  Building2,
  Users,
  Briefcase,
  Filter,
  Loader2,
  Pencil,
  Trash2,
  Eye,
  RefreshCw,
  ArrowUpDown,
  Calendar,
  Globe,
  Copy,
  Link2,
  CheckCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Tables } from "@/lib/supabase/types"

type Organization = Tables<"organizations"> & {
  subscription_tiers: { id: string; name: string; name_ar: string | null; price_monthly: number } | null
}

type SubscriptionTier = Tables<"subscription_tiers">

interface OrganizationsClientProps {
  organizations: Organization[]
  tiers: SubscriptionTier[]
}

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  trial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
}

export function OrganizationsClient({
  organizations: initialOrganizations,
  tiers,
}: OrganizationsClientProps) {
  const router = useRouter()
  const [organizations, setOrganizations] = useState(initialOrganizations)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [tierFilter, setTierFilter] = useState<string>("all")

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isChangeTierDialogOpen, setIsChangeTierDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isMagicLinkDialogOpen, setIsMagicLinkDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Invite link state
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null)
  const [inviteLinkOrgName, setInviteLinkOrgName] = useState("")
  const [inviteLinkEmail, setInviteLinkEmail] = useState("")

  // Selected organization for operations
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)

  // Form state for create
  const [newOrg, setNewOrg] = useState({
    name: "",
    name_ar: "",
    admin_email: "",
    tier_id: "",
    data_residency: "mena",
  })

  // Form state for edit
  const [editOrg, setEditOrg] = useState({
    name: "",
    name_ar: "",
    slug: "",
    data_residency: "",
    max_users: 0,
    max_jobs: 0,
    max_candidates: 0,
    saudization_enabled: false,
    emiratization_enabled: false,
  })

  // Form state for change tier
  const [newTierId, setNewTierId] = useState("")

  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.name_ar?.includes(searchQuery) ||
      org.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === "all" || org.subscription_status === statusFilter
    const matchesTier = tierFilter === "all" || org.tier_id === tierFilter
    return matchesSearch && matchesStatus && matchesTier
  })

  const stats = {
    total: organizations.length,
    active: organizations.filter((o) => o.subscription_status === "active").length,
    trial: organizations.filter((o) => o.subscription_status === "trial").length,
    suspended: organizations.filter((o) => o.subscription_status === "suspended").length,
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  // CREATE Organization
  const handleCreateOrganization = async () => {
    if (!newOrg.name || !newOrg.tier_id) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    try {
      const slug = generateSlug(newOrg.name)
      const selectedTier = tiers.find(t => t.id === newOrg.tier_id)

      const { data, error } = await supabaseInsert<Organization>(
        "organizations",
        {
          name: newOrg.name,
          name_ar: newOrg.name_ar || null,
          slug,
          tier_id: newOrg.tier_id,
          data_residency: newOrg.data_residency,
          subscription_status: "trial",
          subscription_start_date: new Date().toISOString().split("T")[0],
          subscription_end_date: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0],
          max_users: selectedTier?.max_users || 5,
          max_jobs: selectedTier?.max_jobs || 10,
          max_candidates: selectedTier?.max_candidates || 100,
        }
      )

      if (error) {
        if (error.code === "23505") {
          toast.error("An organization with this name already exists")
        } else {
          toast.error(error.message)
        }
        return
      }

      if (data) {
        // Add tier info from local tiers array
        const orgWithTier = {
          ...data,
          subscription_tiers: selectedTier ? {
            id: selectedTier.id,
            name: selectedTier.name,
            name_ar: selectedTier.name_ar,
            price_monthly: selectedTier.price_monthly,
          } : null,
        }
        setOrganizations([orgWithTier as Organization, ...organizations])

        // If admin email provided, create user + assign org_admin + generate magic link
        if (newOrg.admin_email.trim()) {
          try {
            const adminResponse = await fetch("/api/admin/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "create_user_for_org",
                email: newOrg.admin_email.trim(),
                orgId: data.id,
              }),
            })

            const adminResult = await adminResponse.json()

            if (adminResult.success && adminResult.inviteLink) {
              setGeneratedInviteLink(adminResult.inviteLink)
              setInviteLinkOrgName(newOrg.name)
              setInviteLinkEmail(newOrg.admin_email.trim())
              setIsMagicLinkDialogOpen(true)
              toast.success("Organization created and admin assigned!")
            } else if (adminResult.success) {
              toast.success("Organization created and admin assigned (invite link generation failed)")
            } else {
              toast.warning(`Organization created but admin setup failed: ${adminResult.error}`)
            }
          } catch {
            toast.warning("Organization created but admin setup failed. Assign admin manually from Users page.")
          }
        } else {
          toast.success("Organization created successfully")
        }
      }
      setIsCreateDialogOpen(false)
      setNewOrg({
        name: "",
        name_ar: "",
        admin_email: "",
        tier_id: "",
        data_residency: "mena",
      })
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // EDIT Organization
  const openEditDialog = (org: Organization) => {
    setSelectedOrg(org)
    setEditOrg({
      name: org.name,
      name_ar: org.name_ar || "",
      slug: org.slug,
      data_residency: org.data_residency || "mena",
      max_users: org.max_users || 0,
      max_jobs: org.max_jobs || 0,
      max_candidates: org.max_candidates || 0,
      saudization_enabled: org.saudization_enabled || false,
      emiratization_enabled: org.emiratization_enabled || false,
    })
    setIsEditDialogOpen(true)
  }

  const handleEditOrganization = async () => {
    if (!selectedOrg || !editOrg.name) {
      toast.error("Please fill in required fields")
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabaseUpdate(
        "organizations",
        {
          name: editOrg.name,
          name_ar: editOrg.name_ar || null,
          slug: editOrg.slug,
          data_residency: editOrg.data_residency,
          max_users: editOrg.max_users,
          max_jobs: editOrg.max_jobs,
          max_candidates: editOrg.max_candidates,
          saudization_enabled: editOrg.saudization_enabled,
          emiratization_enabled: editOrg.emiratization_enabled,
        },
        { column: "id", value: selectedOrg.id }
      )

      if (error) {
        toast.error(error.message)
        return
      }

      setOrganizations(
        organizations.map((org) =>
          org.id === selectedOrg.id
            ? { ...org, ...editOrg, name_ar: editOrg.name_ar || null }
            : org
        )
      )
      setIsEditDialogOpen(false)
      setSelectedOrg(null)
      toast.success("Organization updated successfully")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // CHANGE TIER
  const openChangeTierDialog = (org: Organization) => {
    setSelectedOrg(org)
    setNewTierId(org.tier_id || "")
    setIsChangeTierDialogOpen(true)
  }

  const handleChangeTier = async () => {
    if (!selectedOrg || !newTierId) {
      toast.error("Please select a tier")
      return
    }

    setIsLoading(true)
    try {
      const selectedTier = tiers.find(t => t.id === newTierId)

      const { error } = await supabaseUpdate(
        "organizations",
        {
          tier_id: newTierId,
          max_users: selectedTier?.max_users || 5,
          max_jobs: selectedTier?.max_jobs || 10,
          max_candidates: selectedTier?.max_candidates || 100,
        },
        { column: "id", value: selectedOrg.id }
      )

      if (error) {
        toast.error(error.message)
        return
      }

      // Update local state with new tier info
      setOrganizations(
        organizations.map((org) =>
          org.id === selectedOrg.id
            ? {
                ...org,
                tier_id: newTierId,
                max_users: selectedTier?.max_users || 5,
                max_jobs: selectedTier?.max_jobs || 10,
                max_candidates: selectedTier?.max_candidates || 100,
                subscription_tiers: selectedTier ? {
                  id: selectedTier.id,
                  name: selectedTier.name,
                  name_ar: selectedTier.name_ar,
                  price_monthly: selectedTier.price_monthly,
                } : null,
              }
            : org
        )
      )
      setIsChangeTierDialogOpen(false)
      setSelectedOrg(null)
      toast.success("Subscription tier updated successfully")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // VIEW DETAILS
  const openViewDialog = (org: Organization) => {
    setSelectedOrg(org)
    setIsViewDialogOpen(true)
  }

  // DELETE Organization
  const openDeleteDialog = (org: Organization) => {
    setSelectedOrg(org)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteOrganization = async () => {
    if (!selectedOrg) return

    setIsLoading(true)
    try {
      const { error } = await supabaseDelete(
        "organizations",
        { column: "id", value: selectedOrg.id }
      )

      if (error) {
        toast.error(error.message)
        return
      }

      setOrganizations(organizations.filter((org) => org.id !== selectedOrg.id))
      setIsDeleteDialogOpen(false)
      setSelectedOrg(null)
      toast.success("Organization deleted successfully")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // STATUS CHANGE
  const handleStatusChange = async (
    orgId: string,
    newStatus: string
  ) => {
    try {
      const { error } = await supabaseUpdate(
        "organizations",
        { subscription_status: newStatus },
        { column: "id", value: orgId }
      )

      if (error) {
        toast.error(error.message)
        return
      }

      setOrganizations(
        organizations.map((org) =>
          org.id === orgId ? { ...org, subscription_status: newStatus } : org
        )
      )
      toast.success(`Organization ${newStatus}`)
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Organizations</h2>
          <p className="text-muted-foreground">
            Manage all organizations on the platform
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Organization
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
              <DialogDescription>
                Add a new organization to the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name (EN) *</Label>
                  <Input
                    id="name"
                    placeholder="Saudi Bank"
                    value={newOrg.name}
                    onChange={(e) =>
                      setNewOrg({ ...newOrg, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_ar">Organization Name (AR)</Label>
                  <Input
                    id="name_ar"
                    placeholder="البنك السعودي"
                    dir="rtl"
                    value={newOrg.name_ar}
                    onChange={(e) =>
                      setNewOrg({ ...newOrg, name_ar: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin_email">Admin Email</Label>
                <Input
                  id="admin_email"
                  type="email"
                  placeholder="admin@company.com"
                  value={newOrg.admin_email}
                  onChange={(e) =>
                    setNewOrg({ ...newOrg, admin_email: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subscription Tier *</Label>
                  <Select
                    value={newOrg.tier_id}
                    onValueChange={(value) =>
                      setNewOrg({ ...newOrg, tier_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers.map((tier) => (
                        <SelectItem key={tier.id} value={tier.id}>
                          {tier.name} - ${tier.price_monthly}/mo
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data Residency</Label>
                  <Select
                    value={newOrg.data_residency}
                    onValueChange={(value) =>
                      setNewOrg({ ...newOrg, data_residency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mena">MENA Region</SelectItem>
                      <SelectItem value="uae">UAE Only</SelectItem>
                      <SelectItem value="ksa">KSA Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateOrganization} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Organization
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Trial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.trial}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Suspended
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            {tiers.map((tier) => (
              <SelectItem key={tier.id} value={tier.id}>
                {tier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Limits</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrgs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No organizations found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{org.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {org.slug}.jadarat.com
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {org.subscription_tiers?.name || "No tier"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "capitalize",
                        statusStyles[org.subscription_status || "trial"]
                      )}
                    >
                      {org.subscription_status || "trial"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {org.max_users || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {org.max_jobs || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {org.created_at
                      ? new Date(org.created_at).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                            openViewDialog(org)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                            openEditDialog(org)
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                            openChangeTierDialog(org)
                          }}
                        >
                          <ArrowUpDown className="mr-2 h-4 w-4" />
                          Change Tier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {org.subscription_status === "active" && (
                          <DropdownMenuItem
                            className="text-yellow-600"
                            onSelect={() => handleStatusChange(org.id, "suspended")}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Suspend
                          </DropdownMenuItem>
                        )}
                        {org.subscription_status === "suspended" && (
                          <DropdownMenuItem
                            className="text-green-600"
                            onSelect={() => handleStatusChange(org.id, "active")}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reactivate
                          </DropdownMenuItem>
                        )}
                        {org.subscription_status === "trial" && (
                          <DropdownMenuItem
                            className="text-green-600"
                            onSelect={() => handleStatusChange(org.id, "active")}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={(e) => {
                            e.preventDefault()
                            openDeleteDialog(org)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Organization Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update organization details and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Organization Name (EN) *</Label>
                <Input
                  id="edit_name"
                  value={editOrg.name}
                  onChange={(e) =>
                    setEditOrg({ ...editOrg, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_name_ar">Organization Name (AR)</Label>
                <Input
                  id="edit_name_ar"
                  dir="rtl"
                  value={editOrg.name_ar}
                  onChange={(e) =>
                    setEditOrg({ ...editOrg, name_ar: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_slug">Slug</Label>
                <Input
                  id="edit_slug"
                  value={editOrg.slug}
                  onChange={(e) =>
                    setEditOrg({ ...editOrg, slug: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Data Residency</Label>
                <Select
                  value={editOrg.data_residency}
                  onValueChange={(value) =>
                    setEditOrg({ ...editOrg, data_residency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mena">MENA Region</SelectItem>
                    <SelectItem value="uae">UAE Only</SelectItem>
                    <SelectItem value="ksa">KSA Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_max_users">Max Users</Label>
                <Input
                  id="edit_max_users"
                  type="number"
                  value={editOrg.max_users}
                  onChange={(e) =>
                    setEditOrg({ ...editOrg, max_users: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_max_jobs">Max Jobs</Label>
                <Input
                  id="edit_max_jobs"
                  type="number"
                  value={editOrg.max_jobs}
                  onChange={(e) =>
                    setEditOrg({ ...editOrg, max_jobs: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_max_candidates">Max Candidates</Label>
                <Input
                  id="edit_max_candidates"
                  type="number"
                  value={editOrg.max_candidates}
                  onChange={(e) =>
                    setEditOrg({ ...editOrg, max_candidates: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <Label>Compliance Settings</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editOrg.saudization_enabled}
                    onChange={(e) =>
                      setEditOrg({ ...editOrg, saudization_enabled: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span className="text-sm">Saudization Tracking</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editOrg.emiratization_enabled}
                    onChange={(e) =>
                      setEditOrg({ ...editOrg, emiratization_enabled: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span className="text-sm">Emiratization Tracking</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditOrganization} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Tier Dialog */}
      <Dialog open={isChangeTierDialogOpen} onOpenChange={setIsChangeTierDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Subscription Tier</DialogTitle>
            <DialogDescription>
              {selectedOrg && `Update subscription tier for ${selectedOrg.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedOrg && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Current Tier</p>
                <p className="font-medium">
                  {selectedOrg.subscription_tiers?.name || "No tier assigned"}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>New Tier</Label>
              <Select value={newTierId} onValueChange={setNewTierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new tier" />
                </SelectTrigger>
                <SelectContent>
                  {tiers.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{tier.name}</span>
                        <span className="text-muted-foreground ml-2">
                          ${tier.price_monthly}/mo
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newTierId && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium">New tier limits:</p>
                {(() => {
                  const tier = tiers.find(t => t.id === newTierId)
                  return tier ? (
                    <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Users</p>
                        <p className="font-medium">{tier.max_users === -1 ? "Unlimited" : tier.max_users}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Jobs</p>
                        <p className="font-medium">{tier.max_jobs === -1 ? "Unlimited" : tier.max_jobs}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Candidates</p>
                        <p className="font-medium">{tier.max_candidates === -1 ? "Unlimited" : tier.max_candidates}</p>
                      </div>
                    </div>
                  ) : null
                })()}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChangeTierDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleChangeTier} disabled={isLoading || !newTierId}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Organization Details</DialogTitle>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedOrg.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedOrg.slug}.jadarat.com</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Globe className="h-4 w-4" /> Data Residency
                  </p>
                  <p className="font-medium capitalize">{selectedOrg.data_residency || "MENA"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subscription Tier</p>
                  <p className="font-medium">{selectedOrg.subscription_tiers?.name || "None"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={cn("capitalize", statusStyles[selectedOrg.subscription_status || "trial"])}>
                    {selectedOrg.subscription_status || "trial"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Price</p>
                  <p className="font-medium">
                    ${selectedOrg.subscription_tiers?.price_monthly || 0}/month
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Usage Limits</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <Users className="h-5 w-5 mx-auto text-muted-foreground" />
                    <p className="text-2xl font-bold">{selectedOrg.max_users || 0}</p>
                    <p className="text-xs text-muted-foreground">Max Users</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <Briefcase className="h-5 w-5 mx-auto text-muted-foreground" />
                    <p className="text-2xl font-bold">{selectedOrg.max_jobs || 0}</p>
                    <p className="text-xs text-muted-foreground">Max Jobs</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <Users className="h-5 w-5 mx-auto text-muted-foreground" />
                    <p className="text-2xl font-bold">{selectedOrg.max_candidates || 0}</p>
                    <p className="text-xs text-muted-foreground">Max Candidates</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Subscription Start
                  </p>
                  <p>{selectedOrg.subscription_start_date || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Subscription End
                  </p>
                  <p>{selectedOrg.subscription_end_date || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Saudization</p>
                  <p>{selectedOrg.saudization_enabled ? "Enabled" : "Disabled"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Emiratization</p>
                  <p>{selectedOrg.emiratization_enabled ? "Enabled" : "Disabled"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p>{selectedOrg.created_at ? new Date(selectedOrg.created_at).toLocaleDateString() : "N/A"}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false)
              if (selectedOrg) openEditDialog(selectedOrg)
            }}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this organization? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedOrg && (
            <div className="py-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="font-medium text-destructive">{selectedOrg.name}</p>
                <p className="text-sm text-muted-foreground">{selectedOrg.slug}.jadarat.com</p>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                All data associated with this organization including users, jobs, and candidates will be permanently deleted.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrganization}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Link Dialog */}
      <Dialog open={isMagicLinkDialogOpen} onOpenChange={setIsMagicLinkDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-green-500" />
              Admin Invite Link Generated
            </DialogTitle>
            <DialogDescription>
              Organization <strong>{inviteLinkOrgName}</strong> has been created and{" "}
              <strong>{inviteLinkEmail}</strong> has been assigned as Org Admin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>User created with email auto-confirmed</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Assigned as Org Admin</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Invite link generated</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Invite Link (share with the admin)</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={generatedInviteLink || ""}
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (generatedInviteLink) {
                      navigator.clipboard.writeText(generatedInviteLink)
                      toast.success("Invite link copied to clipboard!")
                    }
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This link directs the admin to create their password. It expires after one use.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setIsMagicLinkDialogOpen(false)
                setGeneratedInviteLink(null)
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
