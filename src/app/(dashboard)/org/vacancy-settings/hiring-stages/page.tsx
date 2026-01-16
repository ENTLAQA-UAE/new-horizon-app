"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Plus, Pencil, Trash2, Loader2, GripVertical, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

interface HiringStage {
  id: string
  name: string
  name_ar: string | null
  color: string
  sort_order: number
  is_default: boolean
  is_terminal: boolean
  is_active: boolean
}

const defaultColors = [
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#06B6D4", // Cyan
  "#10B981", // Green
  "#EC4899", // Pink
  "#EF4444", // Red
  "#22C55E", // Success Green
]

export default function HiringStagesPage() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [stages, setStages] = useState<HiringStage[]>([])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingStage, setEditingStage] = useState<HiringStage | null>(null)
  const [deletingStage, setDeletingStage] = useState<HiringStage | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    color: "#3B82F6",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single()

      const orgId = profile?.organization_id
      if (!orgId) {
        setIsLoading(false)
        return
      }

      setOrganizationId(orgId)

      // Check if stages exist, if not seed defaults
      const { data: existingStages } = await supabase
        .from("hiring_stages")
        .select("id")
        .eq("org_id", orgId)
        .limit(1)

      if (!existingStages?.length) {
        await supabase.rpc("seed_default_hiring_stages", { p_org_id: orgId })
      }

      const { data, error } = await supabase
        .from("hiring_stages")
        .select("*")
        .eq("org_id", orgId)
        .order("sort_order")

      if (error) throw error
      setStages(data || [])
    } catch (error) {
      console.error("Error loading stages:", error)
      toast.error("Failed to load hiring stages")
    } finally {
      setIsLoading(false)
    }
  }

  const openDialog = (stage?: HiringStage) => {
    if (stage) {
      setEditingStage(stage)
      setFormData({
        name: stage.name,
        name_ar: stage.name_ar || "",
        color: stage.color,
      })
    } else {
      setEditingStage(null)
      setFormData({ name: "", name_ar: "", color: "#3B82F6" })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !organizationId) {
      toast.error("Please enter a stage name")
      return
    }

    setIsSaving(true)
    try {
      if (editingStage) {
        const { error } = await supabase
          .from("hiring_stages")
          .update({
            name: formData.name,
            name_ar: formData.name_ar || null,
            color: formData.color,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingStage.id)

        if (error) throw error
        toast.success("Stage updated successfully")
      } else {
        const maxOrder = Math.max(...stages.filter(s => !s.is_terminal).map(s => s.sort_order), 0)
        const { error } = await supabase.from("hiring_stages").insert({
          org_id: organizationId,
          name: formData.name,
          name_ar: formData.name_ar || null,
          color: formData.color,
          sort_order: maxOrder + 1,
          is_default: false,
          is_terminal: false,
          is_active: true,
        })

        if (error) throw error
        toast.success("Stage created successfully")
      }

      setIsDialogOpen(false)
      loadData()
    } catch (error) {
      console.error("Error saving stage:", error)
      toast.error("Failed to save stage")
    } finally {
      setIsSaving(false)
    }
  }

  const openDeleteDialog = (stage: HiringStage) => {
    if (stage.is_default) {
      toast.error("Default stages cannot be deleted")
      return
    }
    setDeletingStage(stage)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingStage) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("hiring_stages")
        .delete()
        .eq("id", deletingStage.id)

      if (error) throw error
      toast.success("Stage deleted successfully")
      setIsDeleteDialogOpen(false)
      setDeletingStage(null)
      loadData()
    } catch (error) {
      toast.error("Failed to delete stage")
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
          <h2 className="text-2xl font-bold tracking-tight">Hiring Stage</h2>
          <p className="text-muted-foreground">
            Configure the stages candidates go through in the hiring process
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add hiring stage
        </Button>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stages.map((stage) => (
              <TableRow key={stage.id}>
                <TableCell>
                  <Checkbox disabled />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="font-medium">{stage.name}</span>
                    {stage.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {!stage.is_default && (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDialog(stage)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(stage)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStage ? "Edit Stage" : "Add Stage"}</DialogTitle>
            <DialogDescription>
              {editingStage ? "Update hiring stage details" : "Create a new hiring stage"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stage-name">Name (English) *</Label>
              <Input
                id="stage-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Phone Screen"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage-name-ar">Name (Arabic)</Label>
              <Input
                id="stage-name-ar"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                placeholder="فحص هاتفي"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform",
                      formData.color === color
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingStage ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Stage</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this stage? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingStage && (
            <div className="py-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="font-medium text-destructive">{deletingStage.name}</p>
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
