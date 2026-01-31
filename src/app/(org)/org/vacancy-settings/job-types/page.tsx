"use client"

import { useState, useEffect } from "react"
import { supabaseInsert, supabaseUpdate, supabaseDelete, supabaseSelect, getCurrentUserId } from "@/lib/supabase/auth-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
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
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"

interface JobType {
  id: string
  name: string
  name_ar: string | null
  is_active: boolean
}

export default function JobTypesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [jobTypes, setJobTypes] = useState<JobType[]>([])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<JobType | null>(null)
  const [deletingType, setDeletingType] = useState<JobType | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Get current user ID from token (avoids getSession hang)
      const userId = await getCurrentUserId()

      if (!userId) {
        console.error("No user found")
        setIsLoading(false)
        return
      }

      // Get user's org_id from profiles
      const { data: profileData, error: profileError } = await supabaseSelect<{ org_id: string }[]>(
        "profiles",
        {
          select: "org_id",
          filter: [{ column: "id", operator: "eq", value: userId }],
          limit: 1
        }
      )

      if (profileError || !profileData?.[0]?.org_id) {
        console.error("Error loading profile:", profileError)
        setIsLoading(false)
        return
      }

      const orgId = profileData[0].org_id
      setOrganizationId(orgId)

      // Get job types using auth-fetch
      const { data, error } = await supabaseSelect<JobType[]>(
        "job_types",
        {
          select: "*",
          filter: [{ column: "org_id", operator: "eq", value: orgId }],
          order: { column: "name", ascending: true },
        }
      )

      if (error) throw new Error(error.message)
      setJobTypes(data || [])
    } catch (error: any) {
      console.error("Error loading job types:", error)
      toast.error(error.message || "Failed to load job types")
    } finally {
      setIsLoading(false)
    }
  }

  const openDialog = (type?: JobType) => {
    if (type) {
      setEditingType(type)
      setFormData({
        name: type.name,
        name_ar: type.name_ar || "",
      })
    } else {
      setEditingType(null)
      setFormData({ name: "", name_ar: "" })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!organizationId) {
      toast.error("Organization not found. Please refresh the page and try again.")
      return
    }
    if (!formData.name) {
      toast.error("Please enter a job type name")
      return
    }

    setIsSaving(true)
    try {
      if (editingType) {
        const { error } = await supabaseUpdate('job_types', {
          name: formData.name,
          name_ar: formData.name_ar || null,
          updated_at: new Date().toISOString(),
        }, { column: 'id', value: editingType.id })

        if (error) throw error
        toast.success("Job type updated successfully")
      } else {
        const { error } = await supabaseInsert('job_types', {
          org_id: organizationId,
          name: formData.name,
          name_ar: formData.name_ar || null,
          is_active: true,
        })

        if (error) throw error
        toast.success("Job type created successfully")
      }

      setIsDialogOpen(false)
      loadData()
    } catch (error) {
      console.error("Error saving job type:", error)
      toast.error("Failed to save job type")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (type: JobType) => {
    try {
      const { error } = await supabaseUpdate('job_types', { is_active: !type.is_active }, { column: 'id', value: type.id })

      if (error) throw error
      setJobTypes(jobTypes.map(t => t.id === type.id ? { ...t, is_active: !t.is_active } : t))
      toast.success(`Job type ${!type.is_active ? "activated" : "deactivated"}`)
    } catch (error) {
      toast.error("Failed to update job type")
    }
  }

  const openDeleteDialog = (type: JobType) => {
    setDeletingType(type)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingType) return

    setIsSaving(true)
    try {
      const { error } = await supabaseDelete('job_types', { column: 'id', value: deletingType.id })

      if (error) throw error
      toast.success("Job type deleted successfully")
      setIsDeleteDialogOpen(false)
      setDeletingType(null)
      loadData()
    } catch (error) {
      toast.error("Failed to delete job type")
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Job Type</h2>
          <p className="text-muted-foreground">
            Configure job types for your organization
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Job Type
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No job types found. Add your first job type.
                </TableCell>
              </TableRow>
            ) : (
              jobTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>
                    <Switch
                      checked={type.is_active}
                      onCheckedChange={() => handleToggleActive(type)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(type)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(type)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingType ? "Edit Job Type" : "Add Job Type"}</DialogTitle>
            <DialogDescription>
              {editingType ? "Update job type details" : "Create a new job type"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type-name">Name (English) *</Label>
              <Input
                id="type-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Full Time"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type-name-ar">Name (Arabic)</Label>
              <Input
                id="type-name-ar"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                placeholder="دوام كامل"
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingType ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Job Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this job type?
            </DialogDescription>
          </DialogHeader>
          {deletingType && (
            <div className="py-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="font-medium text-destructive">{deletingType.name}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
