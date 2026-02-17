"use client"

import { useState } from "react"
import { supabaseInsert, supabaseUpdate, supabaseDelete } from "@/lib/supabase/auth-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Shield,
  Building2,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  UserCog,
  Trash2,
  Download,
  Link2,
  Copy,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  department: string | null
  avatar_url: string | null
  is_active: boolean | null
  last_login_at: string | null
  created_at: string | null
  organizations: { id: string; name: string } | null
  roles: string[]
}

interface Organization {
  id: string
  name: string
}

interface UsersClientProps {
  initialUsers: User[]
  organizations: Organization[]
}

// Role colors - using brand-aware styling where possible
const getRoleColor = (role: string): string => {
  switch (role) {
    case "super_admin":
      return "bg-red-500" // Keep semantic red for super admin
    case "org_admin":
      return "bg-[var(--brand-primary,#3b82f6)]" // Use brand primary
    case "hr_manager":
      return "bg-[var(--brand-secondary,#8b5cf6)]" // Use brand secondary
    case "recruiter":
      return "bg-emerald-500"
    case "hiring_manager":
      return "bg-amber-500"
    case "interviewer":
      return "bg-slate-500"
    default:
      return "bg-gray-500"
  }
}

export function UsersClient({ initialUsers, organizations }: UsersClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [orgFilter, setOrgFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false)
  const [isInviteLinkDialogOpen, setIsInviteLinkDialogOpen] = useState(false)
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null)
  const [inviteLinkLoading, setInviteLinkLoading] = useState(false)
  const [newRole, setNewRole] = useState<string>("")
  const [selectedOrgId, setSelectedOrgId] = useState<string>("")
  const { t } = useI18n()

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: t("admin.users.superAdmin"),
      org_admin: t("admin.users.orgAdmin"),
      hr_manager: t("admin.users.hrManager"),
      recruiter: t("admin.users.recruiter"),
      hiring_manager: t("admin.users.deptManager"),
      interviewer: t("admin.users.interviewer"),
    }
    return labels[role] || role
  }

  const roleEntries: [string, string][] = [
    ["super_admin", t("admin.users.superAdmin")],
    ["org_admin", t("admin.users.orgAdmin")],
    ["hr_manager", t("admin.users.hrManager")],
    ["recruiter", t("admin.users.recruiter")],
    ["hiring_manager", t("admin.users.deptManager")],
    ["interviewer", t("admin.users.interviewer")],
  ]

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole =
      roleFilter === "all" || user.roles.includes(roleFilter)

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active)

    const matchesOrg =
      orgFilter === "all" ||
      (orgFilter === "none" && !user.organizations) ||
      user.organizations?.id === orgFilter

    return matchesSearch && matchesRole && matchesStatus && matchesOrg
  })

  // Stats
  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    superAdmins: users.filter((u) => u.roles.includes("super_admin")).length,
    withOrg: users.filter((u) => u.organizations).length,
  }

  const toggleUserStatus = async (user: User) => {
    setIsLoading(true)

    const { error } = await supabaseUpdate(
      "profiles",
      { is_active: !user.is_active },
      { column: "id", value: user.id }
    )

    if (error) {
      toast.error(t("admin.common.error"))
    } else {
      setUsers(users.map((u) =>
        u.id === user.id ? { ...u, is_active: !u.is_active } : u
      ))
      toast.success(!user.is_active ? t("admin.users.userActivated") : t("admin.users.userDeactivated"))
    }
    setIsLoading(false)
  }

  const addRole = async () => {
    if (!selectedUser || !newRole) return

    setIsLoading(true)

    const { error } = await supabaseInsert("user_roles", {
      user_id: selectedUser.id,
      role: newRole,
    })

    if (error) {
      if (error.code === "23505") {
        toast.error(t("admin.users.alreadyHasRole"))
      } else {
        toast.error(t("admin.common.error"))
      }
    } else {
      setUsers(users.map((u) =>
        u.id === selectedUser.id
          ? { ...u, roles: [...u.roles, newRole] }
          : u
      ))
      toast.success(t("admin.users.roleAdded"))
      setIsRoleDialogOpen(false)
      setNewRole("")
    }
    setIsLoading(false)
  }

  const removeRole = async (user: User, role: string) => {
    setIsLoading(true)

    const { error } = await supabaseDelete("user_roles", [
      { column: "user_id", value: user.id },
      { column: "role", value: role },
    ])

    if (error) {
      toast.error(t("admin.common.error"))
    } else {
      setUsers(users.map((u) =>
        u.id === user.id
          ? { ...u, roles: u.roles.filter((r) => r !== role) }
          : u
      ))
      toast.success(t("admin.users.roleRemoved"))
    }
    setIsLoading(false)
  }

  const assignOrganization = async () => {
    if (!selectedUser) return

    setIsLoading(true)

    const orgId = selectedOrgId === "none" ? null : selectedOrgId

    const { error } = await supabaseUpdate(
      "profiles",
      { org_id: orgId },
      { column: "id", value: selectedUser.id }
    )

    if (error) {
      toast.error(t("admin.common.error"))
    } else {
      const org = orgId ? organizations.find((o) => o.id === orgId) : null
      setUsers(users.map((u) =>
        u.id === selectedUser.id
          ? { ...u, organizations: org ? { id: org.id, name: org.name } : null }
          : u
      ))
      toast.success(org ? `Assigned to ${org.name}` : "Removed from organization")
      setIsOrgDialogOpen(false)
      setSelectedOrgId("")
    }
    setIsLoading(false)
  }

  const generateInviteLink = async (user: User) => {
    setSelectedUser(user)
    setInviteLinkLoading(true)
    setGeneratedInviteLink(null)
    setIsInviteLinkDialogOpen(true)

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_magic_link",
          email: user.email,
        }),
      })

      const result = await response.json()

      if (result.success && result.inviteLink) {
        setGeneratedInviteLink(result.inviteLink)
      } else {
        toast.error(result.error || t("admin.common.error"))
        setIsInviteLinkDialogOpen(false)
      }
    } catch {
      toast.error(t("admin.common.error"))
      setIsInviteLinkDialogOpen(false)
    } finally {
      setInviteLinkLoading(false)
    }
  }

  const exportUsers = () => {
    const csvContent = [
      ["Name", "Email", "Phone", "Organization", "Roles", "Status", "Last Login", "Created"],
      ...filteredUsers.map((user) => [
        `${user.first_name} ${user.last_name}`,
        user.email,
        user.phone || "",
        user.organizations?.name || "No organization",
        user.roles.map((r) => getRoleLabel(r)).join("; "),
        user.is_active ? "Active" : "Inactive",
        user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "Never",
        user.created_at ? new Date(user.created_at).toLocaleDateString() : "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t("admin.users.exportSuccess"))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("admin.users.title")}</h2>
          <p className="text-muted-foreground">
            {t("admin.users.subtitle")}
          </p>
        </div>
        <Button onClick={exportUsers}>
          <Download className="mr-2 h-4 w-4" />
          {t("admin.users.exportCsv")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.users.totalUsers")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.users.activeUsers")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.users.superAdmins")}</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.superAdmins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.users.withOrg")}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withOrg}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.users.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.users.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("admin.users.filterByRole")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.users.allRoles")}</SelectItem>
                <SelectItem value="super_admin">{t("admin.users.superAdmin")}</SelectItem>
                <SelectItem value="org_admin">{t("admin.users.orgAdmin")}</SelectItem>
                <SelectItem value="hr_manager">{t("admin.users.hrManager")}</SelectItem>
                <SelectItem value="recruiter">{t("admin.users.recruiter")}</SelectItem>
                <SelectItem value="hiring_manager">{t("admin.users.deptManager")}</SelectItem>
                <SelectItem value="interviewer">{t("admin.users.interviewer")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.users.allStatus")}</SelectItem>
                <SelectItem value="active">{t("admin.users.active")}</SelectItem>
                <SelectItem value="inactive">{t("admin.users.inactive")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.users.allOrgs")}</SelectItem>
                <SelectItem value="none">{t("admin.users.noOrg")}</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>{`${t("admin.users.user")} (${filteredUsers.length})`}</CardTitle>
          <CardDescription>
            {t("admin.users.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.users.user")}</TableHead>
                <TableHead>{t("admin.users.organization")}</TableHead>
                <TableHead>{t("admin.users.roles")}</TableHead>
                <TableHead>{t("admin.users.status")}</TableHead>
                <TableHead>{t("admin.users.lastLogin")}</TableHead>
                <TableHead>{t("admin.users.joined")}</TableHead>
                <TableHead className="text-right">{t("admin.users.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {t("admin.users.noUsersFound")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar_url || ""} />
                          <AvatarFallback>
                            {user.first_name[0]}{user.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.organizations ? (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {user.organizations.name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant="secondary"
                              className={`${getRoleColor(role)} text-white text-xs`}
                            >
                              {getRoleLabel(role)}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">{t("admin.users.noRolesAssigned")}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {user.is_active ? t("admin.users.active") : t("admin.users.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleDateString()
                        : t("admin.users.never")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t("admin.users.actions")}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user)
                              setIsRoleDialogOpen(true)
                            }}
                          >
                            <UserCog className="mr-2 h-4 w-4" />
                            {t("admin.users.manageRoles")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user)
                              setSelectedOrgId(user.organizations?.id || "none")
                              setIsOrgDialogOpen(true)
                            }}
                          >
                            <Building2 className="mr-2 h-4 w-4" />
                            {t("admin.users.assignOrg")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => generateInviteLink(user)}>
                            <Link2 className="mr-2 h-4 w-4" />
                            {t("admin.users.generateInvite")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleUserStatus(user)}>
                            {user.is_active ? (
                              <>
                                <XCircle className="mr-2 h-4 w-4" />
                                {t("admin.users.deactivate")}
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {t("admin.users.activate")}
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Manage Roles Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.users.manageUserRoles")}</DialogTitle>
            <DialogDescription>
              {selectedUser && `${selectedUser.first_name} ${selectedUser.last_name}`}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              {/* Current Roles */}
              <div>
                <Label>{t("admin.users.currentRoles")}</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedUser.roles.length > 0 ? (
                    selectedUser.roles.map((role) => (
                      <Badge
                        key={role}
                        variant="secondary"
                        className={`${getRoleColor(role)} text-white cursor-pointer`}
                        onClick={() => removeRole(selectedUser, role)}
                      >
                        {getRoleLabel(role)}
                        <XCircle className="ml-1 h-3 w-3" />
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">{t("admin.users.noRolesAssigned")}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("admin.users.clickToRemove")}
                </p>
              </div>

              {/* Add Role */}
              <div>
                <Label>{t("admin.users.addRole")}</Label>
                <div className="flex gap-2 mt-2">
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={t("admin.users.selectRole")} />
                    </SelectTrigger>
                    <SelectContent>
                      {roleEntries
                        .filter(([key]) => !selectedUser.roles.includes(key))
                        .map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={addRole} disabled={!newRole || isLoading}>
                    {t("admin.users.add")}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              {t("admin.users.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Organization Dialog */}
      <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.users.assignOrgTitle")}</DialogTitle>
            <DialogDescription>
              {selectedUser && t("admin.users.assignOrgTitle").replace("{name}", `${selectedUser.first_name} ${selectedUser.last_name}`)}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.avatar_url || ""} />
                  <AvatarFallback>
                    {selectedUser.first_name[0]}{selectedUser.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("admin.users.organization")}</Label>
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("admin.users.selectOrg")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("admin.users.noOrg")}</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedUser.organizations && selectedOrgId !== selectedUser.organizations.id && (
                <p className="text-sm text-amber-600">
                  {t("admin.users.removeFromOrg").replace("{orgName}", selectedUser.organizations.name)}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrgDialogOpen(false)}>
              {t("admin.users.cancel")}
            </Button>
            <Button onClick={assignOrganization} disabled={isLoading}>
              {isLoading ? t("admin.users.saving") : t("admin.users.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Link Dialog */}
      <Dialog open={isInviteLinkDialogOpen} onOpenChange={setIsInviteLinkDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-indigo-500" />
              {t("admin.users.inviteLinkFor").replace("{name}", `${selectedUser?.first_name} ${selectedUser?.last_name}`)}
            </DialogTitle>
            <DialogDescription>
              Share this link with <strong>{selectedUser?.email}</strong> so they can
              set up their password and access the platform.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {inviteLinkLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">{t("admin.users.generatingLink")}</span>
              </div>
            ) : generatedInviteLink ? (
              <div className="space-y-2">
                <Label>{t("admin.users.inviteLink")}</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={generatedInviteLink}
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedInviteLink)
                      toast.success(t("admin.users.inviteCopied"))
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("admin.users.inviteLinkExpiry")}
                </p>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setIsInviteLinkDialogOpen(false)
                setGeneratedInviteLink(null)
              }}
            >
              {t("admin.users.done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
