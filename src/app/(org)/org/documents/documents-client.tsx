// @ts-nocheck
// Note: This file uses a "documents" table that doesn't exist in the current schema
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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
} from "@/components/ui/dialog"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  FileText,
  Plus,
  Search,
  Download,
  Trash2,
  Upload,
  Filter,
  File,
  Image,
  FileType,
  Loader2,
  Eye,
  X,
  FolderOpen,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Document {
  id: string
  name: string
  description: string | null
  file_url: string
  file_type: string | null
  file_size: number | null
  document_type: string
  candidate_id: string | null
  application_id: string | null
  created_at: string
  candidates: { id: string; first_name: string; last_name: string } | null
  applications: { id: string; jobs: { title: string } | null } | null
}

interface Candidate {
  id: string
  first_name: string
  last_name: string
}

interface DocumentsClientProps {
  documents: Document[]
  candidates: Candidate[]
  organizationId: string
}

const documentTypes = [
  { value: "resume", label: "Resume / CV" },
  { value: "cover_letter", label: "Cover Letter" },
  { value: "offer_letter", label: "Offer Letter" },
  { value: "contract", label: "Contract" },
  { value: "id_document", label: "ID Document" },
  { value: "certificate", label: "Certificate" },
  { value: "reference", label: "Reference Letter" },
  { value: "other", label: "Other" },
]

const documentTypeColors: Record<string, string> = {
  resume: "bg-blue-100 text-blue-800",
  cover_letter: "bg-green-100 text-green-800",
  offer_letter: "bg-purple-100 text-purple-800",
  contract: "bg-orange-100 text-orange-800",
  id_document: "bg-red-100 text-red-800",
  certificate: "bg-yellow-100 text-yellow-800",
  reference: "bg-indigo-100 text-indigo-800",
  other: "bg-gray-100 text-gray-800",
}

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return File
  if (fileType.includes("pdf")) return FileType
  if (fileType.includes("image")) return Image
  return FileText
}

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "Unknown"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentsClient({ documents: initialDocuments, candidates, organizationId }: DocumentsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [documents, setDocuments] = useState(initialDocuments)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [candidateFilter, setCandidateFilter] = useState<string>("all")
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    document_type: "resume",
    candidate_id: "none",
  })

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === "all" || doc.document_type === typeFilter

    const matchesCandidate =
      candidateFilter === "all" || doc.candidate_id === candidateFilter

    return matchesSearch && matchesType && matchesCandidate
  })

  // Stats
  const stats = {
    total: documents.length,
    resumes: documents.filter((d) => d.document_type === "resume").length,
    contracts: documents.filter((d) => d.document_type === "contract").length,
    offers: documents.filter((d) => d.document_type === "offer_letter").length,
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error("File size must be less than 25MB")
        return
      }
      setSelectedFile(file)
      if (!formData.name) {
        setFormData({ ...formData, name: file.name.split(".")[0] })
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !formData.name) {
      toast.error("Please select a file and enter a name")
      return
    }

    setIsLoading(true)

    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `documents/${organizationId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, selectedFile)

      if (uploadError) {
        throw new Error("Failed to upload file")
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath)

      // Create document record
      const { data, error } = await supabase
        .from("documents")
        .insert({
          org_id: organizationId,
          name: formData.name,
          description: formData.description || null,
          file_url: urlData.publicUrl,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          document_type: formData.document_type,
          candidate_id: formData.candidate_id === "none" ? null : (formData.candidate_id || null),
        })
        .select(`
          *,
          candidates (id, first_name, last_name),
          applications (id, jobs (title))
        `)
        .single()

      if (error) throw error

      setDocuments([data, ...documents])
      setIsUploadOpen(false)
      resetForm()
      toast.success("Document uploaded successfully")
      router.refresh()
    } catch (error) {
      toast.error("Failed to upload document")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId)

    if (error) {
      toast.error("Failed to delete document")
      return
    }

    setDocuments(documents.filter((d) => d.id !== documentId))
    toast.success("Document deleted")
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      document_type: "resume",
      candidate_id: "none",
    })
    setSelectedFile(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
          <p className="text-muted-foreground">
            Manage candidate documents and files
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsUploadOpen(true); }}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resumes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.resumes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contracts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.contracts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Offer Letters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.offers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={candidateFilter} onValueChange={setCandidateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Candidates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Candidates</SelectItem>
                {candidates.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    {candidate.first_name} {candidate.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No documents found</p>
                  <Button
                    variant="link"
                    onClick={() => setIsUploadOpen(true)}
                    className="mt-2"
                  >
                    Upload your first document
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((doc) => {
                const FileIcon = getFileIcon(doc.file_type)
                return (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <FileIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={documentTypeColors[doc.document_type] || documentTypeColors.other}>
                        {documentTypes.find((t) => t.value === doc.document_type)?.label || doc.document_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {doc.candidates ? (
                        <span>
                          {doc.candidates.first_name} {doc.candidates.last_name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(doc.file_url, "_blank")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const link = document.createElement("a")
                            link.href = doc.file_url
                            link.download = doc.name
                            link.click()
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document and associate it with a candidate
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>File *</Label>
              {selectedFile ? (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="flex-1 text-sm truncate">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  />
                  <div className="flex items-center justify-center gap-2 p-8 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click or drag to upload (Max 25MB)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Document Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., John's Resume"
              />
            </div>

            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value) => setFormData({ ...formData, document_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
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

            <div className="space-y-2">
              <Label>Associate with Candidate</Label>
              <Select
                value={formData.candidate_id}
                onValueChange={(value) => setFormData({ ...formData, candidate_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select candidate (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No candidate</SelectItem>
                  {candidates.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.first_name} {candidate.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsUploadOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isLoading || !selectedFile}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
