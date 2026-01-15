"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Tables } from "@/lib/supabase/types"

type Organization = Tables<"organizations"> & {
  subscription_tiers: { name: string; name_ar: string | null } | null
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
  const supabase = createClient()
  const [organizations, setOrganizations] = useState(initialOrganizations)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [tierFilter, setTierFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [newOrg, setNewOrg] = useState({
    name: "",
    name_ar: "",
    admin_email: "",
    tier_id: "",
    data_residency: "mena",
  })

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

  const handleCreateOrganization = async () => {
    if (!newOrg.name || !newOrg.tier_id) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    try {
      const slug = generateSlug(newOrg.name)

      const { data, error } = await supabase
        .from("organizations")
        .insert({
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
        })
        .select(`*, subscription_tiers (name, name_ar)`)
        .single()

      if (error) {
        if (error.code === "23505") {
          toast.error("An organization with this name already exists")
        } else {
          toast.error(error.message)
        }
        return
      }

      setOrganizations([data, ...organizations])
      setIsCreateDialogOpen(false)
      setNewOrg({
        name: "",
        name_ar: "",
        admin_email: "",
        tier_id: "",
        data_residency: "mena",
      })
      toast.success("Organization created successfully")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (
    orgId: string,
    newStatus: string
  ) => {
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ subscription_status: newStatus })
        .eq("id", orgId)

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
              <TableHead>Usage</TableHead>
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
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Change Tier</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {org.subscription_status === "active" && (
                          <DropdownMenuItem
                            className="text-yellow-600"
                            onClick={() => handleStatusChange(org.id, "suspended")}
                          >
                            Suspend
                          </DropdownMenuItem>
                        )}
                        {org.subscription_status === "suspended" && (
                          <DropdownMenuItem
                            className="text-green-600"
                            onClick={() => handleStatusChange(org.id, "active")}
                          >
                            Reactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive">
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
    </div>
  )
}
