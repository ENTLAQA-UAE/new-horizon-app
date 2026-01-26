"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabaseInsert, supabaseUpdate } from "@/lib/supabase/auth-fetch"
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
  Clock,
  Video,
  Phone,
  MapPin,
  Users,
  Loader2,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  User,
  Briefcase,
  Sparkles,
  Copy,
  ExternalLink,
  Link2,
  RefreshCw,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { format, addHours, startOfDay, isSameDay, isAfter, isBefore } from "date-fns"
import { useAI } from "@/hooks/use-ai"
import { ScorecardForm } from "@/components/interviews/scorecard-form"
import { ClipboardList, X, Mail, Globe } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Common timezones for the Middle East and international use
const timezones = [
  { value: "Asia/Riyadh", label: "Riyadh (GMT+3)" },
  { value: "Asia/Dubai", label: "Dubai (GMT+4)" },
  { value: "Asia/Kuwait", label: "Kuwait (GMT+3)" },
  { value: "Asia/Bahrain", label: "Bahrain (GMT+3)" },
  { value: "Asia/Qatar", label: "Qatar (GMT+3)" },
  { value: "Africa/Cairo", label: "Cairo (GMT+2)" },
  { value: "Europe/London", label: "London (GMT+0)" },
  { value: "Europe/Paris", label: "Paris (GMT+1)" },
  { value: "America/New_York", label: "New York (GMT-5)" },
  { value: "America/Los_Angeles", label: "Los Angeles (GMT-8)" },
  { value: "Asia/Singapore", label: "Singapore (GMT+8)" },
  { value: "Asia/Tokyo", label: "Tokyo (GMT+9)" },
  { value: "UTC", label: "UTC (GMT+0)" },
]

// Roles that can conduct interviews
const interviewerRoles = ["interviewer", "hiring_manager", "hr_manager", "org_admin", "recruiter"]

interface Interview {
  id: string
  application_id: string
  title: string
  interview_type: string
  scheduled_at: string
  duration_minutes: number
  timezone: string
  location: string | null
  meeting_link: string | null
  meeting_password: string | null
  interviewer_ids: string[]
  organizer_id: string | null
  status: string
  candidate_confirmed: boolean
  overall_rating: number | null
  feedback: any[]
  recommendation: string | null
  internal_notes: string | null
  applications: {
    id: string
    candidates: {
      id: string
      first_name: string
      last_name: string
      email: string
      phone: string | null
      current_title: string | null
    }
    jobs: {
      id: string
      title: string
      title_ar: string | null
    }
  } | null
}

interface TeamMember {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  role: string
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
  }
}

interface ScorecardCriteria {
  id: string
  name: string
  name_ar?: string
  description?: string
  weight: number
}

interface ScorecardTemplate {
  id: string
  name: string
  name_ar?: string
  criteria: ScorecardCriteria[]
  rating_scale_type: string
  rating_scale_labels: Record<string, string>
  require_notes_per_criteria: boolean
}

interface MeetingProvider {
  provider: string
  is_enabled: boolean
  is_verified: boolean
  is_default_meeting_provider: boolean
}

interface InterviewsClientProps {
  interviews: Interview[]
  teamMembers: TeamMember[]
  applications: Application[]
  hasCalendarConnected?: boolean
  organizationId: string
  scorecardTemplates: ScorecardTemplate[]
  meetingProviders?: MeetingProvider[]
  defaultMeetingProvider?: string | null
}

const interviewTypes = [
  { value: "video", label: "Video Call", icon: Video },
  { value: "in_person", label: "Physical Interview", icon: MapPin },
]

const meetingProviderInfo: Record<string, { name: string; icon: string }> = {
  zoom: { name: "Zoom", icon: "🎦" },
  microsoft: { name: "Microsoft Teams", icon: "🟦" },
  google: { name: "Google Meet", icon: "🟢" },
}

const statusStyles: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  no_show: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
}

const durationOptions = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
]

