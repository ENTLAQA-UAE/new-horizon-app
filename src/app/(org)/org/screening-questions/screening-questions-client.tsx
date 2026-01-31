"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  supabaseInsert,
  supabaseUpdate,
  supabaseDelete,
} from "@/lib/supabase/auth-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Copy,
  Loader2,
  HelpCircle,
  AlertTriangle,
  GripVertical,
  Type,
  List,
  CheckSquare,
  ToggleLeft,
  FileUp,
  Hash,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import type { Json } from "@/lib/supabase/types"

interface ScreeningQuestion {
  id: string
  org_id: string
  job_id: string | null
  question: string
  question_ar: string | null
  description: string | null
  description_ar: string | null
  question_type: string
  options: string[] | null
  is_required: boolean
  min_value: number | null
  max_value: number | null
  min_length: number | null
  max_length: number | null
  is_knockout: boolean
  knockout_value: string | null
  scoring_weight: number | null
  ideal_answer: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

interface ScreeningQuestionsClientProps {
  questions: ScreeningQuestion[]
  jobs: { id: string; title: string }[]
  organizationId: string
}

interface QuestionFormData {
  question: string
  question_ar: string
  description: string
  description_ar: string
  question_type: string
  options: string[]
  is_required: boolean
  min_value: number | null
  max_value: number | null
  min_length: number | null
  max_length: number | null
  is_knockout: boolean
  knockout_value: string
  scoring_weight: number
  ideal_answer: string
  job_id: string
}

export function ScreeningQuestionsClient({
  questions: initialQuestions,
  jobs,
  organizationId,
}: ScreeningQuestionsClientProps) {
  const router = useRouter()
  const { t, language, isRTL } = useI18n()

  const questionTypes = [
    { value: "text", label: t("screeningQuestions.questionTypes.shortText"), icon: Type, description: t("screeningQuestions.questionTypeDescriptions.shortText") },
    { value: "textarea", label: t("screeningQuestions.questionTypes.longText"), icon: Type, description: t("screeningQuestions.questionTypeDescriptions.longText") },
    { value: "select", label: t("screeningQuestions.questionTypes.singleSelect"), icon: List, description: t("screeningQuestions.questionTypeDescriptions.singleSelect") },
    { value: "multiselect", label: t("screeningQuestions.questionTypes.multiSelect"), icon: CheckSquare, description: t("screeningQuestions.questionTypeDescriptions.multiSelect") },
    { value: "boolean", label: t("screeningQuestions.questionTypes.yesNo"), icon: ToggleLeft, description: t("screeningQuestions.questionTypeDescriptions.yesNo") },
    { value: "number", label: t("screeningQuestions.questionTypes.number"), icon: Hash, description: t("screeningQuestions.questionTypeDescriptions.number") },
    { value: "file", label: t("screeningQuestions.questionTypes.fileUpload"), icon: FileUp, description: t("screeningQuestions.questionTypeDescriptions.fileUpload") },
  ]

  const [questions, setQuestions] = useState(initialQuestions)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterJobId, setFilterJobId] = useState<string>("all")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<ScreeningQuestion | null>(null)
  const [deletingQuestion, setDeletingQuestion] = useState<ScreeningQuestion | null>(null)

