// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { supabaseInsert, supabaseUpdate, supabaseDelete, supabaseSelect, supabaseRpc } from "@/lib/supabase/auth-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toast } from "sonner"
import {
  Plus,
  Loader2,
  GripVertical,
  Pencil,
  Trash2,
  User,
  Globe,
  GraduationCap,
  Briefcase,
  FileText,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FormSection {
  id: string
  name: string
  name_ar: string | null
  description: string | null
  icon: string
  is_default: boolean
  is_enabled: boolean
  sort_order: number
  fields: FormField[]
}

interface FormField {
  id: string
  section_id: string
  name: string
  name_ar: string | null
  field_type: string
  placeholder: string | null
  is_default: boolean
  is_required: boolean
  is_enabled: boolean
  sort_order: number
}

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
  { value: "url", label: "URL" },
  { value: "select", label: "Dropdown" },
  { value: "textarea", label: "Long Text" },
  { value: "file", label: "File Upload" },
  { value: "checkbox", label: "Checkbox" },
]

const iconMap: Record<string, any> = {
  user: User,
  globe: Globe,
  "graduation-cap": GraduationCap,
  briefcase: Briefcase,
  "file-text": FileText,
}

export default function ApplicationFormPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [sections, setSections] = useState<FormSection[]>([])

  // Dialog states
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false)
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<FormSection | null>(null)
  const [editingField, setEditingField] = useState<FormField | null>(null)
  const [deletingItem, setDeletingItem] = useState<{ type: "section" | "field"; item: any } | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)

  // Form states
  const [sectionForm, setSectionForm] = useState({
    name: "",
    name_ar: "",
    description: "",
    icon: "file-text",
  })

  const [fieldForm, setFieldForm] = useState({
    name: "",
    name_ar: "",
    field_type: "text",
    placeholder: "",
    is_required: false,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Get user's org_id from profiles using auth-fetch
      const { data: profileData, error: profileError } = await supabaseSelect<{ org_id: string }[]>(
        "profiles",
        { select: "org_id", limit: 1 }
      )

      if (profileError || !profileData?.[0]?.org_id) {
        console.error("Error loading profile:", profileError)
        setIsLoading(false)
        return
      }

      const orgId = profileData[0].org_id
      setOrganizationId(orgId)

      // Check if sections exist, if not seed defaults
      const { data: existingSections } = await supabaseSelect<{ id: string }[]>(
        "application_form_sections",
        {
          select: "id",
          filter: [{ column: "org_id", operator: "eq", value: orgId }],
          limit: 1,
        }
      )

      if (!existingSections?.length) {
        // Seed default form - call RPC function
        await supabaseRpc("seed_default_application_form", { p_org_id: orgId })
      }

      // Ensure Basic Information section has Phone Number field (for existing orgs)
      const { data: basicInfoSection } = await supabaseSelect<{ id: string }[]>(
        "application_form_sections",
        {
          select: "id",
          filter: [
            { column: "org_id", operator: "eq", value: orgId },
            { column: "name", operator: "eq", value: "Basic Information" },
          ],
          limit: 1,
        }
      )

      if (basicInfoSection?.[0]?.id) {
        const basicInfoId = basicInfoSection[0].id
        // Check if Phone Number field exists
        const { data: phoneField } = await supabaseSelect<{ id: string }[]>(
          "application_form_fields",
          {
            select: "id",
            filter: [
              { column: "section_id", operator: "eq", value: basicInfoId },
              { column: "name", operator: "eq", value: "Phone Number" },
            ],
            limit: 1,
          }
        )

        // Add Phone Number if missing
        if (!phoneField?.length) {
          await supabaseInsert("application_form_fields", {
            section_id: basicInfoId,
            org_id: orgId,
            name: "Phone Number",
            name_ar: "رقم الهاتف",
            field_type: "phone",
            is_default: true,
            is_required: true,
            is_enabled: true,
            sort_order: 4,
          })
        }
      }

      // Load sections
      const { data: sectionsData, error: sectionsError } = await supabaseSelect<FormSection[]>(
        "application_form_sections",
        {
          select: "*",
          filter: [{ column: "org_id", operator: "eq", value: orgId }],
          order: { column: "sort_order", ascending: true },
        }
      )

      if (sectionsError) throw new Error(sectionsError.message)

      // Load fields for each section
      const sectionsWithFields = await Promise.all(
        (sectionsData || []).map(async (section) => {
          const { data: fields } = await supabaseSelect<FormField[]>(
            "application_form_fields",
            {
              select: "*",
              filter: [{ column: "section_id", operator: "eq", value: section.id }],
              order: { column: "sort_order", ascending: true },
            }
          )

          return { ...section, fields: fields || [] }
        })
      )

      setSections(sectionsWithFields)
    } catch (error: any) {
      console.error("Error loading data:", error)
      toast.error(error.message || "Failed to load application form")
    } finally {
      setIsLoading(false)
    }
  }

  // Section handlers
  const openSectionDialog = (section?: FormSection) => {
    if (section) {
      setEditingSection(section)
      setSectionForm({
        name: section.name,
        name_ar: section.name_ar || "",
        description: section.description || "",
        icon: section.icon,
      })
    } else {
      setEditingSection(null)
      setSectionForm({ name: "", name_ar: "", description: "", icon: "file-text" })
    }
    setIsSectionDialogOpen(true)
  }

  const handleSaveSection = async () => {
    if (!organizationId) {
      toast.error("Organization not found. Please refresh the page and try again.")
      return
    }
    if (!sectionForm.name) {
      toast.error("Please enter a section name")
      return
    }

    setIsSaving(true)
    try {
      if (editingSection) {
        const { error } = await supabaseUpdate(
          "application_form_sections",
          {
            name: sectionForm.name,
            name_ar: sectionForm.name_ar || null,
            description: sectionForm.description || null,
            icon: sectionForm.icon,
            updated_at: new Date().toISOString(),
          },
          { column: "id", value: editingSection.id }
        )

        if (error) throw error
        toast.success("Section updated successfully")
      } else {
        const maxOrder = Math.max(...sections.map((s) => s.sort_order), 0)
        const { error } = await supabaseInsert("application_form_sections", {
          org_id: organizationId,
          name: sectionForm.name,
          name_ar: sectionForm.name_ar || null,
          description: sectionForm.description || null,
          icon: sectionForm.icon,
          is_default: false,
          is_enabled: true,
          sort_order: maxOrder + 1,
        })

        if (error) throw error
        toast.success("Section created successfully")
      }

      setIsSectionDialogOpen(false)
      loadData()
    } catch (error) {
      console.error("Error saving section:", error)
      toast.error("Failed to save section")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleSection = async (section: FormSection) => {
    if (section.is_default) {
      toast.error("Default sections cannot be disabled")
      return
    }

    try {
      const { error } = await supabaseUpdate(
        "application_form_sections",
        { is_enabled: !section.is_enabled, updated_at: new Date().toISOString() },
        { column: "id", value: section.id }
      )

      if (error) throw error

      setSections(sections.map((s) =>
        s.id === section.id ? { ...s, is_enabled: !s.is_enabled } : s
      ))
      toast.success(`Section ${!section.is_enabled ? "enabled" : "disabled"}`)
    } catch (error) {
      toast.error("Failed to update section")
    }
  }

  // Field handlers
  const openFieldDialog = (sectionId: string, field?: FormField) => {
    setSelectedSectionId(sectionId)
    if (field) {
      setEditingField(field)
      setFieldForm({
        name: field.name,
        name_ar: field.name_ar || "",
        field_type: field.field_type,
        placeholder: field.placeholder || "",
        is_required: field.is_required,
      })
    } else {
      setEditingField(null)
      setFieldForm({ name: "", name_ar: "", field_type: "text", placeholder: "", is_required: false })
    }
    setIsFieldDialogOpen(true)
  }

  const handleSaveField = async () => {
    if (!organizationId) {
      toast.error("Organization not found. Please refresh the page and try again.")
      return
    }
    if (!selectedSectionId) {
      toast.error("Please select a section first")
      return
    }
    if (!fieldForm.name) {
      toast.error("Please enter a field name")
      return
    }

    setIsSaving(true)
    try {
      const section = sections.find((s) => s.id === selectedSectionId)

      if (editingField) {
        const { error } = await supabaseUpdate(
          "application_form_fields",
          {
            name: fieldForm.name,
            name_ar: fieldForm.name_ar || null,
            field_type: fieldForm.field_type,
            placeholder: fieldForm.placeholder || null,
            is_required: fieldForm.is_required,
            updated_at: new Date().toISOString(),
          },
          { column: "id", value: editingField.id }
        )

        if (error) throw error
        toast.success("Field updated successfully")
      } else {
        const maxOrder = Math.max(...(section?.fields.map((f) => f.sort_order) || []), 0)
        const { error } = await supabaseInsert("application_form_fields", {
          section_id: selectedSectionId,
          org_id: organizationId,
          name: fieldForm.name,
          name_ar: fieldForm.name_ar || null,
          field_type: fieldForm.field_type,
          placeholder: fieldForm.placeholder || null,
          is_default: false,
          is_required: fieldForm.is_required,
          is_enabled: true,
          sort_order: maxOrder + 1,
        })

        if (error) throw error
        toast.success("Field added successfully")
      }

      setIsFieldDialogOpen(false)
      loadData()
    } catch (error) {
      console.error("Error saving field:", error)
      toast.error("Failed to save field")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleField = async (field: FormField) => {
    try {
      const { error } = await supabaseUpdate(
        "application_form_fields",
        { is_enabled: !field.is_enabled, updated_at: new Date().toISOString() },
        { column: "id", value: field.id }
      )

      if (error) throw error
      loadData()
      toast.success(`Field ${!field.is_enabled ? "enabled" : "disabled"}`)
    } catch (error) {
      toast.error("Failed to update field")
    }
  }

  const handleToggleRequired = async (field: FormField) => {
    if (field.is_default && field.is_required) {
      toast.error("This field is required by default")
      return
    }

    try {
      const { error } = await supabaseUpdate(
        "application_form_fields",
        { is_required: !field.is_required, updated_at: new Date().toISOString() },
        { column: "id", value: field.id }
      )

      if (error) throw error
      loadData()
    } catch (error) {
      toast.error("Failed to update field")
    }
  }

  // Delete handlers
  const openDeleteDialog = (type: "section" | "field", item: any) => {
    if (item.is_default) {
      toast.error(`Default ${type}s cannot be deleted`)
      return
    }
    setDeletingItem({ type, item })
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingItem) return

    setIsSaving(true)
    try {
      const table = deletingItem.type === "section" ? "application_form_sections" : "application_form_fields"
      const { error } = await supabaseDelete(table, { column: "id", value: deletingItem.item.id })

      if (error) throw error
      toast.success(`${deletingItem.type === "section" ? "Section" : "Field"} deleted successfully`)
      setIsDeleteDialogOpen(false)
      setDeletingItem(null)
      loadData()
    } catch (error) {
      toast.error("Failed to delete")
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
          <h2 className="text-2xl font-bold tracking-tight">Application Form</h2>
          <p className="text-muted-foreground">
            Configure the application form sections and fields for job applicants
          </p>
        </div>
        <Button onClick={() => openSectionDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Section
        </Button>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const IconComponent = iconMap[section.icon] || FileText

          return (
            <Card key={section.id} className={cn(!section.is_enabled && "opacity-60")}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {section.name}
                        {section.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Required
                          </Badge>
                        )}
                      </CardTitle>
                      {section.name_ar && (
                        <p className="text-sm text-muted-foreground" dir="rtl">
                          {section.name_ar}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={section.is_enabled}
                      onCheckedChange={() => handleToggleSection(section)}
                      disabled={section.is_default}
                    />
                    {!section.is_default && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openSectionDialog(section)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog("section", section)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Fields list */}
                <div className="space-y-2">
                  {section.fields.map((field) => (
                    <div
                      key={field.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border bg-muted/30",
                        !field.is_enabled && "opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <div>
                          <p className="font-medium text-sm">
                            {field.name}
                            {field.is_required && <span className="text-red-500 ml-1">*</span>}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {field.field_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleToggleRequired(field)}
                          disabled={field.is_default && field.is_required}
                        >
                          {field.is_required ? "Required" : "Optional"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleField(field)}
                        >
                          {field.is_enabled ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        {!field.is_default && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openFieldDialog(section.id, field)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDeleteDialog("field", field)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => openFieldDialog(section.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Section Dialog */}
      <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSection ? "Edit Section" : "Add Section"}</DialogTitle>
            <DialogDescription>
              {editingSection ? "Update section details" : "Create a new form section"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="section-name">Name (English) *</Label>
              <Input
                id="section-name"
                value={sectionForm.name}
                onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                placeholder="e.g., Skills & Certifications"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section-name-ar">Name (Arabic)</Label>
              <Input
                id="section-name-ar"
                value={sectionForm.name_ar}
                onChange={(e) => setSectionForm({ ...sectionForm, name_ar: e.target.value })}
                placeholder="المهارات والشهادات"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section-desc">Description</Label>
              <Input
                id="section-desc"
                value={sectionForm.description}
                onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                placeholder="Brief description of this section"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSection} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingSection ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Field Dialog */}
      <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingField ? "Edit Field" : "Add Field"}</DialogTitle>
            <DialogDescription>
              {editingField ? "Update field details" : "Add a new field to this section"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="field-name">Field Name (English) *</Label>
              <Input
                id="field-name"
                value={fieldForm.name}
                onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                placeholder="e.g., Years of Experience"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="field-name-ar">Field Name (Arabic)</Label>
              <Input
                id="field-name-ar"
                value={fieldForm.name_ar}
                onChange={(e) => setFieldForm({ ...fieldForm, name_ar: e.target.value })}
                placeholder="سنوات الخبرة"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="field-type">Field Type</Label>
              <Select
                value={fieldForm.field_type}
                onValueChange={(value) => setFieldForm({ ...fieldForm, field_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="field-placeholder">Placeholder</Label>
              <Input
                id="field-placeholder"
                value={fieldForm.placeholder}
                onChange={(e) => setFieldForm({ ...fieldForm, placeholder: e.target.value })}
                placeholder="Enter placeholder text"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="field-required"
                checked={fieldForm.is_required}
                onCheckedChange={(checked) => setFieldForm({ ...fieldForm, is_required: checked })}
              />
              <Label htmlFor="field-required">Required field</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFieldDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveField} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingField ? "Update" : "Add Field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {deletingItem?.type === "section" ? "Section" : "Field"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deletingItem?.type}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingItem && (
            <div className="py-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="font-medium text-destructive">{deletingItem.item.name}</p>
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
