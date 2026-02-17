"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  FileText,
  Search,
  Filter,
  File,
  Image,
  FolderOpen,
  User,
  Briefcase,
  ExternalLink,
  Upload,
  Plus,
  Loader2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useI18n } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"

interface Document {
  id: string
  name: string
  file_url: string
  file_type: string
  file_size: number | null
  document_type: string
  candidate_id: string | null
  candidate_name: string
  application_id: string | null
  job_id: string | null
  job_title: string
  created_at: string
}

interface Job {
  id: string
  title: string
}

interface Application {
  id: string
  job_id: string
  candidate_id: string
  candidates: {
    id: string
    first_name: string
    last_name: string
  }
}

interface DocumentsClientProps {
  documents: Document[]
  jobs: Job[]
  organizationId: string
}

const documentTypes = [
  { value: "english_test", label: "English Test" },
  { value: "assessment", label: "Assessment Report" },
  { value: "certificate", label: "Certificate" },
  { value: "id_document", label: "ID Document" },
  { value: "reference", label: "Reference Letter" },
  { value: "background_check", label: "Background Check" },
  { value: "medical", label: "Medical Report" },
  { value: "contract", label: "Contract" },
  { value: "other", label: "Other" },
]

const documentTypeColors: Record<string, string> = {
  resume: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  pdf: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  doc: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  docx: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  attachment: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  image: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return "-"
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

function getFileIcon(fileType: string) {
  if (fileType.includes("image") || ["png", "jpg", "jpeg", "gif"].includes(fileType)) {
    return <Image className="h-5 w-5 text-green-600" />
  }
  if (fileType.includes("pdf") || fileType === "resume") {
    return <FileText className="h-5 w-5 text-red-600" />
  }
  return <File className="h-5 w-5 text-gray-600" />
}

export function DocumentsClient({
  documents: initialDocuments,
  jobs,
  organizationId,
}: DocumentsClientProps) {
  const { t, language, isRTL } = useI18n()
  const [documents, setDocuments] = useState(initialDocuments)
  const [searchQuery, setSearchQuery] = useState("")
  const [jobFilter, setJobFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentName, setDocumentName] = useState("")
  const [selectedJobId, setSelectedJobId] = useState<string>("")
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>("")
  const [selectedDocType, setSelectedDocType] = useState<string>("")
  const [applications, setApplications] = useState<Application[]>([])
  const [loadingApplications, setLoadingApplications] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load applications when job is selected
  useEffect(() => {
    if (selectedJobId) {
      setLoadingApplications(true)
      setSelectedApplicationId("")
      const loadApps = async () => {
        try {
          const supabase = createClient()
          const { data } = await supabase
            .from("applications")
            .select("id, job_id, candidate_id, candidates(id, first_name, last_name)")
            .eq("job_id", selectedJobId)
          // Transform the data to match our interface (Supabase returns candidates as object, not array)
          const apps = (data || []).map((item) => ({
            id: item.id,
            job_id: item.job_id,
            candidate_id: item.candidate_id,
            candidates: item.candidates as unknown as Application["candidates"],
          }))
          setApplications(apps)
        } finally {
          setLoadingApplications(false)
        }
      }
      loadApps()
    } else {
      setApplications([])
    }
  }, [selectedJobId])

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile || !documentName || !selectedJobId || !selectedApplicationId || !selectedDocType) {
      toast.error("Please fill in all required fields")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("name", documentName)
      formData.append("applicationId", selectedApplicationId)
      formData.append("documentType", selectedDocType)
      formData.append("organizationId", organizationId)

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const result = await response.json()

      // Add the new document to the list
      const application = applications.find(a => a.id === selectedApplicationId)
      const job = jobs.find(j => j.id === selectedJobId)

      if (application && job) {
        const newDoc: Document = {
          id: result.id,
          name: documentName,
          file_url: result.file_url,
          file_type: selectedFile.type.split("/")[1] || "file",
          file_size: selectedFile.size,
          document_type: selectedDocType,
          candidate_id: application.candidate_id,
          candidate_name: `${application.candidates.first_name} ${application.candidates.last_name}`,
          application_id: selectedApplicationId,
          job_id: selectedJobId,
          job_title: job.title,
          created_at: new Date().toISOString(),
        }
        setDocuments([newDoc, ...documents])
      }

      toast.success("Document uploaded successfully")
      resetUploadForm()
      setUploadDialogOpen(false)
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload document")
    } finally {
      setUploading(false)
    }
  }

  const resetUploadForm = () => {
    setSelectedFile(null)
    setDocumentName("")
    setSelectedJobId("")
    setSelectedApplicationId("")
    setSelectedDocType("")
    setApplications([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Get unique document types from existing documents
  const existingDocTypes = Array.from(new Set(documents.map(d => d.document_type)))

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.job_title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesJob = jobFilter === "all" || doc.job_id === jobFilter
    const matchesType = typeFilter === "all" || doc.document_type === typeFilter
    return matchesSearch && matchesJob && matchesType
  })

  // Group documents by job
  const documentsByJob = filteredDocuments.reduce((acc, doc) => {
    const jobKey = doc.job_id || "unassigned"
    if (!acc[jobKey]) {
      acc[jobKey] = {
        job_title: doc.job_title,
        documents: [],
      }
    }
    acc[jobKey].documents.push(doc)
    return acc
  }, {} as Record<string, { job_title: string; documents: Document[] }>)

  // Open document in new tab via signed Bunny CDN URL
  const handleOpenDocument = async (doc: Document) => {
    if (!doc.file_url) {
      toast.error(t("documents.fileNotAvailable"))
      return
    }

    try {
      const response = await fetch("/api/documents/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storagePath: doc.file_url }),
      })

      if (!response.ok) {
        toast.error(t("documents.fileNotAvailable"))
        return
      }

      const { signedUrl } = await response.json()
      window.open(signedUrl, "_blank", "noopener,noreferrer")
    } catch {
      toast.error(t("documents.fileNotAvailable"))
    }
  }

  const stats = {
    total: documents.length,
    resumes: documents.filter(d => d.document_type === "resume").length,
    attachments: documents.filter(d => d.document_type !== "resume").length,
    jobs: Object.keys(documentsByJob).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("nav.documents")}</h1>
          <p className="text-muted-foreground">
            {t("documents.description")}
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("documents.totalDocuments")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("documents.resumes")}</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resumes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("documents.otherAttachments")}</CardTitle>
            <File className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attachments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("documents.jobPositions")}</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.jobs}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("documents.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={jobFilter} onValueChange={setJobFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder={t("documents.filterByJob")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("documents.allJobs")}</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("documents.filterByType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("documents.allTypes")}</SelectItem>
                  {existingDocTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents grouped by job */}
      {Object.keys(documentsByJob).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">{t("documents.noDocumentsFound")}</h3>
            <p className="text-muted-foreground text-center mt-2">
              {t("documents.noDocumentsDescription")}
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(documentsByJob).map(([jobId, { job_title, documents: jobDocs }]) => (
          <Card key={jobId}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                {job_title}
                <Badge variant="secondary" className="ml-2">
                  {jobDocs.length} {jobDocs.length !== 1 ? t("documents.documentPlural") : t("documents.documentSingular")}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("documents.table.document")}</TableHead>
                    <TableHead>{t("documents.table.candidate")}</TableHead>
                    <TableHead>{t("documents.table.type")}</TableHead>
                    <TableHead>{t("documents.table.size")}</TableHead>
                    <TableHead>{t("documents.table.uploaded")}</TableHead>
                    <TableHead className="text-right">{t("common.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobDocs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc.file_type)}
                          <span className="font-medium">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {doc.candidate_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={documentTypeColors[doc.document_type] || documentTypeColors.other}
                        >
                          {doc.document_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {formatFileSize(doc.file_size)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDocument(doc)}
                          title={t("documents.openInNewTab")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      {/* Upload Document Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
        setUploadDialogOpen(open)
        if (!open) resetUploadForm()
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </DialogTitle>
            <DialogDescription>
              Upload a document and link it to a candidate and job position.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setSelectedFile(file)
                      if (!documentName) {
                        setDocumentName(file.name.replace(/\.[^/.]+$/, ""))
                      }
                    }
                  }}
                  className="flex-1"
                />
              </div>
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Document Name */}
            <div className="space-y-2">
              <Label htmlFor="docName">Document Name *</Label>
              <Input
                id="docName"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="e.g., English Test Report"
              />
            </div>

            {/* Document Type */}
            <div className="space-y-2">
              <Label>Document Type *</Label>
              <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Job Selection */}
            <div className="space-y-2">
              <Label>Job Position *</Label>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job position" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Candidate Selection */}
            <div className="space-y-2">
              <Label>Candidate *</Label>
              <Select
                value={selectedApplicationId}
                onValueChange={setSelectedApplicationId}
                disabled={!selectedJobId || loadingApplications}
              >
                <SelectTrigger>
                  {loadingApplications ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading candidates...
                    </div>
                  ) : (
                    <SelectValue placeholder={selectedJobId ? "Select candidate" : "Select a job first"} />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {applications.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No candidates found for this job
                    </div>
                  ) : (
                    applications.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.candidates.first_name} {app.candidates.last_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !documentName || !selectedJobId || !selectedApplicationId || !selectedDocType}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
