"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabaseInsert, supabaseUpdate, supabaseDelete, supabaseSelect } from "@/lib/supabase/auth-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  Search,
  MoreHorizontal,
  Users,
  UserPlus,
  Mail,
  Pencil,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  Loader2,
  Send,
  Clock,
  Copy,
  RefreshCw,
  X,
  Link,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface TeamMember {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  department: string | null
  avatar_url: string | null
  is_active: boolean | null
  created_at: string | null
  last_login_at: string | null
}

interface Invite {
  id: string
  email: string
  role: string
  invite_code: string
  status: string
  expires_at: string | null
  created_at: string
}

interface Department {
  id: string
  name: string
}

interface TeamClientProps {
  members: TeamMember[]
  invites: Invite[]
  departments: Department[]
  organizationId: string
  currentUserId: string
}

const roleLabels: Record<string, string> = {
  org_admin: "Admin",
  hr_manager: "HR Manager",
  recruiter: "Recruiter",
  hiring_manager: "Department Manager",
  interviewer: "Interviewer",
}

const roleColors: Record<string, string> = {
  org_admin: "bg-purple-500",
  hr_manager: "bg-blue-500",
  recruiter: "bg-green-500",
  hiring_manager: "bg-orange-500",
  interviewer: "bg-gray-500",
}

