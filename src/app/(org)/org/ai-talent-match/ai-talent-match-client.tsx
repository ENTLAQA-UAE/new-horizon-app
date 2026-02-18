"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Search,
  Sparkles,
  Briefcase,
  ChevronDown,
  ChevronRight,
  MapPin,
  Mail,
  Phone,
  Star,
  TrendingUp,
  Users,
  Target,
  Eye,
  FileText,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  UserPlus,
  RefreshCw,
  Database,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"

interface Job {
  id: string
  title: string
  title_ar: string | null
  status: string
  department_id: string | null
  location_id: string | null
  description: string | null
  experience_level: string | null
  job_type: string | null
  published_at: string | null
  created_at: string
  departments: { id: string; name: string; name_ar: string | null } | null
  locations: { id: string; name: string; name_ar: string | null; city: string; country: string } | null
}

interface Candidate {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  current_title: string | null
  city: string | null
  country: string | null
  avatar_url: string | null
  resume_url: string | null
  years_of_experience: number | null
  skills: string[] | null
}

interface PoolRecommendation {
  id: string
  job_id: string
  candidate_id: string
  application_id: string | null
  overall_score: number | null
  skills_match_score: number | null
  experience_score: number | null
  education_score: number | null
  recommendation: string | null
  recommendation_reason: string | null
  screening_feedback: string | null
  strengths: string[] | null
  concerns: string[] | null
  skill_gaps: string[] | null
  screening_data: Record<string, unknown> | null
  source: string | null
  created_at: string
  updated_at: string
  candidates: Candidate | null
}

interface AITalentHubClientProps {
  jobs: Job[]
  recommendations: PoolRecommendation[]
  candidatePoolCount: number
  organizationId: string
}

type RecommendationLevel = "all" | "strong_match" | "good_match" | "potential_match" | "weak_match"

const recommendationConfig: Record<string, { label: string; labelAr: string; color: string; bgColor: string; icon: typeof Star }> = {
  strong_match: {
    label: "Strong Match",
    labelAr: "تطابق قوي",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800",
    icon: Star,
  },
  good_match: {
    label: "Good Match",
    labelAr: "تطابق جيد",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800",
    icon: CheckCircle2,
  },
  potential_match: {
    label: "Potential Match",
    labelAr: "تطابق محتمل",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800",
    icon: Clock,
  },
  weak_match: {
    label: "Weak Match",
    labelAr: "تطابق ضعيف",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-50 border-orange-200 dark:bg-orange-950/50 dark:border-orange-800",
    icon: AlertCircle,
  },
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
  if (score >= 65) return "text-blue-600 dark:text-blue-400"
  if (score >= 50) return "text-amber-600 dark:text-amber-400"
  return "text-orange-600 dark:text-orange-400"
}

function getProgressColor(score: number): string {
  if (score >= 80) return "[&>div]:bg-emerald-500"
  if (score >= 65) return "[&>div]:bg-blue-500"
  if (score >= 50) return "[&>div]:bg-amber-500"
  return "[&>div]:bg-orange-500"
}

