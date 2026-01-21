// @ts-nocheck
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

interface JobGrade {
  id: string
  name: string
  name_ar: string | null
  level: number
  is_active: boolean
}

export default function JobGradesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [grades, setGrades] = useState<JobGrade[]>([])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState<JobGrade | null>(null)
  const [deletingGrade, setDeletingGrade] = useState<JobGrade | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    level: 1,
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

      // Get job grades using auth-fetch
      const { data, error } = await supabaseSelect<JobGrade[]>(
        "job_grades",
        {
          select: "*",
          filter: [{ column: "org_id", operator: "eq", value: orgId }],
          order: { column: "level", ascending: true },
        }
      )

      if (error) throw new Error(error.message)
      setGrades(data || [])
    } catch (error: any) {
      console.error("Error loading job grades:", error)
      toast.error(error.message || "Failed to load job grades")
    } finally {
      setIsLoading(false)
    }
  }

  const openDialog = (grade?: JobGrade) => {
    if (grade) {
      setEditingGrade(grade)
      setFormData({
        name: grade.name,
        name_ar: grade.name_ar || "",
        level: grade.level,
      })
    } else {
      setEditingGrade(null)
      const nextLevel = Math.max(...grades.map(g => g.level), 0) + 1
      setFormData({ name: "", name_ar: "", level: nextLevel })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!organizationId) {
      toast.error("Organization not found. Please refresh the page and try again.")
      return
    }
    if (!formData.name) {
      toast.error("Please enter a grade name")
      return
    }

    setIsSaving(true)
    try {
      if (editingGrade) {
        const { error } = await supabaseUpdate(
          "job_grades",
          {
            name: formData.name,
            name_ar: formData.name_ar || null,
            level: formData.level,
            updated_at: new Date().toISOString(),
          },
          { column: "id", value: editingGrade.id }
        )

        if (error) throw error
        toast.success("Job grade updated successfully")
      } else {
        const { error } = await supabaseInsert("job_grades", {
          org_id: organizationId,
          name: formData.name,
          name_ar: formData.name_ar || null,
          level: formData.level,
          is_active: true,
        })

        if (error) throw error
        toast.success("Job grade created successfully")
      }

      setIsDialogOpen(false)
      loadData()
    } catch (error) {
      console.error("Error saving job grade:", error)
      toast.error("Failed to save job grade")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (grade: JobGrade) => {
    try {
      const { error } = await supabaseUpdate(
        "job_grades",
        { is_active: !grade.is_active },
        { column: "id", value: grade.id }
      )

      if (error) throw error
      setGrades(grades.map(g => g.id === grade.id ? { ...g, is_active: !g.is_active } : g))
      toast.success(`Job grade ${!grade.is_active ? "activated" : "deactivated"}`)
    } catch (error) {
      toast.error("Failed to update job grade")
    }
  }

  const openDeleteDialog = (grade: JobGrade) => {
    setDeletingGrade(grade)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingGrade) return

    setIsSaving(true)
    try {
      const { error } = await supabaseDelete(
        "job_grades",
        { column: "id", value: deletingGrade.id }
      )

      if (error) throw error
      toast.success("Job grade deleted successfully")
      setIsDeleteDialogOpen(false)
      setDeletingGrade(null)
      loadData()
    } catch (error) {
      toast.error("Failed to delete job grade")
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
          <h2 className="text-2xl font-bold tracking-tight">Job Grade</h2>
          <p className="text-muted-foreground">
            Configure job grades/levels for your organization
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Job Grade
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Level</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Arabic Name</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No job grades found. Add your first job grade.
                </TableCell>
              </TableRow>
            ) : (
              grades.map((grade) => (
                <TableRow key={grade.id}>
                  <TableCell className="font-medium">{grade.level}</TableCell>
                  <TableCell>{grade.name}</TableCell>
                  <TableCell dir="rtl">{grade.name_ar || "—"}</TableCell>
                  <TableCell>
                    <Switch
                      checked={grade.is_active}
                      onCheckedChange={() => handleToggleActive(grade)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(grade)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(grade)}>
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
            <DialogTitle>{editingGrade ? "Edit Job Grade" : "Add Job Grade"}</DialogTitle>
            <DialogDescription>
              {editingGrade ? "Update job grade details" : "Create a new job grade"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="grade-name">Name (English) *</Label>
              <Input
                id="grade-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Senior"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade-name-ar">Name (Arabic)</Label>
              <Input
                id="grade-name-ar"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                placeholder="أقدم"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade-level">Level</Label>
              <Input
                id="grade-level"
                type="number"
                min="1"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingGrade ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Job Grade</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this job grade?
            </DialogDescription>
          </DialogHeader>
          {deletingGrade && (
            <div className="py-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="font-medium text-destructive">{deletingGrade.name}</p>
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
