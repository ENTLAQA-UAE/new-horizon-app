"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  FileText,
  Search,
  Download,
  Filter,
  File,
  Image,
  FolderOpen,
  User,
  Briefcase,
  ExternalLink,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useI18n } from "@/lib/i18n"

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

interface DocumentsClientProps {
  documents: Document[]
  jobs: Job[]
  organizationId: string
}

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
  documents,
  jobs,
}: DocumentsClientProps) {
  const { t, language, isRTL } = useI18n()
  const [searchQuery, setSearchQuery] = useState("")
  const [jobFilter, setJobFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  // Get unique document types
  const documentTypes = Array.from(new Set(documents.map(d => d.document_type)))

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

  // Open document in new tab for viewing (like Google Drive)
  const handleOpenDocument = (doc: Document) => {
    if (!doc.file_url) {
      toast.error(t("documents.fileNotAvailable"))
      return
    }
    // Open the file directly in a new tab - user can view and download from there
    window.open(doc.file_url, "_blank", "noopener,noreferrer")
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
      <div>
        <h1 className="text-2xl font-bold">{t("nav.documents")}</h1>
        <p className="text-muted-foreground">
          {t("documents.description")}
        </p>
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
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
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
    </div>
  )
}