  const [formData, setFormData] = useState<QuestionFormData>({
    question: "",
    question_ar: "",
    description: "",
    description_ar: "",
    question_type: "text",
    options: [""],
    is_required: false,
    min_value: null,
    max_value: null,
    min_length: null,
    max_length: null,
    is_knockout: false,
    knockout_value: "",
    scoring_weight: 1,
    ideal_answer: "",
    job_id: "global",
  })

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesJob = filterJobId === "all" || q.job_id === filterJobId || (filterJobId === "global" && !q.job_id)
    return matchesSearch && matchesJob
  })

  const stats = {
    total: questions.length,
    knockout: questions.filter((q) => q.is_knockout).length,
    required: questions.filter((q) => q.is_required).length,
  }

  const resetForm = () => {
    setFormData({
      question: "",
      question_ar: "",
      description: "",
      description_ar: "",
      question_type: "text",
      options: [""],
      is_required: false,
      min_value: null,
      max_value: null,
      min_length: null,
      max_length: null,
      is_knockout: false,
      knockout_value: "",
      scoring_weight: 1,
      ideal_answer: "",
      job_id: "global",
    })
    setEditingQuestion(null)
  }

  const handleSave = async () => {
    if (!formData.question) {
      toast.error(t("screeningQuestions.toast.enterQuestion"))
      return
    }

    if ((formData.question_type === "select" || formData.question_type === "multiselect") &&
        formData.options.filter(o => o.trim()).length < 2) {
      toast.error(t("screeningQuestions.toast.addAtLeastTwoOptions"))
      return
    }

    setIsLoading(true)
    try {
      const questionData = {
        org_id: organizationId,
        job_id: formData.job_id === "global" ? null : (formData.job_id || null),
        question: formData.question,
        question_ar: formData.question_ar || null,
        description: formData.description || null,
        description_ar: formData.description_ar || null,
        question_type: formData.question_type,
        options: (formData.question_type === "select" || formData.question_type === "multiselect")
          ? formData.options.filter(o => o.trim())
          : null,
        is_required: formData.is_required,
        min_value: formData.question_type === "number" ? formData.min_value : null,
        max_value: formData.question_type === "number" ? formData.max_value : null,
        min_length: formData.question_type === "text" || formData.question_type === "textarea"
          ? formData.min_length : null,
        max_length: formData.question_type === "text" || formData.question_type === "textarea"
          ? formData.max_length : null,
        is_knockout: formData.is_knockout,
        knockout_value: formData.is_knockout ? formData.knockout_value : null,
        scoring_weight: formData.scoring_weight,
        ideal_answer: formData.ideal_answer || null,
      }

      if (editingQuestion) {
        const { data, error } = await supabaseUpdate<ScreeningQuestion>(
          "screening_questions",
          { ...questionData, updated_at: new Date().toISOString() },
          { column: "id", value: editingQuestion.id }
        )

        if (error) throw new Error(error.message)
        if (data) {
          setQuestions(questions.map((q) => (q.id === editingQuestion.id ? data : q)))
        }
        toast.success(t("screeningQuestions.toast.questionUpdated"))
      } else {
        const maxOrder = questions.length > 0 ? Math.max(...questions.map((q) => q.sort_order)) : 0
        const { data, error } = await supabaseInsert<ScreeningQuestion>(
          "screening_questions",
          {
            ...questionData,
            sort_order: maxOrder + 1,
            is_active: true,
          }
        )

        if (error) throw new Error(error.message)
        if (data) {
          setQuestions([...questions, data])
        }
        toast.success(t("screeningQuestions.toast.questionCreated"))
      }

      setIsDialogOpen(false)
      resetForm()
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || t("screeningQuestions.toast.saveFailed"))
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingQuestion) return

    setIsLoading(true)
    try {
      const { error } = await supabaseDelete(
        "screening_questions",
        { column: "id", value: deletingQuestion.id }
      )

      if (error) throw new Error(error.message)

      setQuestions(questions.filter((q) => q.id !== deletingQuestion.id))
      setIsDeleteDialogOpen(false)
      setDeletingQuestion(null)
      toast.success(t("screeningQuestions.toast.questionDeleted"))
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || t("screeningQuestions.toast.deleteFailed"))
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDuplicate = async (question: ScreeningQuestion) => {
    setIsLoading(true)
    try {
      const maxOrder = questions.length > 0 ? Math.max(...questions.map((q) => q.sort_order)) : 0
      const { data, error } = await supabaseInsert<ScreeningQuestion>(
        "screening_questions",
        {
          org_id: organizationId,
          job_id: question.job_id,
          question: `${question.question} ${t("screeningQuestions.copySuffix")}`,
          question_ar: question.question_ar,
          description: question.description,
          description_ar: question.description_ar,
          question_type: question.question_type,
          options: question.options,
          is_required: question.is_required,
          min_value: question.min_value,
          max_value: question.max_value,
          min_length: question.min_length,
          max_length: question.max_length,
          is_knockout: question.is_knockout,
          knockout_value: question.knockout_value,
          scoring_weight: question.scoring_weight,
          ideal_answer: question.ideal_answer,
          sort_order: maxOrder + 1,
          is_active: true,
        }
      )

      if (error) throw new Error(error.message)
      if (data) {
        setQuestions([...questions, data])
        toast.success(t("screeningQuestions.toast.questionDuplicated"))
      }
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || t("screeningQuestions.toast.duplicateFailed"))
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (question: ScreeningQuestion) => {
    setEditingQuestion(question)
    setFormData({
      question: question.question,
      question_ar: question.question_ar || "",
      description: question.description || "",
      description_ar: question.description_ar || "",
      question_type: question.question_type,
      options: question.options || [""],
      is_required: question.is_required,
      min_value: question.min_value,
      max_value: question.max_value,
      min_length: question.min_length,
      max_length: question.max_length,
      is_knockout: question.is_knockout,
      knockout_value: question.knockout_value || "",
      scoring_weight: question.scoring_weight || 1,
      ideal_answer: question.ideal_answer || "",
      job_id: question.job_id || "global",
    })
    setIsDialogOpen(true)
  }

  const getQuestionTypeConfig = (type: string) =>
    questionTypes.find((t) => t.value === type) || questionTypes[0]

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ""] })
  }

  const removeOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    })
  }

  const updateOption = (index: number, value: string) => {
    setFormData({
      ...formData,
      options: formData.options.map((opt, i) => (i === index ? value : opt)),
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("nav.screeningQuestions")}</h2>
          <p className="text-muted-foreground">
            {t("screeningQuestions.description")}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          {t("screeningQuestions.addQuestion")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("screeningQuestions.totalQuestions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("common.form.required")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.required}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("screeningQuestions.knockout")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.knockout}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("screeningQuestions.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterJobId} onValueChange={setFilterJobId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t("screeningQuestions.allQuestions")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("screeningQuestions.allQuestions")}</SelectItem>
            <SelectItem value="global">{t("screeningQuestions.globalAllJobs")}</SelectItem>
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Questions Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>{t("screeningQuestions.question")}</TableHead>
              <TableHead>{t("screeningQuestions.type")}</TableHead>
              <TableHead>{t("screeningQuestions.scope")}</TableHead>
              <TableHead className="w-24">{t("common.table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuestions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">{t("screeningQuestions.noQuestionsFound")}</p>
                  <Button
                    variant="link"
                    onClick={() => { resetForm(); setIsDialogOpen(true); }}
                    className="mt-2"
                  >
                    {t("screeningQuestions.addFirstQuestion")}
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              filteredQuestions.map((question) => {
                const typeConfig = getQuestionTypeConfig(question.question_type)
                const TypeIcon = typeConfig.icon
                return (
                  <TableRow key={question.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{question.question}</span>
                          {question.is_required && (
                            <Badge variant="outline" className="text-xs">{t("common.form.required")}</Badge>
                          )}
                          {question.is_knockout && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {t("screeningQuestions.knockout")}
                            </Badge>
                          )}
                        </div>
                        {question.question_ar && (
                          <p className="text-sm text-muted-foreground" dir="rtl">
                            {question.question_ar}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{typeConfig.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {question.job_id ? (
                        <Badge variant="secondary">
                          {jobs.find((j) => j.id === question.job_id)?.title || t("screeningQuestions.jobSpecific")}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{t("screeningQuestions.global")}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(question)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDuplicate(question)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            setDeletingQuestion(question)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? t("screeningQuestions.editQuestion") : t("screeningQuestions.addQuestion")}
            </DialogTitle>
            <DialogDescription>
              {t("screeningQuestions.dialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Question Text */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("screeningQuestions.questionEnglish")}</Label>
                <Textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder={t("screeningQuestions.questionEnglishPlaceholder")}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("screeningQuestions.questionArabic")}</Label>
                <Textarea
                  value={formData.question_ar}
                  onChange={(e) => setFormData({ ...formData, question_ar: e.target.value })}
                  placeholder={t("screeningQuestions.questionArabicPlaceholder")}
                  rows={2}
                  dir="rtl"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>{t("screeningQuestions.descriptionOptional")}</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("screeningQuestions.descriptionPlaceholder")}
              />
            </div>

            {/* Question Type */}
            <div className="space-y-2">
              <Label>{t("screeningQuestions.questionType")}</Label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {questionTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      type="button"
                      className={cn(
                        "p-3 border rounded-lg text-left transition-colors",
                        formData.question_type === type.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => setFormData({ ...formData, question_type: type.value })}
                    >
                      <Icon className="h-5 w-5 mb-1" />
                      <p className="text-sm font-medium">{type.label}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Options for Select/Multi-select */}
            {(formData.question_type === "select" || formData.question_type === "multiselect") && (
              <div className="space-y-2">
                <Label>{t("screeningQuestions.options")}</Label>
                <div className="space-y-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={t("screeningQuestions.optionPlaceholder", { number: index + 1 })}
                      />
                      {formData.options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("screeningQuestions.addOption")}
                  </Button>
                </div>
              </div>
            )}

            {/* Number constraints */}
            {formData.question_type === "number" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("screeningQuestions.minimumValue")}</Label>
                  <Input
                    type="number"
                    value={formData.min_value ?? ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      min_value: e.target.value ? parseInt(e.target.value) : null
                    })}
                    placeholder={t("screeningQuestions.noMinimum")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("screeningQuestions.maximumValue")}</Label>
                  <Input
                    type="number"
                    value={formData.max_value ?? ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      max_value: e.target.value ? parseInt(e.target.value) : null
                    })}
                    placeholder={t("screeningQuestions.noMaximum")}
                  />
                </div>
              </div>
            )}

            {/* Text constraints */}
            {(formData.question_type === "text" || formData.question_type === "textarea") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("screeningQuestions.minimumLength")}</Label>
                  <Input
                    type="number"
                    value={formData.min_length ?? ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      min_length: e.target.value ? parseInt(e.target.value) : null
                    })}
                    placeholder={t("screeningQuestions.noMinimum")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("screeningQuestions.maximumLength")}</Label>
                  <Input
                    type="number"
                    value={formData.max_length ?? ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      max_length: e.target.value ? parseInt(e.target.value) : null
                    })}
                    placeholder={t("screeningQuestions.noMaximum")}
                  />
                </div>
              </div>
            )}

            {/* Job scope */}
            <div className="space-y-2">
              <Label>{t("screeningQuestions.applyToJob")}</Label>
              <Select
                value={formData.job_id}
                onValueChange={(value) => setFormData({ ...formData, job_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("screeningQuestions.allJobsGlobal")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">{t("screeningQuestions.allJobsGlobal")}</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("screeningQuestions.globalQuestionsHint")}
              </p>
            </div>

            {/* Required & Knockout */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>{t("common.form.required")}</Label>
                  <p className="text-sm text-muted-foreground">{t("screeningQuestions.mustBeAnswered")}</p>
                </div>
                <Switch
                  checked={formData.is_required}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_required: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>{t("screeningQuestions.knockoutQuestion")}</Label>
                  <p className="text-sm text-muted-foreground">{t("screeningQuestions.autoRejectWrongAnswer")}</p>
                </div>
                <Switch
                  checked={formData.is_knockout}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_knockout: checked })
                  }
                />
              </div>
            </div>

            {/* Knockout value */}
            {formData.is_knockout && (
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <Label className="text-red-700">{t("screeningQuestions.knockoutValue")}</Label>
                <p className="text-sm text-red-600 mb-2">
                  {t("screeningQuestions.knockoutDescription")}
                </p>
                {formData.question_type === "boolean" ? (
                  <Select
                    value={formData.knockout_value}
                    onValueChange={(value) => setFormData({ ...formData, knockout_value: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("screeningQuestions.selectDisqualifyingAnswer")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">{t("common.yes")}</SelectItem>
                      <SelectItem value="no">{t("common.no")}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (formData.question_type === "select" || formData.question_type === "multiselect") ? (
                  <Select
                    value={formData.knockout_value}
                    onValueChange={(value) => setFormData({ ...formData, knockout_value: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("screeningQuestions.selectDisqualifyingOption")} />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.options.filter(o => o.trim()).map((option, index) => (
                        <SelectItem key={index} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={formData.knockout_value}
                    onChange={(e) => setFormData({ ...formData, knockout_value: e.target.value })}
                    placeholder={t("screeningQuestions.enterDisqualifyingAnswer")}
                  />
                )}
              </div>
            )}

            {/* Scoring */}
            <div className="space-y-2">
              <Label>{t("screeningQuestions.scoringWeight")}</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  value={formData.scoring_weight}
                  onChange={(e) => setFormData({
                    ...formData,
                    scoring_weight: parseInt(e.target.value) || 1
                  })}
                  min={1}
                  max={10}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">
                  {t("screeningQuestions.scoringWeightHint")}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingQuestion ? t("screeningQuestions.update") : t("screeningQuestions.addQuestion")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("screeningQuestions.deleteQuestion")}</DialogTitle>
            <DialogDescription>
              {t("screeningQuestions.deleteConfirmation")}
            </DialogDescription>
          </DialogHeader>
          {deletingQuestion && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{deletingQuestion.question}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
