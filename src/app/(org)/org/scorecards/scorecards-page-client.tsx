"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  ClipboardList,
  Star,
  User,
  Briefcase,
  Calendar,
  Filter,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"

export interface Scorecard {
  id: string
  interview_id: string
  template_id: string | null
  interviewer_id: string
  criteria_scores: Array<{ criteria_id: string; score: number; notes?: string; name?: string }>
  overall_score: number | null
  weighted_score: number | null
  recommendation: string
  strengths?: string
  weaknesses?: string
  additional_notes?: string
  status: string
  submitted_at: string | null
  created_at: string
  profiles?: {
    first_name: string
    last_name: string
    avatar_url: string | null
  }
  scorecard_templates?: {
    id: string
    name: string
    name_ar?: string
    template_type: string
    criteria?: Array<{
      id: string
      name: string
      name_ar?: string
      description?: string
      weight: number
    }>
  }
  interviews?: {
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
        title_ar?: string
      }
    }
  }
}

interface Job {
  id: string
  title: string
}

interface ScorecardsPageClientProps {
  scorecards: Scorecard[]
  jobs: Job[]
  organizationId: string
}

const recommendationConfig = {
  strong_yes: { labelKey: "scorecards.recommendations.strongYes", color: "bg-green-600", icon: ThumbsUp },
  yes: { labelKey: "scorecards.recommendations.yes", color: "bg-green-500", icon: ThumbsUp },
  neutral: { labelKey: "scorecards.recommendations.neutral", color: "bg-gray-500", icon: Minus },
  no: { labelKey: "scorecards.recommendations.no", color: "bg-red-500", icon: ThumbsDown },
  strong_no: { labelKey: "scorecards.recommendations.strongNo", color: "bg-red-600", icon: ThumbsDown },
}

