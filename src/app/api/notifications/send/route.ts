// @ts-nocheck
/**
 * Notification Send Endpoint
 *
 * Triggers notifications for various events from client components.
 * Validates user permissions and sends to appropriate channels.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { sendNotification, notify, NotificationEventCode, NotificationRecipient } from "@/lib/notifications/send-notification"
import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Helper to get internal team recipients with both userId and email
 * This enables both in-app and email notifications when both channels are enabled
 */
async function getTeamRecipients(
  supabase: SupabaseClient,
  orgId: string,
  roles?: string[]
): Promise<NotificationRecipient[]> {
  // Get user IDs from user_roles
  let query = supabase
    .from("user_roles")
    .select("user_id")
    .eq("org_id", orgId)

  if (roles && roles.length > 0) {
    query = query.in("role", roles)
  }

  const { data: roleData } = await query

  if (!roleData || roleData.length === 0) {
    return []
  }

  const userIds = roleData.map(r => r.user_id)

  // Get user profiles with email
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds)

  return (profiles || []).map(p => ({
    userId: p.id,
    email: p.email,
    name: p.full_name || p.email,
  }))
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { eventType, data } = body
    let { orgId } = body

    if (!eventType) {
      return NextResponse.json({ error: "Missing eventType" }, { status: 400 })
    }

    // Get user's org_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single()

    // For events that need org lookup (from candidate portal or scorecard form)
    const eventsNeedingOrgLookup = ["offer_accepted", "offer_rejected", "scorecard_submitted"]

    if (!orgId && eventsNeedingOrgLookup.includes(eventType)) {
      // Get org from the related entity
      if (eventType === "offer_accepted" || eventType === "offer_rejected") {
        if (data.offerId) {
          const { data: offer } = await serviceClient
            .from("offers")
            .select("applications(jobs(org_id))")
            .eq("id", data.offerId)
            .single()

          orgId = (offer?.applications as any)?.jobs?.org_id
        }
      } else if (eventType === "scorecard_submitted" && data.interviewId) {
        const { data: interview } = await serviceClient
          .from("interviews")
          .select("applications(jobs(org_id))")
          .eq("id", data.interviewId)
          .single()

        orgId = (interview?.applications as any)?.jobs?.org_id
      }
    }

    // Fall back to user's org if still no orgId
    if (!orgId && profile?.org_id) {
      orgId = profile.org_id
    }

    if (!orgId) {
      return NextResponse.json({ error: "Could not determine organization" }, { status: 400 })
    }

    // For org-specific events, verify user belongs to org (skip for candidate portal events)
    const candidatePortalEvents = ["offer_accepted", "offer_rejected"]
    if (!candidatePortalEvents.includes(eventType)) {
      if (!profile || profile.org_id !== orgId) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 })
      }
    }

    let result

    switch (eventType) {
      case "interview_scheduled": {
        // Get candidate and job info
        const { data: application } = await serviceClient
          .from("applications")
          .select(`
            id,
            candidates(id, first_name, last_name, email),
            jobs(id, title)
          `)
          .eq("id", data.applicationId)
          .single()

        if (!application) {
          return NextResponse.json({ error: "Application not found" }, { status: 404 })
        }

        const candidate = application.candidates as any
        const job = application.jobs as any

        // Build recipients list starting with candidate
        const interviewRecipients: NotificationRecipient[] = [
          { email: candidate.email, name: `${candidate.first_name} ${candidate.last_name}` },
        ]

        // Get interviewer details (with both userId and email for dual-channel)
        let interviewerName = "The hiring team"
        if (data.interviewerIds?.length > 0) {
          const { data: interviewers } = await serviceClient
            .from("profiles")
            .select("id, full_name, email")
            .in("id", data.interviewerIds)

          if (interviewers && interviewers.length > 0) {
            interviewerName = interviewers.map(i => i.full_name).join(", ")
            // Add interviewers with both userId and email
            interviewers.forEach(i => {
              interviewRecipients.push({
                userId: i.id,
                email: i.email,
                name: i.full_name || i.email,
              })
            })
          }
        }

        result = await sendNotification(serviceClient, {
          eventCode: "interview_scheduled",
          orgId,
          recipients: interviewRecipients,
          variables: {
            candidate_name: `${candidate.first_name} ${candidate.last_name}`,
            receiver_name: `${candidate.first_name} ${candidate.last_name}`,
            job_title: job.title,
            interview_date: data.interviewDate,
            interview_time: data.interviewTime,
            interview_type: data.interviewType,
            interviewer_name: interviewerName,
            meeting_link: data.meetingLink,
          },
          interviewId: data.interviewId,
          applicationId: data.applicationId,
        })
        break
      }

      case "interview_cancelled": {
        // Get candidate info
        const { data: interview } = await serviceClient
          .from("interviews")
          .select(`
            id,
            applications(
              id,
              candidates(id, first_name, last_name, email),
              jobs(id, title)
            )
          `)
          .eq("id", data.interviewId)
          .single()

        if (!interview?.applications) {
          return NextResponse.json({ error: "Interview not found" }, { status: 404 })
        }

        const app = interview.applications as any
        const candidate = app.candidates
        const job = app.jobs

        result = await sendNotification(serviceClient, {
          eventCode: "interview_cancelled",
          orgId,
          recipients: [{ email: candidate.email, name: `${candidate.first_name} ${candidate.last_name}` }],
          variables: {
            candidate_name: `${candidate.first_name} ${candidate.last_name}`,
            job_title: job.title,
          },
          interviewId: data.interviewId,
          applicationId: app.id,
        })
        break
      }

      case "offer_sent": {
        // Start with candidate recipient
        const offerRecipients: NotificationRecipient[] = [
          { email: data.candidateEmail, name: data.candidateName },
        ]

        // Add team members with both userId and email for dual-channel delivery
        if (data.teamUserIds && data.teamUserIds.length > 0) {
          const { data: teamProfiles } = await serviceClient
            .from("profiles")
            .select("id, full_name, email")
            .in("id", data.teamUserIds)

          if (teamProfiles) {
            teamProfiles.forEach(p => {
              offerRecipients.push({
                userId: p.id,
                email: p.email,
                name: p.full_name || p.email,
              })
            })
          }
        }

        result = await sendNotification(serviceClient, {
          eventCode: "offer_sent",
          orgId,
          recipients: offerRecipients,
          variables: {
            candidate_name: data.candidateName,
            receiver_name: data.candidateName,
            job_title: data.jobTitle,
            salary: data.salary,
            start_date: data.startDate,
            offer_url: data.offerUrl,
          },
          applicationId: data.applicationId,
        })
        break
      }

      case "offer_accepted":
      case "offer_rejected": {
        // Get offer details if not provided
        let candidateName = data.candidateName
        let jobTitle = data.jobTitle
        let applicationId = data.applicationId

        if (data.offerId && (!candidateName || !jobTitle)) {
          const { data: offerData } = await serviceClient
            .from("offers")
            .select(`
              job_title,
              application_id,
              applications(candidates(first_name, last_name))
            `)
            .eq("id", data.offerId)
            .single()

          if (offerData) {
            jobTitle = jobTitle || offerData.job_title
            applicationId = applicationId || offerData.application_id
            const candidate = (offerData.applications as any)?.candidates
            if (candidate && !candidateName) {
              candidateName = `${candidate.first_name} ${candidate.last_name}`
            }
          }
        }

        // Get org admins to notify (with both userId and email for dual-channel)
        const offerRecipients = await getTeamRecipients(serviceClient, orgId, ["org_admin", "hiring_manager"])

        result = await sendNotification(serviceClient, {
          eventCode: eventType as NotificationEventCode,
          orgId,
          recipients: offerRecipients,
          variables: {
            candidate_name: candidateName || "A candidate",
            job_title: jobTitle || "the position",
          },
          applicationId: applicationId,
        })
        break
      }

      case "candidate_rejection": {
        result = await notify.candidateRejection(serviceClient, orgId, {
          candidateName: data.candidateName,
          candidateEmail: data.candidateEmail,
          jobTitle: data.jobTitle,
          reason: data.reason,
          applicationId: data.applicationId,
        })
        break
      }

      case "job_published": {
        // Get org team to notify (with both userId and email for dual-channel)
        const jobRecipients = await getTeamRecipients(serviceClient, orgId)

        result = await sendNotification(serviceClient, {
          eventCode: "job_published",
          orgId,
          recipients: jobRecipients,
          variables: {
            job_title: data.jobTitle,
          },
          jobId: data.jobId,
        })
        break
      }

      case "candidate_stage_moved": {
        result = await sendNotification(serviceClient, {
          eventCode: "candidate_stage_moved",
          orgId,
          recipients: [{ email: data.candidateEmail, name: data.candidateName }],
          variables: {
            candidate_name: data.candidateName,
            job_title: data.jobTitle,
            stage_name: data.stageName,
          },
          applicationId: data.applicationId,
        })
        break
      }

      case "scorecard_submitted": {
        // Get interview and candidate details
        let candidateName = data.candidateName
        let jobTitle = data.jobTitle
        let applicationId = data.applicationId
        let interviewerName = data.interviewerName

        if (data.interviewId && (!candidateName || !jobTitle)) {
          const { data: interviewData } = await serviceClient
            .from("interviews")
            .select(`
              applications(
                id,
                candidates(first_name, last_name),
                jobs(title)
              )
            `)
            .eq("id", data.interviewId)
            .single()

          if (interviewData?.applications) {
            const app = interviewData.applications as any
            applicationId = applicationId || app.id
            if (app.candidates && !candidateName) {
              candidateName = `${app.candidates.first_name} ${app.candidates.last_name}`
            }
            if (app.jobs && !jobTitle) {
              jobTitle = app.jobs.title
            }
          }
        }

        // Get interviewer name if not provided
        if (!interviewerName && user) {
          const { data: interviewer } = await serviceClient
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single()

          interviewerName = interviewer?.full_name || "An interviewer"
        }

        // Notify hiring team (with both userId and email for dual-channel)
        const scorecardRecipients = await getTeamRecipients(serviceClient, orgId, ["org_admin", "hiring_manager"])

        result = await sendNotification(serviceClient, {
          eventCode: "scorecard_submitted",
          orgId,
          recipients: scorecardRecipients,
          variables: {
            candidate_name: candidateName || "A candidate",
            job_title: jobTitle || "the position",
            interviewer_name: interviewerName || "An interviewer",
            score: String(data.score || "N/A"),
          },
          interviewId: data.interviewId,
          applicationId: applicationId,
        })
        break
      }

      case "user_invited": {
        // Get inviter's name
        const { data: inviter } = await serviceClient
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()

        // Get org name
        const { data: org } = await serviceClient
          .from("organizations")
          .select("name")
          .eq("id", orgId)
          .single()

        result = await sendNotification(serviceClient, {
          eventCode: "user_invited",
          orgId,
          recipients: [{ email: data.recipientEmail, name: data.recipientName }],
          variables: {
            receiver_name: data.recipientName,
            inviter_name: inviter?.full_name || "A team member",
            org_name: org?.name || "the organization",
            role: data.role,
            invitation_url: data.inviteLink,
          },
          forceEmail: true, // Always send email for invites
        })
        break
      }

      case "role_changed": {
        // Get the user whose role is being changed
        const { data: targetUser } = await serviceClient
          .from("profiles")
          .select("id, full_name, email")
          .eq("id", data.userId)
          .single()

        if (!targetUser) {
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Get the current user (who is making the change)
        const { data: changer } = await serviceClient
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()

        // Get org name
        const { data: org } = await serviceClient
          .from("organizations")
          .select("name")
          .eq("id", orgId)
          .single()

        result = await sendNotification(serviceClient, {
          eventCode: "role_changed",
          orgId,
          recipients: [{
            userId: targetUser.id,
            email: targetUser.email,
            name: targetUser.full_name || targetUser.email,
          }],
          variables: {
            user_name: targetUser.full_name || "there",
            receiver_name: targetUser.full_name || "there",
            changed_by: changer?.full_name || "An administrator",
            old_role: data.previousRole || "Previous Role",
            new_role: data.newRole,
            role: data.newRole,
            org_name: org?.name || "the organization",
          },
        })
        break
      }

      case "candidate_disqualified": {
        // Get candidate and job info
        const { data: application } = await serviceClient
          .from("applications")
          .select(`
            id,
            candidates(id, first_name, last_name, email),
            jobs(id, title, org_id)
          `)
          .eq("id", data.applicationId)
          .single()

        if (!application) {
          return NextResponse.json({ error: "Application not found" }, { status: 404 })
        }

        const candidate = application.candidates as any
        const job = application.jobs as any

        // Get org name
        const { data: org } = await serviceClient
          .from("organizations")
          .select("name")
          .eq("id", orgId)
          .single()

        // Get disqualifier name
        const { data: disqualifier } = await serviceClient
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()

        // Notify hiring team
        const disqualifyRecipients = await getTeamRecipients(serviceClient, orgId, ["org_admin", "hr_manager", "recruiter"])

        result = await sendNotification(serviceClient, {
          eventCode: "candidate_disqualified",
          orgId,
          recipients: disqualifyRecipients,
          variables: {
            candidate_name: `${candidate?.first_name || ""} ${candidate?.last_name || ""}`.trim() || "A candidate",
            job_title: job?.title || "the position",
            disqualification_reason: data.reason || "Not specified",
            disqualified_by: disqualifier?.full_name || "A team member",
            org_name: org?.name || "the organization",
            application_url: `/org/applications?id=${data.applicationId}`,
          },
          applicationId: data.applicationId,
        })
        break
      }

      case "interview_rescheduled": {
        // Get interview details
        const { data: interview } = await serviceClient
          .from("interviews")
          .select(`
            id,
            scheduled_at,
            interview_type,
            location,
            meeting_link,
            applications(
              id,
              candidates(id, first_name, last_name, email),
              jobs(id, title)
            )
          `)
          .eq("id", data.interviewId)
          .single()

        if (!interview) {
          return NextResponse.json({ error: "Interview not found" }, { status: 404 })
        }

        const app = interview.applications as any
        const candidateData = app?.candidates as any

        // Get org name
        const { data: org } = await serviceClient
          .from("organizations")
          .select("name")
          .eq("id", orgId)
          .single()

        // Format date/time
        const scheduledDate = interview.scheduled_at ? new Date(interview.scheduled_at) : null
        const interviewDate = scheduledDate?.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) || "TBD"
        const interviewTime = scheduledDate?.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) || "TBD"

        result = await sendNotification(serviceClient, {
          eventCode: "interview_rescheduled",
          orgId,
          recipients: [{
            email: candidateData?.email,
            name: `${candidateData?.first_name || ""} ${candidateData?.last_name || ""}`.trim(),
          }],
          variables: {
            candidate_name: `${candidateData?.first_name || ""} ${candidateData?.last_name || ""}`.trim() || "Candidate",
            job_title: app?.jobs?.title || "the position",
            interview_date: interviewDate,
            interview_time: interviewTime,
            interview_type: interview.interview_type || "Interview",
            location: interview.location || interview.meeting_link || "To be confirmed",
            meeting_link: interview.meeting_link || "",
            previous_date: data.previousDate || "the previous date",
            org_name: org?.name || "the organization",
          },
          interviewId: data.interviewId,
          applicationId: app?.id,
        })
        break
      }

      case "offer_created": {
        // Get offer details
        const { data: offer } = await serviceClient
          .from("offers")
          .select(`
            id,
            salary,
            start_date,
            applications(
              id,
              candidates(id, first_name, last_name),
              jobs(id, title)
            )
          `)
          .eq("id", data.offerId)
          .single()

        if (!offer) {
          return NextResponse.json({ error: "Offer not found" }, { status: 404 })
        }

        const offerApp = offer.applications as any
        const offerCandidate = offerApp?.candidates as any

        // Get org name
        const { data: org } = await serviceClient
          .from("organizations")
          .select("name")
          .eq("id", orgId)
          .single()

        // Get creator name
        const { data: creator } = await serviceClient
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()

        // Notify hiring team
        const offerRecipients = await getTeamRecipients(serviceClient, orgId, ["org_admin", "hr_manager"])

        result = await sendNotification(serviceClient, {
          eventCode: "offer_created",
          orgId,
          recipients: offerRecipients,
          variables: {
            candidate_name: `${offerCandidate?.first_name || ""} ${offerCandidate?.last_name || ""}`.trim() || "A candidate",
            job_title: offerApp?.jobs?.title || "the position",
            salary: offer.salary ? `$${offer.salary.toLocaleString()}` : "Not specified",
            start_date: offer.start_date ? new Date(offer.start_date).toLocaleDateString() : "TBD",
            created_by: creator?.full_name || "A team member",
            org_name: org?.name || "the organization",
            offer_url: `/org/offers?id=${data.offerId}`,
          },
          applicationId: offerApp?.id,
        })
        break
      }

      case "offer_expired": {
        // Get offer details
        const { data: offer } = await serviceClient
          .from("offers")
          .select(`
            id,
            expires_at,
            applications(
              id,
              candidates(id, first_name, last_name),
              jobs(id, title)
            )
          `)
          .eq("id", data.offerId)
          .single()

        if (!offer) {
          return NextResponse.json({ error: "Offer not found" }, { status: 404 })
        }

        const expiredApp = offer.applications as any
        const expiredCandidate = expiredApp?.candidates as any

        // Get org name
        const { data: org } = await serviceClient
          .from("organizations")
          .select("name")
          .eq("id", orgId)
          .single()

        // Notify hiring team
        const expiredRecipients = await getTeamRecipients(serviceClient, orgId, ["org_admin", "hr_manager"])

        result = await sendNotification(serviceClient, {
          eventCode: "offer_expired",
          orgId,
          recipients: expiredRecipients,
          variables: {
            candidate_name: `${expiredCandidate?.first_name || ""} ${expiredCandidate?.last_name || ""}`.trim() || "A candidate",
            job_title: expiredApp?.jobs?.title || "the position",
            expiry_date: offer.expires_at ? new Date(offer.expires_at).toLocaleDateString() : "N/A",
            org_name: org?.name || "the organization",
            offer_url: `/org/offers?id=${data.offerId}`,
          },
          applicationId: expiredApp?.id,
        })
        break
      }

      case "job_closed": {
        // Get job details
        const { data: job } = await serviceClient
          .from("jobs")
          .select("id, title, status")
          .eq("id", data.jobId)
          .single()

        if (!job) {
          return NextResponse.json({ error: "Job not found" }, { status: 404 })
        }

        // Get org name
        const { data: org } = await serviceClient
          .from("organizations")
          .select("name")
          .eq("id", orgId)
          .single()

        // Get closer name
        const { data: closer } = await serviceClient
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()

        // Notify hiring team
        const jobClosedRecipients = await getTeamRecipients(serviceClient, orgId, ["org_admin", "hr_manager", "recruiter"])

        result = await sendNotification(serviceClient, {
          eventCode: "job_closed",
          orgId,
          recipients: jobClosedRecipients,
          variables: {
            job_title: job.title || "the position",
            closed_by: closer?.full_name || "A team member",
            close_reason: data.reason || "Not specified",
            org_name: org?.name || "the organization",
            job_url: `/org/jobs/${data.jobId}`,
          },
        })
        break
      }

      case "job_expiring": {
        // Get job details
        const { data: job } = await serviceClient
          .from("jobs")
          .select("id, title, expires_at")
          .eq("id", data.jobId)
          .single()

        if (!job) {
          return NextResponse.json({ error: "Job not found" }, { status: 404 })
        }

        // Get org name
        const { data: org } = await serviceClient
          .from("organizations")
          .select("name")
          .eq("id", orgId)
          .single()

        // Notify hiring team
        const jobExpiringRecipients = await getTeamRecipients(serviceClient, orgId, ["org_admin", "hr_manager", "recruiter"])

        result = await sendNotification(serviceClient, {
          eventCode: "job_expiring",
          orgId,
          recipients: jobExpiringRecipients,
          variables: {
            job_title: job.title || "the position",
            expiry_date: job.expires_at ? new Date(job.expires_at).toLocaleDateString() : "Soon",
            days_remaining: data.daysRemaining || "a few",
            org_name: org?.name || "the organization",
            job_url: `/org/jobs/${data.jobId}`,
          },
        })
        break
      }

      case "requisition_created": {
        // Get requisition details
        const { data: requisition } = await serviceClient
          .from("requisitions")
          .select("id, title, department, positions_count")
          .eq("id", data.requisitionId)
          .single()

        if (!requisition) {
          return NextResponse.json({ error: "Requisition not found" }, { status: 404 })
        }

        // Get org name
        const { data: org } = await serviceClient
          .from("organizations")
          .select("name")
          .eq("id", orgId)
          .single()

        // Get creator name
        const { data: creator } = await serviceClient
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()

        // Notify approvers (org admins and HR managers)
        const requisitionRecipients = await getTeamRecipients(serviceClient, orgId, ["org_admin", "hr_manager"])

        result = await sendNotification(serviceClient, {
          eventCode: "requisition_created",
          orgId,
          recipients: requisitionRecipients,
          variables: {
            requisition_title: requisition.title || "New Requisition",
            department: requisition.department || "Not specified",
            positions_count: String(requisition.positions_count || 1),
            created_by: creator?.full_name || "A team member",
            org_name: org?.name || "the organization",
            requisition_url: `/org/requisitions?id=${data.requisitionId}`,
          },
        })
        break
      }

      case "requisition_approved": {
        // Get requisition details
        const { data: requisition } = await serviceClient
          .from("requisitions")
          .select("id, title, department, created_by")
          .eq("id", data.requisitionId)
          .single()

        if (!requisition) {
          return NextResponse.json({ error: "Requisition not found" }, { status: 404 })
        }

        // Get org name
        const { data: org } = await serviceClient
          .from("organizations")
          .select("name")
          .eq("id", orgId)
          .single()

        // Get approver name
        const { data: approver } = await serviceClient
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()

        // Get creator to notify them
        const { data: creator } = await serviceClient
          .from("profiles")
          .select("id, full_name, email")
          .eq("id", requisition.created_by)
          .single()

        const approvedRecipients = creator
          ? [{ userId: creator.id, email: creator.email, name: creator.full_name || creator.email }]
          : await getTeamRecipients(serviceClient, orgId, ["org_admin", "hr_manager"])

        result = await sendNotification(serviceClient, {
          eventCode: "requisition_approved",
          orgId,
          recipients: approvedRecipients,
          variables: {
            requisition_title: requisition.title || "Requisition",
            department: requisition.department || "Not specified",
            approved_by: approver?.full_name || "An approver",
            org_name: org?.name || "the organization",
            requisition_url: `/org/requisitions?id=${data.requisitionId}`,
          },
        })
        break
      }

      case "requisition_rejected": {
        // Get requisition details
        const { data: requisition } = await serviceClient
          .from("requisitions")
          .select("id, title, department, created_by")
          .eq("id", data.requisitionId)
          .single()

        if (!requisition) {
          return NextResponse.json({ error: "Requisition not found" }, { status: 404 })
        }

        // Get org name
        const { data: org } = await serviceClient
          .from("organizations")
          .select("name")
          .eq("id", orgId)
          .single()

        // Get rejector name
        const { data: rejector } = await serviceClient
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()

        // Get creator to notify them
        const { data: creator } = await serviceClient
          .from("profiles")
          .select("id, full_name, email")
          .eq("id", requisition.created_by)
          .single()

        const rejectedRecipients = creator
          ? [{ userId: creator.id, email: creator.email, name: creator.full_name || creator.email }]
          : await getTeamRecipients(serviceClient, orgId, ["org_admin", "hr_manager"])

        result = await sendNotification(serviceClient, {
          eventCode: "requisition_rejected",
          orgId,
          recipients: rejectedRecipients,
          variables: {
            requisition_title: requisition.title || "Requisition",
            department: requisition.department || "Not specified",
            rejected_by: rejector?.full_name || "An approver",
            rejection_reason: data.reason || "Not specified",
            org_name: org?.name || "the organization",
            requisition_url: `/org/requisitions?id=${data.requisitionId}`,
          },
        })
        break
      }

      case "interview_reminder": {
        // Get interview details
        const { data: interview } = await serviceClient
          .from("interviews")
          .select(`
            id,
            scheduled_at,
            interview_type,
            location,
            meeting_link,
            applications(
              id,
              candidates(id, first_name, last_name, email),
              jobs(id, title)
            )
          `)
          .eq("id", data.interviewId)
          .single()

        if (!interview) {
          return NextResponse.json({ error: "Interview not found" }, { status: 404 })
        }

        const reminderApp = interview.applications as any
        const reminderCandidate = reminderApp?.candidates as any

        // Get org name
        const { data: org } = await serviceClient
          .from("organizations")
          .select("name")
          .eq("id", orgId)
          .single()

        // Format date/time
        const reminderDate = interview.scheduled_at ? new Date(interview.scheduled_at) : null
        const reminderDateStr = reminderDate?.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) || "TBD"
        const reminderTimeStr = reminderDate?.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) || "TBD"

        result = await sendNotification(serviceClient, {
          eventCode: "interview_reminder",
          orgId,
          recipients: [{
            email: reminderCandidate?.email,
            name: `${reminderCandidate?.first_name || ""} ${reminderCandidate?.last_name || ""}`.trim(),
          }],
          variables: {
            candidate_name: `${reminderCandidate?.first_name || ""} ${reminderCandidate?.last_name || ""}`.trim() || "Candidate",
            job_title: reminderApp?.jobs?.title || "the position",
            interview_date: reminderDateStr,
            interview_time: reminderTimeStr,
            interview_type: interview.interview_type || "Interview",
            location: interview.location || interview.meeting_link || "To be confirmed",
            meeting_link: interview.meeting_link || "",
            org_name: org?.name || "the organization",
          },
          interviewId: data.interviewId,
          applicationId: reminderApp?.id,
        })
        break
      }

      case "scorecard_reminder": {
        // Get interview details for pending scorecard
        const { data: interview } = await serviceClient
          .from("interviews")
          .select(`
            id,
            scheduled_at,
            applications(
              id,
              candidates(id, first_name, last_name),
              jobs(id, title)
            )
          `)
          .eq("id", data.interviewId)
          .single()

        if (!interview) {
          return NextResponse.json({ error: "Interview not found" }, { status: 404 })
        }

        const scorecardApp = interview.applications as any
        const scorecardCandidate = scorecardApp?.candidates as any

        // Get org name
        const { data: org } = await serviceClient
          .from("organizations")
          .select("name")
          .eq("id", orgId)
          .single()

        // Get interviewer to remind
        const { data: interviewer } = await serviceClient
          .from("profiles")
          .select("id, full_name, email")
          .eq("id", data.interviewerId)
          .single()

        if (!interviewer) {
          return NextResponse.json({ error: "Interviewer not found" }, { status: 404 })
        }

        result = await sendNotification(serviceClient, {
          eventCode: "scorecard_reminder",
          orgId,
          recipients: [{
            userId: interviewer.id,
            email: interviewer.email,
            name: interviewer.full_name || interviewer.email,
          }],
          variables: {
            interviewer_name: interviewer.full_name || "Interviewer",
            candidate_name: `${scorecardCandidate?.first_name || ""} ${scorecardCandidate?.last_name || ""}`.trim() || "A candidate",
            job_title: scorecardApp?.jobs?.title || "the position",
            interview_date: interview.scheduled_at ? new Date(interview.scheduled_at).toLocaleDateString() : "Recent",
            org_name: org?.name || "the organization",
            scorecard_url: `/org/interviews?id=${data.interviewId}`,
          },
          interviewId: data.interviewId,
          applicationId: scorecardApp?.id,
        })
        break
      }

      default:
        return NextResponse.json({ error: `Unknown event type: ${eventType}` }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      result
    })
  } catch (err) {
    console.error("Notification send error:", err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to send notification",
    }, { status: 500 })
  }
}
