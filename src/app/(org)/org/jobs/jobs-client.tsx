// @ts-nocheck
// Note: Supabase query type inference issues with array operations
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { supabaseInsert, supabaseUpdate, supabaseDelete, supabaseSelect } from "@/lib/supabase/auth-fetch"
import { useAuth } from "@/lib/auth/auth-context"
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
import { Label } from "@/components/ui/label"
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
import { toast } from "sonner"
import {
  Plus,
  Search,
  MoreHorizontal,
  Briefcase,
  Filter,
  Loader2,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Globe,
  Settings,
  Share2,
  Link,
  ExternalLink,
  Sparkles,
  RefreshCw,
  CheckCircle,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"

interface Job {
  id: string
  title: string
  title_ar: string | null
  description: string | null
  description_ar: string | null
  department_id: string | null
  location_id: string | null
  location: string | null
  location_ar: string | null
  job_type_id: string | null
  job_type: string | null
  job_grade_id: string | null
  experience_level: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  is_remote: boolean | null
  status: string | null
  published_at: string | null
  closing_date: string | null
  created_at: string | null
}

interface Department {
  id: string
  name: string
  name_ar: string | null
}

interface JobType {
  id: string
  name: string
  name_ar: string | null
}

interface JobGrade {
  id: string
  name: string
  name_ar: string | null
  level: number
}

interface Location {
  id: string
  name: string
  name_ar: string | null
  city: string | null
  country: string | null
}

interface HiringStage {
  id: string
  name: string
  name_ar: string | null
  color: string
  sort_order: number
}

interface JobsClientProps {
  jobs: Job[]
  departments: Department[]
  jobTypes: JobType[]
  jobGrades: JobGrade[]
  locations: Location[]
  hiringStages: HiringStage[]
  orgSlug: string | null
}

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  pending_approval: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  open: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  closed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  filled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
}

const statusLabelKeys: Record<string, string> = {
  draft: "jobs.status.draft",
  pending_approval: "common.status.pending",
  open: "jobs.status.published",
  paused: "jobs.status.onHold",
  closed: "jobs.status.closed",
  filled: "common.status.completed",
}

// Helper to calculate days until deadline
const getDaysUntilDeadline = (closesAt: string | null) => {
  if (!closesAt) return null
  const deadline = new Date(closesAt)
  const now = new Date()
  const diffTime = deadline.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Helper to get deadline badge style
const getDeadlineBadgeStyle = (daysLeft: number | null) => {
  if (daysLeft === null) return null
  if (daysLeft < 0) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  if (daysLeft <= 3) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
  if (daysLeft <= 7) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
  return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
}

// Helper to generate URL-friendly slug from title
const generateSlug = (title: string): string => {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single
  return `${base}-${Date.now()}`
}

const employmentTypeKeys = [
  { value: "full_time", labelKey: "jobs.employmentTypes.fullTime" },
  { value: "part_time", labelKey: "jobs.employmentTypes.partTime" },
  { value: "contract", labelKey: "jobs.employmentTypes.contract" },
  { value: "internship", labelKey: "jobs.employmentTypes.internship" },
  { value: "temporary", labelKey: "jobs.employmentTypes.temporary" },
]

const experienceLevelKeys = [
  { value: "entry", labelKey: "jobs.experienceLevels.entry" },
  { value: "junior", labelKey: "jobs.experienceLevels.junior" },
  { value: "mid", labelKey: "jobs.experienceLevels.mid" },
  { value: "senior", labelKey: "jobs.experienceLevels.senior" },
  { value: "lead", labelKey: "jobs.experienceLevels.lead" },
  { value: "executive", labelKey: "jobs.experienceLevels.executive" },
]

// Available currencies (same as org settings and requisitions)
const currencies = [
  { value: "SAR", label: "SAR - Saudi Riyal" },
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "KWD", label: "KWD - Kuwaiti Dinar" },
  { value: "QAR", label: "QAR - Qatari Riyal" },
  { value: "BHD", label: "BHD - Bahraini Dinar" },
  { value: "OMR", label: "OMR - Omani Rial" },
  { value: "EGP", label: "EGP - Egyptian Pound" },
  { value: "JOD", label: "JOD - Jordanian Dinar" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "PKR", label: "PKR - Pakistani Rupee" },
]

