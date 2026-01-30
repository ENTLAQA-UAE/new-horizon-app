"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  MapPin,
  Briefcase,
  Clock,
  Building2,
  Globe,
  ArrowLeft,
  ArrowRight,
  Calendar,
  GraduationCap,
  CheckCircle,
  Upload,
  FileText,
  X,
  Loader2,
  Send,
  AlertCircle,
  Plus,
  Trash2,
  User,
  Award,
  Languages,
  Check,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Job {
  id: string
  title: string
  title_ar: string | null
  description: string | null
  description_ar: string | null
  requirements: string | null
  requirements_ar: string | null
  benefits: string | null
  benefits_ar: string | null
  location: string | null
  department: string | null
  employment_type: string | null
  experience_level: string | null
  education_level: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  remote_allowed: boolean | null
  published_at: string | null
  closing_date: string | null
  skills_required: string[] | null
}

interface Organization {
  id: string
  name: string
  slug: string
}

interface Branding {
  primary_color: string | null
  logo_url: string | null
}

interface ScreeningQuestion {
  id: string
  question: string
  question_ar: string | null
  description: string | null
  description_ar: string | null
  question_type: string
  options: string[] | null
  is_required: boolean
  is_knockout: boolean
  knockout_value: string | null
  min_value: number | null
  max_value: number | null
  min_length: number | null
  max_length: number | null
}

interface FieldOption {
  value: string
  label: string
  label_ar?: string
}

interface ApplicationFormField {
  id: string
  section_id: string
  name: string
  name_ar: string | null
  field_type: string
  placeholder: string | null
  options: FieldOption[] | null
  is_required: boolean
  is_enabled: boolean
  sort_order: number
}

interface ApplicationFormSection {
  id: string
  name: string
  name_ar: string | null
  description: string | null
  icon: string
  is_default: boolean
  is_enabled: boolean
  is_repeatable: boolean
  min_entries: number
  max_entries: number
  sort_order: number
  fields: ApplicationFormField[]
}

interface ThankYouConfig {
  title?: string
  titleAr?: string
  message?: string
  messageAr?: string
  showLogo: boolean
  ctaText?: string
  ctaTextAr?: string
}

interface JobDetailClientProps {
  organization: Organization
  job: Job
  branding: Branding | null
  screeningQuestions?: ScreeningQuestion[]
  applicationFormSections?: ApplicationFormSection[]
  thankYouConfig?: ThankYouConfig | null
}

const employmentTypeLabels: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  temporary: "Temporary",
}

const experienceLevelLabels: Record<string, string> = {
  entry: "Entry Level",
  junior: "Junior (1-2 years)",
  mid: "Mid Level (3-5 years)",
  senior: "Senior (5-8 years)",
  lead: "Lead (8+ years)",
  manager: "Manager",
  director: "Director",
  executive: "Executive",
}

const educationLabels: Record<string, string> = {
  high_school: "High School",
  diploma: "Diploma",
  bachelors: "Bachelor's Degree",
  masters: "Master's Degree",
  phd: "PhD / Doctorate",
}

const sectionIcons: Record<string, any> = {
  user: User,
  globe: Globe,
  "graduation-cap": GraduationCap,
  briefcase: Briefcase,
  "file-text": FileText,
  languages: Languages,
  award: Award,
}

