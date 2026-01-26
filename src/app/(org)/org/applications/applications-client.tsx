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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
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
  Paperclip,
  Clock,
  Plus,
  Video,
  MapPin,
  ExternalLink,
  Upload,
  ChevronDown,
  ChevronUp,
  Star,
  ClipboardCheck,
  XCircle,
  ClipboardList,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Candidate {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  current_title: string | null
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
  org_id: string
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
  candidate_app_count?: number
}

interface ApplicationNote {
  id: string
  application_id: string
  user_id: string
  content: string
  is_private: boolean
  created_at: string
  updated_at: string
  profiles?: {
    first_name: string
    last_name: string
    avatar_url: string | null
  }
}

interface Interview {
  id: string
  application_id: string
  title: string
  interview_type: string
  scheduled_at: string
  duration_minutes: number
  location: string | null
  meeting_link: string | null
  status: string
  organizer_id: string | null
}

interface ApplicationActivity {
  id: string
  application_id: string
  user_id: string | null
  activity_type: string
  description: string | null
  metadata: Record<string, unknown>
  created_at: string
  profiles?: {
    first_name: string
    last_name: string
  }
}

interface ApplicationAttachment {
  id: string
  application_id: string
  file_name: string
  file_type: string | null
  file_url: string
  file_size: number | null
  mime_type: string | null
  description: string | null
  created_at: string
}

interface ScorecardTemplate {
  id: string
  name: string
  name_ar?: string
  description?: string
  template_type: string
  criteria: Array<{
    id: string
    name: string
    name_ar?: string
    description?: string
    weight: number
  }>
  rating_scale_type: string
  rating_scale_labels: Record<string, string>
}

interface InterviewScorecard {
  id: string
  interview_id: string
  template_id: string | null
  interviewer_id: string
  criteria_scores: Array<{ criteria_id: string; score: number; notes?: string }>
  overall_score: number | null
  recommendation: string
  strengths?: string
  weaknesses?: string
  additional_notes?: string
  status: string
  submitted_at: string | null
  created_at: string
  profiles?: {
    first_name: string
    last_name: string
  }
  scorecard_templates?: {
    name: string
  }
  interviews?: {
    title: string
    scheduled_at: string
  }
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
  const [isPipelineJobDialogOpen, setIsPipelineJobDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Selected application
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [notes, setNotes] = useState("")

  // Application details data for dialog
  const [applicationNotes, setApplicationNotes] = useState<ApplicationNote[]>([])
  const [applicationInterviews, setApplicationInterviews] = useState<Interview[]>([])
  const [applicationActivities, setApplicationActivities] = useState<ApplicationActivity[]>([])
  const [applicationAttachments, setApplicationAttachments] = useState<ApplicationAttachment[]>([])
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [newNote, setNewNote] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)

  // Expanded rows for multi-application candidates
  const [expandedCandidates, setExpandedCandidates] = useState<Set<string>>(new Set())

  // Star rating (1-5 stars, stored as 0-100 in manual_score: 1 star = 20, 5 stars = 100)
  const [isUpdatingRating, setIsUpdatingRating] = useState(false)

  // Scorecard
  const [selectedInterviewForScorecard, setSelectedInterviewForScorecard] = useState<Interview | null>(null)
  const [isScorecardDialogOpen, setIsScorecardDialogOpen] = useState(false)
  const [scorecardTemplates, setScorecardTemplates] = useState<ScorecardTemplate[]>([])
  const [applicationScorecards, setApplicationScorecards] = useState<InterviewScorecard[]>([])
  const [isLoadingScorecards, setIsLoadingScorecards] = useState(false)

  // Disqualify dialog
  const [isDisqualifyDialogOpen, setIsDisqualifyDialogOpen] = useState(false)
  const [disqualifyReason, setDisqualifyReason] = useState("")
  const [isDisqualifying, setIsDisqualifying] = useState(false)

