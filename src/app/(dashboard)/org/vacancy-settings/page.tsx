"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Pencil,
  Trash2,
  Loader2,
  GripVertical,
  FileText,
  Layers,
  Briefcase,
  Award,
  MapPin,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types
interface ApplicationQuestion {
  id: string
  question: string
  question_ar: string | null
  field_type: string
  options: string[] | null
  is_required: boolean
  sort_order: number
  is_active: boolean
}

interface HiringStage {
  id: string
  name: string
  name_ar: string | null
  color: string
  sort_order: number
  is_active: boolean
}

interface JobType {
  id: string
  name: string
  name_ar: string | null
  is_active: boolean
}

interface JobGrade {
  id: string
  name: string
  name_ar: string | null
  level: number
  is_active: boolean
}

interface Location {
  id: string
  name: string
  name_ar: string | null
  address: string | null
  city: string | null
  country: string | null
  is_active: boolean
}

const fieldTypes = [
  { value: "text", label: "Text Input" },
  { value: "textarea", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown (Single)" },
  { value: "multiselect", label: "Multiple Choice" },
  { value: "radio", label: "Radio Buttons" },
  { value: "checkbox", label: "Checkbox" },
  { value: "file", label: "File Upload" },
  { value: "url", label: "URL/Link" },
]

const stageColors = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
]