// Helper function to format job description content
// Handles both HTML content and plain text/markdown
function formatJobDescription(content: string | null): string {
  if (!content) return ""

  // Check if content already has HTML tags
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content)
  if (hasHtmlTags) {
    return content // Already HTML, return as-is
  }

  // Convert markdown/plain text to HTML
  const lines = content.split('\n')
  const result: string[] = []
  let inList = false

  // Common section headers (English and Arabic)
  const headerPatterns = [
    /^(Requirements|المتطلبات):?$/i,
    /^(Responsibilities|المسؤوليات):?$/i,
    /^(Benefits|المزايا|المميزات):?$/i,
    /^(Skills|المهارات):?$/i,
    /^(Qualifications|المؤهلات):?$/i,
    /^(About the Role|عن الوظيفة):?$/i,
    /^(What You'll Do|ما ستفعله):?$/i,
    /^(What We Offer|ما نقدمه):?$/i,
  ]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) {
      if (inList) {
        result.push('</ul>')
        inList = false
      }
      continue
    }

    // Check for markdown bold headers like **Requirements:**
    const boldHeaderMatch = line.match(/^\*\*(.+?):\*\*$/)
    if (boldHeaderMatch) {
      if (inList) {
        result.push('</ul>')
        inList = false
      }
      result.push(`<h3>${boldHeaderMatch[1]}</h3>`)
      continue
    }

    // Check if this is a section header
    const isHeader = headerPatterns.some(pattern => pattern.test(line))
    if (isHeader) {
      if (inList) {
        result.push('</ul>')
        inList = false
      }
      const headerText = line.replace(/:$/, '')
      result.push(`<h3>${headerText}</h3>`)
      continue
    }

    // Check for bullet points (•, -, *, or lines starting after a header)
    const bulletMatch = line.match(/^[•\-\*]\s*(.+)$/)
    if (bulletMatch) {
      if (!inList) {
        result.push('<ul>')
        inList = true
      }
      result.push(`<li>${bulletMatch[1]}</li>`)
      continue
    }

    // Check for numbered items
    const numberedMatch = line.match(/^\d+[\.\)]\s*(.+)$/)
    if (numberedMatch) {
      if (!inList) {
        result.push('<ul>')
        inList = true
      }
      result.push(`<li>${numberedMatch[1]}</li>`)
      continue
    }

    // If we're right after a header, treat as list item
    if (result.length > 0 && result[result.length - 1].startsWith('<h3>')) {
      if (!inList) {
        result.push('<ul>')
        inList = true
      }
      result.push(`<li>${line}</li>`)
      continue
    }

    // If already in a list and this line isn't a header, treat as list item
    if (inList) {
      result.push(`<li>${line}</li>`)
      continue
    }

    // Regular paragraph
    result.push(`<p>${line}</p>`)
  }

  if (inList) {
    result.push('</ul>')
  }

  return result.join('\n')
}

