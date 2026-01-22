"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { supabaseUpdate, supabaseDelete } from "@/lib/supabase/auth-fetch"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import {
  Search,
  MoreHorizontal,
  FileText,
  Filter,
  Loader2,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  ArrowRight,
  MessageSquare,
  Download,
  ChevronRight,
  LayoutGrid,
  List,
  User,
  Briefcase,
  GripVertical,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Candidate {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  current_job_title: string | null
  resume_url: string | null
  avatar_url: string | null
}

interface PipelineStage {
  id: string
  name: string
  name_ar: string | null
  color: string
  sort_order: number
  stage_type: string
  is_system?: boolean
}

interface Pipeline {
  id: string
  name: string
  name_ar: string | null
  pipeline_stages: PipelineStage[]
}

interface Job {
  id: string
  title: string
  title_ar: string | null
  department_id: string | null
  location_id: string | null
  pipeline_id: string | null
}

interface JobWithPipeline {
  id: string
  title: string
  title_ar: string | null
  status: string
  pipeline_id: string | null
  pipelines: Pipeline | null
}

interface Application {
  id: string
  candidate_id: string
  job_id: string
  stage_id: string | null
  status: string | null
  ai_match_score: number | null
  manual_score: number | null
  notes: string | null
  applied_at: string | null
  created_at: string | null
  updated_at: string | null
  candidates: Candidate | null
  jobs: Job | null
  pipeline_stages: PipelineStage | null
}

interface ApplicationsClientProps {
  applications: Application[]
  jobsWithPipelines: JobWithPipeline[]
}

