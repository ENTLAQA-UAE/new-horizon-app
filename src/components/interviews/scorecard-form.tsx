"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Loader2,
  Star,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Check,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Criteria {
  id: string
  name: string
  name_ar?: string
  description?: string
  weight: number
}

interface ScorecardTemplate {
  id: string
  name: string
  name_ar?: string
  criteria: Criteria[]
  rating_scale_type: string
  rating_scale_labels: Record<string, string>
  require_notes_per_criteria: boolean
}

interface CriteriaScore {
  criteria_id: string
  score: number
  notes: string
}

interface ScorecardFormProps {
  interviewId: string
  applicationId?: string // Optional: for activity logging
  templates: ScorecardTemplate[]
  existingScorecard?: {
    id: string
    template_id: string
    criteria_scores: CriteriaScore[]
    overall_score: number
    recommendation: string
    strengths: string
    weaknesses: string
    additional_notes: string
    status: string
  }
  onSubmit?: () => void
  onSave?: () => void
}

const recommendations = [
  { value: "strong_yes", label: "Strong Yes", icon: ThumbsUp, color: "text-green-600 bg-green-100 dark:bg-green-900" },
  { value: "yes", label: "Yes", icon: ThumbsUp, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900" },
  { value: "neutral", label: "Neutral", icon: Minus, color: "text-amber-600 bg-amber-100 dark:bg-amber-900" },
  { value: "no", label: "No", icon: ThumbsDown, color: "text-orange-600 bg-orange-100 dark:bg-orange-900" },
  { value: "strong_no", label: "Strong No", icon: ThumbsDown, color: "text-red-600 bg-red-100 dark:bg-red-900" },
]

export function ScorecardForm({
  interviewId,
  applicationId,
  templates,
  existingScorecard,
  onSubmit,
  onSave,
}: ScorecardFormProps) {
  const supabase = createClient()

  const [selectedTemplateId, setSelectedTemplateId] = useState(
    existingScorecard?.template_id || (templates.length > 0 ? templates[0].id : "")
  )
  const [criteriaScores, setCriteriaScores] = useState<CriteriaScore[]>(
    existingScorecard?.criteria_scores || []
  )
  const [recommendation, setRecommendation] = useState(
    existingScorecard?.recommendation || "neutral"
  )
  const [strengths, setStrengths] = useState(existingScorecard?.strengths || "")
  const [weaknesses, setWeaknesses] = useState(existingScorecard?.weaknesses || "")
  const [additionalNotes, setAdditionalNotes] = useState(
    existingScorecard?.additional_notes || ""
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)
  const maxScore = selectedTemplate?.rating_scale_type === "1-10" ? 10 : 5

  const getScoreForCriteria = (criteriaId: string): number | undefined => {
    return criteriaScores.find((cs) => cs.criteria_id === criteriaId)?.score
  }

  const getNotesForCriteria = (criteriaId: string): string => {
    return criteriaScores.find((cs) => cs.criteria_id === criteriaId)?.notes || ""
  }

  const updateScore = (criteriaId: string, score: number) => {
    setCriteriaScores((prev) => {
      const existing = prev.find((cs) => cs.criteria_id === criteriaId)
      if (existing) {
        return prev.map((cs) =>
          cs.criteria_id === criteriaId ? { ...cs, score } : cs
        )
      }
      return [...prev, { criteria_id: criteriaId, score, notes: "" }]
    })
  }

  const updateNotes = (criteriaId: string, notes: string) => {
    setCriteriaScores((prev) => {
      const existing = prev.find((cs) => cs.criteria_id === criteriaId)
      if (existing) {
        return prev.map((cs) =>
          cs.criteria_id === criteriaId ? { ...cs, notes } : cs
        )
      }
      return [...prev, { criteria_id: criteriaId, score: 0, notes }]
    })
  }

  const calculateOverallScore = (): number => {
    if (!selectedTemplate || criteriaScores.length === 0) return 0

    let weightedSum = 0
    let totalWeight = 0

    selectedTemplate.criteria.forEach((criteria) => {
      const score = getScoreForCriteria(criteria.id)
      if (score !== undefined) {
        weightedSum += score * criteria.weight
        totalWeight += criteria.weight
      }
    })

    if (totalWeight === 0) return 0
    return Number((weightedSum / totalWeight).toFixed(2))
  }

  const validateForm = (): boolean => {
    if (!selectedTemplate) {
      toast.error("Please select a scorecard template")
      return false
    }

    // Check if all criteria have scores
    const missingScores = selectedTemplate.criteria.filter(
      (c) => getScoreForCriteria(c.id) === undefined
    )

    if (missingScores.length > 0) {
      toast.error(`Please rate all criteria. Missing: ${missingScores.map((c) => c.name).join(", ")}`)
      return false
    }

    // Check if notes are required
    if (selectedTemplate.require_notes_per_criteria) {
      const missingNotes = selectedTemplate.criteria.filter(
        (c) => !getNotesForCriteria(c.id).trim()
      )

      if (missingNotes.length > 0) {
        toast.error(`Notes are required for: ${missingNotes.map((c) => c.name).join(", ")}`)
        return false
      }
    }

    return true
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const overallScore = calculateOverallScore()
      const scorecardData = {
        interview_id: interviewId,
        template_id: selectedTemplateId,
        criteria_scores: criteriaScores,
        overall_score: overallScore,
        recommendation,
        strengths: strengths || null,
        weaknesses: weaknesses || null,
        additional_notes: additionalNotes || null,
        status: "draft",
      }

      if (existingScorecard) {
        const { error } = await supabase
          .from("interview_scorecards")
          .update(scorecardData)
          .eq("id", existingScorecard.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("interview_scorecards")
          .insert(scorecardData)

        if (error) throw error
      }

      toast.success("Scorecard saved as draft")
      onSave?.()
    } catch (error: any) {
      toast.error(error.message || "Failed to save scorecard")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const overallScore = calculateOverallScore()
      const scorecardData = {
        interview_id: interviewId,
        template_id: selectedTemplateId,
        criteria_scores: criteriaScores,
        overall_score: overallScore,
        recommendation,
        strengths: strengths || null,
        weaknesses: weaknesses || null,
        additional_notes: additionalNotes || null,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      }

      if (existingScorecard) {
        const { error } = await supabase
          .from("interview_scorecards")
          .update(scorecardData)
          .eq("id", existingScorecard.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("interview_scorecards")
          .insert(scorecardData)

        if (error) throw error
      }

      toast.success("Scorecard submitted successfully")

      // Send notification about scorecard submission
      fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "scorecard_submitted",
          orgId: "", // API will get from interview
          data: {
            interviewId: interviewId,
            score: calculateOverallScore(),
            recommendation: recommendation,
          },
        }),
      }).catch((err) => {
        console.error("Failed to send scorecard notification:", err)
      })

      // Log activity for scorecard submission
      if (applicationId) {
        const recLabel = recommendations.find(r => r.value === recommendation)?.label || recommendation
        fetch(`/api/applications/${applicationId}/activities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activity_type: "scorecard_submitted",
            description: `Scorecard submitted with overall score ${overallScore.toFixed(1)}/${maxScore} (${recLabel})`,
            metadata: {
              interview_id: interviewId,
              overall_score: overallScore,
              recommendation: recommendation,
              template_id: selectedTemplateId,
            },
          }),
        }).catch((err) => {
          console.error("Failed to log scorecard activity:", err)
        })
      }

      onSubmit?.()
    } catch (error: any) {
      toast.error(error.message || "Failed to submit scorecard")
    } finally {
      setIsLoading(false)
    }
  }

  const isLocked = existingScorecard?.status === "locked"

  const RatingStars = ({ criteriaId, maxRating }: { criteriaId: string; maxRating: number }) => {
    const currentScore = getScoreForCriteria(criteriaId)

    return (
      <div className="flex gap-1">
        {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
          <button
            key={rating}
            type="button"
            disabled={isLocked}
            onClick={() => updateScore(criteriaId, rating)}
            className={cn(
              "w-8 h-8 rounded flex items-center justify-center transition-colors",
              currentScore !== undefined && rating <= currentScore
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80",
              isLocked && "opacity-50 cursor-not-allowed"
            )}
          >
            {rating}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Scorecard Template</CardTitle>
          <CardDescription>Select the template to use for this evaluation</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedTemplateId}
            onValueChange={setSelectedTemplateId}
            disabled={isLocked || !!existingScorecard}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Criteria Scoring */}
      {selectedTemplate && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Evaluation Criteria</CardTitle>
                <CardDescription>
                  Rate the candidate on each criteria (1-{maxScore})
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                Overall: {calculateOverallScore().toFixed(1)}/{maxScore}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedTemplate.criteria.map((criteria) => (
              <div key={criteria.id} className="space-y-3 pb-4 border-b last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{criteria.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {criteria.weight}%
                      </Badge>
                    </div>
                    {criteria.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {criteria.description}
                      </p>
                    )}
                  </div>
                  <RatingStars criteriaId={criteria.id} maxRating={maxScore} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Notes {selectedTemplate.require_notes_per_criteria && <span className="text-red-500">*</span>}
                  </Label>
                  <Textarea
                    value={getNotesForCriteria(criteria.id)}
                    onChange={(e) => updateNotes(criteria.id, e.target.value)}
                    placeholder="Add notes for this criteria..."
                    rows={2}
                    disabled={isLocked}
                    className="resize-none"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Overall Recommendation</CardTitle>
          <CardDescription>Your hiring recommendation for this candidate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {recommendations.map((rec) => {
              const Icon = rec.icon
              return (
                <button
                  key={rec.value}
                  type="button"
                  disabled={isLocked}
                  onClick={() => setRecommendation(rec.value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
                    recommendation === rec.value
                      ? `${rec.color} border-transparent`
                      : "border-border hover:bg-muted",
                    isLocked && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{rec.label}</span>
                  {recommendation === rec.value && <Check className="h-4 w-4" />}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-green-600" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="What are the candidate's key strengths?"
              rows={4}
              disabled={isLocked}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
              placeholder="What areas could the candidate improve?"
              rows={4}
              disabled={isLocked}
            />
          </CardContent>
        </Card>
      </div>

      {/* Additional Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Additional Notes</CardTitle>
          <CardDescription>Any other observations or comments</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Additional observations, concerns, or recommendations..."
            rows={4}
            disabled={isLocked}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      {!isLocked && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Draft
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Scorecard
          </Button>
        </div>
      )}

      {isLocked && (
        <div className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg">
          <Check className="h-5 w-5 text-green-600" />
          <span className="text-muted-foreground">This scorecard has been locked and cannot be edited</span>
        </div>
      )}
    </div>
  )
}