  // Scorecard submission dialog
  const [isScorecardSubmitDialogOpen, setIsScorecardSubmitDialogOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [selectedInterviewId, setSelectedInterviewId] = useState<string>("")

  // Get other applications for a candidate
  const getOtherApplicationsForCandidate = (candidateId: string, currentAppId: string) => {
    return applications.filter(app => app.candidate_id === candidateId && app.id !== currentAppId)
  }

  // Toggle expanded state for a candidate
  const toggleExpanded = (candidateId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedCandidates(prev => {
      const newSet = new Set(prev)
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId)
      } else {
        newSet.add(candidateId)
      }
      return newSet
    })
  }

  // Handle star rating change (1-5 stars = 20-100 score)
  const handleRatingChange = async (applicationId: string, stars: number) => {
    const score = stars * 20 // Convert 1-5 stars to 20-100 score
    setIsUpdatingRating(true)

    try {
      const { error } = await supabaseUpdate(
        "applications",
        {
          manual_score: score,
          updated_at: new Date().toISOString(),
        },
        { column: "id", value: applicationId }
      )

      if (error) {
        toast.error("Failed to update rating")
        return
      }

      // Update local state
      setApplications(
        applications.map((a) =>
          a.id === applicationId ? { ...a, manual_score: score } : a
        )
      )
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication({ ...selectedApplication, manual_score: score })
      }
      toast.success("Rating updated")
    } catch {
      toast.error("Failed to update rating")
    } finally {
      setIsUpdatingRating(false)
    }
  }

  // Convert score to stars (20-100 to 1-5)
  const scoreToStars = (score: number | null) => {
    if (score === null) return 0
    return Math.round(score / 20)
  }

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

  // Fetch application details (notes, interviews, activities, attachments, scorecards)
  const fetchApplicationDetails = async (applicationId: string) => {
    setIsLoadingDetails(true)
    setIsLoadingScorecards(true)
    try {
      const [notesRes, interviewsRes, activitiesRes, attachmentsRes, scorecardsRes, templatesRes] = await Promise.all([
        fetch(`/api/applications/${applicationId}/notes`),
        fetch(`/api/applications/${applicationId}/interviews`),
        fetch(`/api/applications/${applicationId}/activities`),
        fetch(`/api/applications/${applicationId}/attachments`),
        fetch(`/api/applications/${applicationId}/scorecards`),
        fetch(`/api/scorecard-templates`),
      ])

      if (notesRes.ok) {
        const notesData = await notesRes.json()
        setApplicationNotes(notesData.notes || [])
      }
      if (interviewsRes.ok) {
        const interviewsData = await interviewsRes.json()
        setApplicationInterviews(interviewsData.interviews || [])
      }
      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json()
        setApplicationActivities(activitiesData.activities || [])
      }
      if (attachmentsRes.ok) {
        const attachmentsData = await attachmentsRes.json()
        setApplicationAttachments(attachmentsData.attachments || [])
      }
      if (scorecardsRes.ok) {
        const scorecardsData = await scorecardsRes.json()
        setApplicationScorecards(scorecardsData.scorecards || [])
      }
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json()
        setScorecardTemplates(templatesData.templates || [])
      }
    } catch (error) {
      console.error("Error fetching application details:", error)
    } finally {
      setIsLoadingDetails(false)
      setIsLoadingScorecards(false)
    }
  }

  // VIEW
  const openViewDialog = (app: Application) => {
    setSelectedApplication(app)
    setApplicationNotes([])
    setApplicationInterviews([])
    setApplicationActivities([])
    setApplicationAttachments([])
    setApplicationScorecards([])
    setScorecardTemplates([])
    setNewNote("")
    setDisqualifyReason("")
    setSelectedTemplateId("")
    setSelectedInterviewId("")
    setIsViewDialogOpen(true)
    fetchApplicationDetails(app.id)
  }

  // Disqualify candidate
  const handleDisqualify = async () => {
    if (!selectedApplication) return

    setIsDisqualifying(true)
    try {
      // Find the rejected stage for this job's pipeline
      const job = jobsWithPipelines.find(j => j.id === selectedApplication.job_id)
      const rejectedStage = job?.pipelines?.pipeline_stages?.find(s => s.stage_type === "rejected")

      if (!rejectedStage) {
        toast.error("No rejection stage found in pipeline")
        return
      }

      const { error } = await supabaseUpdate(
        "applications",
        {
          stage_id: rejectedStage.id,
          status: "rejected",
          updated_at: new Date().toISOString(),
        },
        { column: "id", value: selectedApplication.id }
      )

      if (error) {
        toast.error(error.message)
        return
      }

      // Add a note with the disqualification reason if provided
      if (disqualifyReason) {
        fetch(`/api/applications/${selectedApplication.id}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `Disqualified: ${disqualifyReason}`,
            is_private: false,
          }),
        }).catch((err) => {
          console.error("Failed to add disqualification note:", err)
        })
      }

      // Update local state
      setApplications(
        applications.map((a) =>
          a.id === selectedApplication.id
            ? { ...a, stage_id: rejectedStage.id, status: "rejected" }
            : a
        )
      )
      setSelectedApplication({
        ...selectedApplication,
        stage_id: rejectedStage.id,
        status: "rejected",
      })

      // Send notification
      if (selectedApplication.candidates && selectedApplication.jobs) {
        fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: "candidate_disqualified",
            orgId: selectedApplication.jobs.org_id,
            data: {
              candidateName: `${selectedApplication.candidates.first_name} ${selectedApplication.candidates.last_name}`,
              candidateEmail: selectedApplication.candidates.email,
              jobTitle: selectedApplication.jobs.title,
              reason: disqualifyReason,
              applicationId: selectedApplication.id,
            },
          }),
        }).catch((err) => {
          console.error("Failed to send disqualify notification:", err)
        })
      }

      setIsDisqualifyDialogOpen(false)
      setDisqualifyReason("")
      toast.success("Candidate disqualified")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsDisqualifying(false)
    }
  }

  // Open scorecard submission page
  const handleOpenScorecardSubmit = () => {
    if (!selectedInterviewId || !selectedTemplateId) {
      toast.error("Please select an interview and template")
      return
    }
    // Navigate to scorecard submission page with pre-selected values
    router.push(`/org/scorecards/submit?interview=${selectedInterviewId}&template=${selectedTemplateId}`)
  }

  // Add note to application
  const handleAddNote = async () => {
    if (!selectedApplication || !newNote.trim()) return

    setIsAddingNote(true)
    try {
      const res = await fetch(`/api/applications/${selectedApplication.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote, is_private: false }),
      })

      if (res.ok) {
        const data = await res.json()
        setApplicationNotes([data.note, ...applicationNotes])
        setNewNote("")
        toast.success("Note added successfully")
      } else {
        toast.error("Failed to add note")
      }
    } catch {
      toast.error("Failed to add note")
    } finally {
      setIsAddingNote(false)
    }
  }

  // Open resume/attachment in new tab (like Google Drive - view & download from there)
  const handleOpenFile = (fileUrl: string) => {
    if (!fileUrl) {
      toast.error("File URL not available")
      return
    }
    // Open the file directly in a new tab - user can view and download from there
    window.open(fileUrl, "_blank", "noopener,noreferrer")
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

      // Get candidate and job info for notification
      const app = applications.find(a => a.id === applicationId)
      if (app && app.candidates && app.jobs) {
        const candidate = app.candidates
        const job = app.jobs

        // Get org_id from app
        fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: stage?.stage_type === "rejected" ? "candidate_rejection" : "candidate_stage_moved",
            orgId: app.jobs?.org_id,
            data: {
              candidateName: `${candidate.first_name} ${candidate.last_name}`,
              candidateEmail: candidate.email,
              jobTitle: job.title,
              stageName: stage?.name || "new stage",
              applicationId: applicationId,
            },
          }),
        }).catch((err) => {
          console.error("Failed to send stage change notification:", err)
        })
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
                {app.candidates?.current_title || "No title"}
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
                <DropdownMenuItem
                  onSelect={() => {
                    handleOpenFile(app.candidates!.resume_url!)
                  }}
                >
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
            onClick={() => {
              if (viewMode === "pipeline") {
                // Already in pipeline view, show job selector dialog
                setIsPipelineJobDialogOpen(true)
              } else {
                // Switching to pipeline view, show job selector dialog first
                setIsPipelineJobDialogOpen(true)
              }
            }}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Pipeline
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setViewMode("list")
              setSelectedPipelineJob(null)
            }}
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

      {/* Pipeline View - No Job Selected (fallback) */}
      {viewMode === "pipeline" && !selectedPipelineJob && (
        <Card className="p-8">
          <div className="text-center space-y-4">
            <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No Job Selected</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Select a job to view its hiring pipeline and manage applications by stage.
              </p>
            </div>
            <Button onClick={() => setIsPipelineJobDialogOpen(true)}>
              <Briefcase className="mr-2 h-4 w-4" />
              Select Job
            </Button>
          </div>
        </Card>
      )}

      {/* Pipeline View - Selected Job Header */}
      {viewMode === "pipeline" && selectedPipelineJob && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPipelineJobDialogOpen(true)}
            >
              <Briefcase className="h-4 w-4 mr-1" />
              Change Job
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
                <TableHead className="w-8"></TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No applications found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => {
                  const stageName = getStageName(app)
                  const stageColor = getStageColor(app)
                  const isMulti = (app.candidate_app_count || 1) > 1
                  const isExpanded = expandedCandidates.has(app.candidate_id)
                  const otherApps = isMulti ? getOtherApplicationsForCandidate(app.candidate_id, app.id) : []

                  return (
                    <>
                      <TableRow key={app.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openViewDialog(app)}>
                        {/* Expand button */}
                        <TableCell className="w-8 px-2">
                          {isMulti && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => toggleExpanded(app.candidate_id, e)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {app.candidates?.first_name?.[0] || "?"}{app.candidates?.last_name?.[0] || "?"}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-primary hover:underline">
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
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const currentStars = scoreToStars(app.manual_score)
                              return (
                                <Star
                                  key={star}
                                  className={cn(
                                    "h-4 w-4",
                                    star <= currentStars
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "fill-transparent text-gray-300"
                                  )}
                                />
                              )
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isMulti ? (
                            <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
                              Multi
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Single
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                      {/* Expanded rows showing other applications */}
                      {isMulti && isExpanded && otherApps.map((otherApp) => {
                        const otherStageName = getStageName(otherApp)
                        const otherStageColor = getStageColor(otherApp)
                        return (
                          <TableRow
                            key={otherApp.id}
                            className="cursor-pointer hover:bg-muted/50 bg-muted/20"
                            onClick={() => openViewDialog(otherApp)}
                          >
                            <TableCell className="w-8 px-2">
                              <div className="pl-4 text-muted-foreground">↳</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3 pl-4">
                                <div className="text-sm text-muted-foreground">
                                  Same candidate
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{otherApp.jobs?.title || "N/A"}</span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                style={{
                                  backgroundColor: `${otherStageColor}20`,
                                  color: otherStageColor,
                                  borderColor: otherStageColor
                                }}
                                variant="outline"
                              >
                                {otherStageName}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(otherApp.applied_at || otherApp.created_at)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const currentStars = scoreToStars(otherApp.manual_score)
                                  return (
                                    <Star
                                      key={star}
                                      className={cn(
                                        "h-4 w-4",
                                        star <= currentStars
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "fill-transparent text-gray-300"
                                      )}
                                    />
                                  )
                                })}
                              </div>
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        )
                      })}
                    </>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* View Dialog - Enhanced with Tabs */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          {selectedApplication && (
            <>
              {/* Header with gradient background */}
              <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-[var(--brand-primary,#6366f1)]/5 to-[var(--brand-secondary,#8b5cf6)]/5">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--brand-primary,#6366f1)] to-[var(--brand-secondary,#8b5cf6)] flex items-center justify-center shadow-lg">
                    <span className="text-xl font-bold text-white">
                      {selectedApplication.candidates?.first_name?.[0] || "?"}
                      {selectedApplication.candidates?.last_name?.[0] || "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold truncate">
                      {selectedApplication.candidates?.first_name}{" "}
                      {selectedApplication.candidates?.last_name}
                    </h2>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {selectedApplication.candidates?.current_title || "No title"} • {selectedApplication.jobs?.title}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      {/* Stage dropdown */}
                      <Select
                        value={selectedApplication.stage_id || ""}
                        onValueChange={(newStageId) => {
                          handleStageChange(selectedApplication.id, newStageId)
                          setSelectedApplication({
                            ...selectedApplication,
                            stage_id: newStageId,
                          })
                        }}
                      >
                        <SelectTrigger
                          className="w-auto h-8 px-3 text-xs font-medium border-0"
                          style={{
                            backgroundColor: getStageColor(selectedApplication),
                            color: "white",
                          }}
                        >
                          <SelectValue>{getStageName(selectedApplication)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const job = jobsWithPipelines.find(j => j.id === selectedApplication.job_id)
                            return job?.pipelines?.pipeline_stages?.map((stage) => (
                              <SelectItem key={stage.id} value={stage.id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: stage.color }}
                                  />
                                  {stage.name}
                                </div>
                              </SelectItem>
                            ))
                          })()}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                        onClick={() => {
                          // Navigate to interviews page with application pre-selected
                          router.push(`/org/interviews?schedule=${selectedApplication.id}`)
                        }}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        Schedule Interview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                        onClick={() => setIsScorecardSubmitDialogOpen(true)}
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                        Scorecard
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setIsDisqualifyDialogOpen(true)}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Disqualify
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Applied {formatDate(selectedApplication.applied_at || selectedApplication.created_at)}
                      </span>
                    </div>
                  </div>
                  {/* Star Rating */}
                  <div className="flex flex-col items-center px-4 py-2 bg-white dark:bg-background rounded-lg border shadow-sm">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const currentStars = scoreToStars(selectedApplication.manual_score)
                        return (
                          <button
                            key={star}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRatingChange(selectedApplication.id, star)
                            }}
                            disabled={isUpdatingRating}
                            className="p-0.5 hover:scale-110 transition-transform disabled:opacity-50"
                          >
                            <Star
                              className={cn(
                                "h-5 w-5 transition-colors",
                                star <= currentStars
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "fill-transparent text-gray-300 hover:text-yellow-300"
                              )}
                            />
                          </button>
                        )
                      })}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">Rating</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 pt-2 border-b bg-muted/30">
                  <TabsList className="h-12 w-full justify-start gap-1 bg-transparent p-0">
                    <TabsTrigger
                      value="details"
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-[var(--brand-primary,#6366f1)] px-4 py-2.5"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Applicant Details
                    </TabsTrigger>
                    <TabsTrigger
                      value="attachments"
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-[var(--brand-primary,#6366f1)] px-4 py-2.5"
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attachments
                    </TabsTrigger>
                    <TabsTrigger
                      value="notes"
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-[var(--brand-primary,#6366f1)] px-4 py-2.5"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Notes
                    </TabsTrigger>
                    <TabsTrigger
                      value="events"
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-[var(--brand-primary,#6366f1)] px-4 py-2.5"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Events
                    </TabsTrigger>
                    <TabsTrigger
                      value="timeline"
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-[var(--brand-primary,#6366f1)] px-4 py-2.5"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Timeline
                    </TabsTrigger>
                    <TabsTrigger
                      value="scorecards"
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-[var(--brand-primary,#6366f1)] px-4 py-2.5"
                    >
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Scorecards
                    </TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-6">
                    {/* Details Tab */}
                    <TabsContent value="details" className="mt-0 space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Contact Information</h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Mail className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Email</p>
                                <a href={`mailto:${selectedApplication.candidates?.email}`} className="text-sm font-medium text-[var(--brand-primary,#6366f1)] hover:underline">
                                  {selectedApplication.candidates?.email}
                                </a>
                              </div>
                            </div>
                            {selectedApplication.candidates?.phone && (
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                  <Phone className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Phone</p>
                                  <a href={`tel:${selectedApplication.candidates.phone}`} className="text-sm font-medium text-[var(--brand-primary,#6366f1)] hover:underline">
                                    {selectedApplication.candidates.phone}
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Application Details</h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Position</p>
                                <p className="text-sm font-medium">{selectedApplication.jobs?.title || "N/A"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-orange-600" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Applied Date</p>
                                <p className="text-sm font-medium">{formatDate(selectedApplication.applied_at || selectedApplication.created_at)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Attachments Tab */}
                    <TabsContent value="attachments" className="mt-0">
                      {isLoadingDetails ? (
                        <div className="flex items-center justify-center py-16">
                          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary,#6366f1)]" />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedApplication.candidates?.resume_url && (
                            <div className="flex items-center justify-between p-4 border rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                  <FileText className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium">Resume - {selectedApplication.candidates?.first_name} {selectedApplication.candidates?.last_name}</p>
                                  <p className="text-sm text-muted-foreground">From candidate profile</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                                onClick={() => handleOpenFile(selectedApplication.candidates!.resume_url!)}
                              >
                                <Download className="h-5 w-5 text-blue-600" />
                              </Button>
                            </div>
                          )}
                          {applicationAttachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center justify-between p-4 border rounded-xl hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                  <FileText className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="font-medium">{attachment.file_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {attachment.file_type || "Document"} • {formatDate(attachment.created_at)}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => window.open(attachment.file_url, "_blank")}
                              >
                                <Download className="h-5 w-5" />
                              </Button>
                            </div>
                          ))}
                          {!selectedApplication.candidates?.resume_url && applicationAttachments.length === 0 && (
                            <div className="text-center py-16">
                              <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                <Paperclip className="h-8 w-8 text-muted-foreground/50" />
                              </div>
                              <p className="text-muted-foreground font-medium">No attachments yet</p>
                              <p className="text-sm text-muted-foreground mt-1">Attachments will appear here when added</p>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    {/* Notes Tab */}
                    <TabsContent value="notes" className="mt-0 space-y-6">
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Add a note about this candidate..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="min-h-[100px] resize-none"
                        />
                        <div className="flex justify-end">
                          <Button
                            onClick={handleAddNote}
                            disabled={isAddingNote || !newNote.trim()}
                            className="bg-[var(--brand-primary,#6366f1)] hover:bg-[var(--brand-primary,#6366f1)]/90"
                          >
                            {isAddingNote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Note
                          </Button>
                        </div>
                      </div>
                      <Separator />
                      {isLoadingDetails ? (
                        <div className="flex items-center justify-center py-16">
                          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary,#6366f1)]" />
                        </div>
                      ) : applicationNotes.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                          <p className="text-muted-foreground font-medium">No notes yet</p>
                          <p className="text-sm text-muted-foreground mt-1">Add a note to track important information</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {applicationNotes.map((note) => (
                            <div key={note.id} className="p-4 border rounded-xl">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand-primary,#6366f1)] to-[var(--brand-secondary,#8b5cf6)] flex items-center justify-center">
                                    <span className="text-xs font-medium text-white">
                                      {note.profiles?.first_name?.[0] || "U"}
                                    </span>
                                  </div>
                                  <span className="font-medium">
                                    {note.profiles?.first_name} {note.profiles?.last_name}
                                  </span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(note.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-11">{note.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Events Tab */}
                    <TabsContent value="events" className="mt-0">
                      {isLoadingDetails ? (
                        <div className="flex items-center justify-center py-16">
                          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary,#6366f1)]" />
                        </div>
                      ) : applicationInterviews.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <Calendar className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                          <p className="text-muted-foreground font-medium">No interviews scheduled</p>
                          <p className="text-sm text-muted-foreground mt-1">Schedule an interview from the Interviews page</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {applicationInterviews.map((interview) => (
                            <div key={interview.id} className="p-4 border rounded-xl hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                  <div className={cn(
                                    "w-12 h-12 rounded-lg flex items-center justify-center",
                                    interview.interview_type === "video" ? "bg-blue-100 dark:bg-blue-900/30" :
                                    interview.interview_type === "in_person" ? "bg-green-100 dark:bg-green-900/30" :
                                    "bg-purple-100 dark:bg-purple-900/30"
                                  )}>
                                    {interview.interview_type === "video" ? (
                                      <Video className="h-6 w-6 text-blue-600" />
                                    ) : interview.interview_type === "in_person" ? (
                                      <MapPin className="h-6 w-6 text-green-600" />
                                    ) : (
                                      <Phone className="h-6 w-6 text-purple-600" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium">{interview.title}</p>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                      <Calendar className="h-4 w-4" />
                                      <span>
                                        {new Date(interview.scheduled_at).toLocaleDateString("en-US", {
                                          weekday: "short",
                                          month: "short",
                                          day: "numeric",
                                          hour: "numeric",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                      <span>•</span>
                                      <span>{interview.duration_minutes} min</span>
                                    </div>
                                    {interview.location && (
                                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        <span>{interview.location}</span>
                                      </div>
                                    )}
                                    {interview.meeting_link && (
                                      <a
                                        href={interview.meeting_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 mt-2 text-sm text-[var(--brand-primary,#6366f1)] hover:underline"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                        Join Meeting
                                      </a>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <Badge variant={
                                    interview.status === "completed" ? "default" :
                                    interview.status === "cancelled" ? "destructive" :
                                    "secondary"
                                  }>
                                    {interview.status}
                                  </Badge>
                                  {(interview.status === "completed" || interview.status === "confirmed" || interview.status === "scheduled") && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1.5"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        // Navigate to scorecards page with interview pre-selected
                                        router.push(`/org/interviews/scorecards?interview=${interview.id}`)
                                      }}
                                    >
                                      <ClipboardCheck className="h-4 w-4" />
                                      Fill Scorecard
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Timeline Tab */}
                    <TabsContent value="timeline" className="mt-0">
                      {isLoadingDetails ? (
                        <div className="flex items-center justify-center py-16">
                          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary,#6366f1)]" />
                        </div>
                      ) : applicationActivities.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <Clock className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                          <p className="text-muted-foreground font-medium">No activity recorded</p>
                          <p className="text-sm text-muted-foreground mt-1">Activity will appear here as actions are taken</p>
                        </div>
                      ) : (
                        <div className="relative pl-8">
                          <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[var(--brand-primary,#6366f1)] to-[var(--brand-secondary,#8b5cf6)]" />
                          <div className="space-y-6">
                            {applicationActivities.map((activity) => (
                              <div key={activity.id} className="relative">
                                <div className="absolute -left-5 w-4 h-4 rounded-full bg-[var(--brand-primary,#6366f1)] border-4 border-background" />
                                <div className="pl-4">
                                  <p className="font-medium">{activity.description || activity.activity_type}</p>
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {activity.profiles?.first_name && `${activity.profiles.first_name} ${activity.profiles.last_name} • `}
                                    {new Date(activity.created_at).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "numeric",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* Scorecards Tab */}
                    <TabsContent value="scorecards" className="mt-0">
                      {isLoadingScorecards ? (
                        <div className="flex items-center justify-center py-16">
                          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary,#6366f1)]" />
                        </div>
                      ) : applicationScorecards.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                          <p className="text-muted-foreground font-medium">No scorecards submitted yet</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Scorecards will appear here once interviewers submit their evaluations
                          </p>
                          {applicationInterviews.length > 0 && (
                            <Button
                              variant="outline"
                              className="mt-4"
                              onClick={() => setIsScorecardSubmitDialogOpen(true)}
                            >
                              <ClipboardList className="mr-2 h-4 w-4" />
                              Submit Scorecard
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {applicationScorecards.map((scorecard) => (
                            <div key={scorecard.id} className="p-4 border rounded-xl hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--brand-primary,#6366f1)] to-[var(--brand-secondary,#8b5cf6)] flex items-center justify-center">
                                    <span className="text-sm font-bold text-white">
                                      {scorecard.profiles?.first_name?.[0] || "?"}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      {scorecard.profiles?.first_name} {scorecard.profiles?.last_name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {scorecard.scorecard_templates?.name || "General Evaluation"}
                                    </p>
                                    {scorecard.interviews && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Interview: {scorecard.interviews.title}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <Badge
                                    variant={
                                      scorecard.recommendation === "strong_yes" || scorecard.recommendation === "yes"
                                        ? "default"
                                        : scorecard.recommendation === "strong_no" || scorecard.recommendation === "no"
                                        ? "destructive"
                                        : "secondary"
                                    }
                                    className={
                                      scorecard.recommendation === "strong_yes"
                                        ? "bg-green-600"
                                        : scorecard.recommendation === "yes"
                                        ? "bg-green-500"
                                        : ""
                                    }
                                  >
                                    {scorecard.recommendation === "strong_yes" && "Strong Yes"}
                                    {scorecard.recommendation === "yes" && "Yes"}
                                    {scorecard.recommendation === "neutral" && "Neutral"}
                                    {scorecard.recommendation === "no" && "No"}
                                    {scorecard.recommendation === "strong_no" && "Strong No"}
                                  </Badge>
                                  {scorecard.overall_score !== null && (
                                    <div className="flex items-center gap-1">
                                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                      <span className="text-sm font-medium">{scorecard.overall_score.toFixed(1)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {(scorecard.strengths || scorecard.weaknesses) && (
                                <div className="mt-4 pt-4 border-t grid md:grid-cols-2 gap-4">
                                  {scorecard.strengths && (
                                    <div>
                                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">
                                        Strengths
                                      </p>
                                      <p className="text-sm text-muted-foreground">{scorecard.strengths}</p>
                                    </div>
                                  )}
                                  {scorecard.weaknesses && (
                                    <div>
                                      <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">
                                        Areas for Improvement
                                      </p>
                                      <p className="text-sm text-muted-foreground">{scorecard.weaknesses}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                  Submitted {scorecard.submitted_at ? formatDate(scorecard.submitted_at) : formatDate(scorecard.created_at)}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {scorecard.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>

              {/* Footer */}
              <div className="px-6 py-4 border-t bg-muted/30 flex justify-end">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </>
          )}
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

      {/* Pipeline Job Selector Dialog */}
      <Dialog open={isPipelineJobDialogOpen} onOpenChange={setIsPipelineJobDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Job for Pipeline View</DialogTitle>
            <DialogDescription>
              Choose a job to view its hiring pipeline and manage applications by stage.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {jobsWithApplications.length === 0 ? (
              <div className="text-center py-6">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No jobs with applications found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Applications will appear here once candidates apply
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {jobsWithApplications.map((job) => {
                  const appCount = applications.filter(a => a.job_id === job.id).length
                  return (
                    <button
                      key={job.id}
                      onClick={() => {
                        setSelectedPipelineJob(job.id)
                        setViewMode("pipeline")
                        setIsPipelineJobDialogOpen(false)
                      }}
                      className="w-full p-3 text-left rounded-lg border hover:bg-accent hover:border-primary transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-medium group-hover:text-primary">{job.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {job.pipelines?.name || "Default Pipeline"} • {appCount} application{appCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <LayoutGrid className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPipelineJobDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disqualify Dialog */}
      <Dialog open={isDisqualifyDialogOpen} onOpenChange={setIsDisqualifyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Disqualify Candidate</DialogTitle>
            <DialogDescription>
              This will move the candidate to the rejected stage. Optionally provide a reason.
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="font-medium text-red-800 dark:text-red-200">
                  {selectedApplication.candidates?.first_name} {selectedApplication.candidates?.last_name}
                </p>
                <p className="text-sm text-red-600 dark:text-red-300">
                  Applied for: {selectedApplication.jobs?.title}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="disqualify-reason">Reason (Optional)</Label>
                <Textarea
                  id="disqualify-reason"
                  value={disqualifyReason}
                  onChange={(e) => setDisqualifyReason(e.target.value)}
                  placeholder="Provide a reason for disqualification..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDisqualifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisqualify}
              disabled={isDisqualifying}
            >
              {isDisqualifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disqualify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scorecard Submission Dialog */}
      <Dialog open={isScorecardSubmitDialogOpen} onOpenChange={setIsScorecardSubmitDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Scorecard</DialogTitle>
            <DialogDescription>
              Select an interview and template to submit a scorecard for this candidate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Interview</Label>
              <Select value={selectedInterviewId} onValueChange={setSelectedInterviewId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an interview" />
                </SelectTrigger>
                <SelectContent>
                  {applicationInterviews.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No interviews scheduled yet
                    </div>
                  ) : (
                    applicationInterviews.map((interview) => (
                      <SelectItem key={interview.id} value={interview.id}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{interview.title}</span>
                          <span className="text-muted-foreground">
                            ({new Date(interview.scheduled_at).toLocaleDateString()})
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a scorecard template" />
                </SelectTrigger>
                <SelectContent>
                  {scorecardTemplates.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No templates available
                    </div>
                  ) : (
                    scorecardTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4" />
                          <span>{template.name}</span>
                          <Badge variant="outline" className="ml-1">
                            {template.template_type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScorecardSubmitDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleOpenScorecardSubmit}
              disabled={!selectedInterviewId || !selectedTemplateId}
            >
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Continue to Scorecard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
