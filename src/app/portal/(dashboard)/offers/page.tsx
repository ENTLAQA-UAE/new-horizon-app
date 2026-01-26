// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { supabaseSelect, supabaseUpdate } from "@/lib/supabase/auth-fetch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
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
  Gift,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Download,
  Briefcase,
  MapPin,
} from "lucide-react"
import { format, formatDistanceToNow, differenceInDays } from "date-fns"
import { toast } from "sonner"

interface Offer {
  id: string
  status: string
  job_title: string
  job_title_ar: string | null
  department: string | null
  location: string | null
  salary_amount: number
  salary_currency: string
  salary_period: string
  benefits: any[]
  start_date: string | null
  expiry_date: string | null
  offer_letter_url: string | null
  created_at: string
  accepted_at: string | null
  rejected_at: string | null
  applications: {
    jobs: {
      organizations: {
        name: string
        logo_url: string | null
      }
    }
  }
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: FileText },
  pending: { label: "Pending Response", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  accepted: { label: "Accepted", color: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "Declined", color: "bg-red-100 text-red-700", icon: XCircle },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-700", icon: AlertCircle },
  withdrawn: { label: "Withdrawn", color: "bg-gray-100 text-gray-700", icon: XCircle },
}

export default function OffersPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [offers, setOffers] = useState<Offer[]>([])
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [responseDialogOpen, setResponseDialogOpen] = useState(false)
  const [responseType, setResponseType] = useState<"accept" | "reject" | null>(null)
  const [responseNotes, setResponseNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadOffers()
  }, [])

  const loadOffers = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Get candidate ID
      const { data: candidate } = await supabaseSelect<{ id: string }>("candidates", {
        select: "id",
        filter: [{ column: "email", operator: "eq", value: user.email! }],
        single: true,
      })

      if (!candidate) return

      // Get all application IDs for this candidate
      const { data: applications } = await supabaseSelect<{ id: string }[]>("applications", {
        select: "id",
        filter: [{ column: "candidate_id", operator: "eq", value: candidate.id }],
      })

      if (!applications?.length) {
        setIsLoading(false)
        return
      }

      const applicationIds = applications.map(a => a.id)

      // Fetch all offers for candidate's applications
      const { data: offersData } = await supabaseSelect<Offer[]>("offers", {
        select: `id,status,job_title,job_title_ar,department,location,salary_amount,salary_currency,salary_period,benefits,start_date,expiry_date,offer_letter_url,created_at,accepted_at,rejected_at,applications(jobs(organizations:org_id(name,logo_url)))`,
        filter: [{ column: "application_id", operator: "in", value: `(${applicationIds.join(",")})` }],
        order: { column: "created_at", ascending: false },
      })

      setOffers(offersData || [])
    } catch (error) {
      console.error("Error loading offers:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResponse = async () => {
    if (!selectedOffer || !responseType) return

    setIsSubmitting(true)
    try {
      const updateData: Record<string, any> = {
        status: responseType === "accept" ? "accepted" : "rejected",
        candidate_response_notes: responseNotes || null,
      }

      if (responseType === "accept") {
        updateData.accepted_at = new Date().toISOString()
      } else {
        updateData.rejected_at = new Date().toISOString()
      }

      const { error } = await supabaseUpdate(
        "offers",
        updateData,
        { column: "id", value: selectedOffer.id }
      )

      if (error) throw error

      toast.success(
        responseType === "accept"
          ? "Congratulations! You've accepted the offer."
          : "You've declined the offer."
      )

      // Send notification to hiring team
      fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: responseType === "accept" ? "offer_accepted" : "offer_rejected",
          orgId: "", // API will get from offer
          data: {
            offerId: selectedOffer.id,
            candidateName: "", // API will get from offer
            jobTitle: selectedOffer.job_title,
          },
        }),
      }).catch((err) => {
        console.error("Failed to send offer response notification:", err)
      })

      setResponseDialogOpen(false)
      setSelectedOffer(null)
      setResponseType(null)
      setResponseNotes("")
      loadOffers()
    } catch (error) {
      toast.error("Failed to submit response")
    } finally {
      setIsSubmitting(false)
    }
  }

  const pendingOffers = offers.filter(o => o.status === "pending")
  const otherOffers = offers.filter(o => o.status !== "pending")

  const OfferCard = ({ offer }: { offer: Offer }) => {
    const status = statusConfig[offer.status] || statusConfig.pending
    const StatusIcon = status.icon
    const isPending = offer.status === "pending"
    const daysUntilExpiry = offer.expiry_date
      ? differenceInDays(new Date(offer.expiry_date), new Date())
      : null

    return (
      <Card className={isPending ? "border-green-200 bg-green-50/30" : ""}>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            {/* Offer Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={status.color}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {status.label}
                </Badge>
                {isPending && daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
                  <Badge variant="destructive">
                    {daysUntilExpiry <= 0 ? "Expires today!" : `${daysUntilExpiry} days left`}
                  </Badge>
                )}
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{offer.job_title}</h3>
                  <p className="text-muted-foreground">
                    {offer.applications?.jobs?.organizations?.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Salary</p>
                  <p className="font-semibold">
                    {offer.salary_currency} {offer.salary_amount.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{offer.salary_period || "year"}
                    </span>
                  </p>
                </div>
                {offer.department && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Department</p>
                    <p className="font-medium">{offer.department}</p>
                  </div>
                )}
                {offer.location && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Location</p>
                    <p className="font-medium">{offer.location}</p>
                  </div>
                )}
                {offer.start_date && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Start Date</p>
                    <p className="font-medium">
                      {format(new Date(offer.start_date), "MMM d, yyyy")}
                    </p>
                  </div>
                )}
              </div>

              {offer.benefits && offer.benefits.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground uppercase mb-2">Benefits</p>
                  <div className="flex flex-wrap gap-2">
                    {offer.benefits.map((benefit, idx) => (
                      <Badge key={idx} variant="secondary">
                        {typeof benefit === "string" ? benefit : benefit.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-sm text-muted-foreground mt-4">
                Received {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 shrink-0">
              {offer.offer_letter_url && (
                <Button variant="outline" asChild>
                  <a
                    href={offer.offer_letter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    View Offer Letter
                  </a>
                </Button>
              )}
              {isPending && (
                <>
                  <Button
                    onClick={() => {
                      setSelectedOffer(offer)
                      setResponseType("accept")
                      setResponseDialogOpen(true)
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accept Offer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedOffer(offer)
                      setResponseType("reject")
                      setResponseDialogOpen(true)
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Decline
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
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
        <h1 className="text-3xl font-bold tracking-tight">Offers</h1>
        <p className="text-muted-foreground">
          Review and respond to your job offers
        </p>
      </div>

      {/* Pending Offers Alert */}
      {pendingOffers.length > 0 && (
        <Card className="border-green-300 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Gift className="h-5 w-5" />
              You have {pendingOffers.length} pending offer{pendingOffers.length > 1 ? "s" : ""}!
            </CardTitle>
            <CardDescription>
              Please review and respond to your offer{pendingOffers.length > 1 ? "s" : ""} below
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Offers List */}
      {offers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Gift className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No offers yet</h3>
            <p className="text-muted-foreground">
              When you receive a job offer, it will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={pendingOffers.length > 0 ? "pending" : "all"}>
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingOffers.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All Offers ({offers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingOffers.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No pending offers
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingOffers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <div className="space-y-4">
              {offers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseType === "accept" ? (
                <span className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Accept Offer
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Decline Offer
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {responseType === "accept"
                ? "Congratulations! You're about to accept this job offer."
                : "Are you sure you want to decline this offer?"}
            </DialogDescription>
          </DialogHeader>

          {selectedOffer && (
            <div className="py-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="font-medium">{selectedOffer.job_title}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedOffer.applications?.jobs?.organizations?.name}
                </p>
                <p className="text-sm font-medium mt-2">
                  {selectedOffer.salary_currency} {selectedOffer.salary_amount.toLocaleString()}/
                  {selectedOffer.salary_period || "year"}
                </p>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium">
                  {responseType === "accept" ? "Message (optional)" : "Reason for declining (optional)"}
                </label>
                <Textarea
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  placeholder={
                    responseType === "accept"
                      ? "Thank you for this opportunity..."
                      : "I've decided to pursue another opportunity..."
                  }
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResponseDialogOpen(false)
                setSelectedOffer(null)
                setResponseType(null)
                setResponseNotes("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResponse}
              disabled={isSubmitting}
              className={responseType === "accept" ? "bg-green-600 hover:bg-green-700" : ""}
              variant={responseType === "reject" ? "destructive" : "default"}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {responseType === "accept" ? "Accept Offer" : "Decline Offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
