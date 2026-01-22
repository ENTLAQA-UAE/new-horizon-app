// @ts-nocheck
// Note: This file uses tables that don't exist in the database schema yet (application_form_sections, etc.)
"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { supabaseInsert, supabaseUpdate, supabaseDelete, supabaseSelect } from "@/lib/supabase/auth-fetch"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Loader2,
  GripVertical,
  FileText,
  Layers,
  Users,
  Image as ImageIcon,
  Upload,
  X,
  ArrowLeft,
  Check,
  Lock,
  Eye,
  EyeOff,
  User,
  Globe,
  GraduationCap,
  Briefcase,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
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

interface Job {
  id: string
  title: string
  title_ar: string | null
  status: string
  thumbnail_url: string | null
  pipeline_id: string | null
}

interface FormSection {
  id: string
  name: string
  name_ar: string | null
  icon: string
  is_default: boolean
  is_enabled: boolean
  sort_order: number
}

interface Pipeline {
  id: string
  name: string
  name_ar: string | null
  description: string | null
  is_default: boolean
}

interface PipelineStage {
  id: string
  pipeline_id: string
  name: string
  name_ar: string | null
  color: string
  stage_type: string
  sort_order: number
}

interface HiringStage {
  id: string
  name: string
  name_ar: string | null
  color: string
  is_default: boolean
  is_terminal: boolean
  sort_order: number
}

interface TeamMember {
  id: string
  first_name?: string
  last_name?: string
  full_name?: string // Computed for display
  email: string
  avatar_url: string | null
  role?: string
}

interface JobSection {
  id: string
  section_id: string
  is_enabled: boolean
  sort_order: number
  section: FormSection
}

interface JobStage {
  id: string
  stage_id: string
  is_enabled: boolean
  sort_order: number
  stage: HiringStage
}

interface JobRecruiter {
  id: string
  user_id: string
  role: string
  user: TeamMember
}

const iconMap: Record<string, any> = {
  user: User,
  globe: Globe,
  "graduation-cap": GraduationCap,
  briefcase: Briefcase,
  "file-text": FileText,
}

// Sortable section item component for drag and drop
interface SortableSectionProps {
  item: JobSection
  onToggle: (sectionId: string) => void
}

function SortableSectionItem({ item, onToggle }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.section_id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const IconComponent = iconMap[item.section?.icon] || FileText

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border bg-background",
        !item.is_enabled && "opacity-50",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className="flex items-center gap-3">
        <button
          className="cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <IconComponent className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{item.section?.name}</p>
          {item.section?.name_ar && (
            <p className="text-sm text-muted-foreground" dir="rtl">
              {item.section.name_ar}
            </p>
          )}
        </div>
        {item.section?.is_default && (
          <Badge variant="secondary" className="ml-2">
            <Lock className="h-3 w-3 mr-1" />
            Required
          </Badge>
        )}
      </div>
      <Switch
        checked={item.is_enabled}
        onCheckedChange={() => onToggle(item.section_id)}
        disabled={item.section?.is_default}
      />
    </div>
  )
}

