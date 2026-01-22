"use client"

import { useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
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
} from "lucide-react"
import { toast } from "sonner"

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

interface JobDetailClientProps {
  organization: Organization
  job: Job
  branding: Branding | null
  screeningQuestions?: ScreeningQuestion[]
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

export function JobDetailClient({ organization, job, branding, screeningQuestions = [] }: JobDetailClientProps) {
  const router = useRouter()
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    linkedIn: "",
    coverLetter: "",
  })

  // Screening question answers - keyed by question ID
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, any>>({})

  // Update screening answer
  const handleScreeningAnswer = (questionId: string, value: any) => {
    setScreeningAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
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

  const primaryColor = branding?.primary_color || "#3b82f6"

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!resumeFile) {
      toast.error("Please upload your resume")
      return
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
      submitData.append("firstName", formData.firstName)
      submitData.append("lastName", formData.lastName)
      submitData.append("email", formData.email)
      submitData.append("phone", formData.phone)
      submitData.append("linkedIn", formData.linkedIn)
      submitData.append("coverLetter", formData.coverLetter)
      submitData.append("resume", resumeFile)

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

                  {formatSalary() && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Salary Range</p>
                        <p className="font-medium text-green-600">{formatSalary()}</p>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply for {job.title}</DialogTitle>
            <DialogDescription>
              Fill out the form below to submit your application to {organization.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+966 50 123 4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedIn">LinkedIn Profile</Label>
              <Input
                id="linkedIn"
                value={formData.linkedIn}
                onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div className="space-y-2">
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

            <div className="space-y-2">
              <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
              <Textarea
                id="coverLetter"
                value={formData.coverLetter}
                onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
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

            <DialogFooter>
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
