"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabaseInsert, supabaseUpdate, supabaseDelete } from "@/lib/supabase/auth-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toast } from "sonner"
import {
  Plus,
  Shield,
  Users,
  Pencil,
  Trash2,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react"

interface Role {
  id: string
  code: string
  name: string
  name_ar: string | null
  description: string | null
  is_system_role: boolean
  is_active: boolean
}

interface Permission {
  id: string
  code: string
  name: string
  name_ar: string | null
  category: string
  description: string | null
}

interface RolePermission {
  role_id: string
  permission_id: string
  permissions: {
    code: string
    name: string
    category: string
  }
}

interface RolesManagementClientProps {
  roles: Role[]
  permissions: Permission[]
  rolePermissions: RolePermission[]
}

export function RolesManagementClient({
  roles: initialRoles,
  permissions,
  rolePermissions: initialRolePermissions,
}: RolesManagementClientProps) {
  const router = useRouter()

  const [roles, setRoles] = useState(initialRoles)
  const [rolePermissions, setRolePermissions] = useState(initialRolePermissions)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    description: "",
  })

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = []
    }
    acc[perm.category].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  // Get permissions for a specific role
  const getPermissionsForRole = (roleId: string) => {
    return rolePermissions
      .filter((rp) => rp.role_id === roleId)
      .map((rp) => rp.permission_id)
  }

  const handleCreateRole = async () => {
    if (!formData.name) {
      toast.error("Role name is required")
      return
    }

    setIsLoading(true)
    try {
      const code = formData.name.toLowerCase().replace(/\s+/g, "_")

      const { data, error } = await supabaseInsert<Role>("roles", {
        code,
        name: formData.name,
        name_ar: formData.name_ar || null,
        description: formData.description || null,
        is_system_role: false,
        is_active: true,
      })

      if (error) throw new Error(error.message)

      setRoles([...roles, data])
      setIsCreateDialogOpen(false)
      setFormData({ name: "", name_ar: "", description: "" })
      toast.success("Role created successfully")
      router.refresh()
    } catch (error) {
      console.error("Error creating role:", error)
      toast.error("Failed to create role")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedRole || !formData.name) return

    setIsLoading(true)
    try {
      const { error } = await supabaseUpdate("roles", {
        name: formData.name,
        name_ar: formData.name_ar || null,
        description: formData.description || null,
      }, { column: "id", value: selectedRole.id })

      if (error) throw new Error(error.message)

      setRoles(
        roles.map((r) =>
          r.id === selectedRole.id
            ? { ...r, name: formData.name, name_ar: formData.name_ar, description: formData.description }
            : r
        )
      )
      setIsEditDialogOpen(false)
      toast.success("Role updated successfully")
      router.refresh()
    } catch (error) {
      console.error("Error updating role:", error)
      toast.error("Failed to update role")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePermission = async (permissionId: string, checked: boolean) => {
    if (!selectedRole) return

    try {
      if (checked) {
        const { error } = await supabaseInsert("role_permissions", {
          role_id: selectedRole.id,
          permission_id: permissionId,
        })
        if (error) throw new Error(error.message)

        const permission = permissions.find((p) => p.id === permissionId)
        setRolePermissions([
          ...rolePermissions,
          {
            role_id: selectedRole.id,
            permission_id: permissionId,
            permissions: {
              code: permission?.code || "",
              name: permission?.name || "",
              category: permission?.category || "",
            },
          },
        ])
      } else {
        const { error } = await supabaseDelete("role_permissions", [
          { column: "role_id", value: selectedRole.id },
          { column: "permission_id", value: permissionId },
        ])
        if (error) throw new Error(error.message)

        setRolePermissions(
          rolePermissions.filter(
            (rp) => !(rp.role_id === selectedRole.id && rp.permission_id === permissionId)
          )
        )
      }
    } catch (error) {
      console.error("Error toggling permission:", error)
      toast.error("Failed to update permission")
    }
  }

  const openEditDialog = (role: Role) => {
    setSelectedRole(role)
    setFormData({
      name: role.name,
      name_ar: role.name_ar || "",
      description: role.description || "",
    })
    setIsEditDialogOpen(true)
  }

  const openPermissionsDialog = (role: Role) => {
    setSelectedRole(role)
    setIsPermissionsDialogOpen(true)
  }

  const categoryLabels: Record<string, string> = {
    platform: "Platform",
    organization: "Organization",
    users: "Users",
    jobs: "Jobs",
    candidates: "Candidates",
    applications: "Applications",
    interviews: "Interviews",
    offers: "Offers",
    workflows: "Workflows",
    communication: "Communication",
    analytics: "Analytics",
    compliance: "Compliance",
    documents: "Documents",
    audit: "Audit",
    portal: "Portal",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Roles & Permissions</h2>
          <p className="text-muted-foreground">
            Manage roles and their permissions
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>
            System roles cannot be deleted but their permissions can be viewed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {role.is_system_role ? (
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{role.name}</p>
                        {role.name_ar && (
                          <p className="text-sm text-muted-foreground">{role.name_ar}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {role.description || "-"}
                  </TableCell>
                  <TableCell>
                    {role.is_system_role ? (
                      <Badge variant="default">System</Badge>
                    ) : (
                      <Badge variant="secondary">Custom</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getPermissionsForRole(role.id).length} permissions
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPermissionsDialog(role)}
                      >
                        <Lock className="h-4 w-4" />
                      </Button>
                      {!role.is_system_role && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(role)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a custom role with specific permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name (English) *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Senior Recruiter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_ar">Role Name (Arabic)</Label>
              <Input
                id="name_ar"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                placeholder="e.g., موظف توظيف أول"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the role's responsibilities..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Role Name (English) *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name_ar">Role Name (Arabic)</Label>
              <Input
                id="edit-name_ar"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {selectedRole?.name} Permissions
            </DialogTitle>
            <DialogDescription>
              {selectedRole?.is_system_role
                ? "View permissions for this system role"
                : "Manage permissions for this role"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Accordion type="multiple" className="w-full">
              {Object.entries(permissionsByCategory).map(([category, perms]) => {
                const rolePerms = selectedRole ? getPermissionsForRole(selectedRole.id) : []
                const checkedCount = perms.filter((p) => rolePerms.includes(p.id)).length

                return (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger>
                      <div className="flex items-center justify-between w-full pr-4">
                        <span>{categoryLabels[category] || category}</span>
                        <Badge variant="secondary">
                          {checkedCount}/{perms.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {perms.map((perm) => {
                          const isChecked = rolePerms.includes(perm.id)
                          return (
                            <div
                              key={perm.id}
                              className="flex items-start space-x-3 p-2 rounded hover:bg-muted/50"
                            >
                              <Checkbox
                                id={perm.id}
                                checked={isChecked}
                                onCheckedChange={(checked) =>
                                  handleTogglePermission(perm.id, checked as boolean)
                                }
                                disabled={selectedRole?.is_system_role}
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={perm.id}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {perm.name}
                                </label>
                                <p className="text-xs text-muted-foreground">{perm.code}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPermissionsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
