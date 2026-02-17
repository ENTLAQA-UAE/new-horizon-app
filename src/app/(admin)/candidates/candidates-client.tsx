"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabaseInsert, supabaseUpdate, supabaseDelete } from "@/lib/supabase/auth-fetch"
import { useI18n } from "@/lib/i18n"
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
  Users,
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
  FileText,
  Upload,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Candidate {
  id: string
  org_id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  phone_secondary: string | null
  headline: string | null
  summary: string | null
  avatar_url: string | null
  city: string | null
  country: string | null
  nationality: string | null
  current_title: string | null
  current_company: string | null
  years_of_experience: number | null
  expected_salary: number | null
  salary_currency: string | null
  notice_period_days: number | null
  skills: unknown
  languages: unknown | null
  education: unknown | null
  experience: unknown | null
  certifications: unknown | null
  resume_url: string | null
  resume_parsed_data: unknown | null
  linkedin_url: string | null
  portfolio_url: string | null
  source: string | null
  source_details: string | null
  referred_by: string | null
  tags: unknown | null
  ai_overall_score: number | null
  ai_score_breakdown: unknown | null
  ai_parsed_at: string | null
  is_blacklisted: boolean | null
  blacklist_reason: string | null
  consent_given: boolean | null
  consent_date: string | null
  created_at: string | null
  updated_at: string | null
}

interface Job {
  id: string
  title: string
  title_ar: string | null
  status: string
}

interface CandidatesClientProps {
  candidates: Candidate[]
  jobs: Job[]
  orgId: string
}

const statusStyles: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  scored: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  screening: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  interviewing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  offered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  hired: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  withdrawn: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
}

type CandidateSource = "career_page" | "linkedin" | "indeed" | "referral" | "agency" | "direct" | "other"

