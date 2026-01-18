"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ThumbsUp,
  ThumbsDown,
  Minus,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CriteriaScore {
  criteria_id: string
  score: number
  notes: string
}

interface Interviewer {
  id: string
  full_name: string
  email: string
  avatar_url?: string
}

interface Scorecard {
  id: string
  interviewer_id: string
  interviewer?: Interviewer
  criteria_scores: CriteriaScore[]
  overall_score: number
  weighted_score?: number
  recommendation: string
  strengths?: string
  weaknesses?: string
  additional_notes?: string
  status: string
  submitted_at?: string
}

interface Criteria {
  id: string
  name: string
  name_ar?: string
  description?: string
  weight: number
}

interface FeedbackAggregationProps {
  scorecards: Scorecard[]
  criteria: Criteria[]
  maxScore?: number
}

const recommendationConfig: Record<string, { label: string; icon: any; color: string; value: number }> = {
  strong_yes: { label: "Strong Yes", icon: ThumbsUp, color: "text-green-600", value: 5 },
  yes: { label: "Yes", icon: ThumbsUp, color: "text-emerald-600", value: 4 },
  neutral: { label: "Neutral", icon: Minus, color: "text-amber-600", value: 3 },
  no: { label: "No", icon: ThumbsDown, color: "text-orange-600", value: 2 },
  strong_no: { label: "Strong No", icon: ThumbsDown, color: "text-red-600", value: 1 },
}

export function FeedbackAggregation({
  scorecards,
  criteria,
  maxScore = 5,
}: FeedbackAggregationProps) {
  const submittedScorecards = scorecards.filter((s) => s.status === "submitted" || s.status === "locked")

  // Calculate average scores per criteria
  const criteriaAverages = criteria.map((c) => {
    const scores = submittedScorecards
      .map((sc) => sc.criteria_scores.find((cs) => cs.criteria_id === c.id)?.score)
      .filter((s): s is number => s !== undefined)

    const average = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0

    const variance = scores.length > 1
      ? Math.sqrt(
          scores.reduce((sum, s) => sum + Math.pow(s - average, 2), 0) / scores.length
        )
      : 0

    return {
      criteria: c,
      average,
      variance,
      scores,
      hasDisagreement: variance > 1,
    }
  })

  // Calculate overall average
  const overallAverage = submittedScorecards.length > 0
    ? submittedScorecards.reduce((sum, sc) => sum + (sc.overall_score || 0), 0) / submittedScorecards.length
    : 0

  // Count recommendations
  const recommendationCounts = submittedScorecards.reduce((acc, sc) => {
    acc[sc.recommendation] = (acc[sc.recommendation] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Calculate consensus
  const getConsensusStatus = () => {
    if (submittedScorecards.length === 0) return { status: "none", label: "No Feedback" }
    if (submittedScorecards.length === 1) return { status: "single", label: "Single Reviewer" }

    const recommendations = submittedScorecards.map((s) => s.recommendation)
    const uniqueRecs = new Set(recommendations)

    // Check if all positive or all negative
    const allPositive = recommendations.every((r) => r === "strong_yes" || r === "yes")
    const allNegative = recommendations.every((r) => r === "strong_no" || r === "no")

    if (uniqueRecs.size === 1) return { status: "unanimous", label: "Unanimous" }
    if (allPositive) return { status: "consensus_yes", label: "Consensus Yes" }
    if (allNegative) return { status: "consensus_no", label: "Consensus No" }

    // Check for significant disagreement
    const hasYes = recommendations.some((r) => r === "strong_yes" || r === "yes")
    const hasNo = recommendations.some((r) => r === "strong_no" || r === "no")

    if (hasYes && hasNo) return { status: "disagreement", label: "Disagreement" }

    return { status: "mixed", label: "Mixed Opinions" }
  }

  const consensus = getConsensusStatus()

  const getConsensusColor = (status: string) => {
    switch (status) {
      case "unanimous":
      case "consensus_yes":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "consensus_no":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "disagreement":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  if (submittedScorecards.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No feedback submitted yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reviewers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submittedScorecards.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallAverage.toFixed(1)}/{maxScore}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Consensus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getConsensusColor(consensus.status)}>
              {consensus.label}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Disagreements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {criteriaAverages.filter((c) => c.hasDisagreement).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendation Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recommendation Breakdown</CardTitle>
          <CardDescription>How each interviewer voted</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            {Object.entries(recommendationConfig).map(([key, config]) => {
              const count = recommendationCounts[key] || 0
              const Icon = config.icon
              return (
                <div key={key} className="flex items-center gap-2">
                  <Icon className={cn("h-5 w-5", config.color)} />
                  <span className="font-medium">{config.label}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Criteria Comparison */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Criteria Comparison</CardTitle>
          <CardDescription>Average scores and agreement across interviewers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {criteriaAverages.map(({ criteria: c, average, variance, scores, hasDisagreement }) => (
            <div key={c.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{c.name}</span>
                  {hasDisagreement && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>High variance in scores - reviewers disagree</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {scores.map((score, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className={cn(
                          "text-xs",
                          score >= maxScore * 0.8
                            ? "border-green-500 text-green-700"
                            : score >= maxScore * 0.6
                            ? "border-amber-500 text-amber-700"
                            : "border-red-500 text-red-700"
                        )}
                      >
                        {score}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-sm font-semibold w-12 text-right">
                    {average.toFixed(1)}
                  </span>
                </div>
              </div>
              <Progress
                value={(average / maxScore) * 100}
                className={cn(
                  "h-2",
                  hasDisagreement && "[&>div]:bg-amber-500"
                )}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Individual Scorecards */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Individual Feedback</CardTitle>
          <CardDescription>Detailed feedback from each interviewer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {submittedScorecards.map((scorecard) => {
            const recConfig = recommendationConfig[scorecard.recommendation]
            const RecIcon = recConfig?.icon || Minus

            return (
              <div key={scorecard.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={scorecard.interviewer?.avatar_url} />
                      <AvatarFallback>
                        {scorecard.interviewer?.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {scorecard.interviewer?.full_name || "Unknown Interviewer"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {scorecard.interviewer?.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-lg px-3">
                      {scorecard.overall_score?.toFixed(1)}/{maxScore}
                    </Badge>
                    <Badge className={cn("flex items-center gap-1", recConfig?.color ? `bg-opacity-20 ${recConfig.color}` : "")}>
                      <RecIcon className="h-3 w-3" />
                      {recConfig?.label || scorecard.recommendation}
                    </Badge>
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid md:grid-cols-2 gap-4">
                  {scorecard.strengths && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Strengths
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {scorecard.strengths}
                      </p>
                    </div>
                  )}
                  {scorecard.weaknesses && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm font-medium text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        Areas for Improvement
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {scorecard.weaknesses}
                      </p>
                    </div>
                  )}
                </div>

                {scorecard.additional_notes && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Additional Notes</div>
                    <p className="text-sm text-muted-foreground">
                      {scorecard.additional_notes}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