export function JobsClient({
  jobs: initialJobs,
  departments,
  jobTypes,
  jobGrades,
  locations,
  hiringStages,
  orgSlug,
}: JobsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const { profile, primaryRole } = useAuth()
  const { t, language, isRTL } = useI18n()
  const [jobs, setJobs] = useState(initialJobs)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Selected job
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    title_ar: "",
    description: "",
    description_ar: "",
    department_id: "",
    location_id: "",
    location: "",
    location_ar: "",
    job_type_id: "",
    job_type: "full_time",
    job_grade_id: "",
    experience_level: "mid",
    salary_min: 0,
    salary_max: 0,
    salary_currency: "SAR",
    is_remote: false,
    closing_date: "",
  })

  // AI Generation state
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedData, setGeneratedData] = useState<{
    title: string
    titleAr: string
    description: string
    descriptionAr: string
    requirements: string[]
    requirementsAr: string[]
    responsibilities: string[]
    responsibilitiesAr: string[]
    benefits: string[]
    benefitsAr: string[]
    skills: string[]
  } | null>(null)

  // Get location name from locations array using location_id
  const getLocationName = (locationId: string | null | undefined) => {
    if (!locationId) return null
    const loc = locations.find(l => l.id === locationId)
    return loc ? `${loc.name}${loc.city ? ` (${loc.city})` : ''}` : null
  }

  const filteredJobs = jobs.filter((job) => {
    const locationName = getLocationName(job.location_id)
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.title_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      locationName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || job.status === statusFilter
    const matchesDepartment = departmentFilter === "all" || job.department_id === departmentFilter
    return matchesSearch && matchesStatus && matchesDepartment
  })

  const stats = {
    total: jobs.length,
    open: jobs.filter((j) => j.status === "open").length,
    draft: jobs.filter((j) => j.status === "draft").length,
    pendingApproval: jobs.filter((j) => j.status === "pending_approval").length,
    closed: jobs.filter((j) => j.status === "closed").length,
  }

  const getDepartmentName = (deptId: string | null) => {
    if (!deptId) return t("jobs.filters.department")
    const dept = departments.find((d) => d.id === deptId)
    return dept?.name || t("jobs.filters.department")
  }

  const resetForm = () => {
    setFormData({
      title: "",
      title_ar: "",
      description: "",
      description_ar: "",
      department_id: "",
      location_id: "",
      location: "",
      location_ar: "",
      job_type_id: "",
      job_type: "full_time",
      job_grade_id: "",
      experience_level: "mid",
      salary_min: 0,
      salary_max: 0,
      salary_currency: "SAR",
      is_remote: false,
      closing_date: "",
    })
    setGeneratedData(null)
  }

  // AI GENERATION
  const handleGenerateWithAI = async () => {
    if (!formData.title) {
      toast.error(t("errors.validation.required"))
      return
    }

    setIsGenerating(true)
    try {
      const locationName = formData.location_id
        ? getLocationName(formData.location_id)
        : formData.location
      const departmentName = formData.department_id
        ? getDepartmentName(formData.department_id)
        : undefined

      const response = await fetch("/api/org/ai/generate-job-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          titleAr: formData.title_ar || undefined,
          department: departmentName,
          location: locationName || undefined,
          employmentType: formData.job_type,
          experienceLevel: formData.experience_level,
          salaryMin: formData.salary_min || undefined,
          salaryMax: formData.salary_max || undefined,
          salaryCurrency: formData.salary_currency,
          isRemote: formData.is_remote,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || t("errors.general.unexpectedError"))
      }

      setGeneratedData(result.data)
      setIsAIDialogOpen(true)
      toast.success(t("jobs.messages.created"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.general.unexpectedError"))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApplyGeneratedContent = () => {
    if (!generatedData) return

    // Build full description with requirements, responsibilities, and benefits in HTML format
    const fullDescription = `<p>${generatedData.description}</p>

<h3>Requirements</h3>
<ul>
${generatedData.requirements.map((r) => `<li>${r}</li>`).join("\n")}
</ul>

<h3>Responsibilities</h3>
<ul>
${generatedData.responsibilities.map((r) => `<li>${r}</li>`).join("\n")}
</ul>

<h3>Benefits</h3>
<ul>
${generatedData.benefits.map((b) => `<li>${b}</li>`).join("\n")}
</ul>

<h3>Skills</h3>
<p>${generatedData.skills.join(", ")}</p>`

    const fullDescriptionAr = `<p>${generatedData.descriptionAr}</p>

<h3>المتطلبات</h3>
<ul>
${generatedData.requirementsAr.map((r) => `<li>${r}</li>`).join("\n")}
</ul>

<h3>المسؤوليات</h3>
<ul>
${generatedData.responsibilitiesAr.map((r) => `<li>${r}</li>`).join("\n")}
</ul>

<h3>المزايا</h3>
<ul>
${generatedData.benefitsAr.map((b) => `<li>${b}</li>`).join("\n")}
</ul>`

    setFormData({
      ...formData,
      title: generatedData.title || formData.title,
      title_ar: generatedData.titleAr || formData.title_ar,
      description: fullDescription,
      description_ar: fullDescriptionAr,
    })

    setIsAIDialogOpen(false)
    toast.success(t("jobs.messages.updated"))
  }

  // CREATE
  const handleCreate = async () => {
    if (!formData.title) {
      toast.error(t("errors.validation.required"))
      return
    }

    if (!profile?.org_id) {
      toast.error(t("errors.general.unexpectedError"))
      return
    }

    setIsLoading(true)
    try {
      // Use supabaseInsert which gets token from localStorage (bypasses getSession timeout)
      // IMPORTANT: org_id and slug are required for RLS policies and DB constraints
      // location_id now references locations table (vacancy settings) after FK migration
      const { data, error } = await supabaseInsert<Job>("jobs", {
        org_id: profile.org_id,
        slug: generateSlug(formData.title),
        title: formData.title,
        title_ar: formData.title_ar || null,
        description: formData.description || null,
        description_ar: formData.description_ar || null,
        department_id: formData.department_id || null,
        location_id: formData.location_id || null,
        job_type_id: formData.job_type_id || null,
        job_type: formData.job_type || "full_time",
        job_grade_id: formData.job_grade_id || null,
        experience_level: formData.experience_level || "mid",
        salary_min: formData.salary_min || null,
        salary_max: formData.salary_max || null,
        salary_currency: formData.salary_currency,
        is_remote: formData.is_remote,
        closing_date: formData.closing_date || null,
        status: "draft",
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data) {
        setJobs([data, ...jobs])
        setIsCreateDialogOpen(false)
        resetForm()
        toast.success(t("jobs.messages.created"))
      }
    } catch {
      toast.error(t("errors.general.unexpectedError"))
    } finally {
      setIsLoading(false)
    }
  }

  // EDIT
  const openEditDialog = (job: Job) => {
    setSelectedJob(job)
    setFormData({
      title: job.title,
      title_ar: job.title_ar || "",
      description: job.description || "",
      description_ar: job.description_ar || "",
      department_id: job.department_id || "",
      location_id: job.location_id || "",
      location: job.location || "",
      location_ar: job.location_ar || "",
      job_type_id: job.job_type_id || "",
      job_type: job.job_type || "full_time",
      job_grade_id: job.job_grade_id || "",
      experience_level: job.experience_level || "mid",
      salary_min: job.salary_min || 0,
      salary_max: job.salary_max || 0,
      salary_currency: job.salary_currency || "SAR",
      is_remote: job.is_remote || false,
      closing_date: job.closing_date?.split("T")[0] || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleEdit = async () => {
    if (!selectedJob || !formData.title) {
      toast.error(t("errors.validation.required"))
      return
    }

    setIsLoading(true)
    try {
      // Use supabaseUpdate which gets token from localStorage (bypasses getSession timeout)
      // location_id now references locations table (vacancy settings) after FK migration
      const { error } = await supabaseUpdate(
        "jobs",
        {
          title: formData.title,
          title_ar: formData.title_ar || null,
          description: formData.description || null,
          description_ar: formData.description_ar || null,
          department_id: formData.department_id || null,
          location_id: formData.location_id || null,
          job_type_id: formData.job_type_id || null,
          job_type: formData.job_type || "full_time",
          job_grade_id: formData.job_grade_id || null,
          experience_level: formData.experience_level || "mid",
          salary_min: formData.salary_min || null,
          salary_max: formData.salary_max || null,
          salary_currency: formData.salary_currency,
          is_remote: formData.is_remote,
          closing_date: formData.closing_date || null,
          updated_at: new Date().toISOString(),
        },
        { column: "id", value: selectedJob.id }
      )

      if (error) {
        toast.error(error.message)
        return
      }

      setJobs(
        jobs.map((j) =>
          j.id === selectedJob.id
            ? { ...j, ...formData }
            : j
        )
      )
      setIsEditDialogOpen(false)
      setSelectedJob(null)
      resetForm()
      toast.success(t("jobs.messages.updated"))
      router.refresh()
    } catch {
      toast.error(t("errors.general.unexpectedError"))
    } finally {
      setIsLoading(false)
    }
  }

  // VIEW
  const openViewDialog = (job: Job) => {
    setSelectedJob(job)
    setIsViewDialogOpen(true)
  }

  // DELETE
  const openDeleteDialog = (job: Job) => {
    setSelectedJob(job)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedJob) return

    setIsLoading(true)
    try {
      // Use supabaseDelete which gets token from localStorage (bypasses getSession timeout)
      const { error } = await supabaseDelete("jobs", { column: "id", value: selectedJob.id })

      if (error) {
        toast.error(error.message)
        return
      }

      setJobs(jobs.filter((j) => j.id !== selectedJob.id))
      setIsDeleteDialogOpen(false)
      setSelectedJob(null)
      toast.success(t("jobs.messages.deleted"))
      router.refresh()
    } catch {
      toast.error(t("errors.general.unexpectedError"))
    } finally {
      setIsLoading(false)
    }
  }

  // STATUS CHANGE
  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      }

      if (newStatus === "open") {
        updateData.published_at = new Date().toISOString()
      }

      // Use supabaseUpdate which gets token from localStorage (bypasses getSession timeout)
      const { error } = await supabaseUpdate("jobs", updateData, { column: "id", value: jobId })

      if (error) {
        toast.error(error.message)
        return
      }

      // Find the job to get details for notification
      const job = jobs.find(j => j.id === jobId)

      setJobs(
        jobs.map((j) =>
          j.id === jobId ? { ...j, status: newStatus, ...updateData } : j
        )
      )

      // Send notification when job is published
      if (newStatus === "open" && job && profile?.org_id) {
        fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: "job_published",
            orgId: profile.org_id,
            data: {
              jobTitle: job.title,
              jobId: job.id,
            },
          }),
        }).catch((err) => {
          console.error("Failed to send job published notification:", err)
        })
      }

      toast.success(newStatus === "open" ? t("jobs.messages.published") : t("jobs.messages.updated"))
      router.refresh()
    } catch {
      toast.error(t("errors.general.unexpectedError"))
    }
  }

  // SUBMIT FOR APPROVAL (recruiter flow)
  const handleSubmitForApproval = async (jobId: string) => {
    try {
      // Update job status to pending_approval
      const { error } = await supabaseUpdate("jobs", {
        status: "pending_approval",
        updated_at: new Date().toISOString(),
      }, { column: "id", value: jobId })

      if (error) {
        toast.error(error.message)
        return
      }

      // Fetch hr_managers in the org and create approval records
      if (profile?.org_id) {
        const { data: hrManagers } = await supabaseSelect<{ user_id: string }>(
          "user_roles",
          {
            select: "user_id",
            filter: [{ column: "role", operator: "eq", value: "hr_manager" }],
          }
        )

        if (hrManagers && hrManagers.length > 0) {
          for (const hm of hrManagers) {
            await supabaseInsert("job_approvals", {
              job_id: jobId,
              approver_id: hm.user_id,
              status: "pending",
            })
          }
        }

        // Send notification to hr_managers
        const job = jobs.find(j => j.id === jobId)
        fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: "job_pending_approval",
            orgId: profile.org_id,
            data: {
              jobTitle: job?.title,
              jobId: jobId,
            },
          }),
        }).catch((err) => {
          console.error("Failed to send approval notification:", err)
        })
      }

      setJobs(jobs.map((j) =>
        j.id === jobId ? { ...j, status: "pending_approval" } : j
      ))
      toast.success(t("jobs.messages.updated"))
      router.refresh()
    } catch {
      toast.error(t("errors.general.unexpectedError"))
    }
  }

  // APPROVE JOB (hr_manager flow)
  const handleApproveJob = async (jobId: string) => {
    try {
      const { error } = await supabaseUpdate("jobs", {
        status: "open",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { column: "id", value: jobId })

      if (error) {
        toast.error(error.message)
        return
      }

      // Update approval record
      const { data: approvalRecords } = await supabaseSelect<{ id: string }>(
        "job_approvals",
        {
          select: "id",
          filter: [{ column: "job_id", operator: "eq", value: jobId }],
        }
      )
      if (approvalRecords) {
        for (const record of approvalRecords) {
          await supabaseUpdate("job_approvals", {
            status: "approved",
            responded_at: new Date().toISOString(),
          }, { column: "id", value: record.id })
        }
      }

      const job = jobs.find(j => j.id === jobId)
      setJobs(jobs.map((j) =>
        j.id === jobId ? { ...j, status: "open", published_at: new Date().toISOString() } : j
      ))

      // Send notifications: job_approved (to recruiter) and job_published (to team)
      if (profile?.org_id && job) {
        // Notify recruiter that their job was approved
        fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: "job_approved",
            orgId: profile.org_id,
            data: { jobTitle: job.title, jobId: job.id },
          }),
        }).catch(console.error)

        // Notify team that job is published
        fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: "job_published",
            orgId: profile.org_id,
            data: { jobTitle: job.title, jobId: job.id },
          }),
        }).catch(console.error)
      }

      toast.success(t("jobs.messages.published"))
      router.refresh()
    } catch {
      toast.error(t("errors.general.unexpectedError"))
    }
  }

  // REJECT JOB (hr_manager flow)
  const handleRejectJob = async (jobId: string) => {
    try {
      const { error } = await supabaseUpdate("jobs", {
        status: "draft",
        updated_at: new Date().toISOString(),
      }, { column: "id", value: jobId })

      if (error) {
        toast.error(error.message)
        return
      }

      // Update approval records
      const { data: approvalRecords } = await supabaseSelect<{ id: string }>(
        "job_approvals",
        {
          select: "id",
          filter: [{ column: "job_id", operator: "eq", value: jobId }],
        }
      )
      if (approvalRecords) {
        for (const record of approvalRecords) {
          await supabaseUpdate("job_approvals", {
            status: "rejected",
            responded_at: new Date().toISOString(),
          }, { column: "id", value: record.id })
        }
      }

      setJobs(jobs.map((j) =>
        j.id === jobId ? { ...j, status: "draft" } : j
      ))
      toast.success(t("jobs.messages.updated"))
      router.refresh()
    } catch {
      toast.error(t("errors.general.unexpectedError"))
    }
  }

  // DUPLICATE
  const handleDuplicate = async (job: Job) => {
    if (!profile?.org_id) {
      toast.error(t("errors.general.unexpectedError"))
      return
    }

    setIsLoading(true)
    try {
      // Use supabaseInsert which gets token from localStorage (bypasses getSession timeout)
      // Note: location_id set to null - FK references job_locations, not vacancy settings
      // IMPORTANT: org_id and slug are required for RLS policies and DB constraints
      const { data, error } = await supabaseInsert<Job>("jobs", {
        org_id: profile.org_id,
        slug: generateSlug(`${job.title} copy`),
        title: `${job.title} (Copy)`,
        title_ar: job.title_ar ? `${job.title_ar} (نسخة)` : null,
        description: job.description,
        description_ar: job.description_ar,
        department_id: job.department_id,
        location_id: null, // FK references job_locations table
        job_type_id: job.job_type_id,
        job_type: job.job_type || "full_time",
        job_grade_id: job.job_grade_id,
        experience_level: job.experience_level || "mid",
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_currency: job.salary_currency,
        is_remote: job.is_remote,
        status: "draft",
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data) {
        setJobs([data, ...jobs])
        toast.success(t("jobs.messages.duplicated"))
        router.refresh()
      }
    } catch {
      toast.error(t("errors.general.unexpectedError"))
    } finally {
      setIsLoading(false)
    }
  }

  // SHARE JOB
  const getJobUrl = (job: Job) => {
    if (!orgSlug) return null
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/careers/${orgSlug}/jobs/${job.id}`
  }

  const handleCopyLink = async (job: Job) => {
    const url = getJobUrl(job)
    if (!url) {
      toast.error(t("errors.general.unexpectedError"))
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success(t("jobs.messages.linkCopied"))
    } catch {
      toast.error(t("errors.general.unexpectedError"))
    }
  }

  const handleShareLinkedIn = (job: Job) => {
    const url = getJobUrl(job)
    if (!url) {
      toast.error(t("errors.general.unexpectedError"))
      return
    }
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    window.open(linkedInUrl, '_blank', 'width=600,height=600')
  }

  const handleShareTwitter = (job: Job) => {
    const url = getJobUrl(job)
    if (!url) {
      toast.error(t("errors.general.unexpectedError"))
      return
    }
    const text = `Check out this job opportunity: ${job.title}`
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    window.open(twitterUrl, '_blank', 'width=600,height=600')
  }

  const formatSalary = (min: number | null, max: number | null, currency: string | null) => {
    if (!min && !max) return t("jobs.fields.salaryRange")
    const cur = currency || "SAR"
    if (min && max) return `${cur} ${min.toLocaleString()} - ${max.toLocaleString()}`
    if (min) return `${cur} ${min.toLocaleString()}+`
    return `${cur} ${max?.toLocaleString()}`
  }

  // Render form fields inline to prevent focus loss on state change
  const renderJobFormFields = (idPrefix: string) => (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-title`}>{t("jobs.fields.title")} *</Label>
          <Input
            id={`${idPrefix}-title`}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={t("jobs.fields.title")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-title_ar`}>{t("jobs.fields.titleAr")}</Label>
          <Input
            id={`${idPrefix}-title_ar`}
            value={formData.title_ar}
            onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
            placeholder="مهندس برمجيات"
            dir="rtl"
          />
        </div>
      </div>

      {/* AI Generation Button */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <div>
            <p className="text-sm font-medium">{t("jobs.jobDescription")}</p>
            <p className="text-xs text-muted-foreground">{t("jobs.fields.description")}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerateWithAI}
          disabled={isGenerating || !formData.title}
          className="bg-white dark:bg-gray-900"
        >
          {isGenerating ? (
            <>
              <Loader2 className={isRTL ? "ml-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4 animate-spin"} />
              {t("common.loading")}
            </>
          ) : (
            <>
              <Sparkles className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
              {t("common.create")}
            </>
          )}
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`}>{t("jobs.fields.description")}</Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t("jobs.fields.description")}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description_ar`}>{t("jobs.fields.descriptionAr")}</Label>
        <Textarea
          id={`${idPrefix}-description_ar`}
          value={formData.description_ar}
          onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
          placeholder={t("jobs.fields.descriptionAr")}
          dir="rtl"
          rows={4}
        />
      </div>

      <Separator />

      {/* Location & Department */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-department_id`}>{t("jobs.fields.department")}</Label>
          <Select
            value={formData.department_id}
            onValueChange={(value) => setFormData({ ...formData, department_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("jobs.fields.department")} />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-location_id`}>{t("jobs.fields.location")}</Label>
          {locations.length > 0 ? (
            <Select
              value={formData.location_id}
              onValueChange={(value) => {
                const loc = locations.find(l => l.id === value)
                setFormData({
                  ...formData,
                  location_id: value,
                  location: loc ? `${loc.name}${loc.city ? `, ${loc.city}` : ''}` : '',
                  location_ar: loc?.name_ar || '',
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("jobs.fields.location")} />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name} {loc.city && `(${loc.city})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={`${idPrefix}-location`}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder={t("jobs.fields.location")}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {locations.length === 0 && (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-location_ar`}>{t("jobs.fields.location")}</Label>
            <Input
              id={`${idPrefix}-location_ar`}
              value={formData.location_ar}
              onChange={(e) => setFormData({ ...formData, location_ar: e.target.value })}
              placeholder="الرياض، المملكة العربية السعودية"
              dir="rtl"
            />
          </div>
        )}
        <div className={cn("space-y-2 flex items-end", locations.length > 0 && "col-span-2")}>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`${idPrefix}-is_remote`}
              checked={formData.is_remote}
              onChange={(e) => setFormData({ ...formData, is_remote: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor={`${idPrefix}-is_remote`} className="font-normal">
              {t("jobs.fields.remoteAllowed")}
            </Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Employment Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-job_type_id`}>{t("jobs.fields.employmentType")}</Label>
          <Select
            value={formData.job_type_id}
            onValueChange={(value) => setFormData({ ...formData, job_type_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("jobs.fields.employmentType")} />
            </SelectTrigger>
            <SelectContent>
              {jobTypes.length > 0 ? (
                jobTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))
              ) : (
                employmentTypeKeys.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {t(type.labelKey)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-job_grade_id`}>{t("jobs.fields.experienceLevel")}</Label>
          <Select
            value={formData.job_grade_id}
            onValueChange={(value) => setFormData({ ...formData, job_grade_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("jobs.fields.experienceLevel")} />
            </SelectTrigger>
            <SelectContent>
              {jobGrades.length > 0 ? (
                jobGrades.map((grade) => (
                  <SelectItem key={grade.id} value={grade.id}>
                    {grade.name} ({grade.level})
                  </SelectItem>
                ))
              ) : (
                experienceLevelKeys.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {t(level.labelKey)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Salary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-salary_min`}>{t("jobs.fields.salaryMin")}</Label>
          <Input
            id={`${idPrefix}-salary_min`}
            type="number"
            value={formData.salary_min || ""}
            onChange={(e) => setFormData({ ...formData, salary_min: parseInt(e.target.value) || 0 })}
            placeholder="5000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-salary_max`}>{t("jobs.fields.salaryMax")}</Label>
          <Input
            id={`${idPrefix}-salary_max`}
            type="number"
            value={formData.salary_max || ""}
            onChange={(e) => setFormData({ ...formData, salary_max: parseInt(e.target.value) || 0 })}
            placeholder="15000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-salary_currency`}>{t("jobs.fields.currency")}</Label>
          <Select
            value={formData.salary_currency}
            onValueChange={(value) => setFormData({ ...formData, salary_currency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Closing Date */}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-closing_date`}>{t("jobs.fields.applicationDeadline")}</Label>
        <Input
          id={`${idPrefix}-closing_date`}
          type="date"
          value={formData.closing_date}
          onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("jobs.title")}</h2>
          <p className="text-muted-foreground">
            {t("jobs.jobDescription")}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
          <Plus className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
          {t("jobs.createJob")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("jobs.allJobs")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("jobs.status.published")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("jobs.status.draft")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("jobs.status.closed")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.closed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("common.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={isRTL ? "pr-9" : "pl-9"}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
            <SelectValue placeholder={t("jobs.filters.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="draft">{t("jobs.status.draft")}</SelectItem>
            <SelectItem value="pending_approval">{t("common.status.pending")}</SelectItem>
            <SelectItem value="open">{t("jobs.status.published")}</SelectItem>
            <SelectItem value="paused">{t("jobs.status.onHold")}</SelectItem>
            <SelectItem value="closed">{t("jobs.status.closed")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("jobs.filters.department")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("jobs.fields.title")}</TableHead>
              <TableHead>{t("jobs.fields.department")}</TableHead>
              <TableHead>{t("jobs.fields.location")}</TableHead>
              <TableHead>{t("jobs.fields.employmentType")}</TableHead>
              <TableHead>{t("jobs.fields.salaryRange")}</TableHead>
              <TableHead>{t("jobs.filters.status")}</TableHead>
              <TableHead className={isRTL ? "text-left" : "text-right"}>{t("common.table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">{t("jobs.emptyState.title")}</p>
                  <Button
                    variant="link"
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="mt-2"
                  >
                    {t("jobs.emptyState.description")}
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{job.title}</div>
                        {job.experience_level && (
                          <div className="text-xs text-muted-foreground capitalize">
                            {job.experience_level.replace("_", " ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {getDepartmentName(job.department_id)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>{getLocationName(job.location_id) || t("jobs.fields.location")}</span>
                      {job.is_remote && (
                        <Badge variant="outline" className={isRTL ? "mr-1 text-xs" : "ml-1 text-xs"}>
                          {t("jobs.locationTypes.remote")}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm capitalize">
                      {job.job_type?.replace("_", " ") || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge className={cn("capitalize w-fit", statusStyles[job.status || "draft"])}>
                        {t(statusLabelKeys[job.status || "draft"]) || job.status}
                      </Badge>
                      {job.status === "open" && job.closing_date && (() => {
                        const daysLeft = getDaysUntilDeadline(job.closing_date)
                        if (daysLeft === null) return null
                        const badgeStyle = getDeadlineBadgeStyle(daysLeft)
                        return (
                          <Badge variant="outline" className={cn("text-xs w-fit", badgeStyle)}>
                            {daysLeft < 0
                              ? t("common.status.expired")
                              : daysLeft === 0
                              ? t("common.time.today")
                              : `${daysLeft} ${t("common.time.days")}`}
                          </Badge>
                        )
                      })()}
                    </div>
                  </TableCell>
                  <TableCell className={isRTL ? "text-left" : "text-right"}>
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
                            openViewDialog(job)
                          }}
                        >
                          <Eye className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                          {t("common.viewDetails")}
                        </DropdownMenuItem>
                        {job.status === "draft" && (
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault()
                              openEditDialog(job)
                            }}
                          >
                            <Pencil className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                            {t("common.edit")}
                          </DropdownMenuItem>
                        )}
                        {job.status === "draft" && (
                          <DropdownMenuItem
                            onSelect={() => router.push(`/org/jobs/${job.id}/settings`)}
                          >
                            <Settings className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                            {t("common.user.settings")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onSelect={() => handleDuplicate(job)}
                        >
                          <Copy className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                          {t("jobs.duplicateJob")}
                        </DropdownMenuItem>
                        {job.status === "open" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleCopyLink(job)}>
                              <Link className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                              {t("jobs.actions.copyLink")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleShareLinkedIn(job)}>
                              <Share2 className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                              {t("common.share")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleShareTwitter(job)}>
                              <ExternalLink className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                              {t("common.share")}
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        {/* Role-based publish/approval actions */}
                        {job.status === "draft" && (primaryRole === "hr_manager" || primaryRole === "super_admin") && (
                          <DropdownMenuItem
                            onSelect={() => handleStatusChange(job.id, "open")}
                            className="text-green-600"
                          >
                            <Globe className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                            {t("jobs.publishJob")}
                          </DropdownMenuItem>
                        )}
                        {job.status === "draft" && primaryRole === "recruiter" && (
                          <DropdownMenuItem
                            onSelect={() => handleSubmitForApproval(job.id)}
                            className="text-amber-600"
                          >
                            <Clock className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                            {t("common.submit")}
                          </DropdownMenuItem>
                        )}
                        {job.status === "pending_approval" && (primaryRole === "hr_manager" || primaryRole === "super_admin") && (
                          <>
                            <DropdownMenuItem
                              onSelect={() => handleApproveJob(job.id)}
                              className="text-green-600"
                            >
                              <Globe className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                              {t("jobs.publishJob")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleRejectJob(job.id)}
                              className="text-red-600"
                            >
                              <EyeOff className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                              {t("common.status.rejected")}
                            </DropdownMenuItem>
                          </>
                        )}
                        {job.status === "open" && (
                          <DropdownMenuItem
                            onSelect={() => handleStatusChange(job.id, "paused")}
                          >
                            <EyeOff className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                            {t("jobs.status.onHold")}
                          </DropdownMenuItem>
                        )}
                        {job.status === "paused" && (
                          <DropdownMenuItem
                            onSelect={() => handleStatusChange(job.id, "open")}
                            className="text-green-600"
                          >
                            <Globe className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                            {t("jobs.reopenJob")}
                          </DropdownMenuItem>
                        )}
                        {(job.status === "open" || job.status === "paused") && (
                          <DropdownMenuItem
                            onSelect={() => handleStatusChange(job.id, "closed")}
                            className="text-red-600"
                          >
                            <EyeOff className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                            {t("jobs.closeJob")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={(e) => {
                            e.preventDefault()
                            openDeleteDialog(job)
                          }}
                        >
                          <Trash2 className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                          {t("common.delete")}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("jobs.createJob")}</DialogTitle>
            <DialogDescription>
              {t("jobs.jobDescription")}
            </DialogDescription>
          </DialogHeader>
          {renderJobFormFields("create")}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading && <Loader2 className={isRTL ? "ml-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4 animate-spin"} />}
              {t("jobs.createJob")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("jobs.editJob")}</DialogTitle>
            <DialogDescription>
              {t("jobs.jobDescription")}
            </DialogDescription>
          </DialogHeader>
          {renderJobFormFields("edit")}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading && <Loader2 className={isRTL ? "ml-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4 animate-spin"} />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("jobs.jobDetails")}</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{selectedJob.title}</h3>
                <Badge className={cn("capitalize mt-2", statusStyles[selectedJob.status || "draft"])}>
                  {t(statusLabelKeys[selectedJob.status || "draft"]) || selectedJob.status}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{getLocationName(selectedJob.location_id) || t("jobs.fields.location")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{selectedJob.job_type?.replace("_", " ") || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{getDepartmentName(selectedJob.department_id)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.salary_currency)}</span>
                </div>
                {selectedJob.closing_date && (
                  <div className="flex items-center gap-2 col-span-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{t("jobs.fields.applicationDeadline")}: {new Date(selectedJob.closing_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {selectedJob.description && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">{t("jobs.fields.description")}</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedJob.description}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div className="text-xs text-muted-foreground">
                {selectedJob.created_at ? new Date(selectedJob.created_at).toLocaleDateString() : ""}
                {selectedJob.published_at && ` | ${t("jobs.status.published")} ${new Date(selectedJob.published_at).toLocaleDateString()}`}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              {t("common.close")}
            </Button>
            {selectedJob?.status === "draft" && (
              <Button onClick={() => {
                setIsViewDialogOpen(false)
                if (selectedJob) openEditDialog(selectedJob)
              }}>
                <Pencil className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                {t("common.edit")}
              </Button>
            )}
            {selectedJob?.status === "open" && (
              <Button variant="outline" onClick={() => selectedJob && handleCopyLink(selectedJob)}>
                <Share2 className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                {t("common.share")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("jobs.deleteJob")}</DialogTitle>
            <DialogDescription>
              {t("jobs.confirmations.delete")}
            </DialogDescription>
          </DialogHeader>
          {selectedJob && (
            <div className="py-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="font-medium text-destructive">{selectedJob.title}</p>
                {getLocationName(selectedJob.location_id) && (
                  <p className="text-sm text-muted-foreground">{getLocationName(selectedJob.location_id)}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading && <Loader2 className={isRTL ? "ml-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4 animate-spin"} />}
              {t("jobs.deleteJob")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generated Content Preview Dialog */}
      <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              {t("jobs.jobDescription")}
            </DialogTitle>
            <DialogDescription>
              {t("jobs.fields.description")}
            </DialogDescription>
          </DialogHeader>

          {generatedData && (
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {/* Title */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">{t("jobs.fields.title")}</Label>
                  <Input
                    value={generatedData.title}
                    onChange={(e) => setGeneratedData({ ...generatedData, title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t("jobs.fields.titleAr")}</Label>
                  <Input
                    value={generatedData.titleAr}
                    onChange={(e) => setGeneratedData({ ...generatedData, titleAr: e.target.value })}
                    className="mt-1"
                    dir="rtl"
                  />
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <Label className="text-xs text-muted-foreground">{t("jobs.fields.description")}</Label>
                <Textarea
                  value={generatedData.description}
                  onChange={(e) => setGeneratedData({ ...generatedData, description: e.target.value })}
                  className="mt-1 min-h-[80px]"
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">{t("jobs.fields.descriptionAr")}</Label>
                <Textarea
                  value={generatedData.descriptionAr}
                  onChange={(e) => setGeneratedData({ ...generatedData, descriptionAr: e.target.value })}
                  className="mt-1 min-h-[80px]"
                  rows={3}
                  dir="rtl"
                />
              </div>

              <Separator />

              {/* Requirements & Responsibilities */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">{t("jobs.requirements")}</Label>
                  <ul className="text-sm space-y-1.5">
                    {generatedData.requirements.map((req, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        <Input
                          value={req}
                          onChange={(e) => {
                            const updated = [...generatedData.requirements]
                            updated[i] = e.target.value
                            setGeneratedData({ ...generatedData, requirements: updated })
                          }}
                          className="h-8 text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            const updated = generatedData.requirements.filter((_, idx) => idx !== i)
                            setGeneratedData({ ...generatedData, requirements: updated })
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs text-muted-foreground"
                    onClick={() => setGeneratedData({ ...generatedData, requirements: [...generatedData.requirements, ""] })}
                  >
                    <Plus className={isRTL ? "h-3 w-3 ml-1" : "h-3 w-3 mr-1"} /> {t("common.add")}
                  </Button>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">{t("jobs.responsibilities")}</Label>
                  <ul className="text-sm space-y-1.5">
                    {generatedData.responsibilities.map((resp, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />
                        <Input
                          value={resp}
                          onChange={(e) => {
                            const updated = [...generatedData.responsibilities]
                            updated[i] = e.target.value
                            setGeneratedData({ ...generatedData, responsibilities: updated })
                          }}
                          className="h-8 text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            const updated = generatedData.responsibilities.filter((_, idx) => idx !== i)
                            setGeneratedData({ ...generatedData, responsibilities: updated })
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs text-muted-foreground"
                    onClick={() => setGeneratedData({ ...generatedData, responsibilities: [...generatedData.responsibilities, ""] })}
                  >
                    <Plus className={isRTL ? "h-3 w-3 ml-1" : "h-3 w-3 mr-1"} /> {t("common.add")}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Benefits */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">{t("jobs.benefits")}</Label>
                <ul className="text-sm grid grid-cols-2 gap-1.5">
                  {generatedData.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-purple-500 shrink-0" />
                      <Input
                        value={benefit}
                        onChange={(e) => {
                          const updated = [...generatedData.benefits]
                          updated[i] = e.target.value
                          setGeneratedData({ ...generatedData, benefits: updated })
                        }}
                        className="h-8 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          const updated = generatedData.benefits.filter((_, idx) => idx !== i)
                          setGeneratedData({ ...generatedData, benefits: updated })
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs text-muted-foreground"
                  onClick={() => setGeneratedData({ ...generatedData, benefits: [...generatedData.benefits, ""] })}
                >
                  <Plus className={isRTL ? "h-3 w-3 ml-1" : "h-3 w-3 mr-1"} /> {t("common.add")}
                </Button>
              </div>

              {/* Skills */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">{t("jobs.fields.skills")}</Label>
                <div className="flex flex-wrap gap-2">
                  {generatedData.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="flex items-center gap-1 pr-1">
                      <input
                        value={skill}
                        onChange={(e) => {
                          const updated = [...generatedData.skills]
                          updated[i] = e.target.value
                          setGeneratedData({ ...generatedData, skills: updated })
                        }}
                        className="bg-transparent border-none outline-none text-xs w-auto min-w-[60px]"
                        style={{ width: `${Math.max(skill.length, 6)}ch` }}
                      />
                      <button
                        type="button"
                        className={isRTL ? "mr-0.5 rounded-full hover:bg-muted p-0.5" : "ml-0.5 rounded-full hover:bg-muted p-0.5"}
                        onClick={() => {
                          const updated = generatedData.skills.filter((_, idx) => idx !== i)
                          setGeneratedData({ ...generatedData, skills: updated })
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setGeneratedData({ ...generatedData, skills: [...generatedData.skills, ""] })}
                  >
                    <Plus className={isRTL ? "h-3 w-3 ml-1" : "h-3 w-3 mr-1"} /> {t("common.add")}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
            <Button
              variant="outline"
              onClick={handleGenerateWithAI}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className={isRTL ? "ml-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4 animate-spin"} />
              ) : (
                <RefreshCw className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
              )}
              {t("common.refresh")}
            </Button>
            <Button variant="outline" onClick={() => setIsAIDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleApplyGeneratedContent}>
              <CheckCircle className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
