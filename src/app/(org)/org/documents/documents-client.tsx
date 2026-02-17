"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  File,
  Image,
  FolderOpen,
  User,
  ExternalLink,
  Upload,
  Plus,
  Loader2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useI18n } from "@/lib/i18n"

interface Document {
  id: string
  name: string
  file_url: string
  file_size: number | null
  mime_type: string | null
  candidate_id: string | null
  candidate_name: string
  candidate_email: string
  created_at: string
}

interface Candidate {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface DocumentsClientProps {
  documents: Document[]
  candidates: Candidate[]
  organizationId: string
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return "-"
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return <File className="h-5 w-5 text-gray-600" />
  if (mimeType.startsWith("image/")) {
    return <Image className="h-5 w-5 text-green-600" />
  }
  if (mimeType.includes("pdf")) {
    return <FileText className="h-5 w-5 text-red-600" />
  }
  return <File className="h-5 w-5 text-gray-600" />
}

export function DocumentsClient({
  documents: initialDocuments,
  candidates,
  organizationId,
}: DocumentsClientProps) {
  const { t } = useI18n()
  const [documents, setDocuments] = useState(initialDocuments)
  const [searchQuery, setSearchQuery] = useState("")
  const [candidateFilter, setCandidateFilter] = useState<string>("all")

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentName, setDocumentName] = useState("")
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile || !documentName || !selectedCandidateId) {
      toast.error(t("documents.fillRequired"))
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("name", documentName)
      formData.append("candidateId", selectedCandidateId)
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
      const candidate = candidates.find(c => c.id === selectedCandidateId)

      if (candidate) {
        const newDoc: Document = {
          id: result.id,
          name: documentName,
          file_url: result.file_url,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          candidate_id: selectedCandidateId,
          candidate_name: `${candidate.first_name} ${candidate.last_name}`,
          candidate_email: candidate.email,
          created_at: new Date().toISOString(),
        }
        setDocuments([newDoc, ...documents])
      }

      toast.success(t("documents.uploadSuccess"))
      resetUploadForm()
      setUploadDialogOpen(false)
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(error instanceof Error ? error.message : t("documents.uploadFailed"))
    } finally {
      setUploading(false)
    }
  }

  const resetUploadForm = () => {
    setSelectedFile(null)
    setDocumentName("")
    setSelectedCandidateId("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.candidate_email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCandidate = candidateFilter === "all" || doc.candidate_id === candidateFilter
    return matchesSearch && matchesCandidate
  })

  // Open document in new tab
  const handleOpenDocument = (doc: Document) => {
    if (!doc.file_url) {
      toast.error(t("documents.fileNotAvailable"))
      return
    }
    window.open(doc.file_url, "_blank", "noopener,noreferrer")
  }

  // Get unique candidates that have documents (for filter dropdown)
  const candidatesWithDocs = candidates.filter(c =>
    documents.some(d => d.candidate_id === c.id)
  )

  const stats = {
    total: documents.length,
    candidates: new Set(documents.map(d => d.candidate_id).filter(Boolean)).size,
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
          {t("documents.uploadDocument")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
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
            <CardTitle className="text-sm font-medium">{t("documents.candidatesWithDocs")}</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.candidates}</div>
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
            <Select value={candidateFilter} onValueChange={setCandidateFilter}>
              <SelectTrigger className="w-[250px]">
                <User className="mr-2 h-4 w-4" />
                <SelectValue placeholder={t("documents.filterByCandidate")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("documents.allCandidates")}</SelectItem>
                {candidatesWithDocs.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    {candidate.first_name} {candidate.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table - Flat List */}
      {filteredDocuments.length === 0 ? (
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
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("documents.table.document")}</TableHead>
                  <TableHead>{t("documents.table.candidate")}</TableHead>
                  <TableHead>{t("documents.table.size")}</TableHead>
                  <TableHead>{t("documents.table.uploaded")}</TableHead>
                  <TableHead className="text-right">{t("common.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.mime_type)}
                        <span className="font-medium">{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">{doc.candidate_name}</div>
                          <div className="text-xs text-muted-foreground">{doc.candidate_email}</div>
                        </div>
                      </div>
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
              {t("documents.uploadDocument")}
            </DialogTitle>
            <DialogDescription>
              {t("documents.uploadDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">{t("documents.file")} *</Label>
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
                  {t("documents.selected")}: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Document Name */}
            <div className="space-y-2">
              <Label htmlFor="docName">{t("documents.fileName")} *</Label>
              <Input
                id="docName"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder={t("documents.fileNamePlaceholder")}
              />
            </div>

            {/* Candidate Selection */}
            <div className="space-y-2">
              <Label>{t("documents.table.candidate")} *</Label>
              <Select
                value={selectedCandidateId}
                onValueChange={setSelectedCandidateId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("documents.selectCandidate")} />
                </SelectTrigger>
                <SelectContent>
                  {candidates.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {t("documents.noCandidates")}
                    </div>
                  ) : (
                    candidates.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        {candidate.first_name} {candidate.last_name} ({candidate.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !documentName || !selectedCandidateId}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("documents.uploading")}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {t("documents.upload")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