export function CandidatesClient({ candidates: initialCandidates, jobs, orgId }: CandidatesClientProps) {
  const router = useRouter()
  const [candidates, setCandidates] = useState(initialCandidates)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")

  const { t } = useI18n()

  const getSourceOptions = (): { value: CandidateSource; label: string }[] => [
    { value: "direct", label: t("admin.candidates.sourceDirect") },
    { value: "linkedin", label: t("admin.candidates.sourceLinkedin") },
    { value: "indeed", label: t("admin.candidates.sourceIndeed") },
    { value: "referral", label: t("admin.candidates.sourceReferral") },
    { value: "agency", label: t("admin.candidates.sourceAgency") },
    { value: "career_page", label: t("admin.candidates.sourceCareerPage") },
    { value: "other", label: t("admin.candidates.sourceOther") },
  ]

  const sourceOptions = getSourceOptions()

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
      candidate.current_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.current_company?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSource = sourceFilter === "all" || candidate.source === sourceFilter
    return matchesSearch && matchesSource
  })

  const stats = {
    total: candidates.length,
    scored: candidates.filter((c) => c.ai_overall_score !== null).length,
    unscored: candidates.filter((c) => c.ai_overall_score === null).length,
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
      toast.error(t("admin.candidates.fillRequired"))
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabaseInsert<Candidate>("candidates", {
        org_id: orgId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        city: formData.city || null,
        country: formData.country || null,
        nationality: formData.nationality || null,
        current_title: formData.current_job_title || null,
        current_company: formData.current_company || null,
        years_of_experience: formData.years_of_experience || null,
        skills: formData.skills ? formData.skills.split(",").map(s => s.trim()) : null,
        source: formData.source as CandidateSource,
      })

      if (error) {
        if (error.code === "23505") {
          toast.error(t("admin.candidates.emailExists"))
        } else {
          toast.error(error.message)
        }
        return
      }

      if (data) setCandidates([data, ...candidates])
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success(t("admin.candidates.createdSuccess"))
      router.refresh()
    } catch {
      toast.error(t("admin.candidates.unexpectedError"))
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
      current_job_title: candidate.current_title || "",
      current_company: candidate.current_company || "",
      years_of_experience: candidate.years_of_experience || 0,
      highest_education: "",
      skills: Array.isArray(candidate.skills) ? candidate.skills.join(", ") : "",
      source: candidate.source || "direct",
    })
    setIsEditDialogOpen(true)
  }

  const handleEdit = async () => {
    if (!selectedCandidate || !formData.first_name || !formData.last_name || !formData.email) {
      toast.error(t("admin.candidates.fillRequired"))
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabaseUpdate("candidates", {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        city: formData.city || null,
        country: formData.country || null,
        nationality: formData.nationality || null,
        current_title: formData.current_job_title || null,
        current_company: formData.current_company || null,
        years_of_experience: formData.years_of_experience || null,
        skills: formData.skills ? formData.skills.split(",").map(s => s.trim()) : null,
        source: formData.source as CandidateSource,
        updated_at: new Date().toISOString(),
      }, { column: "id", value: selectedCandidate.id })

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
      toast.success(t("admin.candidates.updatedSuccess"))
      router.refresh()
    } catch {
      toast.error(t("admin.candidates.unexpectedError"))
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
      const { error } = await supabaseDelete("candidates", { column: "id", value: selectedCandidate.id })

      if (error) {
        toast.error(error.message)
        return
      }

      setCandidates(candidates.filter((c) => c.id !== selectedCandidate.id))
      setIsDeleteDialogOpen(false)
      setSelectedCandidate(null)
      toast.success(t("admin.candidates.deletedSuccess"))
      router.refresh()
    } catch {
      toast.error(t("admin.candidates.unexpectedError"))
    } finally {
      setIsLoading(false)
    }
  }

  // Note: Candidate status is tracked via applications, not on the candidate record

  // Render form fields inline to prevent focus loss on state change
  const renderCandidateFormFields = (idPrefix: string) => (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-first_name`}>{t("admin.candidates.firstName")} *</Label>
          <Input
            id={`${idPrefix}-first_name`}
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            placeholder="Ahmed"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-last_name`}>{t("admin.candidates.lastName")} *</Label>
          <Input
            id={`${idPrefix}-last_name`}
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            placeholder="Al-Hassan"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-email`}>{t("admin.candidates.email")} *</Label>
          <Input
            id={`${idPrefix}-email`}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="ahmed@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-phone`}>{t("admin.candidates.phone")}</Label>
          <Input
            id={`${idPrefix}-phone`}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+966 50 123 4567"
          />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-city`}>{t("admin.candidates.city")}</Label>
          <Input
            id={`${idPrefix}-city`}
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Riyadh"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-country`}>{t("admin.candidates.country")}</Label>
          <Input
            id={`${idPrefix}-country`}
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            placeholder="Saudi Arabia"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-nationality`}>{t("admin.candidates.nationality")}</Label>
          <Input
            id={`${idPrefix}-nationality`}
            value={formData.nationality}
            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            placeholder="Saudi"
          />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-current_job_title`}>{t("admin.candidates.currentJobTitle")}</Label>
          <Input
            id={`${idPrefix}-current_job_title`}
            value={formData.current_job_title}
            onChange={(e) => setFormData({ ...formData, current_job_title: e.target.value })}
            placeholder="Software Engineer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-current_company`}>{t("admin.candidates.currentCompany")}</Label>
          <Input
            id={`${idPrefix}-current_company`}
            value={formData.current_company}
            onChange={(e) => setFormData({ ...formData, current_company: e.target.value })}
            placeholder="Tech Corp"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-years_of_experience`}>{t("admin.candidates.yearsOfExperience")}</Label>
          <Input
            id={`${idPrefix}-years_of_experience`}
            type="number"
            value={formData.years_of_experience}
            onChange={(e) => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) || 0 })}
            placeholder="5"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-highest_education`}>{t("admin.candidates.highestEducation")}</Label>
          <Select
            value={formData.highest_education}
            onValueChange={(value) => setFormData({ ...formData, highest_education: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("admin.candidates.selectEducation")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high_school">{t("admin.candidates.highSchool")}</SelectItem>
              <SelectItem value="diploma">{t("admin.candidates.diploma")}</SelectItem>
              <SelectItem value="bachelors">{t("admin.candidates.bachelors")}</SelectItem>
              <SelectItem value="masters">{t("admin.candidates.masters")}</SelectItem>
              <SelectItem value="phd">{t("admin.candidates.phd")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-skills`}>{t("admin.candidates.skillsCommaSeparated")}</Label>
        <Textarea
          id={`${idPrefix}-skills`}
          value={formData.skills}
          onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
          placeholder="JavaScript, React, Node.js, Python"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-source`}>{t("admin.candidates.sourceLabel")}</Label>
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
          <h2 className="text-2xl font-bold tracking-tight">{t("admin.candidates.title")}</h2>
          <p className="text-muted-foreground">
            {t("admin.candidates.subtitle")}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              {t("admin.candidates.addCandidate")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("admin.candidates.addNew")}</DialogTitle>
              <DialogDescription>
                {t("admin.candidates.addNewDesc")}
              </DialogDescription>
            </DialogHeader>
            {renderCandidateFormFields("create")}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {t("admin.candidates.cancel")}
              </Button>
              <Button onClick={handleCreate} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("admin.candidates.addCandidate")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.candidates.totalCandidates")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.candidates.aiScored")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.scored}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.candidates.pendingScore")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.unscored}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("admin.candidates.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder={t("admin.candidates.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.candidates.allStatus")}</SelectItem>
            <SelectItem value="new">{t("admin.candidates.statusNew")}</SelectItem>
            <SelectItem value="screening">{t("admin.candidates.statusScreening")}</SelectItem>
            <SelectItem value="interviewing">{t("admin.candidates.statusInterviewing")}</SelectItem>
            <SelectItem value="offered">{t("admin.candidates.statusOffered")}</SelectItem>
            <SelectItem value="hired">{t("admin.candidates.statusHired")}</SelectItem>
            <SelectItem value="rejected">{t("admin.candidates.statusRejected")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("admin.candidates.source")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.candidates.allSources")}</SelectItem>
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
              <TableHead>{t("admin.candidates.candidate")}</TableHead>
              <TableHead>{t("admin.candidates.contact")}</TableHead>
              <TableHead>{t("admin.candidates.currentRole")}</TableHead>
              <TableHead>{t("admin.candidates.experience")}</TableHead>
              <TableHead>{t("admin.candidates.status")}</TableHead>
              <TableHead>{t("admin.candidates.source")}</TableHead>
              <TableHead className="text-right">{t("admin.candidates.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCandidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <UserSearch className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">{t("admin.candidates.noCandidatesFound")}</p>
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
                        {candidate.current_title || "-"}
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
                      ? t("admin.candidates.yearsExperience").replace("{count}", String(candidate.years_of_experience))
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("capitalize", statusStyles[candidate.ai_overall_score ? "scored" : "new"])}>
                      {candidate.ai_overall_score ? t("admin.candidates.statusScored") : t("admin.candidates.statusNew")}
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
                          {t("admin.candidates.viewProfile")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                            openEditDialog(candidate)
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          {t("admin.candidates.edit")}
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
                          {t("admin.candidates.delete")}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin.candidates.editCandidate")}</DialogTitle>
            <DialogDescription>
              {t("admin.candidates.editCandidateDesc")}
            </DialogDescription>
          </DialogHeader>
          {renderCandidateFormFields("edit")}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t("admin.candidates.cancel")}
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("admin.candidates.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("admin.candidates.candidateProfile")}</DialogTitle>
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
                    {selectedCandidate.current_title || t("admin.candidates.noTitle")}
                    {selectedCandidate.current_company && ` ${t("admin.candidates.atCompany").replace("{company}", selectedCandidate.current_company)}`}
                  </p>
                  {selectedCandidate.ai_overall_score !== null && (
                    <Badge className="mt-1">
                      {t("admin.candidates.score").replace("{score}", String(selectedCandidate.ai_overall_score))}
                    </Badge>
                  )}
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
                    <span>{t("admin.candidates.yearsExperienceFull").replace("{count}", String(selectedCandidate.years_of_experience))}</span>
                  </div>
                )}
                {selectedCandidate.education && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>{t("admin.candidates.educationOnFile")}</span>
                  </div>
                )}
              </div>

              {Array.isArray(selectedCandidate.skills) && selectedCandidate.skills.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">{t("admin.candidates.skills")}</p>
                    <div className="flex flex-wrap gap-2">
                      {(selectedCandidate.skills as string[]).map((skill, i) => (
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
                {t("admin.candidates.addedOn").replace("{date}", selectedCandidate.created_at ? new Date(selectedCandidate.created_at).toLocaleDateString() : "N/A")}
                {selectedCandidate.source && ` ${t("admin.candidates.viaSource").replace("{source}", selectedCandidate.source.replace("_", " "))}`}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              {t("admin.candidates.close")}
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false)
              if (selectedCandidate) openEditDialog(selectedCandidate)
            }}>
              <Pencil className="mr-2 h-4 w-4" />
              {t("admin.candidates.edit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.candidates.deleteCandidate")}</DialogTitle>
            <DialogDescription>
              {t("admin.candidates.deleteConfirm")}
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
              {t("admin.candidates.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("admin.candidates.deleteCandidate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
