"use client"

import { useState } from "react"
import { supabaseInsert, supabaseUpdate, supabaseDelete } from "@/lib/supabase/auth-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Mail,
  Plus,
  Search,
  Pencil,
  Eye,
  Copy,
  CheckCircle,
  XCircle,
  Code,
  Languages,
  Sparkles,
  Wand2,
  Loader2,
  RefreshCw,
  Globe,
} from "lucide-react"
import { toast } from "sonner"
import { Json } from "@/lib/supabase/types"

interface EmailTemplate {
  id: string
  name: string
  slug: string
  subject: string
  subject_ar: string | null
  body_html: string
  body_html_ar: string | null
  variables: Json | null
  category: string | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
}

interface EmailTemplatesClientProps {
  initialTemplates: EmailTemplate[]
}

const categoryLabels: Record<string, string> = {
  onboarding: "Onboarding",
  auth: "Authentication",
  applications: "Applications",
  interviews: "Interviews",
  offers: "Offers",
  general: "General",
}

const categoryColors: Record<string, string> = {
  onboarding: "bg-green-500",
  auth: "bg-blue-500",
  applications: "bg-purple-500",
  interviews: "bg-orange-500",
  offers: "bg-yellow-500",
  general: "bg-gray-500",
}

const templateTypes = [
  { value: "application_received", label: "Application Received" },
  { value: "interview_invitation", label: "Interview Invitation" },
  { value: "interview_reminder", label: "Interview Reminder" },
  { value: "offer_letter", label: "Offer Letter" },
  { value: "rejection", label: "Rejection Notice" },
  { value: "onboarding_welcome", label: "Onboarding Welcome" },
  { value: "status_update", label: "Status Update" },
  { value: "custom", label: "Custom Template" },
]

