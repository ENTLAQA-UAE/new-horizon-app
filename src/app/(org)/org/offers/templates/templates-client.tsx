// @ts-nocheck
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  supabaseInsert,
  supabaseUpdate,
  supabaseDelete,
} from "@/lib/supabase/auth-fetch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Plus, MoreHorizontal, Pencil, Trash2, Copy, FileSignature, Eye } from "lucide-react"

interface OfferTemplate {
  id: string
  org_id: string
  name: string
  name_ar?: string
  description?: string
  subject?: string
  subject_ar?: string
  body_html: string
  body_html_ar?: string
  is_default: boolean
  merge_fields?: Record<string, string>
  created_at: string
  updated_at: string
}

interface OfferTemplatesClientProps {
  templates: OfferTemplate[]
  orgId: string
}

const defaultVariables = [
  { key: "{{candidate_name}}", description: "Full name of the candidate" },
  { key: "{{position_title}}", description: "Job title" },
  { key: "{{department}}", description: "Department name" },
  { key: "{{salary_amount}}", description: "Base salary amount" },
  { key: "{{salary_currency}}", description: "Currency (SAR, AED, USD)" },
  { key: "{{start_date}}", description: "Proposed start date" },
  { key: "{{company_name}}", description: "Organization name" },
  { key: "{{reporting_to}}", description: "Manager name" },
  { key: "{{probation_period}}", description: "Probation period in months" },
  { key: "{{benefits}}", description: "Benefits list" },
]

const defaultContent = `Dear {{candidate_name}},

We are pleased to offer you the position of {{position_title}} at {{company_name}}.

Position Details:
- Title: {{position_title}}
- Department: {{department}}
- Reporting To: {{reporting_to}}
- Start Date: {{start_date}}

Compensation:
- Base Salary: {{salary_amount}} {{salary_currency}} per year
- Benefits: {{benefits}}

The probation period will be {{probation_period}} months.

Please confirm your acceptance by signing below.

Best regards,
{{company_name}} HR Team`

