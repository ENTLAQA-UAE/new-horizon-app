"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabaseInsert, supabaseUpdate, supabaseDelete } from "@/lib/supabase/auth-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import {
  Plus,
  Search,
  MoreHorizontal,
  Briefcase,
  MapPin,
  Users,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Filter,
} from "lucide-react"
import type { Tables } from "@/lib/supabase/types"

type Job = Tables<"jobs"> & {
  departments: { name: string; name_ar: string | null } | null
  job_locations: { name: string; name_ar: string | null; city: string | null; country: string } | null
}

type Department = Tables<"departments">
type Location = Tables<"job_locations">

interface JobsClientProps {
  jobs: Job[]
  departments: Department[]
  locations: Location[]
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  open: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  closed: "bg-red-100 text-red-800",
  filled: "bg-blue-100 text-blue-800",
}

const statusIcons: Record<string, React.ReactNode> = {
  draft: <Clock className="h-3 w-3" />,
  open: <Play className="h-3 w-3" />,
  paused: <Pause className="h-3 w-3" />,
  closed: <CheckCircle className="h-3 w-3" />,
  filled: <CheckCircle className="h-3 w-3" />,
}

const jobTypeLabels: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  temporary: "Temporary",
  internship: "Internship",
  freelance: "Freelance",
}

const experienceLevelLabels: Record<string, string> = {
  entry: "Entry Level",
  junior: "Junior",
  mid: "Mid Level",
  senior: "Senior",
  lead: "Lead",
  executive: "Executive",
}

export function JobsClient({ jobs: initialJobs, departments, locations }: JobsClientProps) {
  const router = useRouter()
  const [jobs, setJobs] = useState(initialJobs)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    title_ar: "",
    department_id: "",
    location_id: "",
    job_type: "full_time",
    experience_level: "mid",
    description: "",
    salary_min: "",
    salary_max: "",
    positions_count: "1",
  })

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.title_ar?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const resetForm = () => {
    setFormData({
      title: "",
      title_ar: "",
      department_id: "",
      location_id: "",
      job_type: "full_time",
      experience_level: "mid",
      description: "",
      salary_min: "",
      salary_max: "",
      positions_count: "1",
    })
  }

  const handleCreate = async () => {
    if (!formData.title) {
      toast.error("Please enter a job title")
      return
    }

    setIsLoading(true)
    try {
      const slug = generateSlug(formData.title) + "-" + Date.now()

      const { data, error } = await supabaseInsert("jobs", {
        title: formData.title,
        title_ar: formData.title_ar || null,
        slug,
        department_id: formData.department_id || null,
        location_id: formData.location_id || null,
        job_type: formData.job_type as any,
        experience_level: formData.experience_level as any,
        description: formData.description || null,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        positions_count: parseInt(formData.positions_count) || 1,
        status: "draft",
        org_id: "00000000-0000-0000-0000-000000000000", // Will be set by RLS
      })

      if (error) throw error
      if (!data) throw new Error("No data returned from insert")

      // Add the new job to state with null relations (router.refresh will fetch complete data)
      const newJob = {
        ...(data as Record<string, unknown>),
        departments: formData.department_id
          ? departments.find((d) => d.id === formData.department_id) || null
          : null,
        job_locations: formData.location_id
          ? locations.find((l) => l.id === formData.location_id) || null
          : null,
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setJobs([newJob as any, ...jobs])
      setIsCreateOpen(false)
      resetForm()
      toast.success("Job created successfully")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to create job")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (job: Job, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus }

      if (newStatus === "open" && !job.published_at) {
        updateData.published_at = new Date().toISOString()
      }

      const { error } = await supabaseUpdate("jobs", updateData, {
        column: "id",
        value: job.id,
      })

      if (error) throw error

      setJobs(jobs.map((j) => (j.id === job.id ? { ...j, ...updateData } : j)))
      toast.success(`Job ${newStatus === "open" ? "published" : newStatus}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to update job")
    }
  }

  const handleDelete = async (job: Job) => {
    if (!confirm(`Are you sure you want to delete "${job.title}"?`)) return

    try {
      const { error } = await supabaseDelete("jobs", {
        column: "id",
        value: job.id,
      })

      if (error) throw error

      setJobs(jobs.filter((j) => j.id !== job.id))
      toast.success("Job deleted successfully")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete job")
    }
  }

  const stats = {
    total: jobs.length,
    open: jobs.filter((j) => j.status === "open").length,
    draft: jobs.filter((j) => j.status === "draft").length,
    applications: jobs.reduce((acc, j) => acc + (j.applications_count || 0), 0),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Jobs</h2>
          <p className="text-muted-foreground">
            Manage job postings and track applications
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Job</DialogTitle>
              <DialogDescription>
                Create a new job posting. You can publish it later.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title (English)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title_ar">Job Title (Arabic)</Label>
                  <Input
                    id="title_ar"
                    value={formData.title_ar}
                    onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                    placeholder="e.g., مهندس برمجيات أول"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
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
                  <Label>Location</Label>
                  <Select
                    value={formData.location_id}
                    onValueChange={(value) => setFormData({ ...formData, location_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name} - {loc.city}, {loc.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Job Type</Label>
                  <Select
                    value={formData.job_type}
                    onValueChange={(value) => setFormData({ ...formData, job_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(jobTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Experience Level</Label>
                  <Select
                    value={formData.experience_level}
                    onValueChange={(value) => setFormData({ ...formData, experience_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(experienceLevelLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary_min">Min Salary (SAR)</Label>
                  <Input
                    id="salary_min"
                    type="number"
                    value={formData.salary_min}
                    onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                    placeholder="e.g., 15000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary_max">Max Salary (SAR)</Label>
                  <Input
                    id="salary_max"
                    type="number"
                    value={formData.salary_max}
                    onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                    placeholder="e.g., 25000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="positions_count">Positions</Label>
                  <Input
                    id="positions_count"
                    type="number"
                    min="1"
                    value={formData.positions_count}
                    onChange={(e) => setFormData({ ...formData, positions_count: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Job"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.applications}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
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
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="filled">Filled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardContent className="p-0">
          {filteredJobs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{job.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {job.departments?.name || "-"}
                    </TableCell>
                    <TableCell>
                      {job.job_locations ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{job.job_locations.city}, {job.job_locations.country}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {jobTypeLabels[job.job_type] || job.job_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{job.applications_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[job.status]}>
                        {statusIcons[job.status]}
                        <span className="ml-1 capitalize">{job.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {job.status === "draft" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(job, "open")}>
                              <Play className="mr-2 h-4 w-4" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          {job.status === "open" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(job, "paused")}>
                              <Pause className="mr-2 h-4 w-4" />
                              Pause
                            </DropdownMenuItem>
                          )}
                          {job.status === "paused" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(job, "open")}>
                              <Play className="mr-2 h-4 w-4" />
                              Resume
                            </DropdownMenuItem>
                          )}
                          {(job.status === "open" || job.status === "paused") && (
                            <DropdownMenuItem onClick={() => handleStatusChange(job, "closed")}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Close
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(job)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No jobs found</h3>
              <p className="text-muted-foreground text-center mt-1">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first job posting to get started"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
