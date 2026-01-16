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
  UserSearch,
  Filter,
  Loader2,
  Pencil,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Star,
  Users,
  FileText,
  Download,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Candidate {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  city: string | null
  country: string | null
  nationality: string | null
  current_job_title: string | null
  current_company: string | null
  years_of_experience: number | null
  highest_education: string | null
  skills: string[] | null
  resume_url: string | null
  source: string | null
  overall_status: string | null
  created_at: string | null
}

interface Job {
  id: string
  title: string
  title_ar: string | null
  status: string
}

interface OrgCandidatesClientProps {
  candidates: Candidate[]
  jobs: Job[]
}

const statusStyles: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  screening: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  interviewing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  offered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  hired: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  withdrawn: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
}

const sourceOptions = [
  { value: "direct", label: "Direct Application" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "indeed", label: "Indeed" },
  { value: "referral", label: "Employee Referral" },
  { value: "agency", label: "Recruitment Agency" },
  { value: "career_fair", label: "Career Fair" },
  { value: "website", label: "Company Website" },
  { value: "other", label: "Other" },
]

export function OrgCandidatesClient({ candidates: initialCandidates, jobs }: OrgCandidatesClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [candidates, setCandidates] = useState(initialCandidates)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Selected candidate
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    nationality: "",
    current_job_title: "",
    current_company: "",
    years_of_experience: 0,
    highest_education: "",
    skills: "",
    source: "direct",
  })

  const filteredCandidates = candidates.filter((candidate) => {
    const fullName = `${candidate.first_name} ${candidate.last_name}`.toLowerCase()
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.current_job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.current_company?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || candidate.overall_status === statusFilter
    const matchesSource = sourceFilter === "all" || candidate.source === sourceFilter
    return matchesSearch && matchesStatus && matchesSource
  })

  const stats = {
    total: candidates.length,
    new: candidates.filter((c) => c.overall_status === "new").length,
    screening: candidates.filter((c) => c.overall_status === "screening").length,
    interviewing: candidates.filter((c) => c.overall_status === "interviewing").length,
    hired: candidates.filter((c) => c.overall_status === "hired").length,
  }

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      city: "",
      country: "",
      nationality: "",
      current_job_title: "",
      current_company: "",
      years_of_experience: 0,
      highest_education: "",
      skills: "",
      source: "direct",
    })
  }

  // CREATE
  const handleCreate = async () => {
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast.error("Please fill in required fields")
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("candidates")
        .insert({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone || null,
          city: formData.city || null,
          country: formData.country || null,
          nationality: formData.nationality || null,
          current_job_title: formData.current_job_title || null,
          current_company: formData.current_company || null,
          years_of_experience: formData.years_of_experience || null,
          highest_education: formData.highest_education || null,
          skills: formData.skills ? formData.skills.split(",").map(s => s.trim()) : null,
          source: formData.source,
          overall_status: "new",
        })
        .select()
        .single()

      if (error) {
        if (error.code === "23505") {
          toast.error("A candidate with this email already exists")
        } else {
          toast.error(error.message)
        }
        return
      }

      setCandidates([data, ...candidates])
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success("Candidate added successfully")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // EDIT
  const openEditDialog = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setFormData({
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      email: candidate.email,
      phone: candidate.phone || "",
      city: candidate.city || "",
      country: candidate.country || "",
      nationality: candidate.nationality || "",
      current_job_title: candidate.current_job_title || "",
      current_company: candidate.current_company || "",
      years_of_experience: candidate.years_of_experience || 0,
      highest_education: candidate.highest_education || "",
      skills: candidate.skills?.join(", ") || "",
      source: candidate.source || "direct",
    })
    setIsEditDialogOpen(true)
  }

  const handleEdit = async () => {
    if (!selectedCandidate || !formData.first_name || !formData.last_name || !formData.email) {
      toast.error("Please fill in required fields")
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("candidates")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone || null,
          city: formData.city || null,
          country: formData.country || null,
          nationality: formData.nationality || null,
          current_job_title: formData.current_job_title || null,
          current_company: formData.current_company || null,
          years_of_experience: formData.years_of_experience || null,
          highest_education: formData.highest_education || null,
          skills: formData.skills ? formData.skills.split(",").map(s => s.trim()) : null,
          source: formData.source,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedCandidate.id)

      if (error) {
        toast.error(error.message)
        return
      }

      setCandidates(
        candidates.map((c) =>
          c.id === selectedCandidate.id
            ? {
                ...c,
                ...formData,
                skills: formData.skills ? formData.skills.split(",").map(s => s.trim()) : null,
              }
            : c
        )
      )
      setIsEditDialogOpen(false)
      setSelectedCandidate(null)
      resetForm()
      toast.success("Candidate updated successfully")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // VIEW
  const openViewDialog = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setIsViewDialogOpen(true)
  }

  // DELETE
  const openDeleteDialog = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedCandidate) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("candidates")
        .delete()
        .eq("id", selectedCandidate.id)

      if (error) {
        toast.error(error.message)
        return
      }

      setCandidates(candidates.filter((c) => c.id !== selectedCandidate.id))
      setIsDeleteDialogOpen(false)
      setSelectedCandidate(null)
      toast.success("Candidate deleted successfully")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // STATUS CHANGE
  const handleStatusChange = async (candidateId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("candidates")
        .update({ overall_status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", candidateId)

      if (error) {
        toast.error(error.message)
        return
      }

      setCandidates(
        candidates.map((c) =>
          c.id === candidateId ? { ...c, overall_status: newStatus } : c
        )
      )
      toast.success(`Status updated to ${newStatus}`)
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    }
  }

  const CandidateForm = () => (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            placeholder="Ahmed"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            placeholder="Al-Hassan"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="ahmed@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+966 50 123 4567"
          />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Riyadh"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            placeholder="Saudi Arabia"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nationality">Nationality</Label>
          <Input
            id="nationality"
            value={formData.nationality}
            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            placeholder="Saudi"
          />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="current_job_title">Current Job Title</Label>
          <Input
            id="current_job_title"
            value={formData.current_job_title}
            onChange={(e) => setFormData({ ...formData, current_job_title: e.target.value })}
            placeholder="Software Engineer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="current_company">Current Company</Label>
          <Input
            id="current_company"
            value={formData.current_company}
            onChange={(e) => setFormData({ ...formData, current_company: e.target.value })}
            placeholder="Tech Corp"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="years_of_experience">Years of Experience</Label>
          <Input
            id="years_of_experience"
            type="number"
            value={formData.years_of_experience}
            onChange={(e) => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) || 0 })}
            placeholder="5"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="highest_education">Highest Education</Label>
          <Select
            value={formData.highest_education}
            onValueChange={(value) => setFormData({ ...formData, highest_education: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select education" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high_school">High School</SelectItem>
              <SelectItem value="diploma">Diploma</SelectItem>
              <SelectItem value="bachelors">Bachelor&apos;s Degree</SelectItem>
              <SelectItem value="masters">Master&apos;s Degree</SelectItem>
              <SelectItem value="phd">PhD / Doctorate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="skills">Skills (comma separated)</Label>
        <Textarea
          id="skills"
          value={formData.skills}
          onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
          placeholder="JavaScript, React, Node.js, Python"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="source">Source</Label>
        <Select
          value={formData.source}
          onValueChange={(value) => setFormData({ ...formData, source: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sourceOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Candidates</h2>
          <p className="text-muted-foreground">
            Manage your talent pool and candidates
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Candidate
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Screening</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.screening}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Interviewing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.interviewing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.hired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, job title..."
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
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="screening">Screening</SelectItem>
            <SelectItem value="interviewing">Interviewing</SelectItem>
            <SelectItem value="offered">Offered</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {sourceOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
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
              <TableHead>Candidate</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Current Role</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCandidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <UserSearch className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No candidates found</p>
                  <Button
                    variant="link"
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="mt-2"
                  >
                    Add your first candidate
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              filteredCandidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {candidate.first_name[0]}{candidate.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">
                          {candidate.first_name} {candidate.last_name}
                        </div>
                        {candidate.nationality && (
                          <div className="text-xs text-muted-foreground">
                            {candidate.nationality}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">{candidate.email}</div>
                      {candidate.phone && (
                        <div className="text-xs text-muted-foreground">{candidate.phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">
                        {candidate.current_job_title || "-"}
                      </div>
                      {candidate.current_company && (
                        <div className="text-xs text-muted-foreground">
                          {candidate.current_company}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {candidate.years_of_experience !== null
                      ? `${candidate.years_of_experience} years`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("capitalize", statusStyles[candidate.overall_status || "new"])}>
                      {candidate.overall_status || "new"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground capitalize">
                      {candidate.source?.replace("_", " ") || "-"}
                    </span>
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
                            openViewDialog(candidate)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                            openEditDialog(candidate)
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {candidate.resume_url && (
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download Resume
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => handleStatusChange(candidate.id, "screening")}
                        >
                          <Star className="mr-2 h-4 w-4" />
                          Move to Screening
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleStatusChange(candidate.id, "interviewing")}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Move to Interview
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleStatusChange(candidate.id, "offered")}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Send Offer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleStatusChange(candidate.id, "hired")}
                          className="text-green-600"
                        >
                          <Briefcase className="mr-2 h-4 w-4" />
                          Mark as Hired
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleStatusChange(candidate.id, "rejected")}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Reject
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={(e) => {
                            e.preventDefault()
                            openDeleteDialog(candidate)
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
            <DialogTitle>Add New Candidate</DialogTitle>
            <DialogDescription>
              Add a new candidate to your talent pool.
            </DialogDescription>
          </DialogHeader>
          <CandidateForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Candidate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Candidate</DialogTitle>
            <DialogDescription>
              Update candidate information.
            </DialogDescription>
          </DialogHeader>
          <CandidateForm />
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
            <DialogTitle>Candidate Profile</DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">
                    {selectedCandidate.first_name[0]}{selectedCandidate.last_name[0]}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedCandidate.first_name} {selectedCandidate.last_name}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedCandidate.current_job_title || "No title"}
                    {selectedCandidate.current_company && ` at ${selectedCandidate.current_company}`}
                  </p>
                  <Badge className={cn("capitalize mt-1", statusStyles[selectedCandidate.overall_status || "new"])}>
                    {selectedCandidate.overall_status || "new"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedCandidate.email}</span>
                </div>
                {selectedCandidate.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedCandidate.phone}</span>
                  </div>
                )}
                {(selectedCandidate.city || selectedCandidate.country) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {[selectedCandidate.city, selectedCandidate.country].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
                {selectedCandidate.years_of_experience !== null && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedCandidate.years_of_experience} years experience</span>
                  </div>
                )}
                {selectedCandidate.highest_education && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{selectedCandidate.highest_education.replace("_", " ")}</span>
                  </div>
                )}
              </div>

              {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.skills.map((skill, i) => (
                        <Badge key={i} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="text-xs text-muted-foreground">
                Added on {selectedCandidate.created_at ? new Date(selectedCandidate.created_at).toLocaleDateString() : "N/A"}
                {selectedCandidate.source && ` via ${selectedCandidate.source.replace("_", " ")}`}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false)
              if (selectedCandidate) openEditDialog(selectedCandidate)
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
            <DialogTitle>Delete Candidate</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this candidate? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="py-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="font-medium text-destructive">
                  {selectedCandidate.first_name} {selectedCandidate.last_name}
                </p>
                <p className="text-sm text-muted-foreground">{selectedCandidate.email}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Candidate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
