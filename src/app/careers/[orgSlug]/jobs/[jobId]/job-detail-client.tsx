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
import { ScrollArea } from "@/components/ui/scroll-area"
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

interface JobDetailClientProps {
  organization: Organization
  job: Job
  branding: Branding | null
  screeningQuestions?: ScreeningQuestion[]
  applicationFormSections?: ApplicationFormSection[]
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

export function JobDetailClient({
  organization,
  job,
  branding,
  screeningQuestions = [],
  applicationFormSections = []
}: JobDetailClientProps) {
  const router = useRouter()
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)

  // Dynamic form data - keyed by section ID
  // For non-repeatable sections: { [sectionId]: { [fieldName]: value } }
  // For repeatable sections: { [sectionId]: [{ [fieldName]: value }, ...] }
  const [formData, setFormData] = useState<Record<string, any>>({})

  // Screening question answers
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, any>>({})

  // Cover letter (separate from dynamic fields)
  const [coverLetter, setCoverLetter] = useState("")

  const primaryColor = branding?.primary_color || "#3b82f6"

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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div
              className="mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <CheckCircle className="h-8 w-8" style={{ color: primaryColor }} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for applying to {job.title} at {organization.name}. We will review your application and get back to you soon.
            </p>
            <Link href={`/careers/${organization.slug}`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                View More Jobs
              </Button>
            </Link>
          </CardContent>
        </Card>
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
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.description }}
                  />
                </section>
              )}

              {/* Requirements */}
              {job.requirements && (
                <section>
                  <h2 className="text-xl font-semibold mb-4">Requirements</h2>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.requirements }}
                  />
                </section>
              )}

              {/* Benefits */}
              {job.benefits && (
                <section>
                  <h2 className="text-xl font-semibold mb-4">Benefits</h2>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.benefits }}
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

      {/* Application Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Apply for {job.title}</DialogTitle>
            <DialogDescription>
              Fill out the form below to submit your application to {organization.name}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              {/* Dynamic Form Sections */}
              {applicationFormSections.map((section) => renderSection(section))}

              {/* Resume Upload */}
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="resume">Resume *</Label>
                {resumeFile ? (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
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
                    <div className="flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Upload Resume (PDF, DOC, DOCX)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Cover Letter */}
              <div className="space-y-2">
                <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
                <Textarea
                  id="coverLetter"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell us why you're interested in this role..."
                  rows={4}
                />
              </div>

              {/* Screening Questions */}
              {screeningQuestions.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Additional Questions</p>
                  </div>
                  {screeningQuestions.map((question) => (
                    <div key={question.id} className="space-y-2">
                      <Label>
                        {question.question}
                        {question.is_required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {question.description && (
                        <p className="text-xs text-muted-foreground">{question.description}</p>
                      )}

                      {/* Text input */}
                      {question.question_type === "text" && (
                        <Input
                          value={screeningAnswers[question.id] || ""}
                          onChange={(e) => handleScreeningAnswer(question.id, e.target.value)}
                          placeholder="Your answer..."
                          maxLength={question.max_length || undefined}
                        />
                      )}

                      {/* Textarea */}
                      {question.question_type === "textarea" && (
                        <Textarea
                          value={screeningAnswers[question.id] || ""}
                          onChange={(e) => handleScreeningAnswer(question.id, e.target.value)}
                          placeholder="Your answer..."
                          rows={3}
                          maxLength={question.max_length || undefined}
                        />
                      )}

                      {/* Number input */}
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

                      {/* Boolean (Yes/No) */}
                      {question.question_type === "boolean" && (
                        <div className="flex items-center gap-4">
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
                        </div>
                      )}

                      {/* Single Select */}
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

                      {/* Multi Select */}
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

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsApplyDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} style={{ backgroundColor: primaryColor }}>
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
              </DialogFooter>
            </form>
          </ScrollArea>
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