export function AITalentHubClient({ jobs, recommendations, candidatePoolCount, organizationId }: AITalentHubClientProps) {
  const router = useRouter()
  const { language, isRTL } = useI18n()

  const [searchQuery, setSearchQuery] = useState("")
  const [recommendationFilter, setRecommendationFilter] = useState<RecommendationLevel>("all")
  const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({})
  const [selectedRec, setSelectedRec] = useState<PoolRecommendation | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [scanningJob, setScanningJob] = useState<string | null>(null)
  const [applyingCandidate, setApplyingCandidate] = useState<string | null>(null)

  // Group recommendations by job
  const recsByJob = useMemo(() => {
    const grouped: Record<string, PoolRecommendation[]> = {}
    recommendations.forEach((r) => {
      if (!grouped[r.job_id]) grouped[r.job_id] = []
      grouped[r.job_id].push(r)
    })
    return grouped
  }, [recommendations])

  // Filter recommendations
  const filteredRecsByJob = useMemo(() => {
    const filtered: Record<string, PoolRecommendation[]> = {}

    Object.entries(recsByJob).forEach(([jobId, jobRecs]) => {
      const filteredItems = jobRecs.filter((r) => {
        const candidate = r.candidates
        if (!candidate) return false

        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          const fullName = `${candidate.first_name} ${candidate.last_name}`.toLowerCase()
          const matchesSearch =
            fullName.includes(query) ||
            candidate.email?.toLowerCase().includes(query) ||
            candidate.current_title?.toLowerCase().includes(query)
          if (!matchesSearch) return false
        }

        if (recommendationFilter !== "all" && r.recommendation !== recommendationFilter) {
          return false
        }

        return true
      })

      if (filteredItems.length > 0) {
        filtered[jobId] = filteredItems
      }
    })

    return filtered
  }, [recsByJob, searchQuery, recommendationFilter])

  // Stats
  const stats = useMemo(() => {
    const validRecs = recommendations.filter((r) => r.candidates)
    const total = validRecs.length
    const strong = validRecs.filter((r) => r.recommendation === "strong_match").length
    const good = validRecs.filter((r) => r.recommendation === "good_match").length
    const jobsWithRecs = new Set(validRecs.map((r) => r.job_id)).size
    return { total, strong, good, jobsWithRecs }
  }, [recommendations])

  const toggleJob = (jobId: string) => {
    setExpandedJobs((prev) => ({ ...prev, [jobId]: !prev[jobId] }))
  }

  const handleViewDetail = (rec: PoolRecommendation) => {
    setSelectedRec(rec)
    setIsDetailOpen(true)
  }

  const handleOpenResume = (candidateId: string) => {
    if (!candidateId) {
      toast.error(language === "ar" ? "السيرة الذاتية غير متاحة" : "Resume not available")
      return
    }
    window.open(`/api/files/resume-${candidateId}`, "_blank", "noopener,noreferrer")
  }

  // Scan talent pool for a job
  const handleScanPool = async (jobId: string) => {
    setScanningJob(jobId)
    try {
      const response = await fetch("/api/org/ai/talent-pool-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to scan talent pool")
      }

      const result = await response.json()
      const { totalMatches, strongMatches, goodMatches } = result.data

      if (totalMatches === 0) {
        toast.info(
          language === "ar"
            ? "لم يتم العثور على مرشحين مطابقين في المجموعة"
            : "No matching candidates found in the pool"
        )
      } else {
        toast.success(
          language === "ar"
            ? `تم العثور على ${totalMatches} مرشح مطابق (${strongMatches} قوي، ${goodMatches} جيد)`
            : `Found ${totalMatches} matches (${strongMatches} strong, ${goodMatches} good)`
        )
      }

      router.refresh()
    } catch (error) {
      toast.error(
        language === "ar"
          ? "فشل في فحص مجموعة المواهب"
          : error instanceof Error ? error.message : "Failed to scan talent pool"
      )
    } finally {
      setScanningJob(null)
    }
  }

  // Apply a pool candidate to a job
  const handleApplyToJob = async (rec: PoolRecommendation) => {
    if (!rec.candidates) return

    const candidateKey = `${rec.candidate_id}-${rec.job_id}`
    setApplyingCandidate(candidateKey)

    try {
      const response = await fetch("/api/org/ai/talent-pool-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: rec.job_id,
          candidateId: rec.candidate_id,
          screeningId: rec.id,
          orgId: organizationId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to apply candidate")
      }

      toast.success(
        language === "ar"
          ? `تم تقديم ${rec.candidates.first_name} ${rec.candidates.last_name} للوظيفة`
          : `${rec.candidates.first_name} ${rec.candidates.last_name} applied to job successfully`
      )
      router.refresh()
    } catch (error) {
      toast.error(
        language === "ar"
          ? "فشل في تقديم المرشح للوظيفة"
          : error instanceof Error ? error.message : "Failed to apply candidate to job"
      )
    } finally {
      setApplyingCandidate(null)
    }
  }

  // Screening data helpers
  const getScreeningData = (rec: PoolRecommendation) => {
    const data = rec.screening_data as Record<string, unknown> | null
    return {
      summary: (data?.summary as string) || rec.screening_feedback || "",
      summaryAr: (data?.summaryAr as string) || "",
      skillAnalysis: data?.skillAnalysis as { matched?: { skill: string; proficiency: string }[]; missing?: { skill: string; importance: string }[]; additional?: string[] } | undefined,
      experienceAnalysis: data?.experienceAnalysis as { yearsRelevant?: number; relevanceScore?: number; highlights?: string[] } | undefined,
      interviewFocus: (data?.interviewFocus as string[]) || [],
    }
  }

  return (
    <div className={cn("space-y-6 p-6", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {language === "ar" ? "مركز المواهب الذكي" : "AI Talent Hub"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === "ar"
                ? "اكتشف المرشحين المناسبين من مجموعة المواهب الحالية لوظائفك المفتوحة"
                : "Discover matching candidates from your existing talent pool for open positions"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950/50">
                <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{candidatePoolCount}</p>
                <p className="text-xs text-muted-foreground">
                  {language === "ar" ? "مجموعة المواهب" : "Talent Pool"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
                <Star className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.strong}</p>
                <p className="text-xs text-muted-foreground">
                  {language === "ar" ? "تطابق قوي" : "Strong Matches"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/50">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.good}</p>
                <p className="text-xs text-muted-foreground">
                  {language === "ar" ? "تطابق جيد" : "Good Matches"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-950/50">
                <Briefcase className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{jobs.length}</p>
                <p className="text-xs text-muted-foreground">
                  {language === "ar" ? "وظائف مفتوحة" : "Open Jobs"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Input
            placeholder={language === "ar" ? "ابحث عن مرشح..." : "Search candidates..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn("h-10", isRTL ? "pr-10" : "pl-10")}
          />
        </div>
        <Select value={recommendationFilter} onValueChange={(v) => setRecommendationFilter(v as RecommendationLevel)}>
          <SelectTrigger className="w-full sm:w-[200px] h-10">
            <SelectValue placeholder={language === "ar" ? "التوصية" : "Recommendation"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "ar" ? "الكل" : "All Levels"}</SelectItem>
            <SelectItem value="strong_match">{language === "ar" ? "تطابق قوي" : "Strong Match"}</SelectItem>
            <SelectItem value="good_match">{language === "ar" ? "تطابق جيد" : "Good Match"}</SelectItem>
            <SelectItem value="potential_match">{language === "ar" ? "تطابق محتمل" : "Potential Match"}</SelectItem>
            <SelectItem value="weak_match">{language === "ar" ? "تطابق ضعيف" : "Weak Match"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Open Jobs with Pool Recommendations */}
      <div className="space-y-4">
        {jobs.map((job) => {
          const jobRecs = filteredRecsByJob[job.id] || []
          const allJobRecs = recsByJob[job.id] || []
          const isExpanded = expandedJobs[job.id] ?? false
          const jobTitle = language === "ar" && job.title_ar ? job.title_ar : job.title
          const deptName = language === "ar" && job.departments?.name_ar ? job.departments.name_ar : job.departments?.name
          const locationText = job.locations
            ? language === "ar" && job.locations.name_ar
              ? job.locations.name_ar
              : job.locations.name || `${job.locations.city}, ${job.locations.country}`
            : null

          const strongCount = allJobRecs.filter((r) => r.recommendation === "strong_match").length
          const goodCount = allJobRecs.filter((r) => r.recommendation === "good_match").length
          const hasBeenScanned = allJobRecs.length > 0

          return (
            <Card key={job.id} className="border-border/50 overflow-hidden">
              {/* Job Header */}
              <button
                onClick={() => toggleJob(job.id)}
                className="w-full text-left"
              >
                <CardHeader className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base truncate">{jobTitle}</h3>
                          <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800 text-[10px] h-5">
                            {language === "ar" ? "مفتوحة" : "Open"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {deptName && <span>{deptName}</span>}
                          {locationText && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {locationText}
                            </span>
                          )}
                          {job.published_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {language === "ar" ? "نُشرت" : "Published"} {new Date(job.published_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Match Summary Badges */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {strongCount > 0 && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800 text-xs">
                          {strongCount} {language === "ar" ? "قوي" : "strong"}
                        </Badge>
                      )}
                      {goodCount > 0 && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800 text-xs">
                          {goodCount} {language === "ar" ? "جيد" : "good"}
                        </Badge>
                      )}
                      {hasBeenScanned ? (
                        <Badge variant="outline" className="text-xs">
                          {allJobRecs.length} {language === "ar" ? "توصية" : "recommended"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          {language === "ar" ? "لم يتم الفحص" : "Not scanned"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <CardContent className="p-0">
                  <Separator />

                  {/* Scan / Rescan Button */}
                  <div className={cn("px-4 py-3 bg-gradient-to-r from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 border-b flex items-center justify-between")}>
                    <div>
                      <span className="text-sm font-medium">
                        {language === "ar"
                          ? `${candidatePoolCount} مرشح في المجموعة`
                          : `${candidatePoolCount} candidates in talent pool`}
                      </span>
                      {hasBeenScanned && (
                        <p className="text-xs text-muted-foreground">
                          {language === "ar"
                            ? `آخر فحص: ${new Date(allJobRecs[0]?.created_at).toLocaleDateString()}`
                            : `Last scanned: ${new Date(allJobRecs[0]?.created_at).toLocaleDateString()}`}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleScanPool(job.id)
                      }}
                      disabled={scanningJob === job.id}
                      className="gap-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                    >
                      {scanningJob === job.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : hasBeenScanned ? (
                        <RefreshCw className="h-3.5 w-3.5" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      {scanningJob === job.id
                        ? language === "ar" ? "جاري الفحص..." : "Scanning..."
                        : hasBeenScanned
                          ? language === "ar" ? "إعادة الفحص" : "Rescan Pool"
                          : language === "ar" ? "البحث عن مواهب" : "Find Matching Talent"}
                    </Button>
                  </div>

                  {/* Recommendations List */}
                  {jobRecs.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">
                        {hasBeenScanned
                          ? language === "ar" ? "لا توجد نتائج تطابق الفلتر" : "No results match your filter"
                          : language === "ar"
                            ? "اضغط على \"البحث عن مواهب\" لفحص مجموعة المرشحين"
                            : "Click \"Find Matching Talent\" to scan your candidate pool"}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {jobRecs.map((rec) => {
                        const candidate = rec.candidates
                        if (!candidate) return null

                        const score = rec.overall_score || 0
                        const recType = rec.recommendation || "weak_match"
                        const recConfig = recommendationConfig[recType] || recommendationConfig.weak_match
                        const RecIcon = recConfig.icon
                        const screeningData = getScreeningData(rec)
                        const isAlreadyApplied = !!rec.application_id
                        const candidateKey = `${rec.candidate_id}-${rec.job_id}`

                        return (
                          <div key={rec.id} className="p-4 hover:bg-muted/20 transition-colors">
                            <div className="flex items-start gap-4">
                              {/* Avatar */}
                              <div className="flex-shrink-0">
                                {candidate.avatar_url ? (
                                  <img
                                    src={candidate.avatar_url}
                                    alt=""
                                    className="w-11 h-11 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                    {candidate.first_name?.[0]}{candidate.last_name?.[0]}
                                  </div>
                                )}
                              </div>

                              {/* Candidate Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium text-sm">
                                    {candidate.first_name} {candidate.last_name}
                                  </h4>
                                  <Badge className={cn("text-[10px] h-5 border", recConfig.bgColor, recConfig.color)}>
                                    <RecIcon className="h-3 w-3 mr-1" />
                                    {language === "ar" ? recConfig.labelAr : recConfig.label}
                                  </Badge>
                                  {isAlreadyApplied && (
                                    <Badge variant="outline" className="text-[10px] h-5 text-green-600 border-green-200">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      {language === "ar" ? "تم التقديم" : "Applied"}
                                    </Badge>
                                  )}
                                </div>

                                {candidate.current_title && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{candidate.current_title}</p>
                                )}

                                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                  {candidate.email && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {candidate.email}
                                    </span>
                                  )}
                                  {(candidate.city || candidate.country) && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {[candidate.city, candidate.country].filter(Boolean).join(", ")}
                                    </span>
                                  )}
                                  {candidate.years_of_experience && (
                                    <span className="flex items-center gap-1">
                                      <Briefcase className="h-3 w-3" />
                                      {candidate.years_of_experience} {language === "ar" ? "سنوات" : "yrs"}
                                    </span>
                                  )}
                                </div>

                                {/* Summary */}
                                {screeningData.summary && (
                                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                    {language === "ar" && screeningData.summaryAr ? screeningData.summaryAr : screeningData.summary}
                                  </p>
                                )}

                                {/* Strengths */}
                                {rec.strengths && rec.strengths.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {(rec.strengths as string[]).slice(0, 3).map((s, i) => (
                                      <Badge key={i} variant="secondary" className="text-[10px] h-5 font-normal">
                                        {s}
                                      </Badge>
                                    ))}
                                    {(rec.strengths as string[]).length > 3 && (
                                      <Badge variant="secondary" className="text-[10px] h-5 font-normal">
                                        +{(rec.strengths as string[]).length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Score & Actions */}
                              <div className="flex-shrink-0 flex flex-col items-end gap-2">
                                {/* Score */}
                                <div className="text-center">
                                  <div className={cn("text-2xl font-bold", getScoreColor(score))}>
                                    {score}
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    {language === "ar" ? "النتيجة" : "Score"}
                                  </p>
                                </div>

                                {/* Score Breakdown Mini */}
                                <div className="w-24 space-y-1">
                                  {rec.skills_match_score != null && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] text-muted-foreground w-10 truncate">
                                        {language === "ar" ? "مهارات" : "Skills"}
                                      </span>
                                      <Progress value={rec.skills_match_score} className={cn("h-1.5 flex-1", getProgressColor(rec.skills_match_score))} />
                                    </div>
                                  )}
                                  {rec.experience_score != null && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] text-muted-foreground w-10 truncate">
                                        {language === "ar" ? "خبرة" : "Exp"}
                                      </span>
                                      <Progress value={rec.experience_score} className={cn("h-1.5 flex-1", getProgressColor(rec.experience_score))} />
                                    </div>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    onClick={() => handleViewDetail(rec)}
                                    title={language === "ar" ? "عرض التفاصيل" : "View details"}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  {candidate.resume_url && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() => handleOpenResume(candidate.id)}
                                      title={language === "ar" ? "عرض السيرة الذاتية" : "View resume"}
                                    >
                                      <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  {!isAlreadyApplied && (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="h-7 px-2 text-xs gap-1"
                                      onClick={() => handleApplyToJob(rec)}
                                      disabled={applyingCandidate === candidateKey}
                                      title={language === "ar" ? "تقديم للوظيفة" : "Apply to job"}
                                    >
                                      {applyingCandidate === candidateKey ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <UserPlus className="h-3 w-3" />
                                      )}
                                      {language === "ar" ? "تقديم" : "Apply"}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}

        {/* Empty State */}
        {jobs.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="text-lg font-medium mb-1">
                {language === "ar" ? "لا توجد وظائف مفتوحة" : "No Open Jobs"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === "ar"
                  ? "انشر وظائف للبدء في اكتشاف المواهب من مجموعة المرشحين"
                  : "Publish jobs to start discovering talent from your candidate pool"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedRec && selectedRec.candidates && (() => {
            const candidate = selectedRec.candidates
            const score = selectedRec.overall_score || 0
            const recType = selectedRec.recommendation || "weak_match"
            const recConfig = recommendationConfig[recType] || recommendationConfig.weak_match
            const RecIcon = recConfig.icon
            const data = getScreeningData(selectedRec)
            const job = jobs.find((j) => j.id === selectedRec.job_id)
            const isAlreadyApplied = !!selectedRec.application_id

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {candidate.avatar_url ? (
                        <img src={candidate.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {candidate.first_name?.[0]}{candidate.last_name?.[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <span>{candidate.first_name} {candidate.last_name}</span>
                      {candidate.current_title && (
                        <p className="text-sm font-normal text-muted-foreground">{candidate.current_title}</p>
                      )}
                    </div>
                  </DialogTitle>
                  <DialogDescription>
                    {language === "ar" ? "توصية من مجموعة المواهب" : "Talent Pool Recommendation"}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 mt-2">
                  {/* Job & Score */}
                  <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "الوظيفة" : "Job Position"}</p>
                      <p className="font-medium text-sm">{language === "ar" && job?.title_ar ? job.title_ar : job?.title}</p>
                    </div>
                    <div className="text-center">
                      <div className={cn("text-3xl font-bold", getScoreColor(score))}>{score}</div>
                      <Badge className={cn("text-[10px] border mt-1", recConfig.bgColor, recConfig.color)}>
                        <RecIcon className="h-3 w-3 mr-1" />
                        {language === "ar" ? recConfig.labelAr : recConfig.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-wrap gap-3 text-sm">
                    {candidate.email && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-4 w-4" /> {candidate.email}
                      </span>
                    )}
                    {candidate.phone && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-4 w-4" /> {candidate.phone}
                      </span>
                    )}
                    {(candidate.city || candidate.country) && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-4 w-4" /> {[candidate.city, candidate.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>

                  <Separator />

                  {/* Score Breakdown */}
                  {(selectedRec.skills_match_score != null || selectedRec.experience_score != null || selectedRec.education_score != null) && (
                    <div>
                      <h4 className="font-medium text-sm mb-3">{language === "ar" ? "تفصيل النتيجة" : "Score Breakdown"}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: language === "ar" ? "المهارات" : "Skills Match", score: selectedRec.skills_match_score },
                          { label: language === "ar" ? "الخبرة" : "Experience", score: selectedRec.experience_score },
                          { label: language === "ar" ? "التعليم" : "Education", score: selectedRec.education_score },
                        ].filter(item => item.score != null).map((item) => (
                          <div key={item.label} className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{item.label}</span>
                              <span className={cn("font-medium", getScoreColor(item.score || 0))}>{item.score}%</span>
                            </div>
                            <Progress value={item.score || 0} className={cn("h-2", getProgressColor(item.score || 0))} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Summary */}
                  {data.summary && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">{language === "ar" ? "ملخص الذكاء الاصطناعي" : "AI Summary"}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {language === "ar" && data.summaryAr ? data.summaryAr : data.summary}
                      </p>
                    </div>
                  )}

                  {/* Skills Analysis */}
                  {data.skillAnalysis && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">{language === "ar" ? "تحليل المهارات" : "Skills Analysis"}</h4>
                      {data.skillAnalysis.matched && data.skillAnalysis.matched.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-muted-foreground mb-1">{language === "ar" ? "مهارات متطابقة" : "Matched Skills"}</p>
                          <div className="flex flex-wrap gap-1">
                            {data.skillAnalysis.matched.map((s, i) => (
                              <Badge key={i} className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800 text-[10px] h-5">
                                {s.skill}
                                {s.proficiency && <span className="opacity-70 ml-1">({s.proficiency})</span>}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {data.skillAnalysis.missing && data.skillAnalysis.missing.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{language === "ar" ? "مهارات مفقودة" : "Missing Skills"}</p>
                          <div className="flex flex-wrap gap-1">
                            {data.skillAnalysis.missing.map((s, i) => (
                              <Badge key={i} variant="outline" className="text-[10px] h-5 text-orange-600 border-orange-200 dark:text-orange-400">
                                {s.skill}
                                {s.importance && <span className="opacity-70 ml-1">({s.importance})</span>}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Strengths & Concerns */}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedRec.strengths && (selectedRec.strengths as string[]).length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-emerald-600 dark:text-emerald-400">
                          {language === "ar" ? "نقاط القوة" : "Strengths"}
                        </h4>
                        <ul className="space-y-1">
                          {(selectedRec.strengths as string[]).map((s, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedRec.concerns && (selectedRec.concerns as string[]).length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-amber-600 dark:text-amber-400">
                          {language === "ar" ? "نقاط الملاحظة" : "Concerns"}
                        </h4>
                        <ul className="space-y-1">
                          {(selectedRec.concerns as string[]).map((s, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Interview Focus */}
                  {data.interviewFocus && data.interviewFocus.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">{language === "ar" ? "محاور المقابلة المقترحة" : "Suggested Interview Focus"}</h4>
                      <ul className="space-y-1">
                        {data.interviewFocus.map((item, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <Target className="h-3 w-3 text-violet-500 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {candidate.resume_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleOpenResume(candidate.id)}
                      >
                        <FileText className="h-4 w-4" />
                        {language === "ar" ? "عرض السيرة الذاتية" : "View Resume"}
                      </Button>
                    )}
                    {!isAlreadyApplied ? (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          handleApplyToJob(selectedRec)
                          setIsDetailOpen(false)
                        }}
                        disabled={applyingCandidate === `${selectedRec.candidate_id}-${selectedRec.job_id}`}
                      >
                        <UserPlus className="h-4 w-4" />
                        {language === "ar" ? "تقديم للوظيفة" : "Apply to Job"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          setIsDetailOpen(false)
                          router.push(`/org/applications?candidate=${candidate.id}`)
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                        {language === "ar" ? "عرض الطلب" : "View Application"}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
