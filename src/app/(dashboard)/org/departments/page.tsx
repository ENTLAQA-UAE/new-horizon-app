"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  FolderTree,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Users,
  Briefcase,
} from "lucide-react"

interface Department {
  id: string
  name: string
  name_ar: string | null
  description: string | null
  head_user_id: string | null
  is_active: boolean | null
  created_at: string | null
}

export default function DepartmentsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    description: "",
  })

  // Fetch organization and departments
  useEffect(() => {
    async function fetchData() {
      // Get current user's organization
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single()

      const orgId = profile?.organization_id
      if (orgId) {
        setOrganizationId(orgId)
      }

      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name")

      if (error) {
        console.error("Error fetching departments:", error)
        toast.error("Failed to load departments")
      } else {
        setDepartments(data || [])
      }
      setIsLoading(false)
    }

    fetchData()
  }, [supabase])

  const resetForm = () => {
    setFormData({ name: "", name_ar: "", description: "" })
  }

  // Create department
  const handleCreate = async () => {
    if (!formData.name) {
      toast.error("Please enter a department name")
      return
    }

    if (!organizationId) {
      toast.error("Organization not found")
      return
    }

    setIsSaving(true)
    try {
      const { data, error } = await supabase
        .from("departments")
        .insert({
          name: formData.name,
          name_ar: formData.name_ar || null,
          description: formData.description || null,
          is_active: true,
          org_id: organizationId,
        })
        .select()
        .single()

      if (error) {
        toast.error(error.message)
        return
      }

      setDepartments([...departments, data])
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success("Department created successfully")
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  // Edit department
  const openEditDialog = (dept: Department) => {
    setSelectedDepartment(dept)
    setFormData({
      name: dept.name,
      name_ar: dept.name_ar || "",
      description: dept.description || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleEdit = async () => {
    if (!selectedDepartment || !formData.name) {
      toast.error("Please enter a department name")
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("departments")
        .update({
          name: formData.name,
          name_ar: formData.name_ar || null,
          description: formData.description || null,
        })
        .eq("id", selectedDepartment.id)

      if (error) {
        toast.error(error.message)
        return
      }

      setDepartments(
        departments.map((d) =>
          d.id === selectedDepartment.id
            ? { ...d, ...formData }
            : d
        )
      )
      setIsEditDialogOpen(false)
      setSelectedDepartment(null)
      resetForm()
      toast.success("Department updated successfully")
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  // Toggle active status
  const toggleActive = async (dept: Department) => {
    try {
      const { error } = await supabase
        .from("departments")
        .update({ is_active: !dept.is_active })
        .eq("id", dept.id)

      if (error) {
        toast.error(error.message)
        return
      }

      setDepartments(
        departments.map((d) =>
          d.id === dept.id ? { ...d, is_active: !d.is_active } : d
        )
      )
      toast.success(`Department ${!dept.is_active ? "activated" : "deactivated"}`)
    } catch {
      toast.error("An unexpected error occurred")
    }
  }

  // Delete department
  const openDeleteDialog = (dept: Department) => {
    setSelectedDepartment(dept)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedDepartment) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", selectedDepartment.id)

      if (error) {
        toast.error(error.message)
        return
      }

      setDepartments(departments.filter((d) => d.id !== selectedDepartment.id))
      setIsDeleteDialogOpen(false)
      setSelectedDepartment(null)
      toast.success("Department deleted successfully")
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Departments</h2>
          <p className="text-muted-foreground">
            Manage your organizational departments
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {departments.filter(d => d.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">
              {departments.filter(d => !d.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead>Arabic Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <FolderTree className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No departments yet</p>
                  <Button
                    variant="link"
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="mt-2"
                  >
                    Create your first department
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderTree className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium">{dept.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground" dir="rtl">
                      {dept.name_ar || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {dept.description || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={dept.is_active ? "default" : "secondary"}>
                      {dept.is_active ? "Active" : "Inactive"}
                    </Badge>
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
                            openEditDialog(dept)
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => toggleActive(dept)}>
                          {dept.is_active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={(e) => {
                            e.preventDefault()
                            openDeleteDialog(dept)
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
            <DialogDescription>
              Create a new department for your organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name (English) *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Engineering"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-name_ar">Name (Arabic)</Label>
              <Input
                id="create-name_ar"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                placeholder="الهندسة"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Input
                id="create-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Engineering and development team"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update department information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name (English) *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Engineering"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name_ar">Name (Arabic)</Label>
              <Input
                id="edit-name_ar"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                placeholder="الهندسة"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Engineering and development team"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this department? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedDepartment && (
            <div className="py-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="font-medium text-destructive">{selectedDepartment.name}</p>
                {selectedDepartment.name_ar && (
                  <p className="text-sm text-muted-foreground" dir="rtl">
                    {selectedDepartment.name_ar}
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
