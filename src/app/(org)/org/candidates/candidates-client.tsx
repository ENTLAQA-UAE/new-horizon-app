"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { supabaseInsert, supabaseUpdate, supabaseDelete, supabaseSelect } from "@/lib/supabase/auth-fetch"
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
  Upload,
  X,
  Sparkles,
  Wand2,
  ExternalLink,
} from "lucide-react"
import { useAI } from "@/hooks/use-ai"
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
  organizationId: string
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
  { value: "career_page", label: "Career Page" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "indeed", label: "Indeed" },
  { value: "referral", label: "Employee Referral" },
  { value: "agency", label: "Recruitment Agency" },
  { value: "other", label: "Other" },
]

export function OrgCandidatesClient({ candidates: initialCandidates, jobs, organizationId }: OrgCandidatesClientProps) {
  const router = useRouter()
  const { parseResume, isLoading: isAiLoading, error: aiError } = useAI()
  const [candidates, setCandidates] = useState(initialCandidates)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Selected candidate
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<string>("")

  // Resume upload state
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [resumeText, setResumeText] = useState<string>("")
  const [isParsing, setIsParsing] = useState(false)

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
    return matchesSearch && matchesStatus
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
    setResumeFile(null)
    setResumeText("")
  }

  // Open resume in new tab (like Google Drive - view & download from there)
  const handleOpenResume = (resumeUrl: string) => {
    if (!resumeUrl) {
      toast.error("Resume URL not available")
      return
    }
    // Open the file directly in a new tab - user can view and download from there
    window.open(resumeUrl, "_blank", "noopener,noreferrer")
  }

  // CREATE
  const handleCreate = async () => {
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast.error("Please fill in required fields")
      return
    }

    setIsLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabaseInsert<any>("candidates", {
        org_id: organizationId,
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
        source: formData.source as "career_page" | "linkedin" | "indeed" | "referral" | "agency" | "direct" | "other",
      })

      if (error) {
        if (error.code === "23505") {
          toast.error("A candidate with this email already exists")
        } else {
          toast.error(error.message)
        }
        return
      }

      // Upload resume if provided
      let resumeUrl = null
      if (resumeFile) {
        setIsUploadingResume(true)
        resumeUrl = await uploadResume(resumeFile, data.id)
        if (resumeUrl) {
          await supabaseUpdate("candidates", { resume_url: resumeUrl }, { column: "id", value: data.id })
          data.resume_url = resumeUrl
        }
        setIsUploadingResume(false)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCandidates([data as any, ...candidates])
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success("Candidate added successfully")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
      setIsUploadingResume(false)
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
        source: formData.source as "career_page" | "linkedin" | "indeed" | "referral" | "agency" | "direct" | "other",
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
      const { error } = await supabaseDelete("candidates", { column: "id", value: selectedCandidate.id })

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
      const { error } = await supabaseUpdate("candidates", {
        overall_status: newStatus,
        updated_at: new Date().toISOString(),
      }, { column: "id", value: candidateId })

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

  // APPLY TO JOB
  const openApplyDialog = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setSelectedJobId("")
    setIsApplyDialogOpen(true)
  }

  const handleApplyToJob = async () => {
    if (!selectedCandidate || !selectedJobId) {
      toast.error("Please select a job")
      return
    }

    setIsLoading(true)
    try {
      // Check if application already exists
      const { data: existingApp } = await supabaseSelect<{ id: string }>("applications", {
        select: "id",
        filter: [
          { column: "candidate_id", operator: "eq", value: selectedCandidate.id },
          { column: "job_id", operator: "eq", value: selectedJobId },
        ],
        single: true,
      })

      if (existingApp) {
        toast.error("This candidate has already applied to this job")
        setIsLoading(false)
        return
      }

      // Get the first stage (usually "new" or "applied")
      const { data: stages } = await supabaseSelect<{ id: string }[]>("pipeline_stages", {
        select: "id",
        order: { column: "sort_order", ascending: true },
        limit: 1,
      })

      const firstStageId = Array.isArray(stages) && stages.length > 0 ? stages[0].id : null

      // Create the application
      const { error } = await supabaseInsert("applications", {
        org_id: organizationId,
        candidate_id: selectedCandidate.id,
        job_id: selectedJobId,
        stage_id: firstStageId,
        status: "new",
        source: (selectedCandidate.source || "direct") as "career_page" | "linkedin" | "indeed" | "referral" | "agency" | "direct" | "other",
        applied_at: new Date().toISOString(),
      })

      if (error) {
        toast.error(error.message)
        return
      }

      setIsApplyDialogOpen(false)
      setSelectedCandidate(null)
      setSelectedJobId("")
      toast.success("Candidate applied to job successfully")
      router.push("/org/applications")
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Filter published jobs for apply dialog
  const publishedJobs = jobs.filter(j => j.status === "published" || j.status === "open")

  // Resume upload handler
  const uploadResume = async (file: File, candidateId: string): Promise<string | null> => {
    try {
      const supabase = createClient()
      const fileExt = file.name.split(".").pop()
      const fileName = `${candidateId}-${Date.now()}.${fileExt}`
      const filePath = `${candidateId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        return null
      }

      const { data } = supabase.storage.from("resumes").getPublicUrl(filePath)
      return data.publicUrl
    } catch (error) {
      console.error("Resume upload failed:", error)
      return null
    }
  }

  // Handle resume file selection
  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a PDF or Word document")
        return
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB")
        return
      }
      setResumeFile(file)

      // Extract text from PDF for AI parsing
      if (file.type === "application/pdf") {
        try {
          const text = await extractTextFromPDF(file)
          setResumeText(text)
        } catch {
          console.log("Could not extract text for AI parsing")
        }
      } else {
        // For Word docs, we'll need to extract text differently
        try {
          const text = await file.text()
          setResumeText(text)
        } catch {
          console.log("Could not extract text for AI parsing")
        }
      }
    }
  }

  // Extract text from PDF file
  const extractTextFromPDF = async (file: File): Promise<string> => {
    // Using FileReader to read the file
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          // For now, we'll use a simple approach - send the base64 to API
          // In production, you might use pdf-parse or pdf.js
          const base64 = btoa(
            new Uint8Array(reader.result as ArrayBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ''
            )
          )
          resolve(`[PDF Content - Base64 Encoded]\n${base64.substring(0, 50000)}`)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  // AI Parse resume handler
  const handleAIParseResume = async () => {
    if (!resumeText && !resumeFile) {
      toast.error("Please upload a resume first")
      return
    }

    setIsParsing(true)
    try {
      let textToParse = resumeText

      // If we don't have text yet but have a file, try to extract
      if (!textToParse && resumeFile) {
        try {
          textToParse = await resumeFile.text()
        } catch {
          toast.error("Could not read resume file. Please try a different format.")
          setIsParsing(false)
          return
        }
      }

      if (!textToParse) {
        toast.error("Could not extract text from resume")
        setIsParsing(false)
        return
      }

      const result = await parseResume(textToParse)

      if (result) {
        // Auto-fill the form with parsed data
        setFormData({
          first_name: result.firstName || formData.first_name,
          last_name: result.lastName || formData.last_name,
          email: result.email || formData.email,
          phone: result.phone || formData.phone,
          city: result.city || formData.city,
          country: result.country || formData.country,
          nationality: result.nationality || formData.nationality,
          current_job_title: result.currentJobTitle || formData.current_job_title,
          current_company: result.currentCompany || formData.current_company,
          years_of_experience: result.yearsOfExperience || formData.years_of_experience,
          highest_education: mapEducationLevel(result.highestEducation) || formData.highest_education,
          skills: result.skills?.join(", ") || formData.skills,
          source: formData.source,
        })
        toast.success("Resume parsed successfully! Form has been auto-filled.")
      } else if (aiError) {
        toast.error(aiError)
      }
    } catch {
      toast.error("Failed to parse resume")
    } finally {
      setIsParsing(false)
    }
  }

  // Map education degree to our dropdown values
  const mapEducationLevel = (degree?: string): string => {
    if (!degree) return ""
    const lowerDegree = degree.toLowerCase()
    if (lowerDegree.includes("phd") || lowerDegree.includes("doctorate")) return "phd"
    if (lowerDegree.includes("master") || lowerDegree.includes("mba") || lowerDegree.includes("msc") || lowerDegree.includes("ma")) return "masters"
    if (lowerDegree.includes("bachelor") || lowerDegree.includes("bsc") || lowerDegree.includes("ba") || lowerDegree.includes("beng")) return "bachelors"
    if (lowerDegree.includes("diploma") || lowerDegree.includes("associate")) return "diploma"
    if (lowerDegree.includes("high school") || lowerDegree.includes("secondary")) return "high_school"
    return ""
  }

  // Render form fields inline to prevent focus loss on state change
  const renderCandidateFormFields = (idPrefix: string) => (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-first_name`}>First Name *</Label>
          <Input
            id={`${idPrefix}-first_name`}
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            placeholder="Ahmed"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-last_name`}>Last Name *</Label>
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
          <Label htmlFor={`${idPrefix}-email`}>Email *</Label>
          <Input
            id={`${idPrefix}-email`}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="ahmed@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-phone`}>Phone</Label>
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
          <Label htmlFor={`${idPrefix}-city`}>City</Label>
          <Input
            id={`${idPrefix}-city`}
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Riyadh"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-country`}>Country</Label>
          <Input
            id={`${idPrefix}-country`}
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            placeholder="Saudi Arabia"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-nationality`}>Nationality</Label>
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
          <Label htmlFor={`${idPrefix}-current_job_title`}>Current Job Title</Label>
          <Input
            id={`${idPrefix}-current_job_title`}
            value={formData.current_job_title}
            onChange={(e) => setFormData({ ...formData, current_job_title: e.target.value })}
            placeholder="Software Engineer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-current_company`}>Current Company</Label>
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
          <Label htmlFor={`${idPrefix}-years_of_experience`}>Years of Experience</Label>
          <Input
            id={`${idPrefix}-years_of_experience`}
            type="number"
            value={formData.years_of_experience}
            onChange={(e) => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) || 0 })}
            placeholder="5"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-highest_education`}>Highest Education</Label>
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
        <Label htmlFor={`${idPrefix}-skills`}>Skills (comma separated)</Label>
        <Textarea
          id={`${idPrefix}-skills`}
          value={formData.skills}
          onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
          placeholder="JavaScript, React, Node.js, Python"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-source`}>Source</Label>
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

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${idPrefix}-resume`}>Resume (PDF or Word)</Label>
          {resumeFile && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAIParseResume}
              disabled={isParsing || isAiLoading}
              className="h-7 text-xs gap-1.5"
            >
              {isParsing || isAiLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              Parse with AI
            </Button>
          )}
        </div>
        {resumeFile ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
              <span className="flex-1 text-sm truncate">{resumeFile.name}</span>
              <span className="text-xs text-muted-foreground">
                {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setResumeFile(null)
                  setResumeText("")
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-lg">
              <Wand2 className="h-4 w-4 text-violet-500" />
              <p className="text-xs text-muted-foreground">
                Click <span className="font-medium text-violet-600">&quot;Parse with AI&quot;</span> to auto-fill candidate details from this resume
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <input
              id={`${idPrefix}-resume`}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleResumeChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click or drag to upload resume (PDF, DOC, DOCX - Max 10MB)
              </span>
            </div>
          </div>
        )}
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
                          <DropdownMenuItem
                            onSelect={() => handleOpenResume(candidate.resume_url!)}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Resume
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                            openApplyDialog(candidate)
                          }}
                          className="text-primary"
                        >
                          <Briefcase className="mr-2 h-4 w-4" />
                          Apply to Job
                        </DropdownMenuItem>
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
          {renderCandidateFormFields("create")}
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
          {renderCandidateFormFields("edit")}
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

      {/* Apply to Job Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply Candidate to Job</DialogTitle>
            <DialogDescription>
              Select a job to create an application for this candidate.
            </DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">
                    {selectedCandidate.first_name[0]}{selectedCandidate.last_name[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium">
                    {selectedCandidate.first_name} {selectedCandidate.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCandidate.current_job_title || "No title"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apply-job">Select Job *</Label>
                {publishedJobs.length > 0 ? (
                  <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a job position" />
                    </SelectTrigger>
                    <SelectContent>
                      {publishedJobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-4 text-center text-muted-foreground border border-dashed rounded-lg">
                    <p>No published jobs available</p>
                    <p className="text-sm">Publish a job first to apply candidates</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApplyToJob}
              disabled={isLoading || !selectedJobId || publishedJobs.length === 0}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