export function InterviewsClient({
  interviews: initialInterviews,
  teamMembers,
  applications,
  hasCalendarConnected = false,
  organizationId,
  scorecardTemplates,
  meetingProviders = [],
  defaultMeetingProvider = null,
}: InterviewsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { generateInterviewQuestions, isLoading: isAILoading } = useAI()

  const [interviews, setInterviews] = useState(initialInterviews)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Handle "schedule" query parameter - auto-open dialog with application pre-selected
  useEffect(() => {
    const scheduleAppId = searchParams.get("schedule")
    if (scheduleAppId) {
      const app = applications.find(a => a.id === scheduleAppId)
      if (app) {
        setFormData(prev => ({
          ...prev,
          application_id: scheduleAppId,
          title: `Interview - ${app.candidates.first_name} ${app.candidates.last_name}`,
        }))
        setIsCreateDialogOpen(true)
        // Clear the query param
        router.replace("/org/interviews", { scroll: false })
      }
    }
  }, [searchParams, applications, router])
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isQuestionsDialogOpen, setIsQuestionsDialogOpen] = useState(false)
  const [isScorecardDialogOpen, setIsScorecardDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false)

  // Selected interview
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([])

  // Available meeting providers
  const availableProviders = meetingProviders.filter(p => p.is_enabled && p.is_verified)
  const hasVideoProviders = availableProviders.length > 0

  // External guest email input state
  const [guestEmailInput, setGuestEmailInput] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    application_id: "",
    title: "",
    interview_type: "video",
    scheduled_date: new Date(),
    scheduled_time: "10:00",
    duration_minutes: 60,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Riyadh",
    location: "",
    meeting_link: "",
    meeting_provider: defaultMeetingProvider || "",
    interviewer_ids: [] as string[],
    external_guests: [] as string[], // External email addresses
    internal_notes: "",
    syncToCalendar: hasCalendarConnected,
    addMeetLink: true,
  })

  // Filter team members who can be interviewers
  const interviewerMembers = teamMembers.filter(m =>
    interviewerRoles.includes(m.role?.toLowerCase() || "")
  )

  const filteredInterviews = interviews.filter((interview) => {
    const candidateName = `${interview.applications?.candidates?.first_name || ""} ${interview.applications?.candidates?.last_name || ""}`.toLowerCase()
    const jobTitle = interview.applications?.jobs?.title?.toLowerCase() || ""
    const matchesSearch =
      candidateName.includes(searchQuery.toLowerCase()) ||
      jobTitle.includes(searchQuery.toLowerCase()) ||
      interview.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || interview.status === statusFilter
    const matchesDate = !selectedDate || isSameDay(new Date(interview.scheduled_at), selectedDate)
    return matchesSearch && matchesStatus && matchesDate
  })

  // Group interviews by date
  const upcomingInterviews = filteredInterviews.filter(
    (i) => isAfter(new Date(i.scheduled_at), new Date()) && i.status !== "cancelled"
  )
  const pastInterviews = filteredInterviews.filter(
    (i) => isBefore(new Date(i.scheduled_at), new Date()) || i.status === "cancelled"
  )

  const stats = {
    total: interviews.length,
    upcoming: upcomingInterviews.length,
    today: interviews.filter((i) => isSameDay(new Date(i.scheduled_at), new Date())).length,
    completed: interviews.filter((i) => i.status === "completed").length,
  }

  const resetForm = () => {
    setFormData({
      application_id: "",
      title: "",
      interview_type: "video",
      scheduled_date: new Date(),
      scheduled_time: "10:00",
      duration_minutes: 60,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Riyadh",
      location: "",
      meeting_link: "",
      meeting_provider: defaultMeetingProvider || "",
      interviewer_ids: [],
      external_guests: [],
      internal_notes: "",
      syncToCalendar: hasCalendarConnected,
      addMeetLink: true,
    })
    setGuestEmailInput("")
  }

  // Add external guest email
  const addExternalGuest = () => {
    const email = guestEmailInput.trim().toLowerCase()
    if (!email) return

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address")
      return
    }

    // Check for duplicates
    if (formData.external_guests.includes(email)) {
      toast.error("This email is already added")
      return
    }

    setFormData({
      ...formData,
      external_guests: [...formData.external_guests, email],
    })
    setGuestEmailInput("")
  }

  // Remove external guest
  const removeExternalGuest = (email: string) => {
    setFormData({
      ...formData,
      external_guests: formData.external_guests.filter(e => e !== email),
    })
  }

  // Toggle interviewer selection
  const toggleInterviewer = (interviewerId: string) => {
    if (formData.interviewer_ids.includes(interviewerId)) {
      setFormData({
        ...formData,
        interviewer_ids: formData.interviewer_ids.filter(id => id !== interviewerId),
      })
    } else {
      setFormData({
        ...formData,
        interviewer_ids: [...formData.interviewer_ids, interviewerId],
      })
    }
  }

  // Build attendees list for meeting invites
  const buildAttendeesList = () => {
    const attendees: { email: string; name?: string }[] = []

    // Add selected interviewers
    formData.interviewer_ids.forEach(id => {
      const member = teamMembers.find(m => m.id === id)
      if (member) {
        attendees.push({ email: member.email, name: member.full_name })
      }
    })

    // Add external guests
    formData.external_guests.forEach(email => {
      attendees.push({ email })
    })

    // Add candidate if we have the application
    const app = applications.find(a => a.id === formData.application_id)
    if (app?.candidates?.email) {
      attendees.push({
        email: app.candidates.email,
        name: `${app.candidates.first_name} ${app.candidates.last_name}`,
      })
    }

    return attendees
  }

  // Create meeting via provider API
  const createMeeting = async (provider: string, title: string, startTime: Date, durationMinutes: number) => {
    const attendees = buildAttendeesList()

    try {
      if (provider === "zoom") {
        const response = await fetch("/api/zoom/meetings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: title,
            start_time: startTime.toISOString(),
            duration: durationMinutes,
            timezone: formData.timezone,
            attendees: attendees, // Add attendees for Zoom invites
          }),
        })
        if (response.ok) {
          const data = await response.json()
          return { url: data.join_url, id: data.id }
        }
      } else if (provider === "microsoft") {
        const response = await fetch("/api/microsoft/meetings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: title,
            startDateTime: startTime.toISOString(),
            endDateTime: new Date(startTime.getTime() + durationMinutes * 60000).toISOString(),
            isOnlineMeeting: true,
            attendees: attendees, // API handles formatting
            timezone: formData.timezone,
          }),
        })
        if (response.ok) {
          const data = await response.json()
          return { url: data.onlineMeeting?.joinUrl || data.webLink, id: data.id }
        }
      } else if (provider === "google") {
        const response = await fetch("/api/google/meetings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: title,
            start_time: startTime.toISOString(),
            duration: durationMinutes,
            timezone: formData.timezone,
            attendees: attendees, // Google Meet will send calendar invites
          }),
        })
        if (response.ok) {
          const data = await response.json()
          return { url: data.join_url, id: data.id }
        } else {
          // Log error for debugging
          const errorData = await response.json().catch(() => ({}))
          console.error("Google Meet creation failed:", errorData)
        }
      }
      return null
    } catch (error) {
      console.error("Error creating meeting:", error)
      return null
    }
  }

  // Generate meeting link manually (button click)
  const handleGenerateMeetingLink = async () => {
    if (!formData.meeting_provider || formData.meeting_provider === "manual") {
      toast.error("Please select a meeting provider")
      return
    }

    if (!formData.application_id) {
      toast.error("Please select a candidate application first")
      return
    }

    setIsCreatingMeeting(true)
    try {
      // Combine date and time
      const [hours, minutes] = formData.scheduled_time.split(":").map(Number)
      const scheduledAt = new Date(formData.scheduled_date)
      scheduledAt.setHours(hours, minutes, 0, 0)

      const app = applications.find((a) => a.id === formData.application_id)
      const meetingTitle = formData.title || `Interview - ${app?.candidates.first_name} ${app?.candidates.last_name}`

      const meetingResult = await createMeeting(
        formData.meeting_provider,
        meetingTitle,
        scheduledAt,
        formData.duration_minutes
      )

      if (meetingResult?.url) {
        setFormData({ ...formData, meeting_link: meetingResult.url })
        toast.success(`${meetingProviderInfo[formData.meeting_provider]?.name || formData.meeting_provider} meeting created!`)
      } else {
        toast.error(`Failed to create meeting. Please check your ${meetingProviderInfo[formData.meeting_provider]?.name || formData.meeting_provider} integration in Settings → Integrations.`)
      }
    } catch (error) {
      console.error("Error generating meeting link:", error)
      toast.error("Failed to generate meeting link")
    } finally {
      setIsCreatingMeeting(false)
    }
  }

  // CREATE
  const handleCreate = async () => {
    if (!formData.application_id || !formData.title) {
      toast.error("Please fill in required fields")
      return
    }

    setIsLoading(true)
    try {
      // Combine date and time
      const [hours, minutes] = formData.scheduled_time.split(":").map(Number)
      const scheduledAt = new Date(formData.scheduled_date)
      scheduledAt.setHours(hours, minutes, 0, 0)

      // Auto-create meeting link if video call with provider selected
      let meetingLink = formData.meeting_link
      if (formData.interview_type === "video" && formData.meeting_provider && !meetingLink) {
        setIsCreatingMeeting(true)
        const app = applications.find((a) => a.id === formData.application_id)
        const meetingTitle = `${formData.title} - ${app?.candidates.first_name} ${app?.candidates.last_name}`
        const meetingResult = await createMeeting(
          formData.meeting_provider,
          meetingTitle,
          scheduledAt,
          formData.duration_minutes
        )
        setIsCreatingMeeting(false)
        if (meetingResult?.url) {
          meetingLink = meetingResult.url
          toast.success(`Meeting created via ${meetingProviderInfo[formData.meeting_provider]?.name || formData.meeting_provider}`)
        }
      }

      const { data, error } = await supabaseInsert<Interview>("interviews", {
        org_id: organizationId,
        application_id: formData.application_id,
        title: formData.title,
        interview_type: formData.interview_type,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: formData.duration_minutes,
        timezone: formData.timezone,
        location: formData.location || null,
        meeting_link: meetingLink || null,
        interviewer_ids: formData.interviewer_ids,
        internal_notes: formData.internal_notes || null,
        status: "scheduled",
      })

      if (error) {
        toast.error(error.message)
        return
      }

      // Sync to Google Calendar if enabled
      if (formData.syncToCalendar && hasCalendarConnected) {
        try {
          const app = applications.find((a) => a.id === formData.application_id)
          const endTime = new Date(scheduledAt)
          endTime.setMinutes(endTime.getMinutes() + formData.duration_minutes)

          // Build attendees list for calendar invite
          const calendarAttendees: { email: string; name?: string }[] = []

          // Add candidate
          if (app?.candidates?.email) {
            calendarAttendees.push({
              email: app.candidates.email,
              name: `${app.candidates.first_name} ${app.candidates.last_name}`,
            })
          }

          // Add interviewers
          formData.interviewer_ids.forEach(id => {
            const member = teamMembers.find(m => m.id === id)
            if (member) {
              calendarAttendees.push({ email: member.email, name: member.full_name })
            }
          })

          // Add external guests
          formData.external_guests.forEach(email => {
            calendarAttendees.push({ email })
          })

          // Build description with interviewer info
          let description = `Interview for ${app?.jobs.title} position.\n\n`
          description += `Candidate: ${app?.candidates.first_name} ${app?.candidates.last_name} (${app?.candidates.email})\n`

          if (formData.interviewer_ids.length > 0) {
            const interviewerNames = formData.interviewer_ids
              .map(id => teamMembers.find(m => m.id === id)?.full_name)
              .filter(Boolean)
              .join(", ")
            description += `Interviewers: ${interviewerNames}\n`
          }

          description += `\nTimezone: ${formData.timezone}`

          const calendarResponse = await fetch("/api/google/calendar/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              summary: formData.title,
              description,
              location: formData.location || undefined,
              startTime: scheduledAt.toISOString(),
              endTime: endTime.toISOString(),
              attendees: calendarAttendees,
              addMeetLink: formData.addMeetLink && formData.interview_type === "video",
              interviewId: data.id,
              timeZone: formData.timezone,
            }),
          })

          if (calendarResponse.ok) {
            const calendarData = await calendarResponse.json()
            // Update local state with calendar link
            if (calendarData.event?.hangoutLink) {
              data.meeting_link = calendarData.event.hangoutLink
            }
            toast.success("Interview scheduled and synced to Google Calendar")
          } else {
            toast.success("Interview scheduled (Calendar sync failed)")
          }
        } catch (calendarError) {
          console.error("Calendar sync error:", calendarError)
          toast.success("Interview scheduled (Calendar sync failed)")
        }
      } else {
        toast.success("Interview scheduled successfully")
      }

      // Send notification to candidate and interviewers
      const tzLabel = timezones.find(tz => tz.value === formData.timezone)?.label || formData.timezone
      fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "interview_scheduled",
          orgId: organizationId,
          data: {
            applicationId: formData.application_id,
            interviewId: data.id,
            interviewDate: format(scheduledAt, "EEEE, MMMM d, yyyy"),
            interviewTime: `${format(scheduledAt, "h:mm a")} (${tzLabel})`,
            interviewType: formData.interview_type,
            meetingLink: meetingLink || null,
            location: formData.location || null, // Physical location for in-person interviews
            interviewerIds: formData.interviewer_ids,
            timezone: formData.timezone,
          },
        }),
      }).catch((err) => {
        console.error("Failed to send interview notification:", err)
      })

      // Log activity for interview scheduled
      fetch(`/api/applications/${formData.application_id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_type: "interview_scheduled",
          description: `Interview scheduled: ${formData.title} on ${format(scheduledAt, "MMM d, yyyy 'at' h:mm a")}`,
          metadata: {
            interview_id: data.id,
            interview_type: formData.interview_type,
            scheduled_at: scheduledAt.toISOString(),
          },
        }),
      }).catch((err) => {
        console.error("Failed to log interview activity:", err)
      })

      setInterviews([data as unknown as Interview, ...interviews])
      setIsCreateDialogOpen(false)
      resetForm()
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // STATUS CHANGE
  const handleStatusChange = async (interviewId: string, newStatus: string) => {
    try {
      const updateData: Record<string, any> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      }

      if (newStatus === "completed") {
        updateData.completed_at = new Date().toISOString()
      }
      if (newStatus === "cancelled") {
        updateData.cancelled_at = new Date().toISOString()
      }

      const { error } = await supabaseUpdate("interviews", updateData, { column: "id", value: interviewId })

      if (error) {
        toast.error(error.message)
        return
      }

      setInterviews(
        interviews.map((i) =>
          i.id === interviewId ? { ...i, status: newStatus, ...updateData } : i
        )
      )

      // Send notification if interview was cancelled
      if (newStatus === "cancelled") {
        fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: "interview_cancelled",
            orgId: organizationId,
            data: {
              interviewId,
            },
          }),
        }).catch((err) => {
          console.error("Failed to send cancellation notification:", err)
        })
      }

      // Log activity for interview status change
      const interview = interviews.find(i => i.id === interviewId)
      if (interview?.applications?.id) {
        const statusLabels: Record<string, string> = {
          confirmed: "confirmed",
          completed: "completed",
          cancelled: "cancelled",
          no_show: "marked as no-show",
        }
        fetch(`/api/applications/${interview.applications.id}/activities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activity_type: `interview_${newStatus}`,
            description: `Interview ${statusLabels[newStatus] || newStatus}: ${interview.title}`,
            metadata: {
              interview_id: interviewId,
              new_status: newStatus,
            },
          }),
        }).catch((err) => {
          console.error("Failed to log interview status activity:", err)
        })
      }

      toast.success(`Interview marked as ${newStatus}`)
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    }
  }

  // Generate AI Questions
  const handleGenerateQuestions = async (interview: Interview) => {
    if (!interview.applications) return

    setSelectedInterview(interview)
    setIsQuestionsDialogOpen(true)

    const questions = await generateInterviewQuestions(
      interview.applications.jobs.title,
      "", // description
      [], // skills
      interview.interview_type === "assessment" ? "technical" : "behavioral"
    )

    if (questions) {
      setGeneratedQuestions(questions)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: format(date, "EEE, MMM d, yyyy"),
      time: format(date, "h:mm a"),
    }
  }

  const InterviewCard = ({ interview }: { interview: Interview }) => {
    const { date, time } = formatDateTime(interview.scheduled_at)
    const TypeIcon = interviewTypes.find((t) => t.value === interview.interview_type)?.icon || Video

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TypeIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{interview.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {interview.applications?.candidates?.first_name}{" "}
                  {interview.applications?.candidates?.last_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {interview.applications?.jobs?.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn("capitalize", statusStyles[interview.status])}>
                {interview.status.replace("_", " ")}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => handleGenerateQuestions(interview)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI Questions
                  </DropdownMenuItem>
                  {interview.meeting_link && (
                    <DropdownMenuItem
                      onSelect={() => {
                        navigator.clipboard.writeText(interview.meeting_link!)
                        toast.success("Meeting link copied")
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Meeting Link
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {interview.status === "scheduled" && (
                    <>
                      <DropdownMenuItem
                        onSelect={() => handleStatusChange(interview.id, "confirmed")}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark Confirmed
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => handleStatusChange(interview.id, "completed")}
                        className="text-green-600"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark Completed
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => handleStatusChange(interview.id, "no_show")}
                        className="text-orange-600"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        No Show
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => handleStatusChange(interview.id, "cancelled")}
                        className="text-red-600"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel
                      </DropdownMenuItem>
                    </>
                  )}
                  {(interview.status === "completed" || interview.status === "confirmed") && scorecardTemplates.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => {
                          setSelectedInterview(interview)
                          setIsScorecardDialogOpen(true)
                        }}
                      >
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Fill Scorecard
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{time}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{interview.duration_minutes} min</span>
            </div>
          </div>
          {interview.interviewer_ids && interview.interviewer_ids.length > 0 && (
            <div className="mt-2 flex items-center gap-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {interview.interviewer_ids.length} interviewer(s)
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Interviews</h2>
          <p className="text-muted-foreground">
            Schedule and manage candidate interviews
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Interview
        </Button>
      </div>

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
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.today}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by candidate, job, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no_show">No Show</SelectItem>
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Filter by date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
            />
            {selectedDate && (
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedDate(undefined)}
                >
                  Clear filter
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Interviews */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingInterviews.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastInterviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingInterviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No upcoming interviews</p>
                <Button
                  variant="link"
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="mt-2"
                >
                  Schedule your first interview
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingInterviews.map((interview) => (
                <InterviewCard key={interview.id} interview={interview} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastInterviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No past interviews</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastInterviews.map((interview) => (
                <InterviewCard key={interview.id} interview={interview} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Interview Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              Schedule a new interview with a candidate
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="application_id">Candidate Application *</Label>
              <Select
                value={formData.application_id}
                onValueChange={(value) => {
                  const app = applications.find((a) => a.id === value)
                  setFormData({
                    ...formData,
                    application_id: value,
                    title: app
                      ? `Interview: ${app.candidates.first_name} ${app.candidates.last_name} - ${app.jobs.title}`
                      : "",
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select candidate" />
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

            <div className="space-y-2">
              <Label htmlFor="title">Interview Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Technical Interview - Round 1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Interview Type</Label>
                <Select
                  value={formData.interview_type}
                  onValueChange={(value) => setFormData({ ...formData, interview_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {interviewTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select
                  value={formData.duration_minutes.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, duration_minutes: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.scheduled_date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.scheduled_date}
                      onSelect={(date) =>
                        date && setFormData({ ...formData, scheduled_date: date })
                      }
                      disabled={(date) => date < startOfDay(new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduled_time: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Timezone Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Timezone
              </Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData({ ...formData, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Interviewer Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assign Interviewers
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Select team members to conduct this interview. They will receive notifications and calendar invites.
              </p>
              <div className="border rounded-lg max-h-[160px] overflow-y-auto">
                {interviewerMembers.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {interviewerMembers.map((member) => (
                      <div
                        key={member.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                          formData.interviewer_ids.includes(member.id)
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-muted"
                        )}
                        onClick={() => toggleInterviewer(member.id)}
                      >
                        <Checkbox
                          checked={formData.interviewer_ids.includes(member.id)}
                          onCheckedChange={() => toggleInterviewer(member.id)}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {member.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {member.role?.replace("_", " ")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No team members with interviewer roles found
                  </div>
                )}
              </div>
              {formData.interviewer_ids.length > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {formData.interviewer_ids.length} interviewer(s) selected
                </p>
              )}
            </div>

            {/* External Guests */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Invite External Guests (Optional)
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Add email addresses of external participants. They will receive calendar invites from the video provider.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="guest@example.com"
                  value={guestEmailInput}
                  onChange={(e) => setGuestEmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addExternalGuest()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addExternalGuest}
                  disabled={!guestEmailInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.external_guests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.external_guests.map((email) => (
                    <Badge key={email} variant="secondary" className="flex items-center gap-1 pr-1">
                      <Mail className="h-3 w-3" />
                      {email}
                      <button
                        type="button"
                        onClick={() => removeExternalGuest(email)}
                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {formData.interview_type === "video" && (
              <div className="space-y-4">
                {/* Meeting Provider Selection with Generate Button */}
                {hasVideoProviders ? (
                  <div className="space-y-3">
                    <Label>Meeting Provider</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.meeting_provider}
                        onValueChange={(value) => setFormData({ ...formData, meeting_provider: value, meeting_link: "" })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProviders.map((provider) => (
                            <SelectItem key={provider.provider} value={provider.provider}>
                              <div className="flex items-center gap-2">
                                <span>{meetingProviderInfo[provider.provider]?.icon}</span>
                                <span>{meetingProviderInfo[provider.provider]?.name || provider.provider}</span>
                                {provider.is_default_meeting_provider && (
                                  <Badge variant="secondary" className="ml-2 text-xs">Default</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                          <SelectItem value="manual">
                            <div className="flex items-center gap-2">
                              <span>🔗</span>
                              <span>Enter link manually</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {formData.meeting_provider && formData.meeting_provider !== "manual" && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGenerateMeetingLink}
                          disabled={isCreatingMeeting || !formData.application_id}
                          className="shrink-0"
                        >
                          {isCreatingMeeting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Link2 className="h-4 w-4 mr-2" />
                          )}
                          Generate Link
                        </Button>
                      )}
                    </div>

                    {/* Meeting Link Display/Input */}
                    <div className="space-y-2">
                      <Label htmlFor="meeting_link">Meeting Link</Label>
                      <div className="flex gap-2">
                        <Input
                          id="meeting_link"
                          value={formData.meeting_link}
                          onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                          placeholder={formData.meeting_provider === "manual"
                            ? "https://zoom.us/... or https://meet.google.com/..."
                            : "Click 'Generate Link' to create a meeting"}
                          readOnly={formData.meeting_provider !== "manual" && !!formData.meeting_link}
                          className={formData.meeting_link ? "bg-green-50 dark:bg-green-950/20 border-green-300" : ""}
                        />
                        {formData.meeting_link && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText(formData.meeting_link)
                              toast.success("Meeting link copied!")
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {formData.meeting_link && (
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Meeting link generated successfully
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="meeting_link">Meeting Link</Label>
                    <Input
                      id="meeting_link"
                      value={formData.meeting_link}
                      onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                      placeholder="https://zoom.us/... or https://meet.google.com/..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Configure meeting integrations in Settings → Integrations to auto-generate links
                    </p>
                  </div>
                )}
              </div>
            )}

            {hasCalendarConnected && (
              <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <Checkbox
                  id="syncToCalendar"
                  checked={formData.syncToCalendar}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, syncToCalendar: checked as boolean })
                  }
                />
                <div className="flex-1">
                  <label
                    htmlFor="syncToCalendar"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Sync to Google Calendar
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Creates a calendar event and sends invites to attendees
                  </p>
                </div>
                <CalendarIcon className="h-5 w-5 text-blue-600" />
              </div>
            )}

            {formData.interview_type === "in_person" && (
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Office address or room"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="internal_notes">Internal Notes</Label>
              <Textarea
                id="internal_notes"
                value={formData.internal_notes}
                onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                placeholder="Notes for the interview team..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Questions Dialog */}
      <Dialog open={isQuestionsDialogOpen} onOpenChange={setIsQuestionsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Interview Questions
            </DialogTitle>
            <DialogDescription>
              AI-generated questions for this interview
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isAILoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Generating questions...</span>
              </div>
            ) : generatedQuestions.length > 0 ? (
              <div className="space-y-3">
                {generatedQuestions.map((question, index) => (
                  <div key={index} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-semibold text-primary">{index + 1}.</span>
                    <p className="text-sm">{question}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No questions generated yet
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(generatedQuestions.join("\n\n"))
                toast.success("Questions copied to clipboard")
              }}
              disabled={generatedQuestions.length === 0}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy All
            </Button>
            <Button onClick={() => setIsQuestionsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scorecard Dialog */}
      <Dialog open={isScorecardDialogOpen} onOpenChange={setIsScorecardDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Interview Scorecard
            </DialogTitle>
            {selectedInterview && (
              <DialogDescription>
                Evaluate {selectedInterview.applications?.candidates?.first_name}{" "}
                {selectedInterview.applications?.candidates?.last_name} for{" "}
                {selectedInterview.applications?.jobs?.title}
              </DialogDescription>
            )}
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            {selectedInterview && scorecardTemplates.length > 0 ? (
              <ScorecardForm
                interviewId={selectedInterview.id}
                applicationId={selectedInterview.applications?.id}
                templates={scorecardTemplates}
                onSubmit={() => {
                  setIsScorecardDialogOpen(false)
                  toast.success("Scorecard submitted successfully")
                  router.refresh()
                }}
                onSave={() => {
                  toast.success("Scorecard saved as draft")
                }}
              />
            ) : (
              <div className="text-center py-8">
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No scorecard templates available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create scorecard templates in Settings &gt; Scorecards
                </p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
