"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { supabaseSelect, supabaseUpdate } from "@/lib/supabase/auth-fetch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  Loader2,
  Search,
  Building2,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Gift,
  FileText,
  ExternalLink,
  AlertTriangle,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { toast } from "sonner"

interface Application {
  id: string
  status: string
  applied_at: string
  cover_letter: string | null
  jobs: {
    id: string
    title: string
    job_type: string
    is_remote: boolean
    organizations: {
      name: string
      logo_url: string | null
    }
    job_locations: {
      name: string
      city: string
    } | null
  }
}

const statusConfig: Record<string, { label: string; color: string; icon: any; description: string }> = {
  applied: {
    label: "Applied",
    color: "bg-blue-100 text-blue-700",
    icon: Clock,
    description: "Your application has been received"
  },
  screening: {
    label: "Screening",
    color: "bg-purple-100 text-purple-700",
    icon: AlertCircle,
    description: "Your application is being reviewed"
  },
  interview: {
    label: "Interview",
    color: "bg-yellow-100 text-yellow-700",
    icon: Calendar,
    description: "You've been selected for an interview"
  },
  offer: {
    label: "Offer",
    color: "bg-green-100 text-green-700",
    icon: Gift,
    description: "Congratulations! You have a job offer"
  },
  hired: {
    label: "Hired",
    color: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle,
    description: "Welcome aboard!"
  },
  rejected: {
    label: "Not Selected",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
    description: "Unfortunately, you were not selected for this position"
  },
  withdrawn: {
    label: "Withdrawn",
    color: "bg-gray-100 text-gray-700",
    icon: XCircle,
    description: "You withdrew your application"
  },
}

export default function ApplicationsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false)

  useEffect(() => {
    loadApplications()
  }, [])

  useEffect(() => {
    filterApplications()
  }, [applications, searchQuery, statusFilter])

  const loadApplications = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Get candidate ID using auth-fetch
      const { data: candidate, error: candidateError } = await supabaseSelect<{ id: string }>(
        "candidates",
        {
          select: "id",
          filter: [{ column: "email", operator: "eq", value: user.email }],
          single: true
        }
      )

      if (candidateError || !candidate) return

      // Fetch all applications using auth-fetch
      const { data: apps, error: appsError } = await supabaseSelect<Application[]>(
        "applications",
        {
          select: `id,status,applied_at,cover_letter,jobs(id,title,job_type,is_remote,organizations:org_id(name,logo_url),job_locations:location_id(name,city))`,
          filter: [{ column: "candidate_id", operator: "eq", value: candidate.id }],
          order: { column: "applied_at", ascending: false }
        }
      )

      if (appsError) {
        console.error("Error loading applications:", appsError)
        toast.error("Failed to load applications")
        return
      }

      setApplications(apps || [])
    } catch (error) {
      console.error("Error loading applications:", error)
      toast.error("Failed to load applications")
    } finally {
      setIsLoading(false)
    }
  }

  const filterApplications = () => {
    let filtered = [...applications]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(app =>
        app.jobs?.title?.toLowerCase().includes(query) ||
        app.jobs?.organizations?.name?.toLowerCase().includes(query)
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    setFilteredApplications(filtered)
  }

  const handleWithdraw = async () => {
    if (!selectedApp) return

    setIsWithdrawing(true)
    try {
      const { error } = await supabaseUpdate(
        "applications",
        { status: "withdrawn" },
        { column: "id", value: selectedApp.id }
      )

      if (error) throw new Error(error.message)

      toast.success("Application withdrawn successfully")
      setWithdrawDialogOpen(false)
      setSelectedApp(null)
      loadApplications()
    } catch (error) {
      toast.error("Failed to withdraw application")
    } finally {
      setIsWithdrawing(false)
    }
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
        <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
        <p className="text-muted-foreground">
          Track the status of all your job applications
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by job title or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No applications found</h3>
            <p className="text-muted-foreground">
              {applications.length === 0
                ? "You haven't applied to any jobs yet"
                : "No applications match your filters"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => {
            const status = statusConfig[app.status] || statusConfig.applied
            const StatusIcon = status.icon
            const canWithdraw = !["rejected", "withdrawn", "hired"].includes(app.status)

            return (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Job Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {app.jobs?.title || "Position"}
                        </h3>
                        <p className="text-muted-foreground">
                          {app.jobs?.organizations?.name || "Company"}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                          {app.jobs?.job_locations && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {app.jobs.job_locations.city}
                            </span>
                          )}
                          {app.jobs?.is_remote && (
                            <Badge variant="secondary">Remote</Badge>
                          )}
                          {app.jobs?.job_type && (
                            <Badge variant="outline" className="capitalize">
                              {app.jobs.job_type.replace("_", " ")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <Badge className={status.color}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Applied {app.applied_at
                          ? formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })
                          : "recently"}
                      </p>
                      {canWithdraw && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setSelectedApp(app)
                            setWithdrawDialogOpen(true)
                          }}
                        >
                          Withdraw Application
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      <StatusIcon className="inline-block mr-1 h-4 w-4" />
                      {status.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Withdraw Application
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to withdraw your application for{" "}
              <span className="font-medium">{selectedApp?.jobs?.title}</span> at{" "}
              <span className="font-medium">{selectedApp?.jobs?.organizations?.name}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. You will need to submit a new application
              if you change your mind.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleWithdraw}
              disabled={isWithdrawing}
            >
              {isWithdrawing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Withdraw Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
