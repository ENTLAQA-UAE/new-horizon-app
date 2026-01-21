"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Json } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Loader2,
  ClipboardList,
  GripVertical,
  X,
  Star,
  FileText,
  Code,
  Users,
  Briefcase,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Criteria {
  id: string
  name: string
  name_ar?: string
  description?: string
  weight: number
}

export interface ScorecardTemplate {
  id: string
  org_id: string
  name: string
  name_ar?: string
  description?: string
  description_ar?: string
  template_type: string
  criteria: Criteria[]
  rating_scale_type: string
  rating_scale_labels: Record<string, string>
  rating_scale_labels_ar?: Record<string, string>
  is_default: boolean
  is_active: boolean
  require_notes_per_criteria: boolean
  created_at: string
  updated_at: string
}

interface ScorecardsClientProps {
  templates: ScorecardTemplate[]
  organizationId: string
}

const templateTypes = [
  { value: "technical", label: "Technical", icon: Code, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "behavioral", label: "Behavioral", icon: Users, color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { value: "cultural", label: "Cultural Fit", icon: Star, color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  { value: "general", label: "General", icon: FileText, color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
  { value: "custom", label: "Custom", icon: Briefcase, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
]

const ratingScales = [
  { value: "1-5", label: "1-5 Scale", max: 5 },
  { value: "1-10", label: "1-10 Scale", max: 10 },
]

const defaultRatingLabels: Record<string, Record<string, string>> = {
  "1-5": {
    "1": "Poor",
    "2": "Below Average",
    "3": "Average",
    "4": "Good",
    "5": "Excellent",
  },
  "1-10": {
    "1": "Very Poor",
    "2": "Poor",
    "3": "Below Average",
    "4": "Slightly Below",
    "5": "Average",
    "6": "Slightly Above",
    "7": "Good",
    "8": "Very Good",
    "9": "Excellent",
    "10": "Outstanding",
  },
}

export function ScorecardsClient({ templates: initialTemplates, organizationId }: ScorecardsClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [templates, setTemplates] = useState(initialTemplates)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Selected template for edit/delete
  const [selectedTemplate, setSelectedTemplate] = useState<ScorecardTemplate | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    description: "",
    description_ar: "",
    template_type: "general",
    rating_scale_type: "1-5",
    is_default: false,
    require_notes_per_criteria: false,
    criteria: [] as Criteria[],
  })

  // New criteria form
  const [newCriteria, setNewCriteria] = useState({
    name: "",
    name_ar: "",
    description: "",
    weight: 20,
  })

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || template.template_type === typeFilter
    return matchesSearch && matchesType
  })

  const stats = {
    total: templates.length,
    active: templates.filter((t) => t.is_active).length,
    technical: templates.filter((t) => t.template_type === "technical").length,
    behavioral: templates.filter((t) => t.template_type === "behavioral").length,
  }

  const resetForm = () => {
    setFormData({
      name: "",
      name_ar: "",
      description: "",
      description_ar: "",
      template_type: "general",
      rating_scale_type: "1-5",
      is_default: false,
      require_notes_per_criteria: false,
      criteria: [],
    })
    setNewCriteria({
      name: "",
      name_ar: "",
      description: "",
      weight: 20,
    })
  }

  const addCriteria = () => {
    if (!newCriteria.name) {
      toast.error("Please enter criteria name")
      return
    }

    const criteria: Criteria = {
      id: crypto.randomUUID(),
      name: newCriteria.name,
      name_ar: newCriteria.name_ar || undefined,
      description: newCriteria.description || undefined,
      weight: newCriteria.weight,
    }

    setFormData({
      ...formData,
      criteria: [...formData.criteria, criteria],
    })

    setNewCriteria({
      name: "",
      name_ar: "",
      description: "",
      weight: 20,
    })
  }

  const removeCriteria = (id: string) => {
    setFormData({
      ...formData,
      criteria: formData.criteria.filter((c) => c.id !== id),
    })
  }

  const updateCriteriaWeight = (id: string, weight: number) => {
    setFormData({
      ...formData,
      criteria: formData.criteria.map((c) =>
        c.id === id ? { ...c, weight } : c
      ),
    })
  }

  // CREATE
  const handleCreate = async () => {
    if (!formData.name) {
      toast.error("Please enter template name")
      return
    }

    if (formData.criteria.length === 0) {
      toast.error("Please add at least one criteria")
      return
    }

    setIsLoading(true)
    try {
      const insertData = {
        org_id: organizationId,
        name: formData.name,
        name_ar: formData.name_ar || null,
        description: formData.description || null,
        description_ar: formData.description_ar || null,
        template_type: formData.template_type,
        criteria: formData.criteria as unknown as Json,
        rating_scale_type: formData.rating_scale_type,
        rating_scale_labels: defaultRatingLabels[formData.rating_scale_type] as unknown as Json,
        is_default: formData.is_default,
        require_notes_per_criteria: formData.require_notes_per_criteria,
      }

      console.log("Creating scorecard template with data:", insertData)

      // Get session with timeout - the Supabase client's getSession can hang
      console.log("Checking auth session...")
      let accessToken: string | null = null

      try {
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("getSession timeout")), 3000)
        )
        const { data: sessionData } = await Promise.race([sessionPromise, timeoutPromise])
        accessToken = sessionData?.session?.access_token || null
        console.log("Session from getSession:", accessToken ? "found" : "not found")
      } catch (e) {
        console.warn("getSession timed out, trying localStorage fallback")
      }

      // Fallback: try to get token from localStorage if getSession failed
      if (!accessToken) {
        try {
          const storageKeys = Object.keys(localStorage).filter(
            k => k.startsWith("sb-") && k.endsWith("-auth-token")
          )
          if (storageKeys.length > 0) {
            const storedData = localStorage.getItem(storageKeys[0])
            if (storedData) {
              const parsed = JSON.parse(storedData)
              accessToken = parsed?.access_token || null
              console.log("Session from localStorage:", accessToken ? "found" : "not found")
            }
          }
        } catch (e) {
          console.warn("Could not get token from localStorage:", e)
        }
      }

      if (!accessToken) {
        toast.error("No active session. Please refresh the page and try again.")
        return
      }

      // Use direct fetch instead of Supabase client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      console.log("Making direct fetch request to Supabase...")
      const startTime = Date.now()

      const response = await fetch(`${supabaseUrl}/rest/v1/scorecard_templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(insertData),
      })

      console.log("Fetch completed in", Date.now() - startTime, "ms, status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Supabase error response:", errorText)
        throw new Error(errorText || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("Scorecard template created successfully:", data)

      // Handle array response (PostgREST returns array for single insert with Prefer: return=representation)
      const createdTemplate = Array.isArray(data) ? data[0] : data
      setTemplates([createdTemplate as ScorecardTemplate, ...templates])
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success("Scorecard template created successfully")
      router.refresh()
    } catch (err) {
      console.error("Unexpected error creating scorecard:", err)
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      toast.error(`Failed to create template: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  // UPDATE
  const handleUpdate = async () => {
    if (!selectedTemplate) return

    if (!formData.name) {
      toast.error("Please enter template name")
      return
    }

    if (formData.criteria.length === 0) {
      toast.error("Please add at least one criteria")
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("scorecard_templates")
        .update({
          name: formData.name,
          name_ar: formData.name_ar || null,
          description: formData.description || null,
          description_ar: formData.description_ar || null,
          template_type: formData.template_type,
          criteria: formData.criteria as unknown as Json,
          rating_scale_type: formData.rating_scale_type,
          rating_scale_labels: defaultRatingLabels[formData.rating_scale_type] as unknown as Json,
          is_default: formData.is_default,
          require_notes_per_criteria: formData.require_notes_per_criteria,
        })
        .eq("id", selectedTemplate.id)
        .select()
        .single()

      if (error) {
        toast.error(error.message)
        return
      }

      setTemplates(templates.map((t) => (t.id === selectedTemplate.id ? data as unknown as ScorecardTemplate : t)))
      setIsEditDialogOpen(false)
      setSelectedTemplate(null)
      resetForm()
      toast.success("Scorecard template updated successfully")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // DELETE
  const handleDelete = async () => {
    if (!selectedTemplate) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("scorecard_templates")
        .delete()
        .eq("id", selectedTemplate.id)

      if (error) {
        toast.error(error.message)
        return
      }

      setTemplates(templates.filter((t) => t.id !== selectedTemplate.id))
      setIsDeleteDialogOpen(false)
      setSelectedTemplate(null)
      toast.success("Scorecard template deleted successfully")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // DUPLICATE
  const handleDuplicate = async (template: ScorecardTemplate) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("scorecard_templates")
        .insert({
          org_id: organizationId,
          name: `${template.name} (Copy)`,
          name_ar: template.name_ar,
          description: template.description,
          description_ar: template.description_ar,
          template_type: template.template_type,
          criteria: template.criteria as unknown as Json,
          rating_scale_type: template.rating_scale_type,
          rating_scale_labels: template.rating_scale_labels as unknown as Json,
          is_default: false,
          require_notes_per_criteria: template.require_notes_per_criteria,
        })
        .select()
        .single()

      if (error) {
        toast.error(error.message)
        return
      }

      setTemplates([data as unknown as ScorecardTemplate, ...templates])
      toast.success("Scorecard template duplicated")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (template: ScorecardTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      name_ar: template.name_ar || "",
      description: template.description || "",
      description_ar: template.description_ar || "",
      template_type: template.template_type,
      rating_scale_type: template.rating_scale_type,
      is_default: template.is_default,
      require_notes_per_criteria: template.require_notes_per_criteria,
      criteria: template.criteria || [],
    })
    setIsEditDialogOpen(true)
  }

  const getTypeConfig = (type: string) => {
    return templateTypes.find((t) => t.value === type) || templateTypes[3]
  }

  const getTotalWeight = () => {
    return formData.criteria.reduce((sum, c) => sum + c.weight, 0)
  }

  const TemplateCard = ({ template }: { template: ScorecardTemplate }) => {
    const typeConfig = getTypeConfig(template.template_type)
    const TypeIcon = typeConfig.icon

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", typeConfig.color)}>
                <TypeIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{template.name}</CardTitle>
                {template.description && (
                  <CardDescription className="text-sm line-clamp-1">
                    {template.description}
                  </CardDescription>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => openEditDialog(template)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleDuplicate(template)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    setSelectedTemplate(template)
                    setIsDeleteDialogOpen(true)
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className={typeConfig.color}>
              {typeConfig.label}
            </Badge>
            {template.is_default && (
              <Badge variant="secondary">Default</Badge>
            )}
            <Badge variant="outline">
              {template.rating_scale_type}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{template.criteria?.length || 0}</span> criteria
          </div>
        </CardContent>
      </Card>
    )
  }

  // Criteria form JSX - inlined to prevent focus loss on re-render
  const criteriaFormJSX = (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
      <h4 className="font-medium text-sm">Add Criteria</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="criteria_name">Name (English) *</Label>
          <Input
            id="criteria_name"
            value={newCriteria.name}
            onChange={(e) => setNewCriteria(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Technical Knowledge"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="criteria_name_ar">Name (Arabic)</Label>
          <Input
            id="criteria_name_ar"
            value={newCriteria.name_ar}
            onChange={(e) => setNewCriteria(prev => ({ ...prev, name_ar: e.target.value }))}
            placeholder="المعرفة التقنية"
            dir="rtl"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="criteria_description">Description</Label>
        <Input
          id="criteria_description"
          value={newCriteria.description}
          onChange={(e) => setNewCriteria(prev => ({ ...prev, description: e.target.value }))}
          placeholder="What should the interviewer evaluate?"
        />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Weight</Label>
          <span className="text-sm text-muted-foreground">{newCriteria.weight}%</span>
        </div>
        <Slider
          value={[newCriteria.weight]}
          onValueChange={([value]) => setNewCriteria(prev => ({ ...prev, weight: value }))}
          max={100}
          min={5}
          step={5}
        />
      </div>
      <Button type="button" onClick={addCriteria} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add Criteria
      </Button>
    </div>
  )

  // Criteria list JSX - inlined to prevent focus loss on re-render
  const criteriaListJSX = (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>Criteria ({formData.criteria.length})</Label>
        <span className={cn(
          "text-sm",
          getTotalWeight() === 100 ? "text-green-600" : "text-amber-600"
        )}>
          Total Weight: {getTotalWeight()}%
        </span>
      </div>
      {formData.criteria.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          No criteria added yet
        </div>
      ) : (
        <div className="space-y-2">
          {formData.criteria.map((criteria) => (
            <div
              key={criteria.id}
              className="flex items-center gap-3 p-3 border rounded-lg bg-background"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{criteria.name}</div>
                {criteria.description && (
                  <div className="text-xs text-muted-foreground truncate">
                    {criteria.description}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{criteria.weight}%</Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeCriteria(criteria.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Scorecard Templates</h2>
          <p className="text-muted-foreground">
            Create and manage interview scorecard templates
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Templates</CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Technical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.technical}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Behavioral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.behavioral}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {templateTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No scorecard templates found</p>
            <Button
              variant="link"
              onClick={() => setIsCreateDialogOpen(true)}
              className="mt-2"
            >
              Create your first template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false)
            setIsEditDialogOpen(false)
            setSelectedTemplate(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Edit Scorecard Template" : "Create Scorecard Template"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? "Update the scorecard template criteria and settings"
                : "Create a new interview scorecard template with custom criteria"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name (English) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Technical Interview"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_ar">Template Name (Arabic)</Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  placeholder="المقابلة التقنية"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe when to use this template..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Type</Label>
                <Select
                  value={formData.template_type}
                  onValueChange={(value) => setFormData({ ...formData, template_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rating Scale</Label>
                <Select
                  value={formData.rating_scale_type}
                  onValueChange={(value) => setFormData({ ...formData, rating_scale_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ratingScales.map((scale) => (
                      <SelectItem key={scale.value} value={scale.value}>
                        {scale.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Set as Default</Label>
                <p className="text-sm text-muted-foreground">
                  Use this template by default for new interviews
                </p>
              </div>
              <Switch
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Notes per Criteria</Label>
                <p className="text-sm text-muted-foreground">
                  Interviewers must add notes for each criteria
                </p>
              </div>
              <Switch
                checked={formData.require_notes_per_criteria}
                onCheckedChange={(checked) => setFormData({ ...formData, require_notes_per_criteria: checked })}
              />
            </div>

            {/* Criteria Section */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="font-semibold">Evaluation Criteria</h3>
              {criteriaFormJSX}
              {criteriaListJSX}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                setIsEditDialogOpen(false)
                setSelectedTemplate(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={isEditDialogOpen ? handleUpdate : handleCreate}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditDialogOpen ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Scorecard Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedTemplate?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
