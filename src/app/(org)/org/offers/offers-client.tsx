"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabaseInsert, supabaseUpdate, supabaseDelete, supabaseSelect } from "@/lib/supabase/auth-fetch"
import { useAuth } from "@/lib/auth/auth-context"
import { useI18n } from "@/lib/i18n"
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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import {
  Plus,
  Search,
  MoreHorizontal,
  Calendar as CalendarIcon,
  Loader2,
  Pencil,
  Trash2,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  FileText,
  User,
  Building,
  MapPin,
  Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface Offer {
  id: string
  org_id: string
  application_id: string
  template_id?: string
  job_title: string
  job_title_ar?: string
  department?: string
  location?: string
  salary_amount: number
  salary_currency: string
  salary_period: string
  signing_bonus?: number
  annual_bonus_percentage?: number
  benefits: any[]
  start_date: string
  offer_expiry_date?: string
  probation_period_months: number
  employment_type: string
  status: string
  candidate_response?: string
  candidate_response_at?: string
  sent_at?: string
  created_at: string
  applications: {
    id: string
    candidates: {
      id: string
      first_name: string
      last_name: string
      email: string
      phone?: string
      current_title?: string
    }
    jobs: {
      id: string
      title: string
      title_ar?: string
    }
  } | null
}

interface OfferTemplate {
  id: string
  name: string
  name_ar?: string
  description?: string
  body_html: string
  body_html_ar?: string
  merge_fields: string[]
  is_default: boolean
}

interface Application {
  id: string
  candidates: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  jobs: {
    id: string
    title: string
    department_id?: string
    departments?: { name: string }
    location_id?: string
    job_locations?: { name: string; city: string }
  }
}

interface OffersClientProps {
  offers: Offer[]
  templates: OfferTemplate[]
  applications: Application[]
  organizationId: string
  defaultCurrency?: string
}

export function OffersClient({
  offers: initialOffers,
  templates,
  applications,
  organizationId,
  defaultCurrency = "SAR",
}: OffersClientProps) {
  const router = useRouter()
  const { primaryRole } = useAuth()
  const { t, language, isRTL } = useI18n()

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: t("offers.status.draft"), color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200", icon: FileText },
    pending_approval: { label: t("offers.status.pending"), color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200", icon: Clock },
    approved: { label: t("offers.status.approved"), color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: CheckCircle },
    sent: { label: t("offers.status.sent"), color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", icon: Send },
    viewed: { label: t("offers.status.viewed"), color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200", icon: Eye },
    accepted: { label: t("offers.status.accepted"), color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: CheckCircle },
    declined: { label: t("offers.status.declined"), color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: XCircle },
    withdrawn: { label: t("offers.status.withdrawn"), color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200", icon: XCircle },
    expired: { label: t("offers.status.expired"), color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", icon: Clock },
    counter_offered: { label: t("offers.status.counterOffered"), color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: FileText },
  }

  const employmentTypes = [
    { value: "full_time", label: t("offers.employmentTypes.fullTime") },
    { value: "part_time", label: t("offers.employmentTypes.partTime") },
    { value: "contract", label: t("offers.employmentTypes.contract") },
    { value: "temporary", label: t("offers.employmentTypes.temporary") },
  ]

  const salaryPeriods = [
    { value: "monthly", label: t("offers.payPeriods.monthly") },
    { value: "yearly", label: t("offers.payPeriods.yearly") },
    { value: "hourly", label: t("offers.payPeriods.hourly") },
  ]

  const currencies = [
    { value: "SAR", label: t("offers.currencies.SAR") },
    { value: "AED", label: t("offers.currencies.AED") },
    { value: "USD", label: t("offers.currencies.USD") },
    { value: "EUR", label: t("offers.currencies.EUR") },
    { value: "GBP", label: t("offers.currencies.GBP") },
    { value: "QAR", label: t("offers.currencies.QAR") },
    { value: "KWD", label: t("offers.currencies.KWD") },
    { value: "BHD", label: t("offers.currencies.BHD") },
    { value: "OMR", label: t("offers.currencies.OMR") },
    { value: "EGP", label: t("offers.currencies.EGP") },
    { value: "JOD", label: t("offers.currencies.JOD") },
    { value: "INR", label: t("offers.currencies.INR") },
    { value: "PKR", label: t("offers.currencies.PKR") },
    { value: "PHP", label: t("offers.currencies.PHP") },
    { value: "CAD", label: t("offers.currencies.CAD") },
    { value: "AUD", label: t("offers.currencies.AUD") },
    { value: "CHF", label: t("offers.currencies.CHF") },
    { value: "JPY", label: t("offers.currencies.JPY") },
    { value: "CNY", label: t("offers.currencies.CNY") },
  ]

  const [offers, setOffers] = useState(initialOffers)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Selected offer
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    application_id: "",
    template_id: "",
    job_title: "",
    job_title_ar: "",
    department: "",
    location: "",
    salary_amount: 0,
    salary_currency: defaultCurrency,
    salary_period: "monthly",
    signing_bonus: 0,
    annual_bonus_percentage: 0,
    start_date: new Date(),
    offer_expiry_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    probation_period_months: 3,
    employment_type: "full_time",
    benefits: [] as string[],
  })

  const filteredOffers = offers.filter((offer) => {
    const candidateName = `${offer.applications?.candidates?.first_name || ""} ${offer.applications?.candidates?.last_name || ""}`.toLowerCase()
    const jobTitle = offer.job_title?.toLowerCase() || ""
    const matchesSearch =
      candidateName.includes(searchQuery.toLowerCase()) ||
      jobTitle.includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || offer.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: offers.length,
    pending: offers.filter((o) => o.status === "sent" || o.status === "viewed").length,
    accepted: offers.filter((o) => o.status === "accepted").length,
    declined: offers.filter((o) => o.status === "declined").length,
  }

  const resetForm = () => {
    setFormData({
      application_id: "",
      template_id: "",
      job_title: "",
      job_title_ar: "",
      department: "",
      location: "",
      salary_amount: 0,
      salary_currency: defaultCurrency,
      salary_period: "monthly",
      signing_bonus: 0,
      annual_bonus_percentage: 0,
      start_date: new Date(),
      offer_expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      probation_period_months: 3,
      employment_type: "full_time",
      benefits: [],
    })
  }

  const handleApplicationSelect = (appId: string) => {
    const app = applications.find((a) => a.id === appId)
    if (app) {
      setFormData({
        ...formData,
        application_id: appId,
        job_title: app.jobs.title,
        department: app.jobs.departments?.name || "",
        location: app.jobs.job_locations?.city || "",
      })
    }
  }

  // CREATE
  const handleCreate = async () => {
    if (!formData.application_id) {
      toast.error(t("offers.messages.selectCandidate"))
      return
    }

    if (!formData.job_title || formData.salary_amount <= 0) {
      toast.error(t("offers.messages.fillRequired"))
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabaseInsert<Offer>("offers", {
        org_id: organizationId,
        application_id: formData.application_id,
        template_id: formData.template_id || null,
        job_title: formData.job_title,
        job_title_ar: formData.job_title_ar || null,
        department: formData.department || null,
        location: formData.location || null,
        salary_amount: formData.salary_amount,
        salary_currency: formData.salary_currency,
        salary_period: formData.salary_period,
        signing_bonus: formData.signing_bonus || null,
        annual_bonus_percentage: formData.annual_bonus_percentage || null,
        start_date: format(formData.start_date, "yyyy-MM-dd"),
        offer_expiry_date: format(formData.offer_expiry_date, "yyyy-MM-dd"),
        probation_period_months: formData.probation_period_months,
        employment_type: formData.employment_type,
        benefits: formData.benefits,
        status: primaryRole === "recruiter" ? "pending_approval" : "draft",
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data) {
        // For recruiter: create approval record targeting hr_managers
        if (primaryRole === "recruiter") {
          const { data: hrManagers } = await supabaseSelect<{ user_id: string }>(
            "user_roles",
            {
              select: "user_id",
              filter: [{ column: "role", operator: "eq", value: "hr_manager" }],
            }
          )
          const hrManagerList = Array.isArray(hrManagers) ? hrManagers : hrManagers ? [hrManagers] : []
          for (const hm of hrManagerList) {
            await supabaseInsert("offer_approvals", {
              offer_id: data.id,
              approver_id: hm.user_id,
              approval_order: 1,
              status: "pending",
            })
          }
        }

        // Find the application to attach nested data for display
        const app = applications.find((a) => a.id === formData.application_id)
        const offerWithRelations: Offer = {
          ...data,
          applications: app ? {
            id: app.id,
            candidates: app.candidates,
            jobs: app.jobs,
          } : null,
        }
        setOffers([offerWithRelations, ...offers])
      }
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success(primaryRole === "recruiter" ? t("offers.messages.createdForApproval") : t("offers.messages.created"))
      router.refresh()
    } catch {
      toast.error(t("offers.messages.unexpectedError"))
    } finally {
      setIsLoading(false)
    }
  }

  // SEND OFFER
  const handleSendOffer = async (offerId: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabaseUpdate(
        "offers",
        {
          status: "sent",
          sent_at: new Date().toISOString(),
        },
        { column: "id", value: offerId }
      )

      if (error) throw new Error(error.message)

      // Find the offer to get candidate details
      const offer = offers.find(o => o.id === offerId)

      setOffers(
        offers.map((o) =>
          o.id === offerId
            ? { ...o, status: "sent", sent_at: new Date().toISOString() }
            : o
        )
      )

      // Send notification to candidate
      if (offer?.applications?.candidates) {
        const candidate = offer.applications.candidates
        fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: "offer_sent",
            orgId: organizationId,
            data: {
              offerId: offer.id,
              candidateName: `${candidate.first_name} ${candidate.last_name}`,
              candidateEmail: candidate.email,
              jobTitle: offer.job_title,
              salary: `${offer.salary_currency} ${offer.salary_amount.toLocaleString()}/${offer.salary_period}`,
              startDate: format(new Date(offer.start_date), "MMMM d, yyyy"),
              applicationId: offer.application_id,
            },
          }),
        }).catch((err) => {
          console.error("Failed to send offer notification:", err)
        })

        // Log activity for offer sent
        fetch(`/api/applications/${offer.application_id}/activities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activity_type: "offer_sent",
            description: `Offer sent: ${offer.salary_currency} ${offer.salary_amount.toLocaleString()}/${offer.salary_period}`,
            metadata: {
              offer_id: offer.id,
              job_title: offer.job_title,
              salary: `${offer.salary_currency} ${offer.salary_amount.toLocaleString()}/${offer.salary_period}`,
              start_date: offer.start_date,
            },
          }),
        }).catch((err) => {
          console.error("Failed to log offer sent activity:", err)
        })
      }

      toast.success(t("offers.messages.sentSuccess"))
      router.refresh()
    } catch {
      toast.error(t("offers.messages.sendFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  // APPROVE OFFER (hr_manager flow)
  const handleApproveOffer = async (offerId: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabaseUpdate("offers", {
        status: "approved",
      }, { column: "id", value: offerId })

      if (error) throw new Error(error.message)

      // Update approval records
      const { data: approvalRecords } = await supabaseSelect<{ id: string }>(
        "offer_approvals",
        {
          select: "id",
          filter: [{ column: "offer_id", operator: "eq", value: offerId }],
        }
      )
      if (approvalRecords) {
        const recordList = Array.isArray(approvalRecords) ? approvalRecords : [approvalRecords]
        for (const record of recordList) {
          await supabaseUpdate("offer_approvals", {
            status: "approved",
            responded_at: new Date().toISOString(),
          }, { column: "id", value: record.id })
        }
      }

      setOffers(offers.map((o) =>
        o.id === offerId ? { ...o, status: "approved" } : o
      ))
      toast.success(t("offers.messages.approvedSendable"))
      router.refresh()
    } catch {
      toast.error(t("offers.messages.approveFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  // REJECT OFFER (hr_manager flow)
  const handleRejectOffer = async (offerId: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabaseUpdate("offers", {
        status: "draft",
      }, { column: "id", value: offerId })

      if (error) throw new Error(error.message)

      // Update approval records
      const { data: approvalRecords } = await supabaseSelect<{ id: string }>(
        "offer_approvals",
        {
          select: "id",
          filter: [{ column: "offer_id", operator: "eq", value: offerId }],
        }
      )
      if (approvalRecords) {
        const recordList = Array.isArray(approvalRecords) ? approvalRecords : [approvalRecords]
        for (const record of recordList) {
          await supabaseUpdate("offer_approvals", {
            status: "rejected",
            responded_at: new Date().toISOString(),
          }, { column: "id", value: record.id })
        }
      }

      setOffers(offers.map((o) =>
        o.id === offerId ? { ...o, status: "draft" } : o
      ))
      toast.success(t("offers.messages.rejectedToDraft"))
      router.refresh()
    } catch {
      toast.error(t("offers.messages.rejectFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  // DELETE
  const handleDelete = async () => {
    if (!selectedOffer) return

    setIsLoading(true)
    try {
      const { error } = await supabaseDelete("offers", { column: "id", value: selectedOffer.id })

      if (error) throw new Error(error.message)

      setOffers(offers.filter((o) => o.id !== selectedOffer.id))
      setIsDeleteDialogOpen(false)
      setSelectedOffer(null)
      toast.success(t("offers.messages.deleted"))
      router.refresh()
    } catch {
      toast.error(t("offers.messages.deleteFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  const formatSalary = (amount: number, currency: string, period: string) => {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount)
    return `${formatted}/${period === "monthly" ? t("offers.payPeriods.monthlyShort") : period === "yearly" ? t("offers.payPeriods.yearlyShort") : t("offers.payPeriods.hourlyShort")}`
  }

  const OfferCard = ({ offer }: { offer: Offer }) => {
    const status = statusConfig[offer.status] || statusConfig.draft
    const StatusIcon = status.icon

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">
                  {offer.applications?.candidates?.first_name}{" "}
                  {offer.applications?.candidates?.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">{offer.job_title}</p>
                <p className="text-xs text-muted-foreground">
                  {offer.applications?.candidates?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn("capitalize flex items-center gap-1", status.color)}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => {
                      setSelectedOffer(offer)
                      setIsViewDialogOpen(true)
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {t("common.viewDetails")}
                  </DropdownMenuItem>
                  {/* hr_manager can send draft or approved offers directly */}
                  {(offer.status === "draft" || offer.status === "approved") && (primaryRole === "hr_manager" || primaryRole === "super_admin") && (
                    <DropdownMenuItem onSelect={() => handleSendOffer(offer.id)}>
                      <Send className="mr-2 h-4 w-4" />
                      {t("offers.sendOffer")}
                    </DropdownMenuItem>
                  )}
                  {/* hr_manager can approve/reject pending offers */}
                  {offer.status === "pending_approval" && (primaryRole === "hr_manager" || primaryRole === "super_admin") && (
                    <>
                      <DropdownMenuItem onSelect={() => handleApproveOffer(offer.id)} className="text-green-600">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {t("offers.actions.approve")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleRejectOffer(offer.id)} className="text-red-600">
                        <XCircle className="mr-2 h-4 w-4" />
                        {t("offers.actions.reject")}
                      </DropdownMenuItem>
                    </>
                  )}
                  {(offer.status === "draft" || offer.status === "pending_approval") && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => {
                          setSelectedOffer(offer)
                          setIsDeleteDialogOpen(true)
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>{formatSalary(offer.salary_amount, offer.salary_currency, offer.salary_period)}</span>
            </div>
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              <span>{t("offers.fields.startDate")}: {format(new Date(offer.start_date), "MMM d, yyyy")}</span>
            </div>
            {offer.department && (
              <div className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                <span>{offer.department}</span>
              </div>
            )}
            {offer.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{offer.location}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("offers.title")}</h2>
          <p className="text-muted-foreground">
            {t("offers.description")}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          {t("offers.createOffer")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("offers.stats.totalOffers")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("offers.stats.pending")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("offers.stats.accepted")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("offers.stats.declined")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("offers.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("offers.fields.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("offers.allStatus")}</SelectItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Offers Grid */}
      {filteredOffers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{t("offers.emptyState.noResults")}</p>
            <Button
              variant="link"
              onClick={() => setIsCreateDialogOpen(true)}
              className="mt-2"
            >
              {t("offers.emptyState.createFirst")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}

      {/* Create Offer Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("offers.createOffer")}</DialogTitle>
            <DialogDescription>
              {t("offers.createDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Candidate Selection */}
            <div className="space-y-2">
              <Label>{t("offers.fields.selectCandidate")} *</Label>
              <Select
                value={formData.application_id}
                onValueChange={handleApplicationSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("offers.placeholders.selectApplication")} />
                </SelectTrigger>
                <SelectContent>
                  {applications.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.candidates.first_name} {app.candidates.last_name} - {app.jobs.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template Selection */}
            <div className="space-y-2">
              <Label>{t("offers.fields.offerTemplate")}</Label>
              <Select
                value={formData.template_id}
                onValueChange={(value) => setFormData({ ...formData, template_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("offers.placeholders.selectTemplate")} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Job Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job_title">{t("offers.fields.jobTitle")} *</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  placeholder={t("offers.placeholders.jobTitle")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_title_ar">{t("offers.fields.jobTitleAr")}</Label>
                <Input
                  id="job_title_ar"
                  value={formData.job_title_ar}
                  onChange={(e) => setFormData({ ...formData, job_title_ar: e.target.value })}
                  placeholder={t("offers.placeholders.jobTitle")}
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">{t("offers.fields.department")}</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder={t("offers.placeholders.department")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">{t("offers.fields.location")}</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder={t("offers.placeholders.location")}
                />
              </div>
            </div>

            {/* Compensation */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">{t("offers.compensation.title")}</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary_amount">{t("offers.fields.salaryAmount")} *</Label>
                  <Input
                    id="salary_amount"
                    type="number"
                    value={formData.salary_amount || ""}
                    onChange={(e) => setFormData({ ...formData, salary_amount: parseFloat(e.target.value) || 0 })}
                    placeholder={t("offers.placeholders.salaryAmount")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("offers.fields.currency")}</Label>
                  <Select
                    value={formData.salary_currency}
                    onValueChange={(value) => setFormData({ ...formData, salary_currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("offers.fields.payPeriod")}</Label>
                  <Select
                    value={formData.salary_period}
                    onValueChange={(value) => setFormData({ ...formData, salary_period: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {salaryPeriods.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signing_bonus">{t("offers.fields.bonus")}</Label>
                  <Input
                    id="signing_bonus"
                    type="number"
                    value={formData.signing_bonus || ""}
                    onChange={(e) => setFormData({ ...formData, signing_bonus: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annual_bonus">{t("offers.fields.annualBonus")}</Label>
                  <Input
                    id="annual_bonus"
                    type="number"
                    value={formData.annual_bonus_percentage || ""}
                    onChange={(e) => setFormData({ ...formData, annual_bonus_percentage: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Dates & Employment */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">{t("offers.employmentDetails")}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("offers.fields.startDate")} *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.start_date, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3 border-b">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData({ ...formData, start_date: new Date() })}
                          >
                            {t("common.time.today")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const tomorrow = new Date()
                              tomorrow.setDate(tomorrow.getDate() + 1)
                              setFormData({ ...formData, start_date: tomorrow })
                            }}
                          >
                            {t("common.time.tomorrow")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const nextWeek = new Date()
                              nextWeek.setDate(nextWeek.getDate() + 7)
                              setFormData({ ...formData, start_date: nextWeek })
                            }}
                          >
                            {t("offers.dateShortcuts.nextWeek")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const nextMonth = new Date()
                              nextMonth.setMonth(nextMonth.getMonth() + 1)
                              nextMonth.setDate(1)
                              setFormData({ ...formData, start_date: nextMonth })
                            }}
                          >
                            {t("offers.dateShortcuts.firstNextMonth")}
                          </Button>
                        </div>
                      </div>
                      <Calendar
                        mode="single"
                        selected={formData.start_date}
                        onSelect={(date) =>
                          date && setFormData({ ...formData, start_date: date })
                        }
                        initialFocus
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>{t("offers.fields.expirationDate")}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.offer_expiry_date, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3 border-b">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const in3Days = new Date()
                              in3Days.setDate(in3Days.getDate() + 3)
                              setFormData({ ...formData, offer_expiry_date: in3Days })
                            }}
                          >
                            {t("offers.dateShortcuts.threeDays")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const in7Days = new Date()
                              in7Days.setDate(in7Days.getDate() + 7)
                              setFormData({ ...formData, offer_expiry_date: in7Days })
                            }}
                          >
                            {t("offers.dateShortcuts.oneWeek")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const in14Days = new Date()
                              in14Days.setDate(in14Days.getDate() + 14)
                              setFormData({ ...formData, offer_expiry_date: in14Days })
                            }}
                          >
                            {t("offers.dateShortcuts.twoWeeks")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const in30Days = new Date()
                              in30Days.setDate(in30Days.getDate() + 30)
                              setFormData({ ...formData, offer_expiry_date: in30Days })
                            }}
                          >
                            {t("offers.dateShortcuts.thirtyDays")}
                          </Button>
                        </div>
                      </div>
                      <Calendar
                        mode="single"
                        selected={formData.offer_expiry_date}
                        onSelect={(date) =>
                          date && setFormData({ ...formData, offer_expiry_date: date })
                        }
                        initialFocus
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>{t("offers.fields.employmentType")}</Label>
                  <Select
                    value={formData.employment_type}
                    onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {employmentTypes.map((et) => (
                        <SelectItem key={et.value} value={et.value}>
                          {et.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="probation">{t("offers.fields.probationPeriod")}</Label>
                  <Input
                    id="probation"
                    type="number"
                    value={formData.probation_period_months}
                    onChange={(e) => setFormData({ ...formData, probation_period_months: parseInt(e.target.value) || 3 })}
                    min={0}
                    max={12}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("offers.createOffer")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Offer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("offers.offerDetails")}</DialogTitle>
          </DialogHeader>
          {selectedOffer && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {selectedOffer.applications?.candidates?.first_name}{" "}
                    {selectedOffer.applications?.candidates?.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedOffer.applications?.candidates?.email}
                  </p>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("offers.fields.position")}</span>
                  <span className="font-medium">{selectedOffer.job_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("offers.fields.salary")}</span>
                  <span className="font-medium">
                    {formatSalary(selectedOffer.salary_amount, selectedOffer.salary_currency, selectedOffer.salary_period)}
                  </span>
                </div>
                {selectedOffer.signing_bonus && selectedOffer.signing_bonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("offers.fields.bonus")}</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: selectedOffer.salary_currency,
                      }).format(selectedOffer.signing_bonus)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("offers.fields.startDate")}</span>
                  <span className="font-medium">
                    {format(new Date(selectedOffer.start_date), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("offers.fields.employmentType")}</span>
                  <span className="font-medium capitalize">
                    {selectedOffer.employment_type.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("offers.fields.status")}</span>
                  <Badge className={statusConfig[selectedOffer.status]?.color}>
                    {statusConfig[selectedOffer.status]?.label}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              {t("common.close")}
            </Button>
            {/* hr_manager can send draft/approved offers */}
            {(selectedOffer?.status === "draft" || selectedOffer?.status === "approved") && (primaryRole === "hr_manager" || primaryRole === "super_admin") && (
              <Button onClick={() => {
                handleSendOffer(selectedOffer.id)
                setIsViewDialogOpen(false)
              }}>
                <Send className="mr-2 h-4 w-4" />
                {t("offers.sendOffer")}
              </Button>
            )}
            {/* hr_manager can approve pending offers */}
            {selectedOffer?.status === "pending_approval" && (primaryRole === "hr_manager" || primaryRole === "super_admin") && (
              <>
                <Button onClick={() => {
                  handleApproveOffer(selectedOffer.id)
                  setIsViewDialogOpen(false)
                }} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {t("offers.actions.approve")}
                </Button>
                <Button variant="destructive" onClick={() => {
                  handleRejectOffer(selectedOffer.id)
                  setIsViewDialogOpen(false)
                }}>
                  <XCircle className="mr-2 h-4 w-4" />
                  {t("offers.actions.reject")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("offers.deleteOffer")}</DialogTitle>
            <DialogDescription>
              {t("offers.confirmations.deleteDescription")}
            </DialogDescription>
          </DialogHeader>
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