export default function JobSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useAuth()
  const jobId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  const [job, setJob] = useState<Job | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  // Available options from org settings
  const [availableSections, setAvailableSections] = useState<FormSection[]>([])
  const [availableStages, setAvailableStages] = useState<HiringStage[]>([])
  const [availableTeam, setAvailableTeam] = useState<TeamMember[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([])
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null)

  // Job-specific selections
  const [jobSections, setJobSections] = useState<JobSection[]>([])
  const [jobStages, setJobStages] = useState<JobStage[]>([])
  const [jobRecruiters, setJobRecruiters] = useState<JobRecruiter[]>([])

  const [selectedRecruiter, setSelectedRecruiter] = useState("")

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end for reordering sections
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setJobSections((items) => {
        const oldIndex = items.findIndex((item) => item.section_id === active.id)
        const newIndex = items.findIndex((item) => item.section_id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  useEffect(() => {
    if (profile?.org_id) {
      loadData()
    } else if (profile === null) {
      // Profile loaded but no org_id
      setIsLoading(false)
    }
    // If profile is undefined, still loading auth
  }, [jobId, profile?.org_id])

  const loadData = async () => {
    const orgId = profile?.org_id
    if (!orgId) {
      setIsLoading(false)
      return
    }

    setOrganizationId(orgId)

    try {
      // Load job first - this is essential
      const { data: jobResult } = await supabaseSelect<Job[]>("jobs", {
        select: "id,title,title_ar,status,thumbnail_url,pipeline_id",
        filter: [{ column: "id", operator: "eq", value: jobId }],
        single: true,
      })

      if (!jobResult) {
        toast.error("Job not found")
        setIsLoading(false)
        return
      }
      setJob(jobResult as unknown as Job)

      // Load other data in parallel, with error handling for each
      const [sectionsResult, stagesResult, teamResult, userRolesResult, pipelinesResult] = await Promise.all([
        // Load available sections (may not exist)
        supabaseSelect<FormSection[]>("application_form_sections", {
          filter: [
            { column: "org_id", operator: "eq", value: orgId },
            { column: "is_enabled", operator: "eq", value: true },
          ],
          order: { column: "sort_order", ascending: true },
        }).catch(() => ({ data: null, error: null })),

        // Load available stages (may not exist) - fallback if no pipelines
        supabaseSelect<HiringStage[]>("hiring_stages", {
          filter: [{ column: "org_id", operator: "eq", value: orgId }],
          order: { column: "sort_order", ascending: true },
        }).catch(() => ({ data: null, error: null })),

        // Load team members (all active profiles in org)
        // We'll filter to recruiters client-side using user_roles
        supabaseSelect<TeamMember[]>("profiles", {
          select: "id,first_name,last_name,email,avatar_url",
          filter: [
            { column: "org_id", operator: "eq", value: orgId },
            { column: "is_active", operator: "eq", value: true },
          ],
        }).catch(() => ({ data: null, error: null })),

        // Load user_roles to filter recruiters
        supabaseSelect<{user_id: string; role: string}[]>("user_roles", {
          select: "user_id,role",
          filter: [{ column: "role", operator: "eq", value: "recruiter" }],
        }).catch(() => ({ data: null, error: null })),

        // Load pipelines for vacancy stages selection
        supabaseSelect<Pipeline[]>("pipelines", {
          filter: [{ column: "org_id", operator: "eq", value: orgId }],
          order: { column: "name", ascending: true },
        }).catch(() => ({ data: null, error: null })),
      ])

      const sections = sectionsResult?.data || []
      const stages = stagesResult?.data || []
      const pipelinesData = pipelinesResult?.data || []
      setPipelines(pipelinesData)

      // Use job's existing pipeline_id, or default pipeline, or first available
      const job = jobResult as unknown as Job
      const selectedPipeline = job.pipeline_id
        ? pipelinesData.find(p => p.id === job.pipeline_id)
        : pipelinesData.find(p => p.is_default) || pipelinesData[0]

      if (selectedPipeline) {
        setSelectedPipelineId(selectedPipeline.id)
        // Load stages for the selected pipeline
        const { data: stagesData } = await supabaseSelect<PipelineStage[]>("pipeline_stages", {
          filter: [{ column: "pipeline_id", operator: "eq", value: selectedPipeline.id }],
          order: { column: "sort_order", ascending: true },
        }).catch(() => ({ data: null, error: null }))
        setPipelineStages(stagesData || [])
      }
      // Process team data: filter to recruiters only and compute full_name
      const rawTeam = teamResult?.data || []
      const recruiterUserIds = (userRolesResult?.data || []).map((r: {user_id: string}) => r.user_id)
      const recruitersOnly = rawTeam.filter((t: TeamMember) => recruiterUserIds.includes(t.id))
      const team = recruitersOnly.map((t: TeamMember) => ({
        ...t,
        full_name: [t.first_name, t.last_name].filter(Boolean).join(' ') || t.email,
      }))

      setAvailableSections(sections)
      setAvailableStages(stages)
      setAvailableTeam(team)

      // Load job-specific configurations in parallel
      const [jobSectionsResult, jobStagesResult, recruitersResult] = await Promise.all([
        supabaseSelect<JobSection[]>("job_application_sections", {
          select: "*,section:application_form_sections(*)",
          filter: [{ column: "job_id", operator: "eq", value: jobId }],
          order: { column: "sort_order", ascending: true },
        }).catch(() => ({ data: null, error: null })),

        supabaseSelect<JobStage[]>("job_hiring_stages", {
          select: "*,stage:hiring_stages(*)",
          filter: [{ column: "job_id", operator: "eq", value: jobId }],
          order: { column: "sort_order", ascending: true },
        }).catch(() => ({ data: null, error: null })),

        supabaseSelect<JobRecruiter[]>("job_recruiters", {
          select: "*,user:profiles(id,first_name,last_name,email,avatar_url)",
          filter: [{ column: "job_id", operator: "eq", value: jobId }],
        }).catch(() => ({ data: null, error: null })),
      ])

      // Set job sections
      const jobSectionsData = jobSectionsResult?.data
      if (jobSectionsData && jobSectionsData.length > 0) {
        setJobSections(jobSectionsData)
      } else {
        // Initialize with all available sections
        const initialSections = sections.map((s, i) => ({
          id: `temp-${s.id}`,
          section_id: s.id,
          is_enabled: true,
          sort_order: i,
          section: s,
        }))
        setJobSections(initialSections)
      }

      // Set job stages
      const jobStagesData = jobStagesResult?.data
      if (jobStagesData && jobStagesData.length > 0) {
        setJobStages(jobStagesData)
      } else {
        // Initialize with all available stages
        const initialStages = stages.map((s, i) => ({
          id: `temp-${s.id}`,
          stage_id: s.id,
          is_enabled: true,
          sort_order: s.sort_order,
          stage: s,
        }))
        setJobStages(initialStages)
      }

      setJobRecruiters(recruitersResult?.data || [])

    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Failed to load job settings")
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle section
  const handleToggleSection = (sectionId: string) => {
    setJobSections(prev =>
      prev.map(s =>
        s.section_id === sectionId
          ? { ...s, is_enabled: !s.is_enabled }
          : s
      )
    )
  }

  // Toggle stage
  const handleToggleStage = (stageId: string) => {
    const stage = jobStages.find(s => s.stage_id === stageId)
    if (stage?.stage.is_default) {
      toast.error("Default stages cannot be disabled")
      return
    }
    setJobStages(prev =>
      prev.map(s =>
        s.stage_id === stageId
          ? { ...s, is_enabled: !s.is_enabled }
          : s
      )
    )
  }

  // Handle pipeline selection change
  const handlePipelineChange = async (pipelineId: string) => {
    setSelectedPipelineId(pipelineId)
    try {
      const { data: stagesData } = await supabaseSelect<PipelineStage[]>("pipeline_stages", {
        filter: [{ column: "pipeline_id", operator: "eq", value: pipelineId }],
        order: { column: "sort_order", ascending: true },
      })
      setPipelineStages(stagesData || [])
    } catch (error) {
      console.error("Error loading pipeline stages:", error)
      toast.error("Failed to load pipeline stages")
    }
  }

  // Add recruiter
  const handleAddRecruiter = async () => {
    if (!selectedRecruiter) return

    // Check if already added
    if (jobRecruiters.some(r => r.user_id === selectedRecruiter)) {
      toast.error("This team member is already assigned")
      return
    }

    try {
      const { data, error } = await supabaseInsert<{ id: string; job_id: string; user_id: string; role: string }>(
        "job_recruiters",
        {
          job_id: jobId,
          user_id: selectedRecruiter,
          role: "recruiter",
        }
      )

      if (error) throw new Error(error.message)

      // Construct the full recruiter object with user data from availableTeam
      const user = availableTeam.find(t => t.id === selectedRecruiter)
      if (data && user) {
        const newRecruiter: JobRecruiter = {
          id: data.id,
          user_id: data.user_id,
          role: data.role,
          user: user,
        }
        setJobRecruiters([...jobRecruiters, newRecruiter])
      }
      setSelectedRecruiter("")
      toast.success("Recruiter added")
    } catch (error) {
      toast.error("Failed to add recruiter")
    }
  }

  // Remove recruiter
  const handleRemoveRecruiter = async (recruiterId: string) => {
    try {
      const { error } = await supabaseDelete("job_recruiters", { column: "id", value: recruiterId })

      if (error) throw new Error(error.message)
      setJobRecruiters(jobRecruiters.filter(r => r.id !== recruiterId))
      toast.success("Recruiter removed")
    } catch (error) {
      toast.error("Failed to remove recruiter")
    }
  }

  // Handle thumbnail upload
  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Use profile.org_id as fallback if organizationId state not set
    const orgId = organizationId || profile?.org_id
    if (!orgId) {
      toast.error("Organization not found. Please refresh the page.")
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    setIsUploadingThumbnail(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${orgId}/jobs/${jobId}/thumbnail.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(fileName)

      // Update job with thumbnail URL
      const { error: updateError } = await supabaseUpdate(
        'jobs',
        { thumbnail_url: publicUrl },
        { column: 'id', value: jobId }
      )

      if (updateError) throw new Error(updateError.message)

      setJob(prev => prev ? { ...prev, thumbnail_url: publicUrl } : null)
      toast.success("Thumbnail uploaded successfully")
    } catch (error) {
      console.error("Error uploading thumbnail:", error)
      toast.error("Failed to upload thumbnail")
    } finally {
      setIsUploadingThumbnail(false)
    }
  }

  // Remove thumbnail
  const handleRemoveThumbnail = async () => {
    try {
      const { error } = await supabaseUpdate(
        'jobs',
        { thumbnail_url: null },
        { column: 'id', value: jobId }
      )

      if (error) throw new Error(error.message)
      setJob(prev => prev ? { ...prev, thumbnail_url: null } : null)
      toast.success("Thumbnail removed")
    } catch (error) {
      toast.error("Failed to remove thumbnail")
    }
  }

  // Save all settings
  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save pipeline selection to job
      if (selectedPipelineId) {
        const { error: pipelineError } = await supabaseUpdate(
          "jobs",
          { pipeline_id: selectedPipelineId },
          { column: "id", value: jobId }
        )
        if (pipelineError) throw new Error(pipelineError.message)
      }

      // Save sections - delete existing first
      const { error: deleteSectionsError } = await supabaseDelete("job_application_sections", { column: "job_id", value: jobId })
      if (deleteSectionsError) throw new Error(deleteSectionsError.message)

      const sectionsToInsert = jobSections.map((s, i) => ({
        job_id: jobId,
        section_id: s.section_id,
        is_enabled: s.is_enabled,
        sort_order: i,
      }))

      if (sectionsToInsert.length > 0) {
        // Insert sections one by one using the new utility
        const sectionInsertResults = await Promise.all(
          sectionsToInsert.map(section => supabaseInsert("job_application_sections", section))
        )
        const sectionError = sectionInsertResults.find(r => r.error)
        if (sectionError?.error) throw new Error(sectionError.error.message)
      }

      // Save stages - delete existing first
      const { error: deleteStagesError } = await supabaseDelete("job_hiring_stages", { column: "job_id", value: jobId })
      if (deleteStagesError) throw new Error(deleteStagesError.message)

      const stagesToInsert = jobStages.map((s, i) => ({
        job_id: jobId,
        stage_id: s.stage_id,
        is_enabled: s.is_enabled,
        sort_order: i,
      }))

      if (stagesToInsert.length > 0) {
        // Insert stages one by one using the new utility
        const stageInsertResults = await Promise.all(
          stagesToInsert.map(stage => supabaseInsert("job_hiring_stages", stage))
        )
        const stageError = stageInsertResults.find(r => r.error)
        if (stageError?.error) throw new Error(stageError.error.message)
      }

      toast.success("Settings saved successfully")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
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

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Job not found</p>
        <Link href="/org/jobs">
          <Button variant="link">Back to Jobs</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/org/jobs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Settings - {job.title}</h2>
            <p className="text-muted-foreground">
              Configure application form, hiring stages, and team for this job
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          Save Settings
        </Button>
      </div>

      <Tabs defaultValue="apply-form" className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-56 shrink-0">
          <TabsList className="flex flex-col h-auto w-full bg-transparent space-y-1">
            <TabsTrigger
              value="apply-form"
              className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="mr-2 h-4 w-4" />
              Apply Form
            </TabsTrigger>
            <TabsTrigger
              value="vacancy-stages"
              className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Layers className="mr-2 h-4 w-4" />
              Vacancy Stages
            </TabsTrigger>
            <TabsTrigger
              value="hiring-team"
              className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="mr-2 h-4 w-4" />
              Hiring Team
            </TabsTrigger>
            <TabsTrigger
              value="thumbnail"
              className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Thumbnail Image
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Main Content */}
        <div className="flex-1">
            {/* Apply Form Tab */}
            <TabsContent value="apply-form" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Apply Form</CardTitle>
                  <CardDescription>
                    Drag to reorder sections. Toggle to enable/disable sections in the application form.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={jobSections.map((s) => s.section_id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {jobSections.map((item) => (
                        <SortableSectionItem
                          key={item.section_id}
                          item={item}
                          onToggle={handleToggleSection}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vacancy Stages Tab */}
            <TabsContent value="vacancy-stages" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Vacancy Stages</CardTitle>
                  <CardDescription>
                    Select a hiring pipeline for this job
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Pipeline Selection */}
                  {pipelines.length > 0 && (
                    <div className="space-y-2">
                      <Label>Hiring Pipeline</Label>
                      <Select value={selectedPipelineId || ""} onValueChange={handlePipelineChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a pipeline" />
                        </SelectTrigger>
                        <SelectContent>
                          {pipelines.map((pipeline) => (
                            <SelectItem key={pipeline.id} value={pipeline.id}>
                              {pipeline.name}
                              {pipeline.is_default && " (Default)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {pipelines.find(p => p.id === selectedPipelineId)?.description && (
                        <p className="text-sm text-muted-foreground">
                          {pipelines.find(p => p.id === selectedPipelineId)?.description}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Pipeline Stages */}
                  {pipelineStages.length > 0 ? (
                    <div className="space-y-2">
                      <Label>Pipeline Stages</Label>
                      {pipelineStages.map((stage) => (
                        <div
                          key={stage.id}
                          className="flex items-center justify-between p-4 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                            <p className="font-medium">{stage.name}</p>
                            <Badge variant="outline" className="capitalize">
                              {stage.stage_type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : pipelines.length === 0 ? (
                    /* Fallback to hiring_stages if no pipelines */
                    <div className="space-y-2">
                      <Label>Hiring Stages</Label>
                      {jobStages.map((item) => (
                        <div
                          key={item.stage_id}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-lg border",
                            !item.is_enabled && "opacity-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.stage?.color }}
                            />
                            <p className="font-medium">{item.stage?.name}</p>
                            {item.stage?.is_default && (
                              <Badge variant="secondary">
                                <Lock className="h-3 w-3 mr-1" />
                                Default
                              </Badge>
                            )}
                            {item.stage?.is_terminal && (
                              <Badge variant="outline">Terminal</Badge>
                            )}
                          </div>
                          <Switch
                            checked={item.is_enabled}
                            onCheckedChange={() => handleToggleStage(item.stage_id)}
                            disabled={item.stage?.is_default}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Select a pipeline to view its stages
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Hiring Team Tab */}
            <TabsContent value="hiring-team" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Hiring Team</CardTitle>
                  <CardDescription>
                    Assign team members to manage this job posting
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add recruiter */}
                  <div className="flex gap-2">
                    <Select value={selectedRecruiter} onValueChange={setSelectedRecruiter}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTeam
                          .filter(t => !jobRecruiters.some(r => r.user_id === t.id))
                          .map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.full_name || member.email}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddRecruiter} disabled={!selectedRecruiter}>
                      Add
                    </Button>
                  </div>

                  <Separator />

                  {/* Current recruiters */}
                  {jobRecruiters.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No team members assigned yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {jobRecruiters.map((recruiter) => (
                        <div
                          key={recruiter.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              {recruiter.user?.avatar_url ? (
                                <img
                                  src={recruiter.user.avatar_url}
                                  alt=""
                                  className="w-10 h-10 rounded-full"
                                />
                              ) : (
                                <User className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {recruiter.user?.full_name || recruiter.user?.email}
                              </p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {recruiter.role}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveRecruiter(recruiter.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Thumbnail Tab */}
            <TabsContent value="thumbnail" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Thumbnail Image</CardTitle>
                  <CardDescription>
                    Upload a thumbnail image for this job posting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <input
                    type="file"
                    ref={thumbnailInputRef}
                    onChange={handleThumbnailUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {job.thumbnail_url ? (
                    <div className="space-y-4">
                      <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden border">
                        <img
                          src={job.thumbnail_url}
                          alt="Job thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => thumbnailInputRef.current?.click()}
                          disabled={isUploadingThumbnail}
                        >
                          {isUploadingThumbnail ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          Replace
                        </Button>
                        <Button variant="ghost" onClick={handleRemoveThumbnail}>
                          <X className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      {isUploadingThumbnail ? (
                        <Loader2 className="h-12 w-12 mx-auto text-muted-foreground animate-spin" />
                      ) : (
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                      )}
                      <p className="mt-4 text-sm text-muted-foreground">
                        Click to upload a thumbnail image
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Recommended: 1200x630px, max 5MB
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
