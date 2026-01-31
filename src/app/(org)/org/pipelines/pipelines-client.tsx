"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabaseInsert, supabaseUpdate, supabaseDelete } from "@/lib/supabase/auth-fetch"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Loader2,
  GitBranch,
  Settings2,
  ArrowRight,
  Mail,
  UserCheck,
  X,
  GripVertical,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

interface Pipeline {
  id: string
  org_id: string
  name: string
  name_ar: string | null
  description: string | null
  description_ar: string | null
  is_default: boolean
  is_active: boolean
  created_at: string
}

interface PipelineStage {
  id: string
  org_id: string
  pipeline_id: string | null
  name: string
  name_ar: string | null
  description: string | null
  color: string
  sort_order: number
  stage_type: string
  is_system: boolean
  requires_approval: boolean
  approvers: string[]
  auto_email_template_id: string | null
  auto_reject_enabled: boolean
  auto_reject_days: number | null
  sla_warning_days: number | null
  sla_critical_days: number | null
}

// Mandatory system stages that are created with every new pipeline
const systemStages = [
  { name: "Applied", name_ar: "تم التقديم", stage_type: "applied", color: "#6B7280", sort_order: 0 },
  { name: "Hired", name_ar: "تم التوظيف", stage_type: "hired", color: "#10B981", sort_order: 998 },
  { name: "Rejected", name_ar: "مرفوض", stage_type: "rejected", color: "#EF4444", sort_order: 999 },
]

interface PipelinesClientProps {
  pipelines: Pipeline[]
  stages: PipelineStage[]
  emailTemplates: { id: string; name: string }[]
  teamMembers: { id: string; name: string }[]
  organizationId: string
}

const stageTypes = [
  { value: "applied", label: "Applied", color: "#6B7280" },
  { value: "screening", label: "Screening", color: "#3B82F6" },
  { value: "interview", label: "Interview", color: "#8B5CF6" },
  { value: "assessment", label: "Assessment", color: "#F59E0B" },
  { value: "offer", label: "Offer", color: "#F97316" },
  { value: "hired", label: "Hired", color: "#10B981" },
  { value: "rejected", label: "Rejected", color: "#EF4444" },
]

const defaultColors = [
  "#6B7280", "#3B82F6", "#8B5CF6", "#F59E0B",
  "#06B6D4", "#10B981", "#EC4899", "#EF4444",
]

interface StageFormData {
  id?: string
  name: string
  name_ar: string
  stage_type: string
  color: string
  requires_approval: boolean
  approvers: string[]
  auto_email_template_id: string
  auto_reject_enabled: boolean
  auto_reject_days: number
  sla_warning_days: number
  sla_critical_days: number
}

interface SortableStageItemProps {
  stage: PipelineStage
  stageTypeConfig: { value: string; label: string; color: string }
  onEdit: (stage: PipelineStage) => void
  onDelete: (stageId: string) => void
}