export function EmailTemplatesClient({ initialTemplates }: EmailTemplatesClientProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isAIGenerateOpen, setIsAIGenerateOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAILoading, setIsAILoading] = useState(false)
  const [previewLanguage, setPreviewLanguage] = useState<"en" | "ar">("en")

  // AI Generation state
  const [aiForm, setAiForm] = useState({
    templateType: "application_received",
    companyName: "",
    jobTitle: "",
    tone: "professional" as "formal" | "friendly" | "professional",
    includeArabic: true,
    customInstructions: "",
  })

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    subject: "",
    subject_ar: "",
    body_html: "",
    body_html_ar: "",
    category: "general",
    is_active: true,
  })

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      categoryFilter === "all" || template.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const openEditDialog = (template: EmailTemplate | null) => {
    if (template) {
      setFormData({
        name: template.name,
        slug: template.slug,
        subject: template.subject,
        subject_ar: template.subject_ar || "",
        body_html: template.body_html,
        body_html_ar: template.body_html_ar || "",
        category: template.category || "general",
        is_active: template.is_active ?? true,
      })
      setSelectedTemplate(template)
    } else {
      setFormData({
        name: "",
        slug: "",
        subject: "",
        subject_ar: "",
        body_html: "",
        body_html_ar: "",
        category: "general",
        is_active: true,
      })
      setSelectedTemplate(null)
    }
    setIsEditOpen(true)
  }

  const saveTemplate = async () => {
    if (!formData.name || !formData.slug || !formData.subject || !formData.body_html) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)

    const templateData = {
      name: formData.name,
      slug: formData.slug,
      subject: formData.subject,
      subject_ar: formData.subject_ar || null,
      body_html: formData.body_html,
      body_html_ar: formData.body_html_ar || null,
      category: formData.category,
      is_active: formData.is_active,
    }

    if (selectedTemplate) {
      // Update
      const { error } = await supabaseUpdate("email_templates", templateData, { column: "id", value: selectedTemplate.id })

      if (error) {
        toast.error("Failed to update template")
      } else {
        setTemplates(templates.map((t) =>
          t.id === selectedTemplate.id ? { ...t, ...templateData } : t
        ))
        toast.success("Template updated successfully")
        setIsEditOpen(false)
      }
    } else {
      // Create
      const { data, error } = await supabaseInsert("email_templates", templateData)

      if (error) {
        toast.error("Failed to create template")
      } else if (data) {
        setTemplates([...templates, data as EmailTemplate])
        toast.success("Template created successfully")
        setIsEditOpen(false)
      }
    }

    setIsLoading(false)
  }

  const toggleActive = async (template: EmailTemplate) => {
    const { error } = await supabaseUpdate("email_templates", { is_active: !template.is_active }, { column: "id", value: template.id })

    if (error) {
      toast.error("Failed to update template status")
    } else {
      setTemplates(templates.map((t) =>
        t.id === template.id ? { ...t, is_active: !t.is_active } : t
      ))
      toast.success(`Template ${!template.is_active ? "activated" : "deactivated"}`)
    }
  }

  const duplicateTemplate = async (template: EmailTemplate) => {
    const { data, error } = await supabaseInsert("email_templates", {
      name: `${template.name} (Copy)`,
      slug: `${template.slug}-copy-${Date.now()}`,
      subject: template.subject,
      subject_ar: template.subject_ar,
      body_html: template.body_html,
      body_html_ar: template.body_html_ar,
      variables: template.variables,
      category: template.category,
      is_active: false,
    })

    if (error) {
      toast.error("Failed to duplicate template")
    } else if (data) {
      setTemplates([...templates, data as EmailTemplate])
      toast.success("Template duplicated successfully")
    }
  }

  const openPreview = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setIsPreviewOpen(true)
  }

  // AI Generate Template
  const handleAIGenerate = async () => {
    setIsAILoading(true)
    try {
      const response = await fetch("/api/ai/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          templateType: aiForm.templateType,
          context: {
            companyName: aiForm.companyName || undefined,
            jobTitle: aiForm.jobTitle || undefined,
            tone: aiForm.tone,
            includeArabic: aiForm.includeArabic,
            customInstructions: aiForm.customInstructions || undefined,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate template")
      }

      // Populate the form with generated data
      setFormData({
        name: data.data.name,
        slug: data.data.slug,
        subject: data.data.subject,
        subject_ar: data.data.subject_ar || "",
        body_html: data.data.body_html,
        body_html_ar: data.data.body_html_ar || "",
        category: data.data.category,
        is_active: true,
      })

      setIsAIGenerateOpen(false)
      setIsEditOpen(true)
      toast.success("Template generated! Review and save it.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate template")
    } finally {
      setIsAILoading(false)
    }
  }

  // AI Translate to Arabic
  const handleAITranslate = async () => {
    if (!formData.subject || !formData.body_html) {
      toast.error("Please fill in the English template first")
      return
    }

    setIsAILoading(true)
    try {
      const response = await fetch("/api/ai/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "translate",
          subject: formData.subject,
          body_html: formData.body_html,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to translate")
      }

      setFormData({
        ...formData,
        subject_ar: data.data.subject_ar,
        body_html_ar: data.data.body_html_ar,
      })

      toast.success("Arabic translation generated!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to translate")
    } finally {
      setIsAILoading(false)
    }
  }

  // AI Improve Template
  const handleAIImprove = async (improvement: string) => {
    if (!formData.subject || !formData.body_html) {
      toast.error("Please fill in the template first")
      return
    }

    setIsAILoading(true)
    try {
      const response = await fetch("/api/ai/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "improve",
          subject: formData.subject,
          body_html: formData.body_html,
          improvement,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to improve template")
      }

      setFormData({
        ...formData,
        subject: data.data.subject,
        body_html: data.data.body_html,
      })

      toast.success("Template improved!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to improve template")
    } finally {
      setIsAILoading(false)
    }
  }

  // Get unique categories
  const categories = [...new Set(templates.map((t) => t.category).filter(Boolean))]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Templates</h2>
          <p className="text-muted-foreground">
            Manage system email templates for notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsAIGenerateOpen(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            AI Generate
          </Button>
          <Button onClick={() => openEditDialog(null)}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter((t) => t.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Arabic</CardTitle>
            <Languages className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter((t) => t.body_html_ar).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category!}>
                    {categoryLabels[category!] || category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-8 text-muted-foreground">
              No email templates found
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {template.slug}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Badge
                      variant="secondary"
                      className={`${categoryColors[template.category || "general"]} text-white text-xs`}
                    >
                      {categoryLabels[template.category || "general"]}
                    </Badge>
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Subject:</span>
                    <p className="text-sm text-muted-foreground truncate">
                      {template.subject}
                    </p>
                  </div>
                  {template.variables && Array.isArray(template.variables) && (
                    <div>
                      <span className="text-sm font-medium">Variables:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(template.variables as string[]).slice(0, 4).map((v) => (
                          <Badge key={v} variant="outline" className="text-xs">
                            {`{{${v}}}`}
                          </Badge>
                        ))}
                        {(template.variables as string[]).length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{(template.variables as string[]).length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="p-4 pt-0 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openPreview(template)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditDialog(template)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => duplicateTemplate(template)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? "Edit Template" : "New Template"}
            </DialogTitle>
            <DialogDescription>
              Configure the email template content and settings
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="english" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="english">English</TabsTrigger>
              <TabsTrigger value="arabic">Arabic (العربية)</TabsTrigger>
            </TabsList>

            <TabsContent value="english" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Welcome Email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder="e.g., welcome"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span>Active</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  placeholder="e.g., Welcome to {{app_name}}!"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body_html">Body HTML *</Label>
                <Textarea
                  id="body_html"
                  value={formData.body_html}
                  onChange={(e) =>
                    setFormData({ ...formData, body_html: e.target.value })
                  }
                  placeholder="<h1>Hello {{first_name}}!</h1>"
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="arabic" className="space-y-4">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAITranslate}
                  disabled={isAILoading || !formData.subject || !formData.body_html}
                >
                  {isAILoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Globe className="mr-2 h-4 w-4" />
                  )}
                  Auto-translate with AI
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject_ar">Subject (Arabic)</Label>
                <Input
                  id="subject_ar"
                  value={formData.subject_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, subject_ar: e.target.value })
                  }
                  placeholder="e.g., مرحباً بك في {{app_name}}!"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body_html_ar">Body HTML (Arabic)</Label>
                <Textarea
                  id="body_html_ar"
                  value={formData.body_html_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, body_html_ar: e.target.value })
                  }
                  placeholder="<h1>مرحباً {{first_name}}!</h1>"
                  rows={12}
                  className="font-mono text-sm"
                  dir="rtl"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveTemplate} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Preview how the email will look
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Select
                  value={previewLanguage}
                  onValueChange={(v) => setPreviewLanguage(v as "en" | "ar")}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg p-4 bg-white">
                <div className="border-b pb-4 mb-4">
                  <p className="text-sm text-muted-foreground">Subject:</p>
                  <p className="font-medium">
                    {previewLanguage === "ar" && selectedTemplate.subject_ar
                      ? selectedTemplate.subject_ar
                      : selectedTemplate.subject}
                  </p>
                </div>

                <div
                  className="prose prose-sm max-w-none"
                  dir={previewLanguage === "ar" ? "rtl" : "ltr"}
                  dangerouslySetInnerHTML={{
                    __html:
                      previewLanguage === "ar" && selectedTemplate.body_html_ar
                        ? selectedTemplate.body_html_ar
                        : selectedTemplate.body_html,
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Generate Dialog */}
      <Dialog open={isAIGenerateOpen} onOpenChange={setIsAIGenerateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              AI Template Generator
            </DialogTitle>
            <DialogDescription>
              Generate a professional email template using AI
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template Type</Label>
              <Select
                value={aiForm.templateType}
                onValueChange={(value) =>
                  setAiForm({ ...aiForm, templateType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templateTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name (optional)</Label>
                <Input
                  value={aiForm.companyName}
                  onChange={(e) =>
                    setAiForm({ ...aiForm, companyName: e.target.value })
                  }
                  placeholder="Your Company"
                />
              </div>
              <div className="space-y-2">
                <Label>Job Title (optional)</Label>
                <Input
                  value={aiForm.jobTitle}
                  onChange={(e) =>
                    setAiForm({ ...aiForm, jobTitle: e.target.value })
                  }
                  placeholder="Software Engineer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tone</Label>
              <Select
                value={aiForm.tone}
                onValueChange={(value) =>
                  setAiForm({
                    ...aiForm,
                    tone: value as "formal" | "friendly" | "professional",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Additional Instructions (optional)</Label>
              <Textarea
                value={aiForm.customInstructions}
                onChange={(e) =>
                  setAiForm({ ...aiForm, customInstructions: e.target.value })
                }
                placeholder="Any specific requirements or content to include..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeArabic"
                checked={aiForm.includeArabic}
                onChange={(e) =>
                  setAiForm({ ...aiForm, includeArabic: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="includeArabic" className="cursor-pointer">
                Include Arabic translation
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAIGenerateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAIGenerate} disabled={isAILoading}>
              {isAILoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
