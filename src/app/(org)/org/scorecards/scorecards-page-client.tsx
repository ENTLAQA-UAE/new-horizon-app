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

interface Scorecard {
  id: string
  interview_id: string
  template_id: string | null
  interviewer_id: string
  criteria_scores: Array<{ criteria_id: string; score: number; notes?: string }>
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
  strong_yes: { label: "Strong Yes", color: "bg-green-600", icon: ThumbsUp },
  yes: { label: "Yes", color: "bg-green-500", icon: ThumbsUp },
  neutral: { label: "Neutral", color: "bg-gray-500", icon: Minus },
  no: { label: "No", color: "bg-red-500", icon: ThumbsDown },
  strong_no: { label: "Strong No", color: "bg-red-600", icon: ThumbsDown },
}

export function ScorecardsPageClient({
  scorecards,
  jobs,
  organizationId,
}: ScorecardsPageClientProps) {
  const router = useRouter()
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
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
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
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Scorecards</h2>
          <p className="text-muted-foreground">
            View all submitted interview scorecards and evaluations
          </p>
        </div>
        <Button onClick={() => router.push("/org/scorecard-templates")}>
          <ClipboardList className="mr-2 h-4 w-4" />
          Manage Templates
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Scorecards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Strong Yes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.strongYes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Yes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.yes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              No / Strong No
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
            placeholder="Search by candidate, interviewer, or job..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Job" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                {job.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={recommendationFilter} onValueChange={setRecommendationFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Recommendation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Recommendations</SelectItem>
            <SelectItem value="strong_yes">Strong Yes</SelectItem>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
            <SelectItem value="no">No</SelectItem>
            <SelectItem value="strong_no">Strong No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Scorecards Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Interviewer</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Recommendation</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredScorecards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No scorecards found</p>
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
                      {scorecard.interviews?.applications?.jobs?.title || "N/A"}
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
                      {scorecard.scorecard_templates?.name || "General"}
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
                  <TableCell className="text-right">
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
                  Scorecard Details
                </DialogTitle>
                <DialogDescription>
                  {selectedScorecard.scorecard_templates?.name || "General Evaluation"} - {selectedScorecard.interviews?.title}
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
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Candidate</p>
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
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Interviewer</p>
                          <p className="font-medium">
                            {selectedScorecard.profiles?.first_name} {selectedScorecard.profiles?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Submitted {formatDate(selectedScorecard.submitted_at)}
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
                        <p className="text-sm text-muted-foreground">Overall Score</p>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="mb-1">{getRecommendationBadge(selectedScorecard.recommendation)}</div>
                      <p className="text-sm text-muted-foreground">Recommendation</p>
                    </div>
                  </div>

                  {/* Criteria Scores */}
                  {selectedScorecard.criteria_scores && selectedScorecard.criteria_scores.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                        Criteria Scores
                      </h4>
                      <div className="space-y-2">
                        {selectedScorecard.criteria_scores.map((criteria, index) => (
                          <div key={criteria.criteria_id || index} className="flex items-center justify-between p-3 rounded-lg border">
                            <span className="font-medium">Criteria {index + 1}</span>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={cn(
                                      "h-4 w-4",
                                      star <= criteria.score
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "fill-transparent text-gray-300"
                                    )}
                                  />
                                ))}
                              </div>
                              <span className="font-medium">{criteria.score}/5</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths & Weaknesses */}
                  {(selectedScorecard.strengths || selectedScorecard.weaknesses) && (
                    <div className="grid md:grid-cols-2 gap-4">
                      {selectedScorecard.strengths && (
                        <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                          <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                            Strengths
                          </h4>
                          <p className="text-sm text-green-800 dark:text-green-300 whitespace-pre-wrap">
                            {selectedScorecard.strengths}
                          </p>
                        </div>
                      )}
                      {selectedScorecard.weaknesses && (
                        <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                          <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">
                            Areas for Improvement
                          </h4>
                          <p className="text-sm text-red-800 dark:text-red-300 whitespace-pre-wrap">
                            {selectedScorecard.weaknesses}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Additional Notes */}
                  {selectedScorecard.additional_notes && (
                    <div className="p-4 rounded-lg border">
                      <h4 className="font-semibold mb-2">Additional Notes</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedScorecard.additional_notes}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="pt-4 border-t flex justify-end">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
