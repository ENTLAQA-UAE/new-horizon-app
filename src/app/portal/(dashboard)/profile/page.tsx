// @ts-nocheck
// Note: Type inference issues with filter parameter
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { supabaseSelect, supabaseUpdate } from "@/lib/supabase/auth-fetch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  FileText,
  Upload,
  Download,
  Trash2,
  Plus,
  Save,
} from "lucide-react"
import { toast } from "sonner"

interface Candidate {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  current_title: string | null
  current_company: string | null
  location: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  resume_url: string | null
  resume_text: string | null
  experience_years: number | null
  education_level: string | null
  skills: string[] | null
  languages: string[] | null
  summary: string | null
}

const educationLevels = [
  { value: "high_school", label: "High School" },
  { value: "associate", label: "Associate Degree" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "master", label: "Master's Degree" },
  { value: "doctorate", label: "Doctorate" },
  { value: "other", label: "Other" },
]

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [formData, setFormData] = useState<Partial<Candidate>>({})
  const [newSkill, setNewSkill] = useState("")
  const [newLanguage, setNewLanguage] = useState("")

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data: candidateData } = await supabaseSelect("candidates", {
        select: "*",
        filter: [{ column: "email", value: user.email }],
        single: true,
      })

      if (candidateData) {
        setCandidate(candidateData)
        setFormData(candidateData)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!candidate) return

    setIsSaving(true)
    try {
      const { error } = await supabaseUpdate(
        "candidates",
        {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          current_title: formData.current_title,
          current_company: formData.current_company,
          location: formData.location,
          linkedin_url: formData.linkedin_url,
          portfolio_url: formData.portfolio_url,
          experience_years: formData.experience_years,
          education_level: formData.education_level,
          skills: formData.skills,
          languages: formData.languages,
          summary: formData.summary,
          updated_at: new Date().toISOString(),
        },
        { column: "id", value: candidate.id }
      )

      if (error) throw error

      toast.success("Profile updated successfully")
      setCandidate({ ...candidate, ...formData })
    } catch (error) {
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddSkill = () => {
    if (!newSkill.trim()) return
    const currentSkills = formData.skills || []
    if (!currentSkills.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...currentSkills, newSkill.trim()] })
    }
    setNewSkill("")
  }

  const handleRemoveSkill = (skill: string) => {
    const currentSkills = formData.skills || []
    setFormData({ ...formData, skills: currentSkills.filter(s => s !== skill) })
  }

  const handleAddLanguage = () => {
    if (!newLanguage.trim()) return
    const currentLanguages = formData.languages || []
    if (!currentLanguages.includes(newLanguage.trim())) {
      setFormData({ ...formData, languages: [...currentLanguages, newLanguage.trim()] })
    }
    setNewLanguage("")
  }

  const handleRemoveLanguage = (language: string) => {
    const currentLanguages = formData.languages || []
    setFormData({ ...formData, languages: currentLanguages.filter(l => l !== language) })
  }

  // Download resume with signed URL (for private buckets)
  const handleDownloadResume = async (resumeUrl: string) => {
    try {
      // Extract the file path from the public URL
      // URL format: https://xxx.supabase.co/storage/v1/object/public/resumes/path/to/file.pdf
      const pathMatch = resumeUrl.match(/\/resumes\/(.+)$/)
      if (!pathMatch) {
        // If it's not a Supabase storage URL, try to open it directly
        window.open(resumeUrl, "_blank")
        return
      }

      const filePath = pathMatch[1]

      // Get signed URL from our API
      const response = await fetch("/api/storage/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: "resumes", path: filePath }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to get download URL")
      }

      const { signedUrl } = await response.json()
      window.open(signedUrl, "_blank")
    } catch (error) {
      console.error("Error downloading resume:", error)
      toast.error("Failed to download resume. Please try again.")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information and resume
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name || ""}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name || ""}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+966 5X XXX XXXX"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location || ""}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="City, Country"
            />
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Professional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="current_title">Current Job Title</Label>
              <Input
                id="current_title"
                value={formData.current_title || ""}
                onChange={(e) => setFormData({ ...formData, current_title: e.target.value })}
                placeholder="Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_company">Current Company</Label>
              <Input
                id="current_company"
                value={formData.current_company || ""}
                onChange={(e) => setFormData({ ...formData, current_company: e.target.value })}
                placeholder="Acme Inc."
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="experience_years">Years of Experience</Label>
              <Input
                id="experience_years"
                type="number"
                min="0"
                max="50"
                value={formData.experience_years || ""}
                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || null })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="education_level">Education Level</Label>
              <Select
                value={formData.education_level || ""}
                onValueChange={(value) => setFormData({ ...formData, education_level: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
                <SelectContent>
                  {educationLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Professional Summary</Label>
            <Textarea
              id="summary"
              value={formData.summary || ""}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Brief summary of your professional background..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          <CardDescription>Add your professional skills</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill..."
              onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
            />
            <Button type="button" onClick={handleAddSkill}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {formData.skills && formData.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1">
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-1 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader>
          <CardTitle>Languages</CardTitle>
          <CardDescription>Languages you speak</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              placeholder="Add a language..."
              onKeyPress={(e) => e.key === "Enter" && handleAddLanguage()}
            />
            <Button type="button" onClick={handleAddLanguage}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {formData.languages && formData.languages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.languages.map((language) => (
                <Badge key={language} variant="secondary" className="gap-1">
                  {language}
                  <button
                    onClick={() => handleRemoveLanguage(language)}
                    className="ml-1 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Links */}
      <Card>
        <CardHeader>
          <CardTitle>Links</CardTitle>
          <CardDescription>Your professional profiles and portfolio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
            <Input
              id="linkedin_url"
              type="url"
              value={formData.linkedin_url || ""}
              onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolio_url">Portfolio / Website</Label>
            <Input
              id="portfolio_url"
              type="url"
              value={formData.portfolio_url || ""}
              onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
              placeholder="https://yourportfolio.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Resume */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume
          </CardTitle>
          <CardDescription>Your uploaded resume</CardDescription>
        </CardHeader>
        <CardContent>
          {candidate.resume_url ? (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Resume</p>
                  <p className="text-sm text-muted-foreground">
                    Uploaded with your application
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => handleDownloadResume(candidate.resume_url!)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No resume uploaded</p>
              <p className="text-sm text-muted-foreground">
                Your resume will be saved when you apply to a job
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button (bottom) */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  )
}
