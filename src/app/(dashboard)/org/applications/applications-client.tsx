"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import {
  Search,
  MoreHorizontal,
  FileText,
  Filter,
  Loader2,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  ArrowRight,
  MessageSquare,
  Download,
  ChevronRight,
  LayoutGrid,
  List,
  Clock,
  User,
  Briefcase,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Candidate {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  current_job_title: string | null
  resume_url: string | null
}

interface Job {
  id: string
  title: string
  title_ar: string | null
  department_id: string | null
  location: string | null
}

interface Application {
  id: string
  candidate_id: string
  job_id: string
  stage: string | null
  status: string | null
  score: number | null
  notes: string | null
  applied_at: string | null
  created_at: string | null
  updated_at: string | null
  candidates: Candidate | null
  jobs: Job | null
}

interface Stage {
  id: string
  name: string
  color: string
}

interface ApplicationsClientProps {
  applications: Application[]
  jobs: { id: string; title: string; title_ar: string | null; status: string }[]
  stages: Stage[]
}

const stageStyles: Record<string, string> = {
  applied: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  screening: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  interview: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  assessment: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  offer: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  hired: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export function ApplicationsClient({
  applications: initialApplications,
  jobs,
  stages,
}: ApplicationsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [applications, setApplications] = useState(initialApplications)
  const [searchQuery, setSearchQuery] = useState("")
  const [stageFilter, setStageFilter] = useState<string>("all")
  const [jobFilter, setJobFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"pipeline" | "table">("pipeline")

  // Dialog states
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Selected application
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [notes, setNotes] = useState("")

  const filteredApplications = applications.filter((app) => {
    const candidateName = `${app.candidates?.first_name || ""} ${app.candidates?.last_name || ""}`.toLowerCase()
    const jobTitle = app.jobs?.title?.toLowerCase() || ""
    const matchesSearch =
      candidateName.includes(searchQuery.toLowerCase()) ||
      jobTitle.includes(searchQuery.toLowerCase()) ||
      app.candidates?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStage = stageFilter === "all" || app.stage === stageFilter
    const matchesJob = jobFilter === "all" || app.job_id === jobFilter
    return matchesSearch && matchesStage && matchesJob
  })

  const getApplicationsByStage = (stageId: string) => {
    return filteredApplications.filter((app) => app.stage === stageId)
  }

  const stats = {
    total: applications.length,
    thisWeek: applications.filter((a) => {
      const date = new Date(a.created_at || "")
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return date > weekAgo
    }).length,
    inProgress: applications.filter((a) =>
      ["screening", "interview", "assessment"].includes(a.stage || "")
    ).length,
    hired: applications.filter((a) => a.stage === "hired").length,
  }

  // VIEW
  const openViewDialog = (app: Application) => {
    setSelectedApplication(app)
    setIsViewDialogOpen(true)
  }

  // NOTES
  const openNotesDialog = (app: Application) => {
    setSelectedApplication(app)
    setNotes(app.notes || "")
    setIsNotesDialogOpen(true)
  }

  const handleSaveNotes = async () => {
    if (!selectedApplication) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("applications")
        .update({
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedApplication.id)

      if (error) {
        toast.error(error.message)
        return
      }

      setApplications(
        applications.map((a) =>
          a.id === selectedApplication.id ? { ...a, notes } : a
        )
      )
      setIsNotesDialogOpen(false)
      toast.success("Notes saved successfully")
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // DELETE
  const openDeleteDialog = (app: Application) => {
    setSelectedApplication(app)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedApplication) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", selectedApplication.id)

      if (error) {
        toast.error(error.message)
        return
      }

      setApplications(applications.filter((a) => a.id !== selectedApplication.id))
      setIsDeleteDialogOpen(false)
      setSelectedApplication(null)
      toast.success("Application deleted successfully")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // STAGE CHANGE
  const handleStageChange = async (applicationId: string, newStage: string) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({
          stage: newStage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId)

      if (error) {
        toast.error(error.message)
        return
      }

      setApplications(
        applications.map((a) =>
          a.id === applicationId ? { ...a, stage: newStage } : a
        )
      )
      toast.success(`Moved to ${newStage}`)
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const ApplicationCard = ({ app }: { app: Application }) => (
    <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {app.candidates?.first_name?.[0] || "?"}{app.candidates?.last_name?.[0] || "?"}
              </span>
            </div>
            <div>
              <p className="font-medium text-sm">
                {app.candidates?.first_name} {app.candidates?.last_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {app.candidates?.current_job_title || "No title"}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  openViewDialog(app)
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  openNotesDialog(app)
                }}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Add Notes
              </DropdownMenuItem>
              {app.candidates?.resume_url && (
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Download Resume
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {stages
                .filter((s) => s.id !== app.stage)
                .map((stage) => (
                  <DropdownMenuItem
                    key={stage.id}
                    onSelect={() => handleStageChange(app.id, stage.id)}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Move to {stage.name}
                  </DropdownMenuItem>
                ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onSelect={(e) => {
                  e.preventDefault()
                  openDeleteDialog(app)
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Briefcase className="h-3 w-3" />
            <span className="truncate">{app.jobs?.title || "No job"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Applied {formatDate(app.applied_at || app.created_at)}</span>
          </div>
        </div>
        {app.score !== null && (
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${app.score}%` }}
              />
            </div>
            <span className="text-xs font-medium">{app.score}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Applications</h2>
          <p className="text-muted-foreground">
            Track and manage candidate applications through your hiring pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "pipeline" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("pipeline")}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Pipeline
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <List className="mr-2 h-4 w-4" />
            Table
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.thisWeek}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.hired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or job..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {stages.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                {stage.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-48">
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
      </div>

      {/* Pipeline View */}
      {viewMode === "pipeline" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {stages.map((stage) => {
              const stageApps = getApplicationsByStage(stage.id)
              return (
                <div key={stage.id} className="w-80 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <h3 className="font-semibold">{stage.name}</h3>
                    </div>
                    <Badge variant="secondary">{stageApps.length}</Badge>
                  </div>
                  <ScrollArea className="h-[calc(100vh-400px)] pr-2">
                    {stageApps.length === 0 ? (
                      <Card className="border-dashed">
                        <CardContent className="py-8 text-center">
                          <p className="text-sm text-muted-foreground">
                            No applications
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      stageApps.map((app) => (
                        <ApplicationCard key={app.id} app={app} />
                      ))
                    )}
                  </ScrollArea>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No applications found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {app.candidates?.first_name?.[0] || "?"}{app.candidates?.last_name?.[0] || "?"}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">
                            {app.candidates?.first_name} {app.candidates?.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {app.candidates?.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{app.jobs?.title || "N/A"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("capitalize", stageStyles[app.stage || "applied"])}>
                        {app.stage || "applied"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(app.applied_at || app.created_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {app.score !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${app.score}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{app.score}%</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault()
                              openViewDialog(app)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault()
                              openNotesDialog(app)
                            }}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Add Notes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {stages
                            .filter((s) => s.id !== app.stage)
                            .slice(0, 3)
                            .map((stage) => (
                              <DropdownMenuItem
                                key={stage.id}
                                onSelect={() => handleStageChange(app.id, stage.id)}
                              >
                                <ChevronRight className="mr-2 h-4 w-4" />
                                Move to {stage.name}
                              </DropdownMenuItem>
                            ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={(e) => {
                              e.preventDefault()
                              openDeleteDialog(app)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">
                    {selectedApplication.candidates?.first_name?.[0] || "?"}
                    {selectedApplication.candidates?.last_name?.[0] || "?"}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedApplication.candidates?.first_name}{" "}
                    {selectedApplication.candidates?.last_name}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedApplication.candidates?.current_job_title || "No title"}
                  </p>
                  <Badge
                    className={cn(
                      "capitalize mt-1",
                      stageStyles[selectedApplication.stage || "applied"]
                    )}
                  >
                    {selectedApplication.stage || "applied"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Job:</span>
                  <span>{selectedApplication.jobs?.title || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedApplication.candidates?.email}</span>
                </div>
                {selectedApplication.candidates?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedApplication.candidates.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Applied{" "}
                    {formatDate(
                      selectedApplication.applied_at || selectedApplication.created_at
                    )}
                  </span>
                </div>
                {selectedApplication.score !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Match Score: {selectedApplication.score}%</span>
                  </div>
                )}
              </div>

              {selectedApplication.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedApplication.notes}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex gap-2">
                {stages
                  .filter((s) => s.id !== selectedApplication.stage)
                  .slice(0, 3)
                  .map((stage) => (
                    <Button
                      key={stage.id}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleStageChange(selectedApplication.id, stage.id)
                        setIsViewDialogOpen(false)
                      }}
                    >
                      Move to {stage.name}
                    </Button>
                  ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Application Notes</DialogTitle>
            <DialogDescription>
              Add notes about this candidate&apos;s application
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter your notes here..."
              rows={6}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this application? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="py-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="font-medium text-destructive">
                  {selectedApplication.candidates?.first_name}{" "}
                  {selectedApplication.candidates?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedApplication.jobs?.title || "No job"}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