export function ScorecardsPageClient({
  scorecards,
  jobs,
  organizationId,
}: ScorecardsPageClientProps) {
  const router = useRouter()
  const { t, language, isRTL } = useI18n()
  const [searchQuery, setSearchQuery] = useState("")
  const [jobFilter, setJobFilter] = useState<string>("all")
  const [recommendationFilter, setRecommendationFilter] = useState<string>("all")

  // View dialog
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedScorecard, setSelectedScorecard] = useState<Scorecard | null>(null)

  const filteredScorecards = useMemo(() => {
    return scorecards.filter((scorecard) => {
      const candidateName = `${scorecard.interviews?.applications?.candidates?.first_name || ""} ${scorecard.interviews?.applications?.candidates?.last_name || ""}`.toLowerCase()
      const interviewerName = `${scorecard.profiles?.first_name || ""} ${scorecard.profiles?.last_name || ""}`.toLowerCase()
      const jobTitle = scorecard.interviews?.applications?.jobs?.title?.toLowerCase() || ""

      const matchesSearch =
        candidateName.includes(searchQuery.toLowerCase()) ||
        interviewerName.includes(searchQuery.toLowerCase()) ||
        jobTitle.includes(searchQuery.toLowerCase())

      const matchesJob = jobFilter === "all" || scorecard.interviews?.applications?.jobs?.id === jobFilter
      const matchesRecommendation = recommendationFilter === "all" || scorecard.recommendation === recommendationFilter

      return matchesSearch && matchesJob && matchesRecommendation
    })
  }, [scorecards, searchQuery, jobFilter, recommendationFilter])

  const stats = {
    total: scorecards.length,
    strongYes: scorecards.filter(s => s.recommendation === "strong_yes").length,
    yes: scorecards.filter(s => s.recommendation === "yes").length,
    no: scorecards.filter(s => s.recommendation === "no" || s.recommendation === "strong_no").length,
  }

  const formatDate = (date: string | null) => {
    if (!date) return t("scorecards.na")
    return new Date(date).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const openViewDialog = (scorecard: Scorecard) => {
    setSelectedScorecard(scorecard)
    setIsViewDialogOpen(true)
  }

  const getRecommendationBadge = (recommendation: string) => {
    const config = recommendationConfig[recommendation as keyof typeof recommendationConfig] || recommendationConfig.neutral
    const Icon = config.icon
    return (
      <Badge className={cn("gap-1", config.color)}>
        <Icon className="h-3 w-3" />
        {t(config.labelKey)}
      </Badge>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("nav.scorecards")}</h2>
          <p className="text-muted-foreground">
            {t("scorecards.description")}
          </p>
        </div>
        <Button onClick={() => router.push("/org/scorecard-templates")}>
          <ClipboardList className={cn(isRTL ? "ml-2" : "mr-2", "h-4 w-4")} />
          {t("scorecards.manageTemplates")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("scorecards.totalScorecards")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("scorecards.recommendations.strongYes")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.strongYes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("scorecards.recommendations.yes")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.yes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("scorecards.recommendations.noStrongNo")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.no}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("scorecards.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-48">
            <Filter className={cn(isRTL ? "ml-2" : "mr-2", "h-4 w-4")} />
            <SelectValue placeholder={t("interviews.fields.job")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("scorecards.allJobs")}</SelectItem>
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                {job.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={recommendationFilter} onValueChange={setRecommendationFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("scorecards.recommendation")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("scorecards.allRecommendations")}</SelectItem>
            <SelectItem value="strong_yes">{t("scorecards.recommendations.strongYes")}</SelectItem>
            <SelectItem value="yes">{t("scorecards.recommendations.yes")}</SelectItem>
            <SelectItem value="neutral">{t("scorecards.recommendations.neutral")}</SelectItem>
            <SelectItem value="no">{t("scorecards.recommendations.no")}</SelectItem>
            <SelectItem value="strong_no">{t("scorecards.recommendations.strongNo")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Scorecards Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("interviews.fields.candidate")}</TableHead>
              <TableHead>{t("interviews.fields.job")}</TableHead>
              <TableHead>{t("interviews.fields.interviewer")}</TableHead>
              <TableHead>{t("scorecards.template")}</TableHead>
              <TableHead>{t("scorecards.score")}</TableHead>
              <TableHead>{t("scorecards.recommendation")}</TableHead>
              <TableHead>{t("scorecards.submitted")}</TableHead>
              <TableHead className={isRTL ? "text-left" : "text-right"}>{t("common.table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredScorecards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">{t("scorecards.noScorecards")}</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredScorecards.map((scorecard) => (
                <TableRow key={scorecard.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openViewDialog(scorecard)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {scorecard.interviews?.applications?.candidates?.first_name?.[0] || "?"}
                          {scorecard.interviews?.applications?.candidates?.last_name?.[0] || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {scorecard.interviews?.applications?.candidates?.first_name}{" "}
                          {scorecard.interviews?.applications?.candidates?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {scorecard.interviews?.applications?.candidates?.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-sm">
                      {scorecard.interviews?.applications?.jobs?.title || t("scorecards.na")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {scorecard.profiles?.first_name} {scorecard.profiles?.last_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {scorecard.scorecard_templates?.name || t("scorecards.general")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {scorecard.overall_score !== null ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{scorecard.overall_score.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getRecommendationBadge(scorecard.recommendation)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(scorecard.submitted_at)}
                    </span>
                  </TableCell>
                  <TableCell className={isRTL ? "text-left" : "text-right"}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        openViewDialog(scorecard)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {selectedScorecard && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  {t("scorecards.scorecardDetails")}
                </DialogTitle>
                <DialogDescription>
                  {selectedScorecard.scorecard_templates?.name || t("scorecards.generalEvaluation")} - {selectedScorecard.interviews?.title}
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-6 py-4">
                  {/* Candidate & Interviewer Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--brand-primary,#6366f1)] to-[var(--brand-secondary,#8b5cf6)] flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {selectedScorecard.interviews?.applications?.candidates?.first_name?.[0] || "?"}
                            {selectedScorecard.interviews?.applications?.candidates?.last_name?.[0] || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("interviews.fields.candidate")}</p>
                          <p className="font-medium">
                            {selectedScorecard.interviews?.applications?.candidates?.first_name}{" "}
                            {selectedScorecard.interviews?.applications?.candidates?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedScorecard.interviews?.applications?.jobs?.title}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("interviews.fields.interviewer")}</p>
                          <p className="font-medium">
                            {selectedScorecard.profiles?.first_name} {selectedScorecard.profiles?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t("scorecards.submittedOn", { date: formatDate(selectedScorecard.submitted_at) })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Score & Recommendation */}
                  <div className="flex items-center justify-center gap-8 p-6 rounded-lg bg-gradient-to-r from-[var(--brand-primary,#6366f1)]/5 to-[var(--brand-secondary,#8b5cf6)]/5">
                    {selectedScorecard.overall_score !== null && (
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
                          <span className="text-4xl font-bold">{selectedScorecard.overall_score.toFixed(1)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{t("scorecards.overallScore")}</p>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="mb-1">{getRecommendationBadge(selectedScorecard.recommendation)}</div>
                      <p className="text-sm text-muted-foreground">{t("scorecards.recommendation")}</p>
                    </div>
                  </div>

                  {/* Criteria Scores */}
                  {selectedScorecard.criteria_scores && selectedScorecard.criteria_scores.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                        {t("scorecards.criteriaScores")}
                      </h4>
                      <div className="space-y-3">
                        {selectedScorecard.criteria_scores.map((criteriaScore, index) => {
                          // Use stored name as primary source (for data integrity)
                          // Fall back to template lookup if no stored name
                          let criteriaName = criteriaScore.name
                          if (!criteriaName) {
                            // Try to find the criteria name from the template
                            // Method 1: Match by criteria_id
                            let templateCriteria = selectedScorecard.scorecard_templates?.criteria?.find(
                              c => c.id === criteriaScore.criteria_id
                            )
                            // Method 2: If no match by ID, try matching by index position
                            if (!templateCriteria && selectedScorecard.scorecard_templates?.criteria) {
                              templateCriteria = selectedScorecard.scorecard_templates.criteria[index]
                            }
                            criteriaName = templateCriteria?.name || t("scorecards.criteriaNumber", { number: index + 1 })
                          }

                          return (
                            <div key={criteriaScore.criteria_id || index} className="p-3 rounded-lg border space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{criteriaName}</span>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={cn(
                                          "h-4 w-4",
                                          star <= criteriaScore.score
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "fill-transparent text-gray-300"
                                        )}
                                      />
                                    ))}
                                  </div>
                                  <span className="font-medium">{criteriaScore.score}/5</span>
                                </div>
                              </div>
                              {criteriaScore.notes && (
                                <p className="text-sm text-muted-foreground pl-2 border-l-2 border-muted">
                                  {criteriaScore.notes}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Strengths & Weaknesses - Always show both sections */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                      <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                        {t("scorecards.strengths")}
                      </h4>
                      {selectedScorecard.strengths ? (
                        <p className="text-sm text-green-800 dark:text-green-300 whitespace-pre-wrap">
                          {selectedScorecard.strengths}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          {t("scorecards.noStrengthsNoted")}
                        </p>
                      )}
                    </div>
                    <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                      <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">
                        {t("scorecards.areasForImprovement")}
                      </h4>
                      {selectedScorecard.weaknesses ? (
                        <p className="text-sm text-red-800 dark:text-red-300 whitespace-pre-wrap">
                          {selectedScorecard.weaknesses}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          {t("scorecards.noImprovementsNoted")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Additional Notes */}
                  {selectedScorecard.additional_notes && (
                    <div className="p-4 rounded-lg border">
                      <h4 className="font-semibold mb-2">{t("scorecards.additionalNotes")}</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedScorecard.additional_notes}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="pt-4 border-t flex justify-end">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  {t("common.close")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