export function OfferTemplatesClient({ templates: initialTemplates, orgId }: OfferTemplatesClientProps) {
  const router = useRouter()
  const [templates, setTemplates] = useState(initialTemplates)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewContent, setPreviewContent] = useState("")
  const [editingTemplate, setEditingTemplate] = useState<OfferTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    description: "",
    subject: "Job Offer - {{position_title}}",
    subject_ar: "",
    body_html: defaultContent,
    body_html_ar: "",
    is_default: false,
  })

  const resetForm = () => {
    setFormData({
      name: "",
      name_ar: "",
      description: "",
      subject: "Job Offer - {{position_title}}",
      subject_ar: "",
      body_html: defaultContent,
      body_html_ar: "",
      is_default: false,
    })
    setEditingTemplate(null)
  }

  const handleOpenDialog = (template?: OfferTemplate) => {
    if (template) {
      setEditingTemplate(template)
      setFormData({
        name: template.name,
        name_ar: template.name_ar || "",
        description: template.description || "",
        subject: template.subject || "",
        subject_ar: template.subject_ar || "",
        body_html: template.body_html,
        body_html_ar: template.body_html_ar || "",
        is_default: template.is_default,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.body_html) {
      toast.error("Please fill in required fields")
      return
    }

    setIsLoading(true)

    try {
      if (editingTemplate) {
        // Update existing template
        const { error } = await supabaseUpdate(
          "offer_templates",
          {
            name: formData.name,
            name_ar: formData.name_ar || null,
            description: formData.description || null,
            subject: formData.subject || null,
            subject_ar: formData.subject_ar || null,
            body_html: formData.body_html,
            body_html_ar: formData.body_html_ar || null,
            is_default: formData.is_default,
            updated_at: new Date().toISOString(),
          },
          { column: "id", value: editingTemplate.id }
        )

        if (error) throw new Error(error.message)

        setTemplates(templates.map(t =>
          t.id === editingTemplate.id
            ? { ...t, ...formData, updated_at: new Date().toISOString() }
            : formData.is_default ? { ...t, is_default: false } : t
        ))
        toast.success("Template updated successfully")
      } else {
        // Create new template
        const { data, error } = await supabaseInsert<OfferTemplate>(
          "offer_templates",
          {
            org_id: orgId,
            name: formData.name,
            name_ar: formData.name_ar || null,
            description: formData.description || null,
            subject: formData.subject || null,
            subject_ar: formData.subject_ar || null,
            body_html: formData.body_html,
            body_html_ar: formData.body_html_ar || null,
            is_default: formData.is_default,
          }
        )

        if (error) throw new Error(error.message)
        if (!data) throw new Error("Failed to create template")

        if (formData.is_default) {
          setTemplates([data, ...templates.map(t => ({ ...t, is_default: false }))])
        } else {
          setTemplates([data, ...templates])
        }
        toast.success("Template created successfully")
      }

      setIsDialogOpen(false)
      resetForm()
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to save template")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return

    const { error } = await supabaseDelete("offer_templates", { column: "id", value: id })

    if (error) {
      toast.error(error.message || "Failed to delete template")
      return
    }

    setTemplates(templates.filter(t => t.id !== id))
    toast.success("Template deleted successfully")
  }

  const handleDuplicate = async (template: OfferTemplate) => {
    const { data, error } = await supabaseInsert<OfferTemplate>(
      "offer_templates",
      {
        org_id: template.org_id,
        name: `${template.name} (Copy)`,
        name_ar: template.name_ar ? `${template.name_ar} (نسخة)` : null,
        description: template.description,
        subject: template.subject,
        subject_ar: template.subject_ar,
        body_html: template.body_html,
        body_html_ar: template.body_html_ar,
        is_default: false,
      }
    )

    if (error) {
      toast.error(error.message || "Failed to duplicate template")
      return
    }

    if (data) {
      setTemplates([data, ...templates])
      toast.success("Template duplicated successfully")
    }
  }

  const handlePreview = (content: string) => {
    // Replace variables with sample data
    const sampleData: Record<string, string> = {
      "{{candidate_name}}": "Ahmed Al-Rashid",
      "{{position_title}}": "Senior Software Engineer",
      "{{department}}": "Engineering",
      "{{salary_amount}}": "25,000",
      "{{salary_currency}}": "SAR",
      "{{start_date}}": "February 1, 2024",
      "{{company_name}}": "Jadarat Technologies",
      "{{reporting_to}}": "Mohammed Hassan",
      "{{probation_period}}": "3",
      "{{benefits}}": "Health Insurance, Annual Bonus, Flexible Hours",
    }

    let preview = content
    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value)
    })

    setPreviewContent(preview)
    setIsPreviewOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Offer Templates</h1>
          <p className="text-muted-foreground">
            Create and manage offer letter templates for your organization
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Template" : "Create Offer Template"}
              </DialogTitle>
              <DialogDescription>
                Create a reusable offer letter template with merge variables
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Standard Offer Letter"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_ar">Template Name (Arabic)</Label>
                  <Input
                    id="name_ar"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder="e.g., خطاب العرض القياسي"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of when to use this template"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Job Offer - {{position_title}}"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject_ar">Email Subject (Arabic)</Label>
                  <Input
                    id="subject_ar"
                    value={formData.subject_ar}
                    onChange={(e) => setFormData({ ...formData, subject_ar: e.target.value })}
                    placeholder="e.g., عرض وظيفي - {{position_title}}"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="body_html">Content (English) *</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(formData.body_html)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                </div>
                <Textarea
                  id="body_html"
                  value={formData.body_html}
                  onChange={(e) => setFormData({ ...formData, body_html: e.target.value })}
                  placeholder="Enter offer letter content..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body_html_ar">Content (Arabic)</Label>
                <Textarea
                  id="body_html_ar"
                  value={formData.body_html_ar}
                  onChange={(e) => setFormData({ ...formData, body_html_ar: e.target.value })}
                  placeholder="أدخل محتوى خطاب العرض..."
                  rows={8}
                  dir="rtl"
                  className="font-mono text-sm"
                />
              </div>

              {/* Available Variables */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Available Variables</CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {defaultVariables.map((v) => (
                      <div key={v.key} className="flex items-center gap-2">
                        <code className="bg-muted px-1.5 py-0.5 rounded">{v.key}</code>
                        <span className="text-muted-foreground">{v.description}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
                <Label htmlFor="is_default">Set as default template</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "Saving..." : editingTemplate ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview with sample data
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-6 bg-white border rounded-lg shadow-sm">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {previewContent}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* Templates List */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileSignature className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No templates yet</h3>
            <p className="text-muted-foreground text-center mt-1">
              Create your first offer template to streamline offer letter generation
            </p>
            <Button className="mt-4" onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div className="font-medium">{template.name}</div>
                    {template.name_ar && (
                      <div className="text-sm text-muted-foreground" dir="rtl">
                        {template.name_ar}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {template.description || "—"}
                  </TableCell>
                  <TableCell>
                    {template.is_default ? (
                      <Badge>Default</Badge>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(template.updated_at || template.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePreview(template.body_html)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenDialog(template)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(template.id)}
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
        </Card>
      )}
    </div>
  )
}
