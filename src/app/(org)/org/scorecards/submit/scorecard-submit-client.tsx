"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import {
  Loader2,
  Star,
  User,
  Briefcase,
  Calendar,
  ArrowLeft,
  Save,
  Send,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Criteria {
  id: string
  name: string
  name_ar?: string
  description?: string
  weight: number
}

interface Template {
  id: string
  name: string
  name_ar?: string
  description?: string
  template_type: string
  criteria: Criteria[]
  rating_scale_type: string
  rating_scale_labels: Record<string, string>
  require_notes_per_criteria: boolean
}

interface Interview {
  id: string
  title: string
  scheduled_at: string
  applications?: {
    id: string
    candidates?: {
      id: string
      first_name: string
      last_name: string
      email: string
    }
    jobs?: {
      id: string
      title: string
    }
  }
}

interface ScorecardSubmitClientProps {
  interview: Interview
  template: Template
  organizationId: string
  userId: string
  existingScorecardId: string | null
}

const recommendationOptions = [
  { value: "strong_yes", label: "Strong Yes", icon: ThumbsUp, color: "text-green-600" },
  { value: "yes", label: "Yes", icon: ThumbsUp, color: "text-green-500" },
  { value: "neutral", label: "Neutral", icon: Minus, color: "text-gray-500" },
  { value: "no", label: "No", icon: ThumbsDown, color: "text-red-500" },
  { value: "strong_no", label: "Strong No", icon: ThumbsDown, color: "text-red-600" },
]

