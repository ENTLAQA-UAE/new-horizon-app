// @ts-nocheck
// Note: Supabase type relationship issues
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabaseInsert, supabaseUpdate, supabaseDelete, supabaseSelect } from "@/lib/supabase/auth-fetch"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  FileCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Building2,
  MapPin,
  Users,
  DollarSign,
} from "lucide-react"
import { format } from "date-fns"

interface Requisition {
  id: string
  org_id: string
  title: string
  title_ar: string | null
  department_id: string | null
  location_id: string | null
  justification: string | null
  job_type: string | null
  positions_count: number | null
  salary_range_min: number | null
  salary_range_max: number | null
  salary_currency: string | null
  status: string
  job_id: string | null
  requested_by: string | null
  created_at: string
  departments?: { id: string; name: string } | null
  job_locations?: { id: string; name: string; city: string } | null
}

interface RequisitionApproval {
  id: string
  requisition_id: string
  approver_id: string
  approval_order: number
  status: string
  responded_at: string | null
  comments: string | null
}

interface RequisitionsClientProps {
  requisitions: Requisition[]
  approvals: RequisitionApproval[]
  departments: { id: string; name: string; name_ar: string | null }[]
  locations: { id: string; name: string; city: string }[]
  jobTypes: { id: string; name: string; name_ar: string | null }[]
  defaultCurrency: string
  teamMembers: { id: string; name: string }[]
  organizationId: string
  currentUserId: string
}

// Fallback job types if none configured
const defaultJobTypes = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "temporary", label: "Temporary" },
  { value: "internship", label: "Internship" },
]

// Available currencies (same as org settings)
const currencies = [
  { value: "SAR", label: "SAR - Saudi Riyal" },
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "KWD", label: "KWD - Kuwaiti Dinar" },
  { value: "QAR", label: "QAR - Qatari Riyal" },
  { value: "BHD", label: "BHD - Bahraini Dinar" },
  { value: "OMR", label: "OMR - Omani Rial" },
  { value: "EGP", label: "EGP - Egyptian Pound" },
  { value: "JOD", label: "JOD - Jordanian Dinar" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "PKR", label: "PKR - Pakistani Rupee" },
]

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: FileCheck },
  pending: { label: "Pending Approval", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-800", icon: AlertCircle },
}