export default function VacancySettingsPage() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("questions")
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  // Data states
  const [questions, setQuestions] = useState<ApplicationQuestion[]>([])
  const [stages, setStages] = useState<HiringStage[]>([])
  const [jobTypes, setJobTypes] = useState<JobType[]>([])
  const [jobGrades, setJobGrades] = useState<JobGrade[]>([])
  const [locations, setLocations] = useState<Location[]>([])

  // Dialog states
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false)
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false)
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false)
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Edit states
  const [editingQuestion, setEditingQuestion] = useState<ApplicationQuestion | null>(null)
  const [editingStage, setEditingStage] = useState<HiringStage | null>(null)
  const [editingType, setEditingType] = useState<JobType | null>(null)
  const [editingGrade, setEditingGrade] = useState<JobGrade | null>(null)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [deleteItem, setDeleteItem] = useState<{ type: string; id: string; name: string } | null>(null)

  // Form states
  const [questionForm, setQuestionForm] = useState({
    question: "",
    question_ar: "",
    field_type: "text",
    options: "",
    is_required: false,
  })
  const [stageForm, setStageForm] = useState({
    name: "",
    name_ar: "",
    color: "#3B82F6",
  })
  const [typeForm, setTypeForm] = useState({ name: "", name_ar: "" })
  const [gradeForm, setGradeForm] = useState({ name: "", name_ar: "", level: 1 })
  const [locationForm, setLocationForm] = useState({
    name: "",
    name_ar: "",
    address: "",
    city: "",
    country: "",
  })

  const [isSaving, setIsSaving] = useState(false)

  // Load organization ID and all data
  useEffect(() => {
    loadOrganizationAndData()
  }, [])

  async function loadOrganizationAndData() {
    setIsLoading(true)
    try {
      // Get current user's organization
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single()

      const orgId = profile?.organization_id
      if (!orgId) {
        console.error("User has no organization")
        setIsLoading(false)
        return
      }

      setOrganizationId(orgId)
      await loadAllData(orgId)
    } catch (error) {
      console.error("Error loading organization:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadAllData(orgId: string) {
    try {
      const [questionsRes, stagesRes, typesRes, gradesRes, locationsRes] = await Promise.all([
        supabase.from("application_questions").select("*").eq("organization_id", orgId).order("sort_order"),
        supabase.from("hiring_stages").select("*").eq("organization_id", orgId).order("sort_order"),
        supabase.from("job_types").select("*").eq("organization_id", orgId).order("name"),
        supabase.from("job_grades").select("*").eq("organization_id", orgId).order("level"),
        supabase.from("locations").select("*").eq("organization_id", orgId).order("name"),
      ])

      setQuestions(questionsRes.data || [])
      setStages(stagesRes.data || [])
      setJobTypes(typesRes.data || [])
      setJobGrades(gradesRes.data || [])
      setLocations(locationsRes.data || [])
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  // Question CRUD
  const handleSaveQuestion = async () => {
    if (!questionForm.question || !organizationId) {
      toast.error("Question is required")
      return
    }

    setIsSaving(true)
    try {
      const data = {
        question: questionForm.question,
        question_ar: questionForm.question_ar || null,
        field_type: questionForm.field_type,
        options: questionForm.options ? questionForm.options.split("\n").filter(o => o.trim()) : null,
        is_required: questionForm.is_required,
        sort_order: editingQuestion?.sort_order || questions.length + 1,
        is_active: true,
        organization_id: organizationId,
      }

      if (editingQuestion) {
        const { error } = await supabase
          .from("application_questions")
          .update(data)
          .eq("id", editingQuestion.id)
        if (error) throw error
        setQuestions(questions.map(q => q.id === editingQuestion.id ? { ...q, ...data } : q))
        toast.success("Question updated")
      } else {
        const { data: newQuestion, error } = await supabase
          .from("application_questions")
          .insert(data)
          .select()
          .single()
        if (error) throw error
        setQuestions([...questions, newQuestion])
        toast.success("Question added")
      }
      setIsQuestionDialogOpen(false)
      resetQuestionForm()
    } catch (error: any) {
      toast.error(error.message || "Failed to save question")
    } finally {
      setIsSaving(false)
    }
  }

  // Stage CRUD
  const handleSaveStage = async () => {
    if (!stageForm.name || !organizationId) {
      toast.error("Stage name is required")
      return
    }

    setIsSaving(true)
    try {
      const data = {
        name: stageForm.name,
        name_ar: stageForm.name_ar || null,
        color: stageForm.color,
        sort_order: editingStage?.sort_order || stages.length + 1,
        is_active: true,
        organization_id: organizationId,
      }

      if (editingStage) {
        const { error } = await supabase
          .from("hiring_stages")
          .update(data)
          .eq("id", editingStage.id)
        if (error) throw error
        setStages(stages.map(s => s.id === editingStage.id ? { ...s, ...data } : s))
        toast.success("Stage updated")
      } else {
        const { data: newStage, error } = await supabase
          .from("hiring_stages")
          .insert(data)
          .select()
          .single()
        if (error) throw error
        setStages([...stages, newStage])
        toast.success("Stage added")
      }
      setIsStageDialogOpen(false)
      resetStageForm()
    } catch (error: any) {
      toast.error(error.message || "Failed to save stage")
    } finally {
      setIsSaving(false)
    }
  }

  // Job Type CRUD
  const handleSaveType = async () => {
    if (!typeForm.name || !organizationId) {
      toast.error("Type name is required")
      return
    }

    setIsSaving(true)
    try {
      const data = {
        name: typeForm.name,
        name_ar: typeForm.name_ar || null,
        is_active: true,
        organization_id: organizationId,
      }

      if (editingType) {
        const { error } = await supabase
          .from("job_types")
          .update(data)
          .eq("id", editingType.id)
        if (error) throw error
        setJobTypes(jobTypes.map(t => t.id === editingType.id ? { ...t, ...data } : t))
        toast.success("Job type updated")
      } else {
        const { data: newType, error } = await supabase
          .from("job_types")
          .insert(data)
          .select()
          .single()
        if (error) throw error
        setJobTypes([...jobTypes, newType])
        toast.success("Job type added")
      }
      setIsTypeDialogOpen(false)
      resetTypeForm()
    } catch (error: any) {
      toast.error(error.message || "Failed to save job type")
    } finally {
      setIsSaving(false)
    }
  }

  // Job Grade CRUD
  const handleSaveGrade = async () => {
    if (!gradeForm.name || !organizationId) {
      toast.error("Grade name is required")
      return
    }

    setIsSaving(true)
    try {
      const data = {
        name: gradeForm.name,
        name_ar: gradeForm.name_ar || null,
        level: gradeForm.level,
        is_active: true,
        organization_id: organizationId,
      }

      if (editingGrade) {
        const { error } = await supabase
          .from("job_grades")
          .update(data)
          .eq("id", editingGrade.id)
        if (error) throw error
        setJobGrades(jobGrades.map(g => g.id === editingGrade.id ? { ...g, ...data } : g))
        toast.success("Job grade updated")
      } else {
        const { data: newGrade, error } = await supabase
          .from("job_grades")
          .insert(data)
          .select()
          .single()
        if (error) throw error
        setJobGrades([...jobGrades, newGrade])
        toast.success("Job grade added")
      }
      setIsGradeDialogOpen(false)
      resetGradeForm()
    } catch (error: any) {
      toast.error(error.message || "Failed to save job grade")
    } finally {
      setIsSaving(false)
    }
  }

  // Location CRUD
  const handleSaveLocation = async () => {
    if (!locationForm.name || !organizationId) {
      toast.error("Location name is required")
      return
    }

    setIsSaving(true)
    try {
      const data = {
        name: locationForm.name,
        name_ar: locationForm.name_ar || null,
        address: locationForm.address || null,
        city: locationForm.city || null,
        country: locationForm.country || null,
        is_active: true,
        organization_id: organizationId,
      }

      if (editingLocation) {
        const { error } = await supabase
          .from("locations")
          .update(data)
          .eq("id", editingLocation.id)
        if (error) throw error
        setLocations(locations.map(l => l.id === editingLocation.id ? { ...l, ...data } : l))
        toast.success("Location updated")
      } else {
        const { data: newLocation, error } = await supabase
          .from("locations")
          .insert(data)
          .select()
          .single()
        if (error) throw error
        setLocations([...locations, newLocation])
        toast.success("Location added")
      }
      setIsLocationDialogOpen(false)
      resetLocationForm()
    } catch (error: any) {
      toast.error(error.message || "Failed to save location")
    } finally {
      setIsSaving(false)
    }
  }

  // Delete handler
  const handleDelete = async () => {
    if (!deleteItem) return

    setIsSaving(true)
    try {
      const tableMap: Record<string, string> = {
        question: "application_questions",
        stage: "hiring_stages",
        type: "job_types",
        grade: "job_grades",
        location: "locations",
      }

      const { error } = await supabase
        .from(tableMap[deleteItem.type])
        .delete()
        .eq("id", deleteItem.id)

      if (error) throw error

      // Update local state
      switch (deleteItem.type) {
        case "question":
          setQuestions(questions.filter(q => q.id !== deleteItem.id))
          break
        case "stage":
          setStages(stages.filter(s => s.id !== deleteItem.id))
          break
        case "type":
          setJobTypes(jobTypes.filter(t => t.id !== deleteItem.id))
          break
        case "grade":
          setJobGrades(jobGrades.filter(g => g.id !== deleteItem.id))
          break
        case "location":
          setLocations(locations.filter(l => l.id !== deleteItem.id))
          break
      }

      toast.success("Deleted successfully")
      setIsDeleteDialogOpen(false)
      setDeleteItem(null)
    } catch (error: any) {
      toast.error(error.message || "Failed to delete")
    } finally {
      setIsSaving(false)
    }
  }

  // Toggle active status
  const toggleActive = async (type: string, id: string, currentStatus: boolean) => {
    const tableMap: Record<string, string> = {
      question: "application_questions",
      stage: "hiring_stages",
      type: "job_types",
      grade: "job_grades",
      location: "locations",
    }

    try {
      const { error } = await supabase
        .from(tableMap[type])
        .update({ is_active: !currentStatus })
        .eq("id", id)

      if (error) throw error

      // Update local state
      switch (type) {
        case "question":
          setQuestions(questions.map(q => q.id === id ? { ...q, is_active: !currentStatus } : q))
          break
        case "stage":
          setStages(stages.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s))
          break
        case "type":
          setJobTypes(jobTypes.map(t => t.id === id ? { ...t, is_active: !currentStatus } : t))
          break
        case "grade":
          setJobGrades(jobGrades.map(g => g.id === id ? { ...g, is_active: !currentStatus } : g))
          break
        case "location":
          setLocations(locations.map(l => l.id === id ? { ...l, is_active: !currentStatus } : l))
          break
      }

      toast.success(`${currentStatus ? "Disabled" : "Enabled"} successfully`)
    } catch (error: any) {
      toast.error(error.message || "Failed to update status")
    }
  }

  // Reset form functions
  const resetQuestionForm = () => {
    setQuestionForm({ question: "", question_ar: "", field_type: "text", options: "", is_required: false })
    setEditingQuestion(null)
  }

  const resetStageForm = () => {
    setStageForm({ name: "", name_ar: "", color: "#3B82F6" })
    setEditingStage(null)
  }

  const resetTypeForm = () => {
    setTypeForm({ name: "", name_ar: "" })
    setEditingType(null)
  }

  const resetGradeForm = () => {
    setGradeForm({ name: "", name_ar: "", level: 1 })
    setEditingGrade(null)
  }

  const resetLocationForm = () => {
    setLocationForm({ name: "", name_ar: "", address: "", city: "", country: "" })
    setEditingLocation(null)
  }

  // Edit handlers
  const openEditQuestion = (question: ApplicationQuestion) => {
    setEditingQuestion(question)
    setQuestionForm({
      question: question.question,
      question_ar: question.question_ar || "",
      field_type: question.field_type,
      options: question.options?.join("\n") || "",
      is_required: question.is_required,
    })
    setIsQuestionDialogOpen(true)
  }

  const openEditStage = (stage: HiringStage) => {
    setEditingStage(stage)
    setStageForm({
      name: stage.name,
      name_ar: stage.name_ar || "",
      color: stage.color,
    })
    setIsStageDialogOpen(true)
  }

  const openEditType = (type: JobType) => {
    setEditingType(type)
    setTypeForm({
      name: type.name,
      name_ar: type.name_ar || "",
    })
    setIsTypeDialogOpen(true)
  }

  const openEditGrade = (grade: JobGrade) => {
    setEditingGrade(grade)
    setGradeForm({
      name: grade.name,
      name_ar: grade.name_ar || "",
      level: grade.level,
    })
    setIsGradeDialogOpen(true)
  }

  const openEditLocation = (location: Location) => {
    setEditingLocation(location)
    setLocationForm({
      name: location.name,
      name_ar: location.name_ar || "",
      address: location.address || "",
      city: location.city || "",
      country: location.country || "",
    })
    setIsLocationDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Vacancy Settings</h2>
        <p className="text-muted-foreground">
          Configure application forms, hiring stages, job types, grades, and locations
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Questions</span>
          </TabsTrigger>
          <TabsTrigger value="stages" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Stages</span>
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Types</span>
          </TabsTrigger>
          <TabsTrigger value="grades" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Grades</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Locations</span>
          </TabsTrigger>
        </TabsList>

        {/* Application Questions Tab */}
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Application Form Questions</CardTitle>
                <CardDescription>
                  Define custom questions for job applications
                </CardDescription>
              </div>
              <Button onClick={() => { resetQuestionForm(); setIsQuestionDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No questions added yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    questions.map((q, index) => (
                      <TableRow key={q.id}>
                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{q.question}</p>
                            {q.question_ar && (
                              <p className="text-sm text-muted-foreground" dir="rtl">{q.question_ar}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {fieldTypes.find(f => f.value === q.field_type)?.label || q.field_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {q.is_required ? (
                            <Badge variant="default">Required</Badge>
                          ) : (
                            <Badge variant="secondary">Optional</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={q.is_active}
                            onCheckedChange={() => toggleActive("question", q.id, q.is_active)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditQuestion(q)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeleteItem({ type: "question", id: q.id, name: q.question })
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hiring Stages Tab */}
        <TabsContent value="stages" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Hiring Stages</CardTitle>
                <CardDescription>
                  Define the stages of your hiring pipeline
                </CardDescription>
              </div>
              <Button onClick={() => { resetStageForm(); setIsStageDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Stage
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Stage Name</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No stages added yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    stages.map((s, index) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{s.name}</p>
                            {s.name_ar && (
                              <p className="text-sm text-muted-foreground" dir="rtl">{s.name_ar}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full"
                              style={{ backgroundColor: s.color }}
                            />
                            <span className="text-sm text-muted-foreground">{s.color}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={s.is_active}
                            onCheckedChange={() => toggleActive("stage", s.id, s.is_active)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditStage(s)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeleteItem({ type: "stage", id: s.id, name: s.name })
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Job Types Tab */}
        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Job Types</CardTitle>
                <CardDescription>
                  Define employment types (Full-time, Part-time, etc.)
                </CardDescription>
              </div>
              <Button onClick={() => { resetTypeForm(); setIsTypeDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Type
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No job types added yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobTypes.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{t.name}</p>
                            {t.name_ar && (
                              <p className="text-sm text-muted-foreground" dir="rtl">{t.name_ar}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={t.is_active}
                            onCheckedChange={() => toggleActive("type", t.id, t.is_active)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditType(t)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeleteItem({ type: "type", id: t.id, name: t.name })
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Job Grades Tab */}
        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Job Grades</CardTitle>
                <CardDescription>
                  Define job grades/levels for your organization
                </CardDescription>
              </div>
              <Button onClick={() => { resetGradeForm(); setIsGradeDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Grade
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Level</TableHead>
                    <TableHead>Grade Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobGrades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No job grades added yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobGrades.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell>
                          <Badge variant="outline">Level {g.level}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{g.name}</p>
                            {g.name_ar && (
                              <p className="text-sm text-muted-foreground" dir="rtl">{g.name_ar}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={g.is_active}
                            onCheckedChange={() => toggleActive("grade", g.id, g.is_active)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditGrade(g)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeleteItem({ type: "grade", id: g.id, name: g.name })
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Office Locations</CardTitle>
                <CardDescription>
                  Define your organization&apos;s office locations
                </CardDescription>
              </div>
              <Button onClick={() => { resetLocationForm(); setIsLocationDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No locations added yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    locations.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{l.name}</p>
                            {l.name_ar && (
                              <p className="text-sm text-muted-foreground" dir="rtl">{l.name_ar}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{l.city || "-"}</TableCell>
                        <TableCell>{l.country || "-"}</TableCell>
                        <TableCell>
                          <Switch
                            checked={l.is_active}
                            onCheckedChange={() => toggleActive("location", l.id, l.is_active)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditLocation(l)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeleteItem({ type: "location", id: l.id, name: l.name })
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? "Edit Question" : "Add Question"}</DialogTitle>
            <DialogDescription>
              Configure the application form question
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Question (English) *</Label>
              <Input
                value={questionForm.question}
                onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                placeholder="e.g., What is your expected salary?"
              />
            </div>
            <div className="space-y-2">
              <Label>Question (Arabic)</Label>
              <Input
                value={questionForm.question_ar}
                onChange={(e) => setQuestionForm({ ...questionForm, question_ar: e.target.value })}
                placeholder="مثال: ما هو راتبك المتوقع؟"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label>Field Type</Label>
              <Select
                value={questionForm.field_type}
                onValueChange={(value) => setQuestionForm({ ...questionForm, field_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {["select", "multiselect", "radio"].includes(questionForm.field_type) && (
              <div className="space-y-2">
                <Label>Options (one per line)</Label>
                <Textarea
                  value={questionForm.options}
                  onChange={(e) => setQuestionForm({ ...questionForm, options: e.target.value })}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                  rows={4}
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch
                checked={questionForm.is_required}
                onCheckedChange={(checked) => setQuestionForm({ ...questionForm, is_required: checked })}
              />
              <Label>Required field</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuestion} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingQuestion ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage Dialog */}
      <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStage ? "Edit Stage" : "Add Stage"}</DialogTitle>
            <DialogDescription>
              Configure the hiring pipeline stage
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Stage Name (English) *</Label>
              <Input
                value={stageForm.name}
                onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                placeholder="e.g., Phone Screening"
              />
            </div>
            <div className="space-y-2">
              <Label>Stage Name (Arabic)</Label>
              <Input
                value={stageForm.name_ar}
                onChange={(e) => setStageForm({ ...stageForm, name_ar: e.target.value })}
                placeholder="مثال: المقابلة الهاتفية"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {stageColors.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-8 h-8 rounded-full border-2",
                      stageForm.color === color ? "border-foreground" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setStageForm({ ...stageForm, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStage} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingStage ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Type Dialog */}
      <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingType ? "Edit Job Type" : "Add Job Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type Name (English) *</Label>
              <Input
                value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                placeholder="e.g., Full-time"
              />
            </div>
            <div className="space-y-2">
              <Label>Type Name (Arabic)</Label>
              <Input
                value={typeForm.name_ar}
                onChange={(e) => setTypeForm({ ...typeForm, name_ar: e.target.value })}
                placeholder="مثال: دوام كامل"
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTypeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveType} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingType ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Grade Dialog */}
      <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGrade ? "Edit Job Grade" : "Add Job Grade"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Grade Name (English) *</Label>
              <Input
                value={gradeForm.name}
                onChange={(e) => setGradeForm({ ...gradeForm, name: e.target.value })}
                placeholder="e.g., Senior Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label>Grade Name (Arabic)</Label>
              <Input
                value={gradeForm.name_ar}
                onChange={(e) => setGradeForm({ ...gradeForm, name_ar: e.target.value })}
                placeholder="مثال: مهندس أول"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Input
                type="number"
                min="1"
                value={gradeForm.level}
                onChange={(e) => setGradeForm({ ...gradeForm, level: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground">
                Higher level = more senior position
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGradeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGrade} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingGrade ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Dialog */}
      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLocation ? "Edit Location" : "Add Location"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Location Name (English) *</Label>
              <Input
                value={locationForm.name}
                onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                placeholder="e.g., Head Office"
              />
            </div>
            <div className="space-y-2">
              <Label>Location Name (Arabic)</Label>
              <Input
                value={locationForm.name_ar}
                onChange={(e) => setLocationForm({ ...locationForm, name_ar: e.target.value })}
                placeholder="مثال: المكتب الرئيسي"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={locationForm.address}
                onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={locationForm.city}
                  onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                  placeholder="Riyadh"
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={locationForm.country}
                  onChange={(e) => setLocationForm({ ...locationForm, country: e.target.value })}
                  placeholder="Saudi Arabia"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLocationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLocation} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingLocation ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Confirmation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteItem?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