export function ScorecardSubmitClient({
  interview,
  template,
  organizationId,
  userId,
  existingScorecardId,
}: ScorecardSubmitClientProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)

  // Form state
  const [criteriaScores, setCriteriaScores] = useState<Record<string, { score: number; notes: string }>>(
    template.criteria.reduce((acc, c) => {
      acc[c.id] = { score: 3, notes: "" }
      return acc
    }, {} as Record<string, { score: number; notes: string }>)
  )
  const [recommendation, setRecommendation] = useState<string>("neutral")
  const [strengths, setStrengths] = useState("")
  const [weaknesses, setWeaknesses] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")

  const maxScore = template.rating_scale_type === "1-10" ? 10 : 5

  const calculateOverallScore = () => {
    let totalWeightedScore = 0
    let totalWeight = 0

    template.criteria.forEach((c) => {
      const score = criteriaScores[c.id]?.score || 0
      totalWeightedScore += (score / maxScore) * c.weight
      totalWeight += c.weight
    })

    if (totalWeight === 0) return 0
    return (totalWeightedScore / totalWeight) * maxScore
  }

  const handleCriteriaScoreChange = (criteriaId: string, score: number) => {
    setCriteriaScores((prev) => ({
      ...prev,
      [criteriaId]: { ...prev[criteriaId], score },
    }))
  }

  const handleCriteriaNotesChange = (criteriaId: string, notes: string) => {
    setCriteriaScores((prev) => ({
      ...prev,
      [criteriaId]: { ...prev[criteriaId], notes },
    }))
  }

  const handleSubmit = async (isDraft: boolean = false) => {
    if (isDraft) {
      setIsSavingDraft(true)
    } else {
      setIsSubmitting(true)
    }

    try {
      // Validate required notes if template requires it
      if (!isDraft && template.require_notes_per_criteria) {
        const missingNotes = template.criteria.filter(
          (c) => !criteriaScores[c.id]?.notes?.trim()
        )
        if (missingNotes.length > 0) {
          toast.error(`Please add notes for: ${missingNotes.map((c) => c.name).join(", ")}`)
          return
        }
      }

      const overallScore = calculateOverallScore()
      const criteriaScoresArray = template.criteria.map((c) => ({
        criteria_id: c.id,
        score: criteriaScores[c.id]?.score || 0,
        notes: criteriaScores[c.id]?.notes || "",
      }))

      const scorecardData = {
        interview_id: interview.id,
        template_id: template.id,
        interviewer_id: userId,
        org_id: organizationId,
        criteria_scores: criteriaScoresArray,
        overall_score: overallScore,
        weighted_score: overallScore,
        recommendation,
        strengths: strengths || null,
        weaknesses: weaknesses || null,
        additional_notes: additionalNotes || null,
        status: isDraft ? "draft" : "submitted",
        submitted_at: isDraft ? null : new Date().toISOString(),
      }

      const response = await fetch("/api/scorecards", {
        method: existingScorecardId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...scorecardData,
          id: existingScorecardId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to save scorecard")
      }

      toast.success(isDraft ? "Draft saved successfully" : "Scorecard submitted successfully")
      router.push("/org/scorecards")
      router.refresh()
    } catch (error) {
      console.error("Error saving scorecard:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save scorecard")
    } finally {
      setIsSubmitting(false)
      setIsSavingDraft(false)
    }
  }

  const candidate = interview.applications?.candidates
  const job = interview.applications?.jobs

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Submit Scorecard</h1>
          <p className="text-muted-foreground">{template.name}</p>
        </div>
      </div>

      {/* Candidate & Interview Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--brand-primary,#6366f1)] to-[var(--brand-secondary,#8b5cf6)] flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {candidate?.first_name?.[0] || "?"}
                {candidate?.last_name?.[0] || "?"}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">
                {candidate?.first_name} {candidate?.last_name}
              </h2>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {job?.title}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(interview.scheduled_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[var(--brand-primary,#6366f1)]">
                {calculateOverallScore().toFixed(1)}
              </div>
              <p className="text-sm text-muted-foreground">Overall Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Criteria Scoring */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Criteria</CardTitle>
          <CardDescription>
            Rate the candidate on each criteria (1-{maxScore} scale)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {template.criteria.map((criteria) => (
            <div key={criteria.id} className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium">{criteria.name}</h4>
                  {criteria.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {criteria.description}
                    </p>
                  )}
                </div>
                <Badge variant="outline">{criteria.weight}% weight</Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: maxScore }, (_, i) => i + 1).map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleCriteriaScoreChange(criteria.id, star)}
                        className="p-0.5 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={cn(
                            "h-6 w-6 transition-colors",
                            star <= (criteriaScores[criteria.id]?.score || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-transparent text-gray-300 hover:text-yellow-300"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="font-medium">
                    {criteriaScores[criteria.id]?.score || 0}/{maxScore}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {template.rating_scale_labels[String(criteriaScores[criteria.id]?.score || 0)] || ""}
                  </span>
                </div>

                <Textarea
                  placeholder={`Notes for ${criteria.name}${template.require_notes_per_criteria ? " (required)" : " (optional)"}`}
                  value={criteriaScores[criteria.id]?.notes || ""}
                  onChange={(e) => handleCriteriaNotesChange(criteria.id, e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommendation */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Recommendation</CardTitle>
          <CardDescription>
            Based on your evaluation, would you recommend hiring this candidate?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {recommendationOptions.map((option) => {
              const Icon = option.icon
              const isSelected = recommendation === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRecommendation(option.value)}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all text-center",
                    isSelected
                      ? "border-[var(--brand-primary,#6366f1)] bg-[var(--brand-primary,#6366f1)]/10"
                      : "border-transparent bg-muted/50 hover:bg-muted"
                  )}
                >
                  <Icon className={cn("h-6 w-6 mx-auto mb-2", option.color)} />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>
            Provide a summary of the candidate&apos;s strengths and areas for improvement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-green-600">Strengths</Label>
            <Textarea
              placeholder="What were the candidate's key strengths?"
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-red-600">Areas for Improvement</Label>
            <Textarea
              placeholder="What areas could the candidate improve on?"
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              placeholder="Any other observations or comments"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pb-8">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={isSavingDraft || isSubmitting}
          >
            {isSavingDraft && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting || isSavingDraft}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />
            Submit Scorecard
          </Button>
        </div>
      </div>
    </div>
  )
}