export function TeamClient({
  members: initialMembers,
  invites: initialInvites,
  departments,
  organizationId,
  currentUserId,
}: TeamClientProps) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [invites, setInvites] = useState(initialInvites)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")

  // Dialog states
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)

  // Form state
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "recruiter",
  })

  const [editForm, setEditForm] = useState({
    role: "",
    department: "none",
    assignedDepartments: [] as string[],
  })

  // Filter members
  const filteredMembers = members.filter((member) => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase()
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || member.role === roleFilter
    return matchesSearch && matchesRole
  })

  const stats = {
    total: members.length,
    active: members.filter((m) => m.is_active !== false).length,
    pending: invites.length,
    admins: members.filter((m) => m.role === "org_admin").length,
  }

  // Send invite
  const handleInvite = async () => {
    if (!inviteForm.email) {
      toast.error("Please enter an email address")
      return
    }

    // Check if already a member
    if (members.some(m => m.email.toLowerCase() === inviteForm.email.toLowerCase())) {
      toast.error("This person is already a team member")
      return
    }

    // Check if already invited
    if (invites.some(i => i.email.toLowerCase() === inviteForm.email.toLowerCase())) {
      toast.error("This person already has a pending invite")
      return
    }

    setIsLoading(true)
    try {
      // Generate invite code
      const generateCode = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        let code = ""
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return code
      }

      const inviteCode = generateCode()

      const { data, error } = await supabaseInsert<Invite>("team_invites", {
        org_id: organizationId,
        email: inviteForm.email.toLowerCase(),
        role: inviteForm.role,
        invite_code: inviteCode,
        invited_by: currentUserId,
        status: "pending",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })

      if (error) {
        // Handle specific database constraint errors
        if (error.code === "23505" || error.message?.includes("duplicate") || error.message?.includes("unique constraint")) {
          toast.error("This person already has a pending invite. Please cancel the existing invite first or wait for them to accept it.")
          // Refresh invites list to sync state
          router.refresh()
          setIsLoading(false)
          setIsInviteDialogOpen(false)
          return
        }
        throw error
      }

      setInvites([data, ...invites])
      setIsInviteDialogOpen(false)
      setInviteForm({ email: "", role: "recruiter" })

      // Send invitation email
      const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
      const inviteLink = `${baseUrl}/signup?code=${inviteCode}`

      fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "user_invited",
          orgId: organizationId,
          data: {
            recipientEmail: inviteForm.email.toLowerCase(),
            recipientName: inviteForm.email.split("@")[0],
            inviteCode: inviteCode,
            inviteLink: inviteLink,
            role: roleLabels[inviteForm.role] || inviteForm.role,
          },
        }),
      }).catch((err) => {
        console.error("Failed to send invitation email:", err)
      })

      toast.success("Invitation sent! The invite email has been delivered.")
    } catch (error: any) {
      console.error("Error sending invite:", error)
      // Provide user-friendly error messages
      if (error.code === "23505" || error.message?.includes("duplicate")) {
        toast.error("This person already has a pending invite")
      } else {
        toast.error(error.message || "Failed to send invitation")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Copy invite code
  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success("Invite code copied to clipboard")
  }

  // Copy invite link
  const copyInviteLink = (code: string) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    const inviteLink = `${baseUrl}/signup?code=${code}`
    navigator.clipboard.writeText(inviteLink)
    toast.success("Invite link copied to clipboard")
  }

  // Resend invite (generate new code)
  const resendInvite = async (invite: Invite) => {
    setIsLoading(true)
    try {
      const generateCode = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        let code = ""
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return code
      }

      const newCode = generateCode()

      const { error } = await supabaseUpdate(
        "team_invites",
        {
          invite_code: newCode,
          status: "pending",
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { column: "id", value: invite.id }
      )

      if (error) throw error

      setInvites(invites.map(i =>
        i.id === invite.id ? { ...i, invite_code: newCode } : i
      ))
      toast.success("New invite code generated")
    } catch (error: any) {
      toast.error(error.message || "Failed to resend invite")
    } finally {
      setIsLoading(false)
    }
  }

  // Cancel invite - delete instead of updating status to avoid unique constraint issues
  const cancelInvite = async (invite: Invite) => {
    try {
      const { error } = await supabaseDelete("team_invites", { column: "id", value: invite.id })

      if (error) throw error

      setInvites(invites.filter(i => i.id !== invite.id))
      toast.success("Invitation cancelled")
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel invite")
    }
  }

  // Edit member role
  const openEditDialog = (member: TeamMember) => {
    setSelectedMember(member)
    setEditForm({
      role: member.role,
      department: member.department || "none",
      assignedDepartments: [],
    })
    setIsEditDialogOpen(true)
  }

  const handleEdit = async () => {
    if (!selectedMember) return

    setIsLoading(true)
    const roleChanged = editForm.role !== selectedMember.role
    const previousRole = selectedMember.role

    try {
      // Update role in user_roles table (delete + insert to handle composite key)
      await supabaseDelete("user_roles", [
        { column: "user_id", value: selectedMember.id },
        { column: "org_id", value: organizationId }
      ])
      const { error: roleError } = await supabaseInsert("user_roles", {
        user_id: selectedMember.id,
        org_id: organizationId,
        role: editForm.role,
      })

      if (roleError) throw roleError

      // Update department in profiles
      const newDepartment = editForm.department === "none" ? null : (editForm.department || null)
      if (newDepartment !== selectedMember.department) {
        const { error: profileError } = await supabaseUpdate(
          "profiles",
          { department: newDepartment },
          { column: "id", value: selectedMember.id }
        )

        if (profileError) throw profileError
      }

      // Update department assignments for hiring_manager
      // Automatically use the selected department as the data access scope
      if (editForm.role === "hiring_manager") {
        // Delete existing department assignments
        await supabaseDelete("user_role_departments", [
          { column: "user_id", value: selectedMember.id },
          { column: "org_id", value: organizationId },
        ])
        // Find the department ID from the selected department name
        const selectedDept = departments.find(d => d.name === editForm.department)
        if (selectedDept) {
          await supabaseInsert("user_role_departments", {
            user_id: selectedMember.id,
            org_id: organizationId,
            department_id: selectedDept.id,
          })
        }
      } else if (roleChanged && previousRole === "hiring_manager") {
        // Role changed FROM hiring_manager — remove department assignments
        await supabaseDelete("user_role_departments", [
          { column: "user_id", value: selectedMember.id },
          { column: "org_id", value: organizationId },
        ])
      }

      setMembers(
        members.map((m) =>
          m.id === selectedMember.id
            ? { ...m, role: editForm.role, department: newDepartment }
            : m
        )
      )
      setIsEditDialogOpen(false)
      setSelectedMember(null)
      toast.success("Team member updated")

      // Send role changed notification if role was actually changed
      if (roleChanged) {
        try {
          const notifResponse = await fetch("/api/notifications/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              eventType: "role_changed",
              orgId: organizationId,
              data: {
                userId: selectedMember.id,
                newRole: roleLabels[editForm.role] || editForm.role,
                previousRole: roleLabels[previousRole] || previousRole,
              },
            }),
          })

          if (!notifResponse.ok) {
            const errorData = await notifResponse.json().catch(() => ({}))
            console.error("Role change notification failed:", notifResponse.status, errorData)
          } else {
            const result = await notifResponse.json()
            if (!result.success && result.errors?.length > 0) {
              console.error("Role change notification errors:", result.errors)
            }
          }
        } catch (err) {
          console.error("Failed to send role change notification:", err)
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update member")
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle active status
  const toggleStatus = async (member: TeamMember) => {
    if (member.id === currentUserId) {
      toast.error("You cannot deactivate yourself")
      return
    }

    try {
      const { error } = await supabaseUpdate(
        "profiles",
        { is_active: !member.is_active },
        { column: "id", value: member.id }
      )

      if (error) throw error

      setMembers(
        members.map((m) =>
          m.id === member.id ? { ...m, is_active: !m.is_active } : m
        )
      )
      toast.success(`User ${member.is_active ? "deactivated" : "activated"}`)
    } catch (error: any) {
      toast.error(error.message || "Failed to update status")
    }
  }

  // Remove member from org
  const openDeleteDialog = (member: TeamMember) => {
    if (member.id === currentUserId) {
      toast.error("You cannot remove yourself")
      return
    }
    setSelectedMember(member)
    setIsDeleteDialogOpen(true)
  }

  const handleRemove = async () => {
    if (!selectedMember) return

    setIsLoading(true)
    try {
      // Remove org_id from profile (removes from organization)
      const { error } = await supabaseUpdate(
        "profiles",
        { org_id: null },
        { column: "id", value: selectedMember.id }
      )

      if (error) throw error

      // Remove role
      await supabaseDelete("user_roles", [
        { column: "user_id", value: selectedMember.id },
        { column: "org_id", value: organizationId }
      ])

      setMembers(members.filter((m) => m.id !== selectedMember.id))
      setIsDeleteDialogOpen(false)
      setSelectedMember(null)
      toast.success("Team member removed from organization")
    } catch (error: any) {
      toast.error(error.message || "Failed to remove member")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team</h2>
          <p className="text-muted-foreground">
            Manage your team members and invitations
          </p>
        </div>
        <Button onClick={() => setIsInviteDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Team Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.admins}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invites">
            <Mail className="mr-2 h-4 w-4" />
            Pending Invites ({invites.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <Shield className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Members Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No team members found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.avatar_url || ""} />
                            <AvatarFallback>
                              {member.first_name?.[0]}{member.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {member.first_name} {member.last_name}
                              {member.id === currentUserId && (
                                <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-white", roleColors[member.role] || "bg-gray-500")}>
                          {roleLabels[member.role] || member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {member.department || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.is_active !== false ? "default" : "secondary"}>
                          {member.is_active !== false ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {member.created_at
                            ? formatDistanceToNow(new Date(member.created_at), { addSuffix: true })
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(member)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Role
                            </DropdownMenuItem>
                            {member.id !== currentUserId && (
                              <>
                                <DropdownMenuItem onClick={() => toggleStatus(member)}>
                                  {member.is_active !== false ? (
                                    <>
                                      <UserX className="mr-2 h-4 w-4" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => openDeleteDialog(member)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="mt-6">
          {invites.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No pending invitations</p>
                <Button className="mt-4" onClick={() => setIsInviteDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Team Member
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {invites.map((invite) => (
                <Card key={invite.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium">{invite.email}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline">{roleLabels[invite.role] || invite.role}</Badge>
                            <span>•</span>
                            <span>
                              Sent {formatDistanceToNow(new Date(invite.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-md">
                          <code className="text-sm font-mono">{invite.invite_code}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyInviteCode(invite.invite_code)}
                            title="Copy code"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyInviteLink(invite.invite_code)}
                          title="Copy invite link"
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => resendInvite(invite)}
                          title="Generate new code"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => cancelInvite(invite)}
                          title="Cancel invite"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your organization. They'll receive a code to sign up.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="colleague@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update role and department for {selectedMember?.first_name} {selectedMember?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_role">Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) => setEditForm({ ...editForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {departments.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="edit_department">Department</Label>
                <Select
                  value={editForm.department}
                  onValueChange={(value) => setEditForm({ ...editForm, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No department</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {editForm.role === "hiring_manager" && departments.length > 0 && editForm.department === "none" && (
              <p className="text-xs text-amber-600">
                Please select a department above. The Department Manager will have data access to the selected department.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this person from your organization?
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="py-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="font-medium text-destructive">
                  {selectedMember.first_name} {selectedMember.last_name}
                </p>
                <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                They will lose access to all organization data but their account will remain.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