export function JobDetailClient({
  organization,
  job,
  branding,
  screeningQuestions = [],
  applicationFormSections = [],
  thankYouConfig = null
}: JobDetailClientProps) {
  const router = useRouter()
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)

  // Multi-step wizard state
  const [currentStep, setCurrentStep] = useState(0)

  // Dynamic form data - keyed by section ID
  // For non-repeatable sections: { [sectionId]: { [fieldName]: value } }
  // For repeatable sections: { [sectionId]: [{ [fieldName]: value }, ...] }
  const [formData, setFormData] = useState<Record<string, any>>({})

  // Screening question answers
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, any>>({})

  // Cover letter (separate from dynamic fields)
  const [coverLetter, setCoverLetter] = useState("")

  const primaryColor = branding?.primary_color || "#3b82f6"

  // Build wizard steps: each section + resume/cover letter + screening questions (if any) + review
  const wizardSteps = [
    ...applicationFormSections.map((section) => ({
      id: `section-${section.id}`,
      label: section.name,
      type: "section" as const,
      sectionId: section.id,
    })),
    {
      id: "resume-cover",
      label: "Resume & Cover Letter",
      type: "resume" as const,
      sectionId: null,
    },
    ...(screeningQuestions.length > 0
      ? [{
          id: "screening",
          label: "Additional Questions",
          type: "screening" as const,
          sectionId: null,
        }]
      : []),
    {
      id: "review",
      label: "Review & Submit",
      type: "review" as const,
      sectionId: null,
    },
  ]

  const totalSteps = wizardSteps.length
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1
  const currentWizardStep = wizardSteps[currentStep]

  // Validate the current step before going next
  const validateCurrentStep = (): boolean => {
    const step = wizardSteps[currentStep]

    if (step.type === "section" && step.sectionId) {
      const section = applicationFormSections.find((s) => s.id === step.sectionId)
      if (!section) return true

      if (section.is_repeatable) {
        const entries = formData[section.id] || []
        for (let i = 0; i < entries.length; i++) {
          for (const field of section.fields) {
            if (field.is_required) {
              const value = entries[i]?.[field.name]
              if (!value || value === "") {
                toast.error(`Please fill in ${field.name} in entry ${i + 1}`)
                return false
              }
            }
          }
        }
      } else {
        for (const field of section.fields) {
          if (field.is_required) {
            const value = formData[section.id]?.[field.name]
            if (!value || value === "") {
              toast.error(`Please fill in ${field.name}`)
              return false
            }
          }
        }
      }
    }

    if (step.type === "resume") {
      if (!resumeFile) {
        toast.error("Please upload your resume")
        return false
      }
    }

    if (step.type === "screening") {
      for (const question of screeningQuestions) {
        if (question.is_required) {
          const answer = screeningAnswers[question.id]
          if (answer === undefined || answer === null || answer === "" ||
              (Array.isArray(answer) && answer.length === 0)) {
            toast.error(`Please answer: ${question.question}`)
            return false
          }
        }
      }
    }

    return true
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1))
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleStepClick = (stepIndex: number) => {
    // Only allow clicking on previous steps or current step
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex)
    }
  }

  // Initialize form data based on sections
  useEffect(() => {
    const initialData: Record<string, any> = {}

    applicationFormSections.forEach(section => {
      if (section.is_repeatable) {
        // Initialize with minimum required entries (or 1 if min is 0)
        const initialEntries = Math.max(section.min_entries, 1)
        initialData[section.id] = Array(initialEntries).fill(null).map(() => {
          const entry: Record<string, any> = {}
          section.fields.forEach(field => {
            entry[field.name] = field.field_type === "checkbox" ? false : ""
          })
          return entry
        })
      } else {
        // Non-repeatable section - single entry
        initialData[section.id] = {}
        section.fields.forEach(field => {
          initialData[section.id][field.name] = field.field_type === "checkbox" ? false : ""
        })
      }
    })

    setFormData(initialData)
  }, [applicationFormSections])

  // Update form field value
  const updateFieldValue = (sectionId: string, fieldName: string, value: any, entryIndex?: number) => {
    setFormData(prev => {
      const section = applicationFormSections.find(s => s.id === sectionId)
      if (!section) return prev

      if (section.is_repeatable && entryIndex !== undefined) {
        const entries = [...(prev[sectionId] || [])]
        if (!entries[entryIndex]) {
          entries[entryIndex] = {}
        }
        entries[entryIndex] = { ...entries[entryIndex], [fieldName]: value }
        return { ...prev, [sectionId]: entries }
      } else {
        return {
          ...prev,
          [sectionId]: { ...(prev[sectionId] || {}), [fieldName]: value }
        }
      }
    })
  }

  // Add entry to repeatable section
  const addEntry = (sectionId: string) => {
    const section = applicationFormSections.find(s => s.id === sectionId)
    if (!section) return

    const currentEntries = formData[sectionId] || []
    if (currentEntries.length >= section.max_entries) {
      toast.error(`Maximum ${section.max_entries} entries allowed`)
      return
    }

    const newEntry: Record<string, any> = {}
    section.fields.forEach(field => {
      newEntry[field.name] = field.field_type === "checkbox" ? false : ""
    })

    setFormData(prev => ({
      ...prev,
      [sectionId]: [...(prev[sectionId] || []), newEntry]
    }))
  }

  // Remove entry from repeatable section
  const removeEntry = (sectionId: string, entryIndex: number) => {
    const section = applicationFormSections.find(s => s.id === sectionId)
    if (!section) return

    const currentEntries = formData[sectionId] || []
    if (currentEntries.length <= section.min_entries) {
      toast.error(`Minimum ${section.min_entries} entries required`)
      return
    }

    setFormData(prev => ({
      ...prev,
      [sectionId]: prev[sectionId].filter((_: any, i: number) => i !== entryIndex)
    }))
  }

  // Update screening answer
  const handleScreeningAnswer = (questionId: string, value: any) => {
    setScreeningAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  // Handle multiselect toggle
  const handleMultiselectToggle = (questionId: string, option: string) => {
    setScreeningAnswers(prev => {
      const current = prev[questionId] || []
      const newValue = current.includes(option)
        ? current.filter((o: string) => o !== option)
        : [...current, option]
      return { ...prev, [questionId]: newValue }
    })
  }

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null
    const currency = job.salary_currency || "SAR"
    if (job.salary_min && job.salary_max) {
      return `${currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
    }
    if (job.salary_min) {
      return `From ${currency} ${job.salary_min.toLocaleString()}`
    }
    return `Up to ${currency} ${job.salary_max?.toLocaleString()}`
  }

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a PDF or Word document")
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB")
        return
      }
      setResumeFile(file)
    }
  }

  // Get value from form data for basic info fields
  const getBasicInfoValue = (fieldName: string): string => {
    const basicInfoSection = applicationFormSections.find(s => s.name === "Basic Information")
    if (basicInfoSection && formData[basicInfoSection.id]) {
      return formData[basicInfoSection.id][fieldName] || ""
    }
    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields in Basic Information
    const basicInfoSection = applicationFormSections.find(s => s.name === "Basic Information")
    if (basicInfoSection) {
      for (const field of basicInfoSection.fields) {
        if (field.is_required) {
          const value = formData[basicInfoSection.id]?.[field.name]
          if (!value || value === "") {
            toast.error(`Please fill in ${field.name}`)
            return
          }
        }
      }
    }

    if (!resumeFile) {
      toast.error("Please upload your resume")
      return
    }

    // Validate required fields in other sections
    for (const section of applicationFormSections) {
      if (section.is_repeatable) {
        const entries = formData[section.id] || []
        for (let i = 0; i < entries.length; i++) {
          for (const field of section.fields) {
            if (field.is_required) {
              const value = entries[i]?.[field.name]
              if (!value || value === "") {
                toast.error(`Please fill in ${field.name} in ${section.name} entry ${i + 1}`)
                return
              }
            }
          }
        }
      } else {
        for (const field of section.fields) {
          if (field.is_required) {
            const value = formData[section.id]?.[field.name]
            if (!value || value === "") {
              toast.error(`Please fill in ${field.name}`)
              return
            }
          }
        }
      }
    }

    // Validate required screening questions
    for (const question of screeningQuestions) {
      if (question.is_required) {
        const answer = screeningAnswers[question.id]
        if (answer === undefined || answer === null || answer === '' ||
            (Array.isArray(answer) && answer.length === 0)) {
          toast.error(`Please answer: ${question.question}`)
          return
        }
      }
    }

    setIsSubmitting(true)

    try {
      // Create form data for file upload
      const submitData = new FormData()
      submitData.append("jobId", job.id)
      submitData.append("organizationId", organization.id)

      // Extract basic info for backwards compatibility
      submitData.append("firstName", getBasicInfoValue("First Name"))
      submitData.append("lastName", getBasicInfoValue("Last Name"))
      submitData.append("email", getBasicInfoValue("Email"))
      submitData.append("phone", getBasicInfoValue("Phone Number"))
      submitData.append("linkedIn", getBasicInfoValue("LinkedIn"))
      submitData.append("coverLetter", coverLetter)
      submitData.append("resume", resumeFile)

      // Add all form data as JSON
      submitData.append("applicationFormData", JSON.stringify(formData))

      // Add screening question answers
      if (screeningQuestions.length > 0) {
        submitData.append("screeningAnswers", JSON.stringify(screeningAnswers))
      }

      const response = await fetch("/api/careers/apply", {
        method: "POST",
        body: submitData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit application")
      }

      setIsSuccess(true)
      toast.success("Application submitted successfully!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit application")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render a single form field
  const renderField = (field: ApplicationFormField, sectionId: string, entryIndex?: number) => {
    const section = applicationFormSections.find(s => s.id === sectionId)
    const value = section?.is_repeatable && entryIndex !== undefined
      ? formData[sectionId]?.[entryIndex]?.[field.name]
      : formData[sectionId]?.[field.name]

    const onChange = (newValue: any) => {
      updateFieldValue(sectionId, field.name, newValue, entryIndex)
    }

    const fieldKey = `${sectionId}-${entryIndex ?? 0}-${field.id}`

    switch (field.field_type) {
      case "text":
      case "email":
      case "phone":
      case "url":
        return (
          <Input
            key={fieldKey}
            type={field.field_type === "email" ? "email" : field.field_type === "url" ? "url" : "text"}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}`}
          />
        )

      case "number":
        return (
          <Input
            key={fieldKey}
            type="number"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || "Enter a number"}
          />
        )

      case "date":
        return (
          <Input
            key={fieldKey}
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full"
          />
        )

      case "textarea":
        return (
          <Textarea
            key={fieldKey}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}`}
            rows={3}
          />
        )

      case "select":
        return (
          <Select key={fieldKey} value={value || ""} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || `Select ${field.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "multiselect":
        return (
          <div key={fieldKey} className="space-y-2">
            {(field.options || []).map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${fieldKey}-${option.value}`}
                  checked={(value || []).includes(option.value)}
                  onCheckedChange={(checked) => {
                    const current = value || []
                    const newValue = checked
                      ? [...current, option.value]
                      : current.filter((v: string) => v !== option.value)
                    onChange(newValue)
                  }}
                />
                <Label htmlFor={`${fieldKey}-${option.value}`} className="font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        )

      case "radio":
        return (
          <RadioGroup key={fieldKey} value={value || ""} onValueChange={onChange}>
            {(field.options || []).map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${fieldKey}-${option.value}`} />
                <Label htmlFor={`${fieldKey}-${option.value}`} className="font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "checkbox":
        return (
          <div key={fieldKey} className="flex items-center space-x-2">
            <Checkbox
              id={fieldKey}
              checked={value || false}
              onCheckedChange={onChange}
            />
            <Label htmlFor={fieldKey} className="font-normal text-sm">
              {field.placeholder || field.name}
            </Label>
          </div>
        )

      case "file":
        return (
          <Input
            key={fieldKey}
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0]
              onChange(file?.name || "")
            }}
          />
        )

      default:
        return (
          <Input
            key={fieldKey}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ""}
          />
        )
    }
  }

  // Render a section (repeatable or not)
  const renderSection = (section: ApplicationFormSection) => {
    const IconComponent = sectionIcons[section.icon] || FileText
    const entries = section.is_repeatable ? (formData[section.id] || []) : null

    return (
      <div key={section.id} className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconComponent className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">{section.name}</h3>
            {section.is_repeatable && (
              <Badge variant="outline" className="text-xs">
                {entries?.length || 0} / {section.max_entries}
              </Badge>
            )}
          </div>
          {section.is_repeatable && (entries?.length || 0) < section.max_entries && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addEntry(section.id)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>

        {section.description && (
          <p className="text-xs text-muted-foreground">{section.description}</p>
        )}

        {section.is_repeatable ? (
          // Render repeatable entries
          <div className="space-y-4">
            {(entries || []).map((entry: any, entryIndex: number) => (
              <div
                key={entryIndex}
                className="p-4 rounded-lg border bg-muted/30 space-y-3 relative"
              >
                {(entries?.length || 0) > section.min_entries && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => removeEntry(section.id, entryIndex)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}

                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Entry {entryIndex + 1}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {section.fields.map((field) => {
                    // Full width for textarea fields
                    const isFullWidth = field.field_type === "textarea"

                    // Check if "Currently Working Here" checkbox is checked for this entry
                    const currentlyWorkingField = section.fields.find(
                      f => f.field_type === "checkbox" && f.name.toLowerCase().includes("currently")
                    )
                    const isCurrentlyWorking = currentlyWorkingField
                      ? formData[section.id]?.[entryIndex]?.[currentlyWorkingField.name]
                      : false

                    // Skip "To Date" fields in sections that have "From Date" (already rendered as part of From Date pair)
                    const sectionHasFromDate = section.fields.some(f => f.field_type === "date" && f.name.toLowerCase().includes("from"))
                    if (field.field_type === "date" && field.name.toLowerCase().includes("to") && sectionHasFromDate) {
                      return null
                    }

                    // For "From Date" fields in repeatable sections (Experience/Education): render as "From Date" + "To Date" pair
                    const isFromDateField = field.field_type === "date" && section.is_repeatable && field.name.toLowerCase().includes("from")
                    if (isFromDateField) {
                      const toDateField = section.fields.find(f => f.field_type === "date" && f.name.toLowerCase().includes("to"))
                      const toDateFieldName = toDateField?.name || "To Date"
                      const toDateValue = formData[section.id]?.[entryIndex]?.[toDateFieldName] || ""
                      return (
                        <div key={field.id} className="md:col-span-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-sm">
                                {field.name}
                                {field.is_required && <span className="text-red-500 ml-1">*</span>}
                              </Label>
                              {renderField(field, section.id, entryIndex)}
                            </div>
                            <div className="space-y-1">
                              <Label className="text-sm">{toDateFieldName}</Label>
                              {isCurrentlyWorking ? (
                                <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-muted-foreground text-sm">
                                  Present
                                </div>
                              ) : (
                                <Input
                                  type="date"
                                  value={toDateValue}
                                  onChange={(e) => updateFieldValue(section.id, toDateFieldName, e.target.value, entryIndex)}
                                  className="w-full"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={field.id}
                        className={cn("space-y-1", isFullWidth && "md:col-span-2")}
                      >
                        <Label className="text-sm">
                          {field.name}
                          {field.is_required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {renderField(field, section.id, entryIndex)}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Render non-repeatable section
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {section.fields.map((field) => {
              const isFullWidth = field.field_type === "textarea"
              return (
                <div
                  key={field.id}
                  className={cn("space-y-1", isFullWidth && "md:col-span-2")}
                >
                  <Label className="text-sm">
                    {field.name}
                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {renderField(field, section.id)}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (isSuccess) {
    const tyTitle = thankYouConfig?.title || "Application Submitted!"
    const tyMessage = thankYouConfig?.message || `Thank you for applying to ${job.title} at ${organization.name}. We will review your application and get back to you soon.`
    const tyCtaText = thankYouConfig?.ctaText || "View More Jobs"
    const showTyLogo = thankYouConfig?.showLogo !== false

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            {/* Gradient accent bar */}
            <div
              className="h-2"
              style={{
                background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}88)`,
              }}
            />
            <div className="px-8 py-10 text-center">
              {/* Logo */}
              {showTyLogo && branding?.logo_url && (
                <div className="mb-6">
                  <img
                    src={branding.logo_url}
                    alt={organization.name}
                    className="h-14 mx-auto object-contain"
                  />
                </div>
              )}
              {/* Success icon */}
              <div
                className="mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-6"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                }}
              >
                <CheckCircle className="h-10 w-10" style={{ color: primaryColor }} />
              </div>
              <h2 className="text-2xl font-bold mb-3 tracking-tight">{tyTitle}</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {tyMessage}
              </p>
              <Link href={`/careers/${organization.slug}`}>
                <Button
                  size="lg"
                  className="shadow-lg hover:shadow-xl transition-all duration-300 text-white font-semibold px-8"
                  style={{ backgroundColor: primaryColor, borderRadius: "12px" }}
                >
                  {tyCtaText}
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground/50 mt-6">
            Powered by Jadarat ATS
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {branding?.logo_url ? (
              <img
                src={branding.logo_url}
                alt={organization.name}
                className="h-10 w-10 rounded-lg object-contain"
              />
            ) : (
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Building2 className="h-5 w-5" style={{ color: primaryColor }} />
              </div>
            )}
            <div>
              <p className="font-medium">{organization.name}</p>
              <Link
                href={`/careers/${organization.slug}`}
                className="text-sm text-muted-foreground hover:underline"
              >
                View all jobs
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <Link
            href={`/careers/${organization.slug}`}
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to all jobs
          </Link>

          {/* Job Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </span>
                  )}
                  {job.department && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {job.department}
                    </span>
                  )}
                  {job.remote_allowed && (
                    <Badge variant="outline">
                      <Globe className="mr-1 h-3 w-3" />
                      Remote Available
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                size="lg"
                onClick={() => setIsApplyDialogOpen(true)}
                style={{ backgroundColor: primaryColor }}
              >
                <Send className="mr-2 h-4 w-4" />
                Apply Now
              </Button>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-8">
              {/* Job Description */}
              {job.description && (
                <section>
                  <h2 className="text-xl font-semibold mb-4">About the Role</h2>
                  <div
                    className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-600 prose-strong:text-gray-900 prose-hr:border-gray-200"
                    dangerouslySetInnerHTML={{ __html: formatJobDescription(job.description) }}
                  />
                </section>
              )}

              {/* Requirements */}
              {job.requirements && (
                <section>
                  <h2 className="text-xl font-semibold mb-4">Requirements</h2>
                  <div
                    className="prose prose-sm max-w-none prose-ul:list-disc prose-li:text-gray-600"
                    dangerouslySetInnerHTML={{ __html: formatJobDescription(job.requirements) }}
                  />
                </section>
              )}

              {/* Benefits */}
              {job.benefits && (
                <section>
                  <h2 className="text-xl font-semibold mb-4">Benefits</h2>
                  <div
                    className="prose prose-sm max-w-none prose-ul:list-disc prose-li:text-gray-600"
                    dangerouslySetInnerHTML={{ __html: formatJobDescription(job.benefits) }}
                  />
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Job Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {job.employment_type && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Employment Type</p>
                        <p className="font-medium">
                          {employmentTypeLabels[job.employment_type] || job.employment_type}
                        </p>
                      </div>
                    </div>
                  )}

                  {job.experience_level && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Experience Level</p>
                        <p className="font-medium">
                          {experienceLevelLabels[job.experience_level] || job.experience_level}
                        </p>
                      </div>
                    </div>
                  )}

                  {job.education_level && (
                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Education</p>
                        <p className="font-medium">
                          {educationLabels[job.education_level] || job.education_level}
                        </p>
                      </div>
                    </div>
                  )}

                  {job.closing_date && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Application Deadline</p>
                        <p className="font-medium">
                          {new Date(job.closing_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Skills */}
              {job.skills_required && job.skills_required.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Required Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {job.skills_required.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Apply CTA */}
              <Card style={{ borderColor: primaryColor }}>
                <CardContent className="pt-6 text-center">
                  <h3 className="font-semibold mb-2">Interested in this role?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Submit your application today
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => setIsApplyDialogOpen(true)}
                    style={{ backgroundColor: primaryColor }}
                  >
                    Apply Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Application Wizard Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={(open) => {
        setIsApplyDialogOpen(open)
        if (!open) setCurrentStep(0)
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          {/* Wizard Header */}
          <div className="px-6 pt-6 pb-4 border-b">
            <DialogHeader>
              <DialogTitle>Apply for {job.title}</DialogTitle>
              <DialogDescription>
                Step {currentStep + 1} of {totalSteps} &mdash; {currentWizardStep?.label}
              </DialogDescription>
            </DialogHeader>

            {/* Step Progress Indicator */}
            <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1">
              {wizardSteps.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepClick(index)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                    index === currentStep
                      ? "text-white"
                      : index < currentStep
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-muted text-muted-foreground"
                  )}
                  style={index === currentStep ? { backgroundColor: primaryColor } : undefined}
                  disabled={index > currentStep}
                >
                  {index < currentStep ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px]" style={index === currentStep ? { borderColor: 'rgba(255,255,255,0.5)' } : undefined}>
                      {index + 1}
                    </span>
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto px-6">
            <form onSubmit={handleSubmit} className="py-6 min-h-[300px]">

              {/* Section Steps */}
              {currentWizardStep?.type === "section" && currentWizardStep.sectionId && (() => {
                const section = applicationFormSections.find(
                  (s) => s.id === currentWizardStep.sectionId
                )
                return section ? renderSection(section) : null
              })()}

              {/* Resume & Cover Letter Step */}
              {currentWizardStep?.type === "resume" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold text-lg">Resume & Cover Letter</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resume" className="text-sm font-medium">Resume *</Label>
                    {resumeFile ? (
                      <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="flex-1 text-sm truncate">{resumeFile.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setResumeFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          id="resume"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleResumeChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <div className="text-center">
                            <p className="text-sm font-medium">Click to upload your resume</p>
                            <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX - Max 10MB</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coverLetter" className="text-sm font-medium">Cover Letter (Optional)</Label>
                    <Textarea
                      id="coverLetter"
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Tell us why you're interested in this role..."
                      rows={6}
                    />
                  </div>
                </div>
              )}

              {/* Screening Questions Step */}
              {currentWizardStep?.type === "screening" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold text-lg">Additional Questions</h3>
                  </div>
                  {screeningQuestions.map((question) => (
                    <div key={question.id} className="space-y-2 p-4 rounded-lg border bg-muted/20">
                      <Label className="text-sm font-medium">
                        {question.question}
                        {question.is_required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {question.description && (
                        <p className="text-xs text-muted-foreground">{question.description}</p>
                      )}

                      {question.question_type === "text" && (
                        <Input
                          value={screeningAnswers[question.id] || ""}
                          onChange={(e) => handleScreeningAnswer(question.id, e.target.value)}
                          placeholder="Your answer..."
                          maxLength={question.max_length || undefined}
                        />
                      )}

                      {question.question_type === "textarea" && (
                        <Textarea
                          value={screeningAnswers[question.id] || ""}
                          onChange={(e) => handleScreeningAnswer(question.id, e.target.value)}
                          placeholder="Your answer..."
                          rows={3}
                          maxLength={question.max_length || undefined}
                        />
                      )}

                      {question.question_type === "number" && (
                        <Input
                          type="number"
                          value={screeningAnswers[question.id] || ""}
                          onChange={(e) => handleScreeningAnswer(question.id, e.target.value)}
                          placeholder="Enter a number..."
                          min={question.min_value || undefined}
                          max={question.max_value || undefined}
                        />
                      )}

                      {question.question_type === "boolean" && (
                        <RadioGroup
                          value={screeningAnswers[question.id]?.toString() || ""}
                          onValueChange={(value) => handleScreeningAnswer(question.id, value === "true")}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id={`${question.id}-yes`} />
                            <Label htmlFor={`${question.id}-yes`}>Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id={`${question.id}-no`} />
                            <Label htmlFor={`${question.id}-no`}>No</Label>
                          </div>
                        </RadioGroup>
                      )}

                      {question.question_type === "select" && question.options && (
                        <Select
                          value={screeningAnswers[question.id] || ""}
                          onValueChange={(value) => handleScreeningAnswer(question.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option..." />
                          </SelectTrigger>
                          <SelectContent>
                            {question.options.map((option, idx) => (
                              <SelectItem key={idx} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {question.question_type === "multiselect" && question.options && (
                        <div className="space-y-2">
                          {question.options.map((option, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${question.id}-${idx}`}
                                checked={(screeningAnswers[question.id] || []).includes(option)}
                                onCheckedChange={() => handleMultiselectToggle(question.id, option)}
                              />
                              <Label htmlFor={`${question.id}-${idx}`} className="font-normal">
                                {option}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Review & Submit Step */}
              {currentWizardStep?.type === "review" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold text-lg">Review Your Application</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Please review your information before submitting.
                  </p>

                  {/* Summary of each section */}
                  {applicationFormSections.map((section) => {
                    const IconComponent = sectionIcons[section.icon] || FileText
                    return (
                      <div key={section.id} className="p-4 rounded-lg border space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                            <h4 className="font-medium text-sm">{section.name}</h4>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              const idx = wizardSteps.findIndex(s => s.sectionId === section.id)
                              if (idx >= 0) setCurrentStep(idx)
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          {section.is_repeatable ? (
                            (formData[section.id] || []).map((entry: any, i: number) => (
                              <div key={i} className="col-span-2 text-muted-foreground">
                                Entry {i + 1}: {section.fields.map(f => entry?.[f.name]).filter(Boolean).join(", ") || "—"}
                              </div>
                            ))
                          ) : (
                            section.fields.map((field) => {
                              const val = formData[section.id]?.[field.name]
                              return val ? (
                                <div key={field.id}>
                                  <span className="text-muted-foreground">{field.name}:</span>{" "}
                                  <span className="font-medium">{String(val)}</span>
                                </div>
                              ) : null
                            })
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Resume summary */}
                  <div className="p-4 rounded-lg border space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium text-sm">Resume & Cover Letter</h4>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          const idx = wizardSteps.findIndex(s => s.type === "resume")
                          if (idx >= 0) setCurrentStep(idx)
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Resume:</span>{" "}
                      <span className="font-medium">{resumeFile?.name || "Not uploaded"}</span>
                    </div>
                    {coverLetter && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Cover Letter:</span>{" "}
                        <span className="font-medium">{coverLetter.substring(0, 100)}{coverLetter.length > 100 ? "..." : ""}</span>
                      </div>
                    )}
                  </div>

                  {/* Screening questions summary */}
                  {screeningQuestions.length > 0 && (
                    <div className="p-4 rounded-lg border space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          <h4 className="font-medium text-sm">Additional Questions</h4>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            const idx = wizardSteps.findIndex(s => s.type === "screening")
                            if (idx >= 0) setCurrentStep(idx)
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                      {screeningQuestions.map((q) => {
                        const answer = screeningAnswers[q.id]
                        return (
                          <div key={q.id} className="text-sm">
                            <span className="text-muted-foreground">{q.question}:</span>{" "}
                            <span className="font-medium">
                              {Array.isArray(answer) ? answer.join(", ") : answer !== undefined ? String(answer) : "—"}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Navigation Footer */}
          <div className="px-6 py-4 border-t flex items-center justify-between bg-muted/30">
            <div>
              {!isFirstStep && (
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsApplyDialogOpen(false)}>
                Cancel
              </Button>
              {isLastStep ? (
                <Button
                  type="button"
                  disabled={isSubmitting}
                  style={{ backgroundColor: primaryColor }}
                  className="text-white"
                  onClick={(e) => {
                    // Trigger form submit
                    const form = (e.target as HTMLElement).closest("div")?.parentElement?.querySelector("form")
                    if (form) {
                      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
                    } else {
                      // Fallback: call handleSubmit directly
                      handleSubmit(e as any)
                    }
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Application
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  style={{ backgroundColor: primaryColor }}
                  className="text-white"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t mt-12 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {organization.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
