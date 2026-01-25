// @ts-nocheck
/**
 * Notification Send Endpoint
 *
 * Triggers notifications for various events from client components.
 * Validates user permissions and sends to appropriate channels.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { sendNotification, notify, NotificationEventCode } from "@/lib/notifications/send-notification"

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
    const { eventType, orgId, data } = body

    if (!eventType || !orgId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify user belongs to organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single()

    if (!profile || profile.org_id !== orgId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
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

        // Get interviewer names
        let interviewerName = "The hiring team"
        if (data.interviewerIds?.length > 0) {
          const { data: interviewers } = await serviceClient
            .from("profiles")
            .select("full_name")
            .in("id", data.interviewerIds)

          if (interviewers && interviewers.length > 0) {
            interviewerName = interviewers.map(i => i.full_name).join(", ")
          }
        }

        result = await notify.interviewScheduled(serviceClient, orgId, {
          candidateName: `${candidate.first_name} ${candidate.last_name}`,
          candidateEmail: candidate.email,
          jobTitle: job.title,
          interviewDate: data.interviewDate,
          interviewTime: data.interviewTime,
          interviewType: data.interviewType,
          interviewerName,
          meetingLink: data.meetingLink,
          interviewId: data.interviewId,
          applicationId: data.applicationId,
          interviewerIds: data.interviewerIds,
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
        result = await notify.offerSent(serviceClient, orgId, {
          candidateName: data.candidateName,
          candidateEmail: data.candidateEmail,
          jobTitle: data.jobTitle,
          salary: data.salary,
          startDate: data.startDate,
          offerUrl: data.offerUrl,
          applicationId: data.applicationId,
          teamUserIds: data.teamUserIds,
        })
        break
      }

      case "offer_accepted":
      case "offer_rejected": {
        // Get org admins to notify
        const { data: admins } = await serviceClient
          .from("user_roles")
          .select("user_id")
          .eq("org_id", orgId)
          .in("role", ["org_admin", "hiring_manager"])

        result = await sendNotification(serviceClient, {
          eventCode: eventType as NotificationEventCode,
          orgId,
          recipients: admins?.map(a => ({ userId: a.user_id })) || [],
          variables: {
            candidate_name: data.candidateName,
            job_title: data.jobTitle,
          },
          applicationId: data.applicationId,
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
        // Get org team to notify
        const { data: team } = await serviceClient
          .from("user_roles")
          .select("user_id")
          .eq("org_id", orgId)

        result = await notify.jobPublished(serviceClient, orgId, {
          jobTitle: data.jobTitle,
          jobId: data.jobId,
          teamUserIds: team?.map(t => t.user_id) || [],
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
        // Notify hiring team
        const { data: team } = await serviceClient
          .from("user_roles")
          .select("user_id")
          .eq("org_id", orgId)
          .in("role", ["org_admin", "hiring_manager"])

        result = await sendNotification(serviceClient, {
          eventCode: "scorecard_submitted",
          orgId,
          recipients: team?.map(t => ({ userId: t.user_id })) || [],
          variables: {
            candidate_name: data.candidateName,
            job_title: data.jobTitle,
            interviewer_name: data.interviewerName,
            score: data.score,
          },
          interviewId: data.interviewId,
          applicationId: data.applicationId,
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
