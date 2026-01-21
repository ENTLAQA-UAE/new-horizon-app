// @ts-nocheck
// Note: This file uses tables/fields that don't exist in the database schema yet
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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
  employment_type: string | null
  job_grade_id: string | null
  experience_level: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  is_remote: boolean | null
  status: string | null
  published_at: string | null
  closes_at: string | null
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
}

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  closed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
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
}: JobsClientProps) {
  const router = useRouter()
  const supabase = createClient()
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
    employment_type: "full_time",
    job_grade_id: "",
    experience_level: "mid",
    salary_min: 0,
    salary_max: 0,
    salary_currency: "SAR",
    is_remote: false,
    closes_at: "",
  })

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.title_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || job.status === statusFilter
    const matchesDepartment = departmentFilter === "all" || job.department_id === departmentFilter
    return matchesSearch && matchesStatus && matchesDepartment
  })

  const stats = {
    total: jobs.length,
    published: jobs.filter((j) => j.status === "published").length,
    draft: jobs.filter((j) => j.status === "draft").length,
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
      employment_type: "full_time",
      job_grade_id: "",
      experience_level: "mid",
      salary_min: 0,
      salary_max: 0,
      salary_currency: "SAR",
      is_remote: false,
      closes_at: "",
    })
  }

  // CREATE
  const handleCreate = async () => {
    if (!formData.title) {
      toast.error("Please enter a job title")
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("jobs")
        .insert({
          title: formData.title,
          title_ar: formData.title_ar || null,
          description: formData.description || null,
          description_ar: formData.description_ar || null,
          department_id: formData.department_id || null,
          location_id: formData.location_id || null,
          location: formData.location || null,
          location_ar: formData.location_ar || null,
          job_type_id: formData.job_type_id || null,
          employment_type: formData.job_type_id ? null : formData.employment_type,
          job_grade_id: formData.job_grade_id || null,
          experience_level: formData.job_grade_id ? null : formData.experience_level,
          salary_min: formData.salary_min || null,
          salary_max: formData.salary_max || null,
          salary_currency: formData.salary_currency,
          is_remote: formData.is_remote,
          closes_at: formData.closes_at || null,
          status: "draft",
        })
        .select()
        .single()

      if (error) {
        toast.error(error.message)
        return
      }

      setJobs([data, ...jobs])
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success("Job created successfully! Configure settings...")
      // Redirect to settings page to configure form sections, stages, and team
      router.push(`/org/jobs/${data.id}/settings`)
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
      employment_type: job.employment_type || "full_time",
      job_grade_id: job.job_grade_id || "",
      experience_level: job.experience_level || "mid",
      salary_min: job.salary_min || 0,
      salary_max: job.salary_max || 0,
      salary_currency: job.salary_currency || "SAR",
      is_remote: job.is_remote || false,
      closes_at: job.closes_at?.split("T")[0] || "",
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
      const { error } = await supabase
        .from("jobs")
        .update({
          title: formData.title,
          title_ar: formData.title_ar || null,
          description: formData.description || null,
          description_ar: formData.description_ar || null,
          department_id: formData.department_id || null,
          location_id: formData.location_id || null,
          location: formData.location || null,
          location_ar: formData.location_ar || null,
          job_type_id: formData.job_type_id || null,
          employment_type: formData.job_type_id ? null : formData.employment_type,
          job_grade_id: formData.job_grade_id || null,
          experience_level: formData.job_grade_id ? null : formData.experience_level,
          salary_min: formData.salary_min || null,
          salary_max: formData.salary_max || null,
          salary_currency: formData.salary_currency,
          is_remote: formData.is_remote,
          closes_at: formData.closes_at || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedJob.id)

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
      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", selectedJob.id)

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
      const updateData: Record<string, any> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      }

      if (newStatus === "published") {
        updateData.published_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from("jobs")
        .update(updateData)
        .eq("id", jobId)

      if (error) {
        toast.error(error.message)
        return
      }

      setJobs(
        jobs.map((j) =>
          j.id === jobId ? { ...j, status: newStatus, ...updateData } : j
        )
      )
      toast.success(`Job ${newStatus === "published" ? "published" : newStatus}`)
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    }
  }

  // DUPLICATE
  const handleDuplicate = async (job: Job) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("jobs")
        .insert({
          title: `${job.title} (Copy)`,
          title_ar: job.title_ar ? `${job.title_ar} (نسخة)` : null,
          description: job.description,
          description_ar: job.description_ar,
          department_id: job.department_id,
          location: job.location,
          location_ar: job.location_ar,
          employment_type: job.employment_type,
          experience_level: job.experience_level,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          salary_currency: job.salary_currency,
          is_remote: job.is_remote,
          status: "draft",
        })
        .select()
        .single()

      if (error) {
        toast.error(error.message)
        return
      }

      setJobs([data, ...jobs])
      toast.success("Job duplicated successfully")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
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
        <Label htmlFor={`${idPrefix}-closes_at`}>Application Deadline</Label>
        <Input
          id={`${idPrefix}-closes_at`}
          type="date"
          value={formData.closes_at}
          onChange={(e) => setFormData({ ...formData, closes_at: e.target.value })}
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
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
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
            <SelectItem value="published">Published</SelectItem>
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
                      <span>{job.location || "Not specified"}</span>
                      {job.is_remote && (
                        <Badge variant="outline" className="ml-1 text-xs">
                          Remote
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm capitalize">
                      {job.employment_type?.replace("_", " ") || "-"}
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
                        {job.status || "draft"}
                      </Badge>
                      {job.status === "published" && job.closes_at && (() => {
                        const daysLeft = getDaysUntilDeadline(job.closes_at)
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
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                            openEditDialog(job)
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => router.push(`/org/jobs/${job.id}/settings`)}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleDuplicate(job)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {job.status === "draft" && (
                          <DropdownMenuItem
                            onSelect={() => handleStatusChange(job.id, "published")}
                            className="text-green-600"
                          >
                            <Globe className="mr-2 h-4 w-4" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        {job.status === "published" && (
                          <DropdownMenuItem
                            onSelect={() => handleStatusChange(job.id, "paused")}
                          >
                            <EyeOff className="mr-2 h-4 w-4" />
                            Pause
                          </DropdownMenuItem>
                        )}
                        {job.status === "paused" && (
                          <DropdownMenuItem
                            onSelect={() => handleStatusChange(job.id, "published")}
                            className="text-green-600"
                          >
                            <Globe className="mr-2 h-4 w-4" />
                            Resume
                          </DropdownMenuItem>
                        )}
                        {(job.status === "published" || job.status === "paused") && (
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
                {selectedJob.title_ar && (
                  <p className="text-muted-foreground" dir="rtl">
                    {selectedJob.title_ar}
                  </p>
                )}
                <Badge className={cn("capitalize mt-2", statusStyles[selectedJob.status || "draft"])}>
                  {selectedJob.status || "draft"}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedJob.location || "Not specified"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{selectedJob.employment_type?.replace("_", " ") || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{getDepartmentName(selectedJob.department_id)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.salary_currency)}</span>
                </div>
                {selectedJob.closes_at && (
                  <div className="flex items-center gap-2 col-span-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Closes: {new Date(selectedJob.closes_at).toLocaleDateString()}</span>
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
            <Button onClick={() => {
              setIsViewDialogOpen(false)
              if (selectedJob) openEditDialog(selectedJob)
            }}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
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
                {selectedJob.location && (
                  <p className="text-sm text-muted-foreground">{selectedJob.location}</p>
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
    </div>
  )
}
