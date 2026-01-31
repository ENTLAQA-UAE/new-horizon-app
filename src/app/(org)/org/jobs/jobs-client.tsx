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

const statusLabels: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  open: "Published",
  paused: "Paused",
  closed: "Closed",
  filled: "Filled",
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

const employmentTypes = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "temporary", label: "Temporary" },
]

const experienceLevels = [
  { value: "entry", label: "Entry Level" },
  { value: "junior", label: "Junior (1-2 years)" },
  { value: "mid", label: "Mid Level (3-5 years)" },
  { value: "senior", label: "Senior (5+ years)" },
  { value: "lead", label: "Lead / Manager" },
  { value: "executive", label: "Executive" },
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
    if (!deptId) return "No Department"
    const dept = departments.find((d) => d.id === deptId)
    return dept?.name || "Unknown"
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
      toast.error("Please enter a job title first")
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
        throw new Error(result.error || "Failed to generate job description")
      }

      setGeneratedData(result.data)
      setIsAIDialogOpen(true)
      toast.success(`Generated with ${result.provider} (${result.model})`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate job description")
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
    toast.success("AI-generated content applied to form")
  }

  // CREATE
  const handleCreate = async () => {
    if (!formData.title) {
      toast.error("Please enter a job title")
      return
    }

    if (!profile?.org_id) {
      toast.error("Organization not found. Please refresh the page.")
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
        toast.success("Job created as draft. Use the menu to configure settings or publish.")
      }
    } catch {
      toast.error("An unexpected error occurred")
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
      toast.error("Please enter a job title")
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
      toast.success("Job updated successfully")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
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
      toast.success("Job deleted successfully")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
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

      toast.success(`Job ${newStatus === "open" ? "published" : newStatus}`)
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
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
      toast.success("Job submitted for approval")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
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

      toast.success("Job approved and published")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
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
      toast.success("Job rejected and returned to draft")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    }
  }

  // DUPLICATE
  const handleDuplicate = async (job: Job) => {
    if (!profile?.org_id) {
      toast.error("Organization not found. Please refresh the page.")
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
        toast.success("Job duplicated successfully")
        router.refresh()
      }
    } catch {
      toast.error("An unexpected error occurred")
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
      toast.error("Could not generate job link")
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Job link copied to clipboard!")
    } catch {
      toast.error("Failed to copy link")
    }
  }

  const handleShareLinkedIn = (job: Job) => {
    const url = getJobUrl(job)
    if (!url) {
      toast.error("Could not generate job link")
      return
    }
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    window.open(linkedInUrl, '_blank', 'width=600,height=600')
  }

  const handleShareTwitter = (job: Job) => {
    const url = getJobUrl(job)
    if (!url) {
      toast.error("Could not generate job link")
      return
    }
    const text = `Check out this job opportunity: ${job.title}`
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    window.open(twitterUrl, '_blank', 'width=600,height=600')
  }

  const formatSalary = (min: number | null, max: number | null, currency: string | null) => {
    if (!min && !max) return "Not specified"
    const cur = currency || "SAR"
    if (min && max) return `${cur} ${min.toLocaleString()} - ${max.toLocaleString()}`
    if (min) return `${cur} ${min.toLocaleString()}+`
    return `Up to ${cur} ${max?.toLocaleString()}`
  }

  // Render form fields inline to prevent focus loss on state change
  const renderJobFormFields = (idPrefix: string) => (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-title`}>Job Title (English) *</Label>
          <Input
            id={`${idPrefix}-title`}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Software Engineer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-title_ar`}>Job Title (Arabic)</Label>
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
            <p className="text-sm font-medium">Generate with AI</p>
            <p className="text-xs text-muted-foreground">Auto-generate description, requirements & skills</p>
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate
            </>
          )}
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`}>Description (English)</Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Job responsibilities and requirements..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description_ar`}>Description (Arabic)</Label>
        <Textarea
          id={`${idPrefix}-description_ar`}
          value={formData.description_ar}
          onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
          placeholder="المسؤوليات والمتطلبات..."
          dir="rtl"
          rows={4}
        />
      </div>

      <Separator />

      {/* Location & Department */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-department_id`}>Department</Label>
          <Select
            value={formData.department_id}
            onValueChange={(value) => setFormData({ ...formData, department_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
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
          <Label htmlFor={`${idPrefix}-location_id`}>Location</Label>
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
                <SelectValue placeholder="Select location" />
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
              placeholder="Riyadh, Saudi Arabia"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {locations.length === 0 && (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-location_ar`}>Location (Arabic)</Label>
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
              Remote work available
            </Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Employment Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-job_type_id`}>Job Type</Label>
          <Select
            value={formData.job_type_id}
            onValueChange={(value) => setFormData({ ...formData, job_type_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select job type" />
            </SelectTrigger>
            <SelectContent>
              {jobTypes.length > 0 ? (
                jobTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))
              ) : (
                employmentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-job_grade_id`}>Job Grade</Label>
          <Select
            value={formData.job_grade_id}
            onValueChange={(value) => setFormData({ ...formData, job_grade_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select job grade" />
            </SelectTrigger>
            <SelectContent>
              {jobGrades.length > 0 ? (
                jobGrades.map((grade) => (
                  <SelectItem key={grade.id} value={grade.id}>
                    {grade.name} (Level {grade.level})
                  </SelectItem>
                ))
              ) : (
                experienceLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
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
          <Label htmlFor={`${idPrefix}-salary_min`}>Min Salary</Label>
          <Input
            id={`${idPrefix}-salary_min`}
            type="number"
            value={formData.salary_min || ""}
            onChange={(e) => setFormData({ ...formData, salary_min: parseInt(e.target.value) || 0 })}
            placeholder="5000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-salary_max`}>Max Salary</Label>
          <Input
            id={`${idPrefix}-salary_max`}
            type="number"
            value={formData.salary_max || ""}
            onChange={(e) => setFormData({ ...formData, salary_max: parseInt(e.target.value) || 0 })}
            placeholder="15000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-salary_currency`}>Currency</Label>
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
        <Label htmlFor={`${idPrefix}-closing_date`}>Application Deadline</Label>
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
          <h2 className="text-2xl font-bold tracking-tight">Jobs</h2>
          <p className="text-muted-foreground">
            Manage job postings and applications
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Create Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Closed</CardTitle>
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
            placeholder="Search by title, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_approval">Pending Approval</SelectItem>
            <SelectItem value="open">Published</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
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
              <TableHead>Job</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No jobs found</p>
                  <Button
                    variant="link"
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="mt-2"
                  >
                    Create your first job
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
                      <span>{getLocationName(job.location_id) || "Not specified"}</span>
                      {job.is_remote && (
                        <Badge variant="outline" className="ml-1 text-xs">
                          Remote
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
                        {statusLabels[job.status || "draft"] || job.status}
                      </Badge>
                      {job.status === "open" && job.closing_date && (() => {
                        const daysLeft = getDaysUntilDeadline(job.closing_date)
                        if (daysLeft === null) return null
                        const badgeStyle = getDeadlineBadgeStyle(daysLeft)
                        return (
                          <Badge variant="outline" className={cn("text-xs w-fit", badgeStyle)}>
                            {daysLeft < 0
                              ? "Expired"
                              : daysLeft === 0
                              ? "Closes today"
                              : daysLeft === 1
                              ? "1 day left"
                              : `${daysLeft} days left`}
                          </Badge>
                        )
                      })()}
                    </div>
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
                            openViewDialog(job)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {job.status === "draft" && (
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault()
                              openEditDialog(job)
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {job.status === "draft" && (
                          <DropdownMenuItem
                            onSelect={() => router.push(`/org/jobs/${job.id}/settings`)}
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onSelect={() => handleDuplicate(job)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        {job.status === "open" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleCopyLink(job)}>
                              <Link className="mr-2 h-4 w-4" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleShareLinkedIn(job)}>
                              <Share2 className="mr-2 h-4 w-4" />
                              Share on LinkedIn
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleShareTwitter(job)}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Share on X (Twitter)
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
                            <Globe className="mr-2 h-4 w-4" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        {job.status === "draft" && primaryRole === "recruiter" && (
                          <DropdownMenuItem
                            onSelect={() => handleSubmitForApproval(job.id)}
                            className="text-amber-600"
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            Submit for Approval
                          </DropdownMenuItem>
                        )}
                        {job.status === "pending_approval" && (primaryRole === "hr_manager" || primaryRole === "super_admin") && (
                          <>
                            <DropdownMenuItem
                              onSelect={() => handleApproveJob(job.id)}
                              className="text-green-600"
                            >
                              <Globe className="mr-2 h-4 w-4" />
                              Approve & Publish
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleRejectJob(job.id)}
                              className="text-red-600"
                            >
                              <EyeOff className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {job.status === "open" && (
                          <DropdownMenuItem
                            onSelect={() => handleStatusChange(job.id, "paused")}
                          >
                            <EyeOff className="mr-2 h-4 w-4" />
                            Pause
                          </DropdownMenuItem>
                        )}
                        {job.status === "paused" && (
                          <DropdownMenuItem
                            onSelect={() => handleStatusChange(job.id, "open")}
                            className="text-green-600"
                          >
                            <Globe className="mr-2 h-4 w-4" />
                            Resume
                          </DropdownMenuItem>
                        )}
                        {(job.status === "open" || job.status === "paused") && (
                          <DropdownMenuItem
                            onSelect={() => handleStatusChange(job.id, "closed")}
                            className="text-red-600"
                          >
                            <EyeOff className="mr-2 h-4 w-4" />
                            Close
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
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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
            <DialogTitle>Create New Job</DialogTitle>
            <DialogDescription>
              Create a new job posting for your organization
            </DialogDescription>
          </DialogHeader>
          {renderJobFormFields("create")}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
            <DialogDescription>
              Update job posting details
            </DialogDescription>
          </DialogHeader>
          {renderJobFormFields("edit")}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{selectedJob.title}</h3>
                <Badge className={cn("capitalize mt-2", statusStyles[selectedJob.status || "draft"])}>
                  {statusLabels[selectedJob.status || "draft"] || selectedJob.status}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{getLocationName(selectedJob.location_id) || "Not specified"}</span>
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
                    <span>Closes: {new Date(selectedJob.closing_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {selectedJob.description && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedJob.description}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div className="text-xs text-muted-foreground">
                Created on {selectedJob.created_at ? new Date(selectedJob.created_at).toLocaleDateString() : "N/A"}
                {selectedJob.published_at && ` | Published on ${new Date(selectedJob.published_at).toLocaleDateString()}`}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedJob?.status === "draft" && (
              <Button onClick={() => {
                setIsViewDialogOpen(false)
                if (selectedJob) openEditDialog(selectedJob)
              }}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {selectedJob?.status === "open" && (
              <Button variant="outline" onClick={() => selectedJob && handleCopyLink(selectedJob)}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this job? This action cannot be undone.
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
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Job
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
              AI Generated Job Description
            </DialogTitle>
            <DialogDescription>
              Review and edit the generated content, then apply it to your job posting
            </DialogDescription>
          </DialogHeader>

          {generatedData && (
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {/* Title */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Title (English)</Label>
                  <Input
                    value={generatedData.title}
                    onChange={(e) => setGeneratedData({ ...generatedData, title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Title (Arabic)</Label>
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
                <Label className="text-xs text-muted-foreground">Description (English)</Label>
                <Textarea
                  value={generatedData.description}
                  onChange={(e) => setGeneratedData({ ...generatedData, description: e.target.value })}
                  className="mt-1 min-h-[80px]"
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Description (Arabic)</Label>
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
                  <Label className="text-xs text-muted-foreground mb-2 block">Requirements</Label>
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
                    <Plus className="h-3 w-3 mr-1" /> Add requirement
                  </Button>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Responsibilities</Label>
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
                    <Plus className="h-3 w-3 mr-1" /> Add responsibility
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Benefits */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Benefits</Label>
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
                  <Plus className="h-3 w-3 mr-1" /> Add benefit
                </Button>
              </div>

              {/* Skills */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Skills</Label>
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
                        className="ml-0.5 rounded-full hover:bg-muted p-0.5"
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
                    <Plus className="h-3 w-3 mr-1" /> Add
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Regenerate
            </Button>
            <Button variant="outline" onClick={() => setIsAIDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyGeneratedContent}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Apply to Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