// Default stage colors by type
const stageTypeColors: Record<string, string> = {
  applied: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  screening: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  interview: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  assessment: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  offer: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  hired: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export function ApplicationsClient({
  applications: initialApplications,
  jobsWithPipelines,
}: ApplicationsClientProps) {
  const router = useRouter()
  const [applications, setApplications] = useState(initialApplications)
  const [searchQuery, setSearchQuery] = useState("")
  const [stageFilter, setStageFilter] = useState<string>("all")
  const [jobFilter, setJobFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"list" | "pipeline">("list")

  // For pipeline view - selected job
  const [selectedPipelineJob, setSelectedPipelineJob] = useState<string | null>(null)

  // Dialog states
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Selected application
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [notes, setNotes] = useState("")

  // Get jobs that have applications
  const jobsWithApplications = useMemo(() => {
    const jobIds = new Set(applications.map(a => a.job_id))
    return jobsWithPipelines.filter(j => jobIds.has(j.id))
  }, [applications, jobsWithPipelines])

  // Get all unique stages from all pipelines for the list view filter
  const allStages = useMemo(() => {
    const stageMap = new Map<string, PipelineStage>()
    jobsWithPipelines.forEach(job => {
      job.pipelines?.pipeline_stages?.forEach(stage => {
        if (!stageMap.has(stage.id)) {
          stageMap.set(stage.id, stage)
        }
      })
    })
    return Array.from(stageMap.values()).sort((a, b) => a.sort_order - b.sort_order)
  }, [jobsWithPipelines])

  // Get stages for selected job in pipeline view
  const selectedJobStages = useMemo(() => {
    if (!selectedPipelineJob) return []
    const job = jobsWithPipelines.find(j => j.id === selectedPipelineJob)
    return job?.pipelines?.pipeline_stages?.sort((a, b) => a.sort_order - b.sort_order) || []
  }, [selectedPipelineJob, jobsWithPipelines])

  // Filter applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const candidateName = `${app.candidates?.first_name || ""} ${app.candidates?.last_name || ""}`.toLowerCase()
      const jobTitle = app.jobs?.title?.toLowerCase() || ""
      const matchesSearch =
        candidateName.includes(searchQuery.toLowerCase()) ||
        jobTitle.includes(searchQuery.toLowerCase()) ||
        app.candidates?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStage = stageFilter === "all" || app.stage_id === stageFilter
      const matchesJob = jobFilter === "all" || app.job_id === jobFilter
      return matchesSearch && matchesStage && matchesJob
    })
  }, [applications, searchQuery, stageFilter, jobFilter])

  // Applications for pipeline view (filtered by selected job)
  const pipelineApplications = useMemo(() => {
    if (!selectedPipelineJob) return []
    return applications.filter(app => app.job_id === selectedPipelineJob)
  }, [applications, selectedPipelineJob])

  const getApplicationsByStage = (stageId: string) => {
    return pipelineApplications.filter((app) => app.stage_id === stageId)
  }

  // Get stage name for an application
  const getStageName = (app: Application) => {
    if (app.pipeline_stages?.name) return app.pipeline_stages.name
    // Fallback: find stage from job's pipeline
    const job = jobsWithPipelines.find(j => j.id === app.job_id)
    const stage = job?.pipelines?.pipeline_stages?.find(s => s.id === app.stage_id)
    return stage?.name || "Unknown"
  }

  // Get stage color
  const getStageColor = (app: Application) => {
    if (app.pipeline_stages?.color) return app.pipeline_stages.color
    const job = jobsWithPipelines.find(j => j.id === app.job_id)
    const stage = job?.pipelines?.pipeline_stages?.find(s => s.id === app.stage_id)
    return stage?.color || "#6B7280"
  }

  // Get stage type for styling
  const getStageType = (app: Application) => {
    if (app.pipeline_stages?.stage_type) return app.pipeline_stages.stage_type
    const job = jobsWithPipelines.find(j => j.id === app.job_id)
    const stage = job?.pipelines?.pipeline_stages?.find(s => s.id === app.stage_id)
    return stage?.stage_type || "applied"
  }

  const stats = {
    total: applications.length,
    thisWeek: applications.filter((a) => {
      const date = new Date(a.created_at || "")
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return date > weekAgo
    }).length,
    inProgress: applications.filter((a) => {
      const stageType = getStageType(a)
      return ["screening", "interview", "assessment"].includes(stageType)
    }).length,
    hired: applications.filter((a) => getStageType(a) === "hired").length,
  }

  // VIEW
  const openViewDialog = (app: Application) => {
    setSelectedApplication(app)
    setIsViewDialogOpen(true)
  }

  // NOTES
  const openNotesDialog = (app: Application) => {
    setSelectedApplication(app)
    setNotes(app.notes || "")
    setIsNotesDialogOpen(true)
  }

  const handleSaveNotes = async () => {
    if (!selectedApplication) return

    setIsLoading(true)
    try {
      const { error } = await supabaseUpdate(
        "applications",
        {
          notes,
          updated_at: new Date().toISOString(),
        },
        { column: "id", value: selectedApplication.id }
      )

      if (error) {
        toast.error(error.message)
        return
      }

      setApplications(
        applications.map((a) =>
          a.id === selectedApplication.id ? { ...a, notes } : a
        )
      )
      setIsNotesDialogOpen(false)
      toast.success("Notes saved successfully")
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // DELETE
  const openDeleteDialog = (app: Application) => {
    setSelectedApplication(app)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedApplication) return

    setIsLoading(true)
    try {
      const { error } = await supabaseDelete(
        "applications",
        { column: "id", value: selectedApplication.id }
      )

      if (error) {
        toast.error(error.message)
        return
      }

      setApplications(applications.filter((a) => a.id !== selectedApplication.id))
      setIsDeleteDialogOpen(false)
      setSelectedApplication(null)
      toast.success("Application deleted successfully")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // STAGE CHANGE
  const handleStageChange = async (applicationId: string, newStageId: string) => {
    // Find the stage for the toast message
    const stage = selectedJobStages.find(s => s.id === newStageId) ||
                  allStages.find(s => s.id === newStageId)

    // Optimistically update UI
    const previousApplications = [...applications]
    setApplications(
      applications.map((a) =>
        a.id === applicationId ? { ...a, stage_id: newStageId } : a
      )
    )

    try {
      const { error } = await supabaseUpdate(
        "applications",
        {
          stage_id: newStageId,
          updated_at: new Date().toISOString(),
        },
        { column: "id", value: applicationId }
      )

      if (error) {
        // Revert on error
        setApplications(previousApplications)
        toast.error(error.message)
        return
      }

      toast.success(`Moved to ${stage?.name || "new stage"}`)
    } catch {
      // Revert on error
      setApplications(previousApplications)
      toast.error("An unexpected error occurred")
    }
  }

  // Handle drag end for Kanban
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const newStageId = destination.droppableId
    handleStageChange(draggableId, newStageId)
  }

  const formatDate = (date: string | null) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const ApplicationCard = ({ app, index, isDragging }: { app: Application; index: number; isDragging?: boolean }) => (
    <Card className={cn(
      "mb-3 cursor-grab hover:shadow-md transition-shadow",
      isDragging && "shadow-lg ring-2 ring-primary rotate-2"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground/50" />
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {app.candidates?.first_name?.[0] || "?"}{app.candidates?.last_name?.[0] || "?"}
                </span>
              </div>
            </div>
            <div>
              <p className="font-medium text-sm">
                {app.candidates?.first_name} {app.candidates?.last_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {app.candidates?.current_job_title || "No title"}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  openViewDialog(app)
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  openNotesDialog(app)
                }}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Add Notes
              </DropdownMenuItem>
              {app.candidates?.resume_url && (
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Download Resume
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {selectedJobStages
                .filter((s) => s.id !== app.stage_id)
                .map((stage) => (
                  <DropdownMenuItem
                    key={stage.id}
                    onSelect={() => handleStageChange(app.id, stage.id)}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Move to {stage.name}
                  </DropdownMenuItem>
                ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onSelect={(e) => {
                  e.preventDefault()
                  openDeleteDialog(app)
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Applied {formatDate(app.applied_at || app.created_at)}</span>
          </div>
        </div>
        {(app.ai_match_score !== null || app.manual_score !== null) && (
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${app.ai_match_score || app.manual_score || 0}%` }}
              />
            </div>
            <span className="text-xs font-medium">{app.ai_match_score || app.manual_score}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Applications</h2>
          <p className="text-muted-foreground">
            Track and manage candidate applications through your hiring pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "pipeline" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("pipeline")}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Pipeline
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="mr-2 h-4 w-4" />
            Table
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.thisWeek}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.hired}</div>
          </CardContent>
        </Card>
      </div>

      {/* List View Filters */}
      {viewMode === "list" && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or job..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {allStages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Job" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobsWithPipelines.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Pipeline View - Job Selector */}
      {viewMode === "pipeline" && !selectedPipelineJob && (
        <Card className="p-8">
          <div className="text-center space-y-4">
            <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Select a Job to View Pipeline</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Each job has its own hiring pipeline. Select a job to manage its applications.
              </p>
            </div>
            {jobsWithApplications.length === 0 ? (
              <p className="text-muted-foreground">No jobs with applications yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {jobsWithApplications.map((job) => {
                  const jobApps = applications.filter(a => a.job_id === job.id)
                  return (
                    <Card
                      key={job.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setSelectedPipelineJob(job.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{job.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {jobApps.length} application{jobApps.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <Badge variant="outline">{job.status}</Badge>
                        </div>
                        {job.pipelines && (
                          <div className="mt-3 flex items-center gap-1">
                            {job.pipelines.pipeline_stages?.slice(0, 4).map((stage, idx) => (
                              <div key={stage.id} className="flex items-center">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: stage.color }}
                                  title={stage.name}
                                />
                                {idx < Math.min(3, (job.pipelines?.pipeline_stages?.length || 0) - 1) && (
                                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            ))}
                            {(job.pipelines.pipeline_stages?.length || 0) > 4 && (
                              <span className="text-xs text-muted-foreground ml-1">
                                +{(job.pipelines.pipeline_stages?.length || 0) - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Pipeline View - Selected Job Header */}
      {viewMode === "pipeline" && selectedPipelineJob && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPipelineJob(null)}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <span className="text-sm text-muted-foreground">Pipeline for:</span>
              <span className="font-medium ml-2">
                {jobsWithPipelines.find(j => j.id === selectedPipelineJob)?.title}
              </span>
            </div>
          </div>
          <Badge variant="secondary">
            {pipelineApplications.length} application{pipelineApplications.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      )}

      {/* Pipeline View with Drag and Drop */}
      {viewMode === "pipeline" && selectedPipelineJob && selectedJobStages.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {selectedJobStages.map((stage) => {
                const stageApps = getApplicationsByStage(stage.id)
                return (
                  <div key={stage.id} className="w-80 flex-shrink-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        <h3 className="font-semibold">{stage.name}</h3>
                      </div>
                      <Badge variant="secondary">{stageApps.length}</Badge>
                    </div>
                    <Droppable droppableId={stage.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={cn(
                            "min-h-[200px] rounded-lg transition-colors p-2",
                            snapshot.isDraggingOver && "bg-primary/5 ring-2 ring-primary/20"
                          )}
                        >
                          <ScrollArea className="h-[calc(100vh-480px)]">
                            {stageApps.length === 0 && !snapshot.isDraggingOver ? (
                              <Card className="border-dashed">
                                <CardContent className="py-8 text-center">
                                  <p className="text-sm text-muted-foreground">
                                    Drop applications here
                                  </p>
                                </CardContent>
                              </Card>
                            ) : (
                              stageApps.map((app, index) => (
                                <Draggable key={app.id} draggableId={app.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                    >
                                      <ApplicationCard
                                        app={app}
                                        index={index}
                                        isDragging={snapshot.isDragging}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              ))
                            )}
                            {provided.placeholder}
                          </ScrollArea>
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })}
            </div>
          </div>
        </DragDropContext>
      )}

      {/* List/Table View */}
      {viewMode === "list" && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No applications found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => {
                  const stageName = getStageName(app)
                  const stageColor = getStageColor(app)
                  const stageType = getStageType(app)
                  const job = jobsWithPipelines.find(j => j.id === app.job_id)
                  const jobStages = job?.pipelines?.pipeline_stages || []

                  return (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {app.candidates?.first_name?.[0] || "?"}{app.candidates?.last_name?.[0] || "?"}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {app.candidates?.first_name} {app.candidates?.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {app.candidates?.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{app.jobs?.title || "N/A"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          style={{
                            backgroundColor: `${stageColor}20`,
                            color: stageColor,
                            borderColor: stageColor
                          }}
                          variant="outline"
                        >
                          {stageName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(app.applied_at || app.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {(app.ai_match_score !== null || app.manual_score !== null) ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${app.ai_match_score || app.manual_score || 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium">{app.ai_match_score || app.manual_score}%</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
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
                                openViewDialog(app)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault()
                                openNotesDialog(app)
                              }}
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Add Notes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {jobStages
                              .filter((s) => s.id !== app.stage_id)
                              .slice(0, 4)
                              .map((stage) => (
                                <DropdownMenuItem
                                  key={stage.id}
                                  onSelect={() => handleStageChange(app.id, stage.id)}
                                >
                                  <ChevronRight className="mr-2 h-4 w-4" />
                                  Move to {stage.name}
                                </DropdownMenuItem>
                              ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={(e) => {
                                e.preventDefault()
                                openDeleteDialog(app)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">
                    {selectedApplication.candidates?.first_name?.[0] || "?"}
                    {selectedApplication.candidates?.last_name?.[0] || "?"}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedApplication.candidates?.first_name}{" "}
                    {selectedApplication.candidates?.last_name}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedApplication.candidates?.current_job_title || "No title"}
                  </p>
                  <Badge
                    style={{
                      backgroundColor: `${getStageColor(selectedApplication)}20`,
                      color: getStageColor(selectedApplication),
                      borderColor: getStageColor(selectedApplication)
                    }}
                    variant="outline"
                    className="mt-1"
                  >
                    {getStageName(selectedApplication)}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Job:</span>
                  <span>{selectedApplication.jobs?.title || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{selectedApplication.candidates?.email}</span>
                </div>
                {selectedApplication.candidates?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Phone:</span>
                    <span>{selectedApplication.candidates.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Applied:</span>
                  <span>{formatDate(selectedApplication.applied_at || selectedApplication.created_at)}</span>
                </div>
              </div>

              {selectedApplication.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedApplication.notes}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedApplication?.candidates?.resume_url && (
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Download Resume
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Notes</DialogTitle>
            <DialogDescription>
              Add notes about this application
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter your notes here..."
            className="min-h-[150px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this application? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="py-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="font-medium text-destructive">
                  {selectedApplication.candidates?.first_name} {selectedApplication.candidates?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Applied for: {selectedApplication.jobs?.title}
                </p>
              </div>
            </div>
          )}
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