function SortableStageItem({ stage, stageTypeConfig, onEdit, onDelete }: SortableStageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-4 p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow",
        stage.is_system && "bg-muted/50",
        isDragging && "opacity-50 shadow-lg z-10"
      )}
    >
      {!stage.is_system ? (
        <button
          className="cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      ) : (
        <div className="w-4" />
      )}
      <div
        className="w-4 h-4 rounded-full flex-shrink-0"
        style={{ backgroundColor: stage.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{stage.name}</span>
          <Badge variant="outline" className="text-xs">
            {stageTypeConfig.label}
          </Badge>
          {stage.is_system && (
            <Badge variant="default" className="text-xs bg-slate-600">
              System
            </Badge>
          )}
          {stage.requires_approval && (
            <Badge variant="secondary" className="text-xs">
              <UserCheck className="h-3 w-3 mr-1" />
              Approval
            </Badge>
          )}
          {stage.auto_email_template_id && (
            <Badge variant="secondary" className="text-xs">
              <Mail className="h-3 w-3 mr-1" />
              Auto-email
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!stage.is_system && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(stage)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => onDelete(stage.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export function PipelinesClient({
  pipelines: initialPipelines,
  stages: initialStages,
  emailTemplates,
  teamMembers,
  organizationId,
}: PipelinesClientProps) {
  const router = useRouter()

  const [pipelines, setPipelines] = useState(initialPipelines)
  const [allStages, setAllStages] = useState(initialStages)
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog states
  const [isPipelineDialogOpen, setIsPipelineDialogOpen] = useState(false)
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Selected items
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null)
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null)
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null)

  // Pipeline form
  const [pipelineForm, setPipelineForm] = useState({
    name: "",
    name_ar: "",
    description: "",
    description_ar: "",
    is_default: false,
  })

  // Stage form
  const [stageForm, setStageForm] = useState<StageFormData>({
    name: "",
    name_ar: "",
    stage_type: "screening",
    color: "#3B82F6",
    requires_approval: false,
    approvers: [],
    auto_email_template_id: "none",
    auto_reject_enabled: false,
    auto_reject_days: 30,
    sla_warning_days: 3,
    sla_critical_days: 7,
  })

  const filteredPipelines = pipelines.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getPipelineStages = (pipelineId: string) =>
    allStages.filter((s) => s.pipeline_id === pipelineId).sort((a, b) => a.sort_order - b.sort_order)

  const stats = {
    total: pipelines.length,
    active: pipelines.filter((p) => p.is_active).length,
    hasDefault: pipelines.some((p) => p.is_default),
  }

  // Drag and drop sensors for stage reordering
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end for reordering stages
  const handleStageDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !selectedPipeline) return

    const stages = getPipelineStages(selectedPipeline.id)
    const oldIndex = stages.findIndex((s) => s.id === active.id)
    const newIndex = stages.findIndex((s) => s.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(stages, oldIndex, newIndex)

    // Update local state immediately for responsiveness
    const updatedStages = reordered.map((stage, index) => ({
      ...stage,
      sort_order: index,
    }))

    setAllStages((prev) => {
      const otherStages = prev.filter((s) => s.pipeline_id !== selectedPipeline.id)
      return [...otherStages, ...updatedStages]
    })

    // Persist each changed sort_order to database
    for (const stage of updatedStages) {
      const original = stages.find((s) => s.id === stage.id)
      if (original && original.sort_order !== stage.sort_order) {
        supabaseUpdate(
          "pipeline_stages",
          { sort_order: stage.sort_order },
          { column: "id", value: stage.id }
        ).catch((err) => console.error("Failed to update stage order:", err))
      }
    }
  }

  const resetPipelineForm = () => {
    setPipelineForm({
      name: "",
      name_ar: "",
      description: "",
      description_ar: "",
      is_default: false,
    })
    setEditingPipeline(null)
  }

  const resetStageForm = () => {
    setStageForm({
      name: "",
      name_ar: "",
      stage_type: "screening",
      color: "#3B82F6",
      requires_approval: false,
      approvers: [],
      auto_email_template_id: "none",
      auto_reject_enabled: false,
      auto_reject_days: 30,
      sla_warning_days: 3,
      sla_critical_days: 7,
    })
    setEditingStage(null)
  }

  // PIPELINE CRUD
  const handleSavePipeline = async () => {
    if (!pipelineForm.name) {
      toast.error("Please enter pipeline name")
      return
    }

    setIsLoading(true)
    try {
      if (editingPipeline) {
        const { data, error } = await supabaseUpdate<Pipeline>(
          "pipelines",
          {
            name: pipelineForm.name,
            name_ar: pipelineForm.name_ar || null,
            description: pipelineForm.description || null,
            description_ar: pipelineForm.description_ar || null,
            is_default: pipelineForm.is_default,
          },
          { column: "id", value: editingPipeline.id }
        )

        if (error) throw error
        if (data) {
          setPipelines(pipelines.map((p) => (p.id === editingPipeline.id ? data : p)))
        }
        toast.success("Pipeline updated successfully")
      } else {
        // Create the pipeline
        const { data, error } = await supabaseInsert<Pipeline>(
          "pipelines",
          {
            org_id: organizationId,
            name: pipelineForm.name,
            name_ar: pipelineForm.name_ar || null,
            description: pipelineForm.description || null,
            description_ar: pipelineForm.description_ar || null,
            is_default: pipelineForm.is_default,
            is_active: true,
          }
        )

        if (error) throw error
        if (!data) throw new Error("No data returned from insert")

        // Auto-create mandatory system stages (Applied, Hired, Rejected)
        const createdStages: PipelineStage[] = []
        for (const stage of systemStages) {
          const { data: stageData, error: stageError } = await supabaseInsert<PipelineStage>(
            "pipeline_stages",
            {
              org_id: organizationId,
              pipeline_id: data.id,
              name: stage.name,
              name_ar: stage.name_ar,
              stage_type: stage.stage_type,
              color: stage.color,
              sort_order: stage.sort_order,
              is_system: true,
              requires_approval: false,
              approvers: [],
            }
          )
          if (stageError) {
            console.error("Failed to create system stage:", stageError)
          } else if (stageData) {
            createdStages.push(stageData)
          }
        }

        if (createdStages.length > 0) {
          setAllStages([...allStages, ...createdStages])
        }

        setPipelines([data, ...pipelines])
        toast.success("Pipeline created with default stages")
      }

      setIsPipelineDialogOpen(false)
      resetPipelineForm()
      router.refresh()
    } catch (error) {
      toast.error("Failed to save pipeline")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePipeline = async () => {
    if (!selectedPipeline) return

    setIsLoading(true)
    try {
      const { error } = await supabaseDelete(
        "pipelines",
        { column: "id", value: selectedPipeline.id }
      )

      if (error) throw error

      setPipelines(pipelines.filter((p) => p.id !== selectedPipeline.id))
      setAllStages(allStages.filter((s) => s.pipeline_id !== selectedPipeline.id))
      setIsDeleteDialogOpen(false)
      setSelectedPipeline(null)
      toast.success("Pipeline deleted successfully")
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete pipeline")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDuplicatePipeline = async (pipeline: Pipeline) => {
    setIsLoading(true)
    try {
      // Create new pipeline
      const { data: newPipeline, error: pipelineError } = await supabaseInsert<Pipeline>(
        "pipelines",
        {
          org_id: organizationId,
          name: `${pipeline.name} (Copy)`,
          name_ar: pipeline.name_ar,
          description: pipeline.description,
          description_ar: pipeline.description_ar,
          is_default: false,
          is_active: true,
        }
      )

      if (pipelineError) throw pipelineError
      if (!newPipeline) throw new Error("No data returned from insert")

      // Copy stages (preserve is_system flag)
      const pipelineStages = getPipelineStages(pipeline.id)
      if (pipelineStages.length > 0) {
        const copiedStages: PipelineStage[] = []
        for (const s of pipelineStages) {
          const { data: stageData, error: stageError } = await supabaseInsert<PipelineStage>(
            "pipeline_stages",
            {
              org_id: organizationId,
              pipeline_id: newPipeline.id,
              name: s.name,
              name_ar: s.name_ar,
              description: s.description,
              color: s.color,
              sort_order: s.sort_order,
              stage_type: s.stage_type,
              is_system: s.is_system,
              requires_approval: s.requires_approval,
              approvers: s.approvers,
              auto_email_template_id: s.auto_email_template_id,
            }
          )
          if (stageError) {
            console.error("Failed to copy stage:", stageError)
          } else if (stageData) {
            copiedStages.push(stageData)
          }
        }

        if (copiedStages.length > 0) {
          setAllStages([...allStages, ...copiedStages])
        }
      }

      setPipelines([newPipeline, ...pipelines])
      toast.success("Pipeline duplicated successfully")
      router.refresh()
    } catch (error) {
      toast.error("Failed to duplicate pipeline")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const openEditPipelineDialog = (pipeline: Pipeline) => {
    setEditingPipeline(pipeline)
    setPipelineForm({
      name: pipeline.name,
      name_ar: pipeline.name_ar || "",
      description: pipeline.description || "",
      description_ar: pipeline.description_ar || "",
      is_default: pipeline.is_default,
    })
    setIsPipelineDialogOpen(true)
  }

  // STAGE CRUD
  const handleSaveStage = async () => {
    if (!stageForm.name || !selectedPipeline) {
      toast.error("Please enter stage name")
      return
    }

    setIsLoading(true)
    try {
      if (editingStage) {
        const { data, error } = await supabaseUpdate<PipelineStage>(
          "pipeline_stages",
          {
            name: stageForm.name,
            name_ar: stageForm.name_ar || null,
            stage_type: stageForm.stage_type,
            color: stageForm.color,
            requires_approval: stageForm.requires_approval,
            approvers: stageForm.approvers,
            auto_email_template_id: stageForm.auto_email_template_id === "none" ? null : (stageForm.auto_email_template_id || null),
            auto_reject_enabled: stageForm.auto_reject_enabled,
            auto_reject_days: stageForm.auto_reject_enabled ? stageForm.auto_reject_days : null,
            sla_warning_days: stageForm.sla_warning_days || null,
            sla_critical_days: stageForm.sla_critical_days || null,
          },
          { column: "id", value: editingStage.id }
        )

        if (error) throw error
        if (data) {
          setAllStages(allStages.map((s) => (s.id === editingStage.id ? data : s)))
        }
        toast.success("Stage updated successfully")
      } else {
        const pipelineStages = getPipelineStages(selectedPipeline.id)
        const maxOrder = pipelineStages.length > 0
          ? Math.max(...pipelineStages.map((s) => s.sort_order))
          : 0

        const { data, error } = await supabaseInsert<PipelineStage>(
          "pipeline_stages",
          {
            org_id: organizationId,
            pipeline_id: selectedPipeline.id,
            name: stageForm.name,
            name_ar: stageForm.name_ar || null,
            stage_type: stageForm.stage_type,
            color: stageForm.color,
            sort_order: maxOrder + 1,
            requires_approval: stageForm.requires_approval,
            approvers: stageForm.approvers,
            auto_email_template_id: stageForm.auto_email_template_id === "none" ? null : (stageForm.auto_email_template_id || null),
            auto_reject_enabled: stageForm.auto_reject_enabled,
            auto_reject_days: stageForm.auto_reject_enabled ? stageForm.auto_reject_days : null,
            sla_warning_days: stageForm.sla_warning_days || null,
            sla_critical_days: stageForm.sla_critical_days || null,
          }
        )

        if (error) throw error
        if (data) {
          setAllStages([...allStages, data])
        }
        toast.success("Stage added successfully")
      }

      setIsStageDialogOpen(false)
      resetStageForm()
      router.refresh()
    } catch (error) {
      toast.error("Failed to save stage")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteStage = async (stageId: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabaseDelete(
        "pipeline_stages",
        { column: "id", value: stageId }
      )

      if (error) throw error

      setAllStages(allStages.filter((s) => s.id !== stageId))
      toast.success("Stage deleted successfully")
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete stage")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const openEditStageDialog = (stage: PipelineStage) => {
    setEditingStage(stage)
    setStageForm({
      name: stage.name,
      name_ar: stage.name_ar || "",
      stage_type: stage.stage_type,
      color: stage.color,
      requires_approval: stage.requires_approval,
      approvers: stage.approvers || [],
      auto_email_template_id: stage.auto_email_template_id || "none",
      auto_reject_enabled: stage.auto_reject_enabled,
      auto_reject_days: stage.auto_reject_days || 30,
      sla_warning_days: stage.sla_warning_days || 3,
      sla_critical_days: stage.sla_critical_days || 7,
    })
    setIsStageDialogOpen(true)
  }

  const getStageTypeConfig = (type: string) =>
    stageTypes.find((t) => t.value === type) || stageTypes[0]

  const PipelineCard = ({ pipeline }: { pipeline: Pipeline }) => {
    const pipelineStages = getPipelineStages(pipeline.id)

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <GitBranch className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {pipeline.name}
                  {pipeline.is_default && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                </CardTitle>
                {pipeline.description && (
                  <CardDescription className="text-sm line-clamp-1">
                    {pipeline.description}
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
                <DropdownMenuItem onSelect={() => setSelectedPipeline(pipeline)}>
                  <Settings2 className="mr-2 h-4 w-4" />
                  Manage Stages
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => openEditPipelineDialog(pipeline)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleDuplicatePipeline(pipeline)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    setSelectedPipeline(pipeline)
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
          <div className="flex items-center gap-2 mb-3">
            <Badge variant={pipeline.is_active ? "default" : "secondary"}>
              {pipeline.is_active ? "Active" : "Inactive"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {pipelineStages.length} stages
            </span>
          </div>
          {pipelineStages.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {pipelineStages.slice(0, 5).map((stage, index) => (
                <div key={stage.id} className="flex items-center">
                  <div
                    className="px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
                    style={{ backgroundColor: `${stage.color}20`, color: stage.color }}
                  >
                    {stage.name}
                  </div>
                  {index < Math.min(pipelineStages.length - 1, 4) && (
                    <ArrowRight className="h-3 w-3 text-muted-foreground mx-1 flex-shrink-0" />
                  )}
                </div>
              ))}
              {pipelineStages.length > 5 && (
                <span className="text-xs text-muted-foreground ml-1">
                  +{pipelineStages.length - 5} more
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hiring Pipelines</h2>
          <p className="text-muted-foreground">
            Create and manage custom hiring pipelines with stages
          </p>
        </div>
        <Button onClick={() => { resetPipelineForm(); setIsPipelineDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Create Pipeline
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pipelines</CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Default Set</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stats.hasDefault ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )}
              <span className="text-sm">{stats.hasDefault ? "Yes" : "No"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search pipelines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Selected Pipeline Stages View */}
      {selectedPipeline && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  {selectedPipeline.name} - Stages
                </CardTitle>
                <CardDescription>
                  Configure stages, approvals, and automations
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { resetStageForm(); setIsStageDialogOpen(true); }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Stage
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPipeline(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getPipelineStages(selectedPipeline.id).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GitBranch className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No stages configured yet</p>
                  <Button
                    variant="link"
                    onClick={() => { resetStageForm(); setIsStageDialogOpen(true); }}
                  >
                    Add your first stage
                  </Button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleStageDragEnd}
                >
                  <SortableContext
                    items={getPipelineStages(selectedPipeline.id).map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {getPipelineStages(selectedPipeline.id).map((stage) => (
                      <SortableStageItem
                        key={stage.id}
                        stage={stage}
                        stageTypeConfig={getStageTypeConfig(stage.stage_type)}
                        onEdit={openEditStageDialog}
                        onDelete={handleDeleteStage}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipelines Grid */}
      {!selectedPipeline && (
        <>
          {filteredPipelines.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <GitBranch className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No pipelines found</p>
                <Button
                  variant="link"
                  onClick={() => { resetPipelineForm(); setIsPipelineDialogOpen(true); }}
                  className="mt-2"
                >
                  Create your first pipeline
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPipelines.map((pipeline) => (
                <PipelineCard key={pipeline.id} pipeline={pipeline} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Pipeline Dialog */}
      <Dialog open={isPipelineDialogOpen} onOpenChange={setIsPipelineDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPipeline ? "Edit Pipeline" : "Create Pipeline"}
            </DialogTitle>
            <DialogDescription>
              {editingPipeline
                ? "Update pipeline details"
                : "Create a new hiring pipeline template"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name (English) *</Label>
                <Input
                  value={pipelineForm.name}
                  onChange={(e) => setPipelineForm({ ...pipelineForm, name: e.target.value })}
                  placeholder="e.g., Technical Hiring"
                />
              </div>
              <div className="space-y-2">
                <Label>Name (Arabic)</Label>
                <Input
                  value={pipelineForm.name_ar}
                  onChange={(e) => setPipelineForm({ ...pipelineForm, name_ar: e.target.value })}
                  placeholder="التوظيف التقني"
                  dir="rtl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={pipelineForm.description}
                onChange={(e) => setPipelineForm({ ...pipelineForm, description: e.target.value })}
                placeholder="Describe this pipeline..."
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Set as Default</Label>
                <p className="text-sm text-muted-foreground">
                  Use for new jobs by default
                </p>
              </div>
              <Switch
                checked={pipelineForm.is_default}
                onCheckedChange={(checked) =>
                  setPipelineForm({ ...pipelineForm, is_default: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsPipelineDialogOpen(false); resetPipelineForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSavePipeline} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPipeline ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage Dialog */}
      <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStage ? "Edit Stage" : "Add Stage"}
            </DialogTitle>
            <DialogDescription>
              Configure stage settings, approvals, and automations
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="py-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="approval">Approvals</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name (English) *</Label>
                  <Input
                    value={stageForm.name}
                    onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                    placeholder="e.g., Technical Interview"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name (Arabic)</Label>
                  <Input
                    value={stageForm.name_ar}
                    onChange={(e) => setStageForm({ ...stageForm, name_ar: e.target.value })}
                    placeholder="المقابلة التقنية"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stage Type</Label>
                  <Select
                    value={stageForm.stage_type}
                    onValueChange={(value) => setStageForm({ ...stageForm, stage_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stageTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                          stageForm.color === color
                            ? "border-foreground scale-110"
                            : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setStageForm({ ...stageForm, color })}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="approval" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    Candidates must be approved to move to this stage
                  </p>
                </div>
                <Switch
                  checked={stageForm.requires_approval}
                  onCheckedChange={(checked) =>
                    setStageForm({ ...stageForm, requires_approval: checked })
                  }
                />
              </div>
              {stageForm.requires_approval && (
                <div className="space-y-2">
                  <Label>Approvers</Label>
                  <Select
                    value={stageForm.approvers[0] || "none"}
                    onValueChange={(value) =>
                      setStageForm({
                        ...stageForm,
                        approvers: value === "none" ? [] : [value],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select approver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No approver required</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select team members who can approve candidates for this stage
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="automation" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Auto-send Email</Label>
                <Select
                  value={stageForm.auto_email_template_id}
                  onValueChange={(value) =>
                    setStageForm({ ...stageForm, auto_email_template_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select email template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {emailTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Automatically send this email when candidate moves to this stage
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Reject</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically reject if no action taken
                  </p>
                </div>
                <Switch
                  checked={stageForm.auto_reject_enabled}
                  onCheckedChange={(checked) =>
                    setStageForm({ ...stageForm, auto_reject_enabled: checked })
                  }
                />
              </div>
              {stageForm.auto_reject_enabled && (
                <div className="space-y-2">
                  <Label>Days until auto-reject</Label>
                  <Input
                    type="number"
                    value={stageForm.auto_reject_days}
                    onChange={(e) =>
                      setStageForm({ ...stageForm, auto_reject_days: parseInt(e.target.value) || 30 })
                    }
                    min={1}
                    max={365}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SLA Warning (days)</Label>
                  <Input
                    type="number"
                    value={stageForm.sla_warning_days}
                    onChange={(e) =>
                      setStageForm({ ...stageForm, sla_warning_days: parseInt(e.target.value) || 3 })
                    }
                    min={1}
                    max={30}
                  />
                </div>
                <div className="space-y-2">
                  <Label>SLA Critical (days)</Label>
                  <Input
                    type="number"
                    value={stageForm.sla_critical_days}
                    onChange={(e) =>
                      setStageForm({ ...stageForm, sla_critical_days: parseInt(e.target.value) || 7 })
                    }
                    min={1}
                    max={60}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsStageDialogOpen(false); resetStageForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveStage} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingStage ? "Update" : "Add Stage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pipeline</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedPipeline?.name}&quot;? This will also delete all associated stages. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePipeline} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
