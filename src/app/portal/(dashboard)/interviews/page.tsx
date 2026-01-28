"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  Users,
  Building2,
  ExternalLink,
  CheckCircle,
  XCircle,
  CalendarDays,
} from "lucide-react"
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns"

interface Interview {
  id: string
  title: string
  interview_type: string
  scheduled_at: string
  duration_minutes: number
  location: string | null
  meeting_link: string | null
  notes: string | null
  status: string
  applications: {
    id: string
    jobs: {
      title: string
      organizations: {
        name: string
      }
    }
  }
  interview_participants: {
    profiles: {
      first_name: string
      last_name: string
    }
  }[]
}

const interviewTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  phone: { label: "Phone Interview", icon: Phone, color: "bg-blue-100 text-blue-700" },
  video: { label: "Video Interview", icon: Video, color: "bg-purple-100 text-purple-700" },
  in_person: { label: "In-Person", icon: Users, color: "bg-green-100 text-green-700" },
  panel: { label: "Panel Interview", icon: Users, color: "bg-orange-100 text-orange-700" },
  technical: { label: "Technical", icon: Building2, color: "bg-yellow-100 text-yellow-700" },
}

export default function InterviewsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([])
  const [pastInterviews, setPastInterviews] = useState<Interview[]>([])

  useEffect(() => {
    loadInterviews()
  }, [])

  const loadInterviews = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Get candidate ID
      const { data: candidate } = await supabase
        .from("candidates")
        .select("id")
        .eq("email", user.email)
        .single()

      if (!candidate) return

      // Get all application IDs for this candidate
      const { data: applications } = await supabase
        .from("applications")
        .select("id")
        .eq("candidate_id", candidate.id)

      if (!applications?.length) {
        setIsLoading(false)
        return
      }

      const applicationIds = applications.map(a => a.id)

      // Fetch all interviews for candidate's applications
      const { data: interviews } = await supabase
        .from("interviews")
        .select(`
          id,
          title,
          interview_type,
          scheduled_at,
          duration_minutes,
          location,
          meeting_link,
          notes,
          status,
          applications (
            id,
            jobs (
              title,
              organizations:org_id (
                name
              )
            )
          ),
          interview_participants (
            profiles:user_id (
              first_name,
              last_name
            )
          )
        `)
        .in("application_id", applicationIds)
        .order("scheduled_at", { ascending: true })

      if (interviews) {
        const now = new Date()
        setUpcomingInterviews(interviews.filter(i => new Date(i.scheduled_at) >= now))
        setPastInterviews(interviews.filter(i => new Date(i.scheduled_at) < now).reverse())
      }
    } catch (error) {
      console.error("Error loading interviews:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"
    return format(date, "EEEE, MMMM d")
  }

  const InterviewCard = ({ interview, isPast = false }: { interview: Interview; isPast?: boolean }) => {
    const type = interviewTypeConfig[interview.interview_type] || interviewTypeConfig.video
    const TypeIcon = type.icon
    const scheduledDate = new Date(interview.scheduled_at)
    const endTime = new Date(scheduledDate.getTime() + interview.duration_minutes * 60000)

    return (
      <Card className={isPast ? "opacity-75" : ""}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            {/* Interview Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={type.color}>
                  <TypeIcon className="mr-1 h-3 w-3" />
                  {type.label}
                </Badge>
                {isPast && interview.status === "completed" && (
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Completed
                  </Badge>
                )}
                {isPast && interview.status === "cancelled" && (
                  <Badge variant="outline" className="text-red-600">
                    <XCircle className="mr-1 h-3 w-3" />
                    Cancelled
                  </Badge>
                )}
              </div>

              <h3 className="font-semibold text-lg">{interview.title}</h3>
              <p className="text-muted-foreground">
                {interview.applications?.jobs?.title} at{" "}
                {interview.applications?.jobs?.organizations?.name}
              </p>

              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{getDateLabel(scheduledDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(scheduledDate, "h:mm a")} - {format(endTime, "h:mm a")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{interview.duration_minutes} minutes</span>
                </div>
              </div>

              {interview.location && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{interview.location}</span>
                </div>
              )}

              {interview.interview_participants?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-1">Interviewers:</p>
                  <div className="flex flex-wrap gap-2">
                    {interview.interview_participants.map((p, idx) => (
                      <Badge key={idx} variant="secondary">
                        {p.profiles?.first_name} {p.profiles?.last_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {interview.notes && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Notes:</p>
                  <p className="text-sm text-muted-foreground">{interview.notes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {!isPast && interview.meeting_link && (
              <div className="shrink-0">
                <Button asChild>
                  <a
                    href={interview.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Join Meeting
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            )}
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
        <h1 className="text-3xl font-bold tracking-tight">Interviews</h1>
        <p className="text-muted-foreground">
          View and prepare for your scheduled interviews
        </p>
      </div>

      {/* Content */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingInterviews.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastInterviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingInterviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No upcoming interviews</h3>
                <p className="text-muted-foreground">
                  When you're scheduled for an interview, it will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingInterviews.map((interview) => (
                <InterviewCard key={interview.id} interview={interview} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {pastInterviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No past interviews</h3>
                <p className="text-muted-foreground">
                  Your interview history will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pastInterviews.map((interview) => (
                <InterviewCard key={interview.id} interview={interview} isPast />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
