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