export function RequisitionsClient({
  requisitions: initialRequisitions,
  approvals: initialApprovals,
  departments,
  locations,
  jobTypes: orgJobTypes,
  defaultCurrency,
  teamMembers,
  organizationId,
  currentUserId,
}: RequisitionsClientProps) {
  const router = useRouter()

  // Use org's configured job types or fallback to defaults
  const jobTypes = orgJobTypes.length > 0
    ? orgJobTypes.map(jt => ({ value: jt.id, label: jt.name }))
    : defaultJobTypes

  const [requisitions, setRequisitions] = useState(initialRequisitions)
  const [approvals, setApprovals] = useState(initialApprovals)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null)
  const [editingRequisition, setEditingRequisition] = useState<Requisition | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    title_ar: "",
    department_id: "",
    location_id: "",
    justification: "",
    job_type: jobTypes[0]?.value || "full_time",
    positions_count: 1,
    salary_range_min: "",
    salary_range_max: "",
    salary_currency: defaultCurrency || "SAR",
    approvers: [] as string[],
  })

  const [approvalComment, setApprovalComment] = useState("")

  const filteredRequisitions = requisitions.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && r.status === "pending") ||
      (activeTab === "approved" && r.status === "approved") ||
      (activeTab === "rejected" && r.status === "rejected") ||
      (activeTab === "mine" && r.requested_by === currentUserId)
    return matchesSearch && matchesTab
  })

  const stats = {
    total: requisitions.length,
    pending: requisitions.filter((r) => r.status === "pending").length,
    approved: requisitions.filter((r) => r.status === "approved").length,
    rejected: requisitions.filter((r) => r.status === "rejected").length,
  }

  const pendingMyApproval = requisitions.filter((r) => {
    if (r.status !== "pending") return false
    const myApproval = approvals.find(
      (a) => a.requisition_id === r.id && a.approver_id === currentUserId && a.status === "pending"
    )
    return !!myApproval
  })

  const resetForm = () => {
    setFormData({
      title: "",
      title_ar: "",
      department_id: "",
      location_id: "",
      justification: "",
      job_type: jobTypes[0]?.value || "full_time",
      positions_count: 1,
      salary_range_min: "",
      salary_range_max: "",
      salary_currency: defaultCurrency || "SAR",
      approvers: [],
    })
    setEditingRequisition(null)
  }

  const handleSave = async () => {
    if (!formData.title) {
      toast.error("Please enter job title")
      return
    }

    if (!formData.justification) {
      toast.error("Please provide justification")
      return
    }

    setIsLoading(true)
    try {
      const requisitionData = {
        org_id: organizationId,
        title: formData.title,
        title_ar: formData.title_ar || null,
        department_id: formData.department_id || null,
        location_id: formData.location_id || null,
        justification: formData.justification,
        job_type: formData.job_type,
        positions_count: formData.positions_count,
        salary_range_min: formData.salary_range_min ? parseFloat(formData.salary_range_min) : null,
        salary_range_max: formData.salary_range_max ? parseFloat(formData.salary_range_max) : null,
        salary_currency: formData.salary_currency,
        status: formData.approvers.length > 0 ? "pending" : "draft",
        requested_by: currentUserId,
      }

      if (editingRequisition) {
        const { error } = await supabaseUpdate(
          'job_requisitions',
          requisitionData,
          { column: 'id', value: editingRequisition.id }
        )

        if (error) throw new Error(error.message)

        // Fetch the updated data with joins
        const { data, error: selectError } = await supabaseSelect<Requisition>(
          'job_requisitions',
          {
            select: '*, departments (id, name), job_locations (id, name, city)',
            filter: [{ column: 'id', operator: 'eq', value: editingRequisition.id }],
            single: true
          }
        )

        if (selectError) throw new Error(selectError.message)
        if (data) setRequisitions(requisitions.map((r) => (r.id === editingRequisition.id ? data : r)))
        toast.success("Requisition updated successfully")
      } else {
        const { data: insertData, error } = await supabaseInsert<{ id: string }>(
          'job_requisitions',
          requisitionData
        )

        if (error) throw new Error(error.message)

        // Fetch the inserted data with joins
        const { data, error: selectError } = await supabaseSelect<Requisition>(
          'job_requisitions',
          {
            select: '*, departments (id, name), job_locations (id, name, city)',
            filter: [{ column: 'id', operator: 'eq', value: insertData!.id }],
            single: true
          }
        )

        if (selectError) throw new Error(selectError.message)

        // Create approvals if approvers selected
        if (formData.approvers.length > 0 && data) {
          const newApprovals: RequisitionApproval[] = []
          for (let index = 0; index < formData.approvers.length; index++) {
            const approverId = formData.approvers[index]
            const approvalData = {
              requisition_id: data.id,
              approver_id: approverId,
              approval_order: index + 1,
              status: "pending",
            }
            const { data: approvalResult, error: approvalError } = await supabaseInsert<RequisitionApproval>(
              'requisition_approvals',
              approvalData
            )
            if (approvalError) console.error("Error creating approval:", approvalError)
            if (approvalResult) newApprovals.push(approvalResult)
          }
          if (newApprovals.length > 0) setApprovals([...approvals, ...newApprovals])
        }

        if (data) setRequisitions([data, ...requisitions])
        toast.success("Requisition created successfully")
      }

      setIsDialogOpen(false)
      resetForm()
      router.refresh()
    } catch (error) {
      toast.error("Failed to save requisition")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprovalResponse = async (approved: boolean) => {
    if (!selectedRequisition) return

    const myApproval = approvals.find(
      (a) => a.requisition_id === selectedRequisition.id && a.approver_id === currentUserId
    )

    if (!myApproval) {
      toast.error("You are not an approver for this requisition")
      return
    }

    setIsLoading(true)
    try {
      // Update approval status
      const { error: approvalError } = await supabaseUpdate(
        'requisition_approvals',
        {
          status: approved ? "approved" : "rejected",
          responded_at: new Date().toISOString(),
          comments: approvalComment || null,
        },
        { column: 'id', value: myApproval.id }
      )

      if (approvalError) throw new Error(approvalError.message)

      // Check if all approvers have approved
      const requisitionApprovals = approvals.filter((a) => a.requisition_id === selectedRequisition.id)
      const allApproved = requisitionApprovals.every((a) =>
        a.approver_id === currentUserId ? approved : a.status === "approved"
      )

      // Update requisition status
      const newStatus = !approved ? "rejected" : allApproved ? "approved" : "pending"
      const { error: requisitionError } = await supabaseUpdate(
        'job_requisitions',
        { status: newStatus },
        { column: 'id', value: selectedRequisition.id }
      )

      if (requisitionError) throw new Error(requisitionError.message)

      // Update local state
      setApprovals(
        approvals.map((a) =>
          a.id === myApproval.id
            ? { ...a, status: approved ? "approved" : "rejected", responded_at: new Date().toISOString() }
            : a
        )
      )
      setRequisitions(
        requisitions.map((r) => (r.id === selectedRequisition.id ? { ...r, status: newStatus } : r))
      )

      setIsApprovalDialogOpen(false)
      setSelectedRequisition(null)
      setApprovalComment("")
      toast.success(`Requisition ${approved ? "approved" : "rejected"} successfully`)
      router.refresh()
    } catch (error) {
      toast.error("Failed to submit approval")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedRequisition) return

    setIsLoading(true)
    try {
      // Delete approvals first
      await supabaseDelete('requisition_approvals', { column: 'requisition_id', value: selectedRequisition.id })

      // Delete requisition
      const { error } = await supabaseDelete('job_requisitions', { column: 'id', value: selectedRequisition.id })

      if (error) throw new Error(error.message)

      setRequisitions(requisitions.filter((r) => r.id !== selectedRequisition.id))
      setApprovals(approvals.filter((a) => a.requisition_id !== selectedRequisition.id))
      setIsDeleteDialogOpen(false)
      setSelectedRequisition(null)
      toast.success("Requisition deleted successfully")
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete requisition")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (requisition: Requisition) => {
    setEditingRequisition(requisition)
    setFormData({
      title: requisition.title,
      title_ar: requisition.title_ar || "",
      department_id: requisition.department_id || "",
      location_id: requisition.location_id || "",
      justification: requisition.justification || "",
      job_type: requisition.job_type || "full_time",
      positions_count: requisition.positions_count || 1,
      salary_range_min: requisition.salary_range_min?.toString() || "",
      salary_range_max: requisition.salary_range_max?.toString() || "",
      salary_currency: requisition.salary_currency || "SAR",
      approvers: [],
    })
    setIsDialogOpen(true)
  }

  const getStatusConfig = (status: string) => statusConfig[status] || statusConfig.draft

  const getRequisitionApprovals = (requisitionId: string) =>
    approvals.filter((a) => a.requisition_id === requisitionId).sort((a, b) => a.approval_order - b.approval_order)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Job Requisitions</h2>
          <p className="text-muted-foreground">Request and track approval for new job positions</p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setIsDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Requisition
        </Button>
      </div>

      {/* Pending Approval Alert */}
      {pendingMyApproval.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">
                  {pendingMyApproval.length} requisition(s) awaiting your approval
                </p>
                <p className="text-sm text-yellow-600">Review and approve or reject the pending requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requisitions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="mine">My Requests</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Position</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Positions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequisitions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <FileCheck className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No requisitions found</p>
                  <Button
                    variant="link"
                    onClick={() => {
                      resetForm()
                      setIsDialogOpen(true)
                    }}
                    className="mt-2"
                  >
                    Create your first requisition
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequisitions.map((requisition) => {
                const statusConf = getStatusConfig(requisition.status)
                const StatusIcon = statusConf.icon
                const isPendingMyApproval = pendingMyApproval.some((r) => r.id === requisition.id)

                return (
                  <TableRow key={requisition.id} className={isPendingMyApproval ? "bg-yellow-50" : ""}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{requisition.title}</span>
                        {requisition.title_ar && (
                          <p className="text-sm text-muted-foreground" dir="rtl">
                            {requisition.title_ar}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {jobTypes.find((t) => t.value === requisition.job_type)?.label || requisition.job_type}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{requisition.departments?.name || "—"}</span>
                      </div>
                      {requisition.job_locations && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{requisition.job_locations.city}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{requisition.positions_count || 1}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConf.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConf.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(requisition.created_at), "MMM d, yyyy")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => {
                              setSelectedRequisition(requisition)
                              setIsViewDialogOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {isPendingMyApproval && (
                            <DropdownMenuItem
                              onSelect={() => {
                                setSelectedRequisition(requisition)
                                setIsApprovalDialogOpen(true)
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve/Reject
                            </DropdownMenuItem>
                          )}
                          {requisition.requested_by === currentUserId && requisition.status === "draft" && (
                            <>
                              <DropdownMenuItem onSelect={() => openEditDialog(requisition)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setSelectedRequisition(requisition)
                                  setIsDeleteDialogOpen(true)
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            <DialogTitle>{editingRequisition ? "Edit Requisition" : "New Requisition"}</DialogTitle>
            <DialogDescription>
              {editingRequisition
                ? "Update job requisition details"
                : "Request approval for a new job position"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Title */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Title (English) *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label>Job Title (Arabic)</Label>
                <Input
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                  placeholder="مهندس برمجيات أول"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Department & Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={formData.department_id}
                  onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Select
                  value={formData.location_id}
                  onValueChange={(value) => setFormData({ ...formData, location_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name} - {loc.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Job Type & Positions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Type</Label>
                <Select
                  value={formData.job_type}
                  onValueChange={(value) => setFormData({ ...formData, job_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Number of Positions</Label>
                <Input
                  type="number"
                  value={formData.positions_count}
                  onChange={(e) =>
                    setFormData({ ...formData, positions_count: parseInt(e.target.value) || 1 })
                  }
                  min={1}
                />
              </div>
            </div>

            {/* Salary Range */}
            <div className="space-y-2">
              <Label>Salary Range</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={formData.salary_currency}
                  onValueChange={(value) => setFormData({ ...formData, salary_currency: value })}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Min"
                  value={formData.salary_range_min}
                  onChange={(e) => setFormData({ ...formData, salary_range_min: e.target.value })}
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={formData.salary_range_max}
                  onChange={(e) => setFormData({ ...formData, salary_range_max: e.target.value })}
                />
              </div>
            </div>

            {/* Justification */}
            <div className="space-y-2">
              <Label>Justification *</Label>
              <Textarea
                value={formData.justification}
                onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                placeholder="Explain why this position is needed..."
                rows={4}
              />
            </div>

            {/* Approvers */}
            {!editingRequisition && (
              <div className="space-y-2">
                <Label>Approvers</Label>
                <Select
                  value={formData.approvers[0] || "none"}
                  onValueChange={(value) => setFormData({ ...formData, approvers: value === "none" ? [] : [value] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select approver (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No approver</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  If no approver is selected, the requisition will be saved as a draft
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingRequisition ? "Update" : formData.approvers.length > 0 ? "Submit for Approval" : "Save Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Requisition Details</DialogTitle>
          </DialogHeader>
          {selectedRequisition && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedRequisition.title}</h3>
                {selectedRequisition.title_ar && (
                  <p className="text-muted-foreground" dir="rtl">
                    {selectedRequisition.title_ar}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedRequisition.departments?.name || "No department"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedRequisition.job_locations?.city || "No location"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedRequisition.positions_count} position(s)</span>
                </div>
                {selectedRequisition.salary_range_min && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedRequisition.salary_currency} {selectedRequisition.salary_range_min?.toLocaleString()}
                      {selectedRequisition.salary_range_max &&
                        ` - ${selectedRequisition.salary_range_max.toLocaleString()}`}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Justification</Label>
                <p className="mt-1">{selectedRequisition.justification || "No justification provided"}</p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Approval Status</Label>
                <div className="mt-2 space-y-2">
                  {getRequisitionApprovals(selectedRequisition.id).map((approval) => {
                    const approver = teamMembers.find((m) => m.id === approval.approver_id)
                    const statusConf = getStatusConfig(approval.status)
                    return (
                      <div key={approval.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span>{approver?.name || "Unknown"}</span>
                        <Badge className={statusConf.color}>{statusConf.label}</Badge>
                      </div>
                    )
                  })}
                  {getRequisitionApprovals(selectedRequisition.id).length === 0 && (
                    <p className="text-sm text-muted-foreground">No approvers assigned</p>
                  )}
                </div>
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

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Requisition</DialogTitle>
            <DialogDescription>
              Approve or reject this job requisition request
            </DialogDescription>
          </DialogHeader>
          {selectedRequisition && (
            <div className="py-4">
              <div className="p-4 bg-muted rounded-lg mb-4">
                <h4 className="font-semibold">{selectedRequisition.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedRequisition.departments?.name} • {selectedRequisition.positions_count} position(s)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Comments (optional)</Label>
                <Textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Add any comments or feedback..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleApprovalResponse(false)} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button onClick={() => handleApprovalResponse(true)} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Requisition</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this requisition? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedRequisition && (
            <div className="p-4 bg-destructive/10 rounded-lg">
              <p className="font-medium text-destructive">{selectedRequisition.title}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
