// @ts-nocheck
// Note: Supabase relation errors with nested queries
/**
 * Notification Send Endpoint
 *
 * Triggers notifications for various events from client components.
 * Validates user permissions and sends to appropriate channels.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { sendNotification, notify, NotificationEventCode, NotificationRecipient, processOfferTemplate } from "@/lib/notifications/send-notification"
import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Helper to combine first_name and last_name into a full name
 */
function getFullName(profile: { first_name?: string | null; last_name?: string | null } | null | undefined): string {
  if (!profile) return ""
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ")
}

/**
 * Helper to get internal team recipients with both userId and email
 * This enables both in-app and email notifications when both channels are enabled
 */
async function getTeamRecipients(
  supabase: SupabaseClient,
  orgId: string,
  roles?: string[],
  departmentId?: string | null
): Promise<NotificationRecipient[]> {
  // Get user IDs from user_roles
  let query = supabase
    .from("user_roles")
    .select("user_id, role")
    .eq("org_id", orgId)

  if (roles && roles.length > 0) {
    query = query.in("role", roles)
  }

  const { data: roleData } = await query

  if (!roleData || roleData.length === 0) {
    return []
  }

  let userIds = roleData.map(r => r.user_id)

  // Department scoping: if departmentId is provided, filter hiring_managers
  // to only those assigned to the specific department.
  // hr_manager and recruiter always receive all notifications (org-wide).
  if (departmentId && roles?.includes("hiring_manager")) {
    const hiringManagerIds = roleData
      .filter(r => r.role === "hiring_manager")
      .map(r => r.user_id)

    if (hiringManagerIds.length > 0) {
      // Get hiring_managers assigned to this department
      const { data: deptAssignments } = await supabase
        .from("user_role_departments")
        .select("user_id")
        .eq("department_id", departmentId)
        .in("user_id", hiringManagerIds)

      const deptManagerIds = new Set((deptAssignments || []).map(d => d.user_id))

      // Filter: keep non-hiring-manager users + hiring_managers in the department
      // If a hiring_manager has NO department assignments, include them (backward compat)
      const { data: allDeptAssignments } = await supabase
        .from("user_role_departments")
        .select("user_id")
        .in("user_id", hiringManagerIds)

      const managersWithDepts = new Set((allDeptAssignments || []).map(d => d.user_id))

      userIds = roleData
        .filter(r => {
          if (r.role !== "hiring_manager") return true
          // If manager has no dept assignments, include (backward compat)
          if (!managersWithDepts.has(r.user_id)) return true
          // If manager is assigned to this department, include
          return deptManagerIds.has(r.user_id)
        })
        .map(r => r.user_id)
    }
  }

  if (userIds.length === 0) return []

  // Get user profiles with email
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .in("id", userIds)

  return (profiles || []).map(p => ({
    userId: p.id,
    email: p.email,
    name: getFullName(p) || p.email,
  }))
}

/**
 * Helper to get the department_id for a job (used for department-scoped notifications)
 */
async function getJobDepartmentId(supabase: SupabaseClient, jobId: string): Promise<string | null> {
  const { data } = await supabase
    .from("jobs")
    .select("department_id")
    .eq("id", jobId)
    .single()
  return data?.department_id || null
}

/**
 * Helper to get department_id from an application's associated job
 */
async function getApplicationDepartmentId(supabase: SupabaseClient, applicationId: string): Promise<string | null> {
  const { data } = await supabase
    .from("applications")
    .select("jobs(department_id)")
    .eq("id", applicationId)
    .single()
  return (data?.jobs as any)?.department_id || null
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

  // Role check - only ATS roles can send notifications
  const { data: senderRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single()

  const sRole = senderRole?.role
  const sAllowedRoles = ["super_admin", "hr_manager", "recruiter", "hiring_manager"]
  if (!sRole || !sAllowedRoles.includes(sRole)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
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
        console.error(`[notifications/send] Authorization failed for ${eventType}:`, {
          hasProfile: !!profile,
          profileOrgId: profile?.org_id,
          requestedOrgId: orgId,
          userId: user.id,
        })
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
            .select("id, first_name, last_name, email")
            .in("id", data.interviewerIds)

          if (interviewers && interviewers.length > 0) {
            interviewerName = interviewers.map(i => getFullName(i) || i.email).join(", ")
            // Add interviewers with both userId and email
            interviewers.forEach(i => {
              interviewRecipients.push({
                userId: i.id,
                email: i.email,
                name: getFullName(i) || i.email,
              })
            })
          }
        }

        // Add external guests to recipients (email-only, no userId)
        if (data.externalGuests?.length > 0) {
          data.externalGuests.forEach((email: string) => {
            interviewRecipients.push({
              email: email,
              name: email, // Use email as name for external guests
            })
          })
        }

        // Determine location - use meeting link for video, physical location for in-person
        const interviewLocation = data.meetingLink || data.location || "To be confirmed"

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
            interviewers: interviewerName, // For email template compatibility
            meeting_link: data.meetingLink || "",
            location: interviewLocation, // For email template - shows meeting link or physical location
          },
          interviewId: data.interviewId,
          applicationId: data.applicationId,
        })
        break
      }

      case "interview_cancelled": {
        // Get candidate and interviewer info
        const { data: interview } = await serviceClient
          .from("interviews")
          .select(`
            id,
            interviewer_ids,
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

        // Start with candidate recipient (email-only for email channel)
        const cancelRecipients: NotificationRecipient[] = [
          { email: candidate.email, name: `${candidate.first_name} ${candidate.last_name}` },
        ]

        // Add interviewers so they get in-app notifications (they have userId)
        const interviewerIds = (interview.interviewer_ids as string[]) || []
        if (interviewerIds.length > 0) {
          const { data: interviewers } = await serviceClient
            .from("profiles")
            .select("id, first_name, last_name, email")
            .in("id", interviewerIds)

          if (interviewers) {
            interviewers.forEach(i => {
              cancelRecipients.push({
                userId: i.id,
                email: i.email,
                name: getFullName(i) || i.email,
              })
            })
          }
        }

        result = await sendNotification(serviceClient, {
          eventCode: "interview_cancelled",
          orgId,
          recipients: cancelRecipients,
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
            .select("id, first_name, last_name, email")
            .in("id", data.teamUserIds)

          if (teamProfiles) {
            teamProfiles.forEach(p => {
              offerRecipients.push({
                userId: p.id,
                email: p.email,
                name: getFullName(p) || p.email,
              })
            })
          }
        }

        // Fetch offer template if offerId is provided
        let emailHtmlOverride: string | undefined
        let emailSubjectOverride: string | undefined

        if (data.offerId) {
          const { data: offerRecord } = await serviceClient
            .from("offers")
            .select("*, applications(candidates(first_name, last_name))")
            .eq("id", data.offerId)
            .single()

          // Generate fresh response token for accept/decline email buttons
          let offerResponseUrls: { acceptUrl: string; declineUrl: string } | undefined
          if (offerRecord) {
            const responseToken = crypto.randomUUID()
            const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

            await serviceClient
              .from("offers")
              .update({
                response_token: responseToken,
                response_token_expires_at: tokenExpiresAt,
              })
              .eq("id", data.offerId)

            const offerBaseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || ""
            offerResponseUrls = {
              acceptUrl: `${offerBaseUrl}/offers/respond?token=${responseToken}&action=accept`,
              declineUrl: `${offerBaseUrl}/offers/respond?token=${responseToken}&action=decline`,
            }
          }

          if (offerRecord?.template_id) {
            const { data: offerTemplate } = await serviceClient
              .from("offer_templates")
              .select("subject, body_html")
              .eq("id", offerRecord.template_id)
              .single()

            if (offerTemplate?.body_html) {
              // Get org info for branding
              const { data: orgInfo } = await serviceClient
                .from("organizations")
                .select("name, logo_url")
                .eq("id", orgId)
                .single()

              const candidateFullName = data.candidateName ||
                `${offerRecord.applications?.candidates?.first_name || ""} ${offerRecord.applications?.candidates?.last_name || ""}`.trim()

              // Format benefits as readable string
              const benefitsList = Array.isArray(offerRecord.benefits)
                ? offerRecord.benefits.join(", ")
                : (offerRecord.benefits || "")

              // Process the offer template with actual offer data
              emailHtmlOverride = processOfferTemplate(
                offerTemplate.body_html,
                {
                  candidate_name: candidateFullName,
                  position_title: offerRecord.job_title || data.jobTitle || "",
                  department: offerRecord.department || "",
                  salary_amount: offerRecord.salary_amount?.toLocaleString() || "",
                  salary_currency: offerRecord.salary_currency || "",
                  start_date: data.startDate || (offerRecord.start_date
                    ? new Date(offerRecord.start_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                    : ""),
                  company_name: orgInfo?.name || "",
                  reporting_to: "",
                  probation_period: offerRecord.probation_period_months?.toString() || "",
                  benefits: benefitsList,
                },
                {
                  org_name: orgInfo?.name || "Organization",
                  logo_url: orgInfo?.logo_url,
                },
                offerResponseUrls
              )

              // Use offer template subject if available
              if (offerTemplate.subject) {
                emailSubjectOverride = offerTemplate.subject
                  .replace(/\{\{position_title\}\}/g, offerRecord.job_title || data.jobTitle || "")
                  .replace(/\{\{candidate_name\}\}/g, candidateFullName)
                  .replace(/\{\{company_name\}\}/g, orgInfo?.name || "")
              }

              // Store the processed HTML on the offer record for audit trail
              await serviceClient
                .from("offers")
                .update({ offer_letter_html: emailHtmlOverride })
                .eq("id", data.offerId)
            }
          }

          // Fallback: if no custom template, create a basic offer email with accept/decline buttons
          if (!emailHtmlOverride && offerRecord && offerResponseUrls) {
            const { data: fallbackOrg } = await serviceClient
              .from("organizations")
              .select("name, logo_url")
              .eq("id", orgId)
              .single()

            const fallbackName = data.candidateName ||
              `${offerRecord.applications?.candidates?.first_name || ""} ${offerRecord.applications?.candidates?.last_name || ""}`.trim() || "Candidate"

            emailHtmlOverride = processOfferTemplate(
              `<p style="margin: 0 0 8px; color: #4b5563; font-size: 16px; line-height: 1.6;">Dear ${fallbackName},</p>
<p style="margin: 0 0 8px; color: #4b5563; font-size: 16px; line-height: 1.6;">We are pleased to extend an offer for the position of <strong>${offerRecord.job_title || data.jobTitle || ""}</strong>.</p>
<p style="margin: 0 0 8px; color: #4b5563; font-size: 16px; line-height: 1.6;">Please respond to this offer using the buttons below.</p>`,
              {
                candidate_name: fallbackName,
                position_title: offerRecord.job_title || data.jobTitle || "",
                salary_amount: "",
                salary_currency: "",
                start_date: "",
                company_name: fallbackOrg?.name || "",
              },
              {
                org_name: fallbackOrg?.name || "Organization",
                logo_url: fallbackOrg?.logo_url,
              },
              offerResponseUrls
            )
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
          emailHtmlOverride,
          emailSubjectOverride,
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

        // Get HR team to notify (with both userId and email for dual-channel)
        const offerDeptId = applicationId ? await getApplicationDepartmentId(serviceClient, applicationId) : null
        const offerRecipients = await getTeamRecipients(serviceClient, orgId, ["hr_manager", "recruiter", "hiring_manager"], offerDeptId)

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

      case "job_pending_approval": {
        // Notify HR managers that a job needs approval
        const pendingRecipients = await getTeamRecipients(serviceClient, orgId, ["hr_manager"])

        // Get submitter name
        const { data: submitter } = await serviceClient
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single()

        // Get job details for department
        let pendingDepartment = ""
        if (data.jobId) {
          const { data: jobData } = await serviceClient
            .from("jobs")
            .select("department_id, departments(name)")
            .eq("id", data.jobId)
            .single()
          pendingDepartment = (jobData?.departments as any)?.name || ""
        }

        // Build the base URL for the action link
        const pendingBaseUrl = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/api\/.*/, "") || ""

        result = await sendNotification(serviceClient, {
          eventCode: "job_pending_approval",
          orgId,
          recipients: pendingRecipients,
          variables: {
            job_title: data.jobTitle,
            submitted_by: getFullName(submitter) || "A recruiter",
            department: pendingDepartment,
            action_url: pendingBaseUrl ? `${pendingBaseUrl}/org/jobs?id=${data.jobId}` : `/org/jobs?id=${data.jobId}`,
          },
          jobId: data.jobId,
        })
        break
      }

      case "job_approved": {
        // Notify the recruiter who submitted the job that it has been approved
        // Find the job's creator or the user who submitted for approval
        let approvedRecipients: NotificationRecipient[] = []

        if (data.submitterId) {
          const { data: submitterProfile } = await serviceClient
            .from("profiles")
            .select("id, first_name, last_name, email")
            .eq("id", data.submitterId)
            .single()

          if (submitterProfile) {
            approvedRecipients = [{
              userId: submitterProfile.id,
              email: submitterProfile.email,
              name: getFullName(submitterProfile) || submitterProfile.email,
            }]
          }
        }

        // Fallback: notify all recruiters
        if (approvedRecipients.length === 0) {
          approvedRecipients = await getTeamRecipients(serviceClient, orgId, ["recruiter"])
        }

        // Get approver name
        const { data: approver } = await serviceClient
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single()

        const approvedBaseUrl = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/api\/.*/, "") || ""

        result = await sendNotification(serviceClient, {
          eventCode: "job_approved",
          orgId,
          recipients: approvedRecipients,
          variables: {
            job_title: data.jobTitle,
            approved_by: getFullName(approver) || "An HR Manager",
            action_url: approvedBaseUrl ? `${approvedBaseUrl}/org/jobs?id=${data.jobId}` : `/org/jobs?id=${data.jobId}`,
          },
          jobId: data.jobId,
        })
        break
      }

      case "job_published": {
        // Get ATS team to notify
        const jobDeptId = data.jobId ? await getJobDepartmentId(serviceClient, data.jobId) : null
        const jobRecipients = await getTeamRecipients(serviceClient, orgId, ["hr_manager", "recruiter", "hiring_manager"], jobDeptId)

        // Get job details for department, location, and career page URL
        let jobDepartment = ""
        let jobLocation = ""
        let jobSlug = ""
        let orgSlug = ""

        if (data.jobId) {
          const { data: jobDetails } = await serviceClient
            .from("jobs")
            .select("slug, departments(name), job_locations(city, country)")
            .eq("id", data.jobId)
            .single()

          jobDepartment = (jobDetails?.departments as any)?.name || ""
          const locations = jobDetails?.job_locations as any[]
          if (locations && locations.length > 0) {
            jobLocation = [locations[0].city, locations[0].country].filter(Boolean).join(", ")
          }
          jobSlug = jobDetails?.slug || ""
        }

        // Get org slug for career page URL
        const { data: orgData } = await serviceClient
          .from("organizations")
          .select("slug")
          .eq("id", orgId)
          .single()
        orgSlug = orgData?.slug || ""

        const publishedBaseUrl = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/api\/.*/, "") || ""
        const jobViewUrl = orgSlug && data.jobId
          ? `${publishedBaseUrl}/careers/${orgSlug}/jobs/${data.jobId}`
          : `${publishedBaseUrl}/org/jobs?id=${data.jobId}`

        result = await sendNotification(serviceClient, {
          eventCode: "job_published",
          orgId,
          recipients: jobRecipients,
          variables: {
            job_title: data.jobTitle,
            department: jobDepartment,
            location: jobLocation,
            action_url: jobViewUrl,
          },
          jobId: data.jobId,
        })
        break
      }

      case "candidate_stage_moved": {
        // Candidate recipient (email-only, for email channel)
        const stageRecipients: NotificationRecipient[] = [
          { email: data.candidateEmail, name: data.candidateName },
        ]

        // Add hiring team so they get in-app notifications
        const stageDeptId = data.applicationId ? await getApplicationDepartmentId(serviceClient, data.applicationId) : null
        const stageTeamRecipients = await getTeamRecipients(
          serviceClient, orgId, ["hr_manager", "hiring_manager", "recruiter"], stageDeptId
        )

        result = await sendNotification(serviceClient, {
          eventCode: "candidate_stage_moved",
          orgId,
          recipients: [...stageRecipients, ...stageTeamRecipients],
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
            .select("first_name, last_name")
            .eq("id", user.id)
            .single()

          interviewerName = getFullName(interviewer) || "An interviewer"
        }

        // Notify hiring team (with both userId and email for dual-channel)
        const scorecardDeptId = applicationId ? await getApplicationDepartmentId(serviceClient, applicationId) : null
        const scorecardRecipients = await getTeamRecipients(serviceClient, orgId, ["hr_manager", "recruiter", "hiring_manager"], scorecardDeptId)

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
          .select("first_name, last_name")
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
            inviter_name: getFullName(inviter) || "A team member",
            org_name: org?.name || "the organization",
            role: data.role,
            invitation_url: data.inviteLink,
          },
          forceEmail: true, // Always send email for invites
        })
        break
      }

      case "role_changed": {
        console.log("[role_changed] Starting notification for userId:", data.userId)

        // Get the user whose role is being changed
        const { data: targetUser, error: targetError } = await serviceClient
          .from("profiles")
          .select("id, first_name, last_name, email")
          .eq("id", data.userId)
          .single()

        if (targetError) {
          console.error("[role_changed] Error fetching target user:", targetError)
        }

        if (!targetUser) {
          console.error("[role_changed] User not found:", data.userId)
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        console.log("[role_changed] Target user found:", targetUser.email)

        // Get the current user (who is making the change)
        const { data: changer } = await serviceClient
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single()

        // Get org name
        const { data: org } = await serviceClient
          .from("organizations")
          .select("name")
          .eq("id", orgId)
          .single()

        const targetFullName = getFullName(targetUser)
        console.log("[role_changed] Sending notification - org:", org?.name, "newRole:", data.newRole, "previousRole:", data.previousRole)

        result = await sendNotification(serviceClient, {
          eventCode: "role_changed",
          orgId,
          recipients: [{
            userId: targetUser.id,
            email: targetUser.email,
            name: targetFullName || targetUser.email,
          }],
          variables: {
            user_name: targetFullName || "there",
            receiver_name: targetFullName || "there",
            changed_by: getFullName(changer) || "An administrator",
            previous_role: data.previousRole || "Previous Role",
            new_role: data.newRole,
            role: data.newRole,
            org_name: org?.name || "the organization",
          },
        })

        console.log("[role_changed] Notification result:", result)
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
          .select("first_name, last_name")
          .eq("id", user.id)
          .single()

        // Notify hiring team
        const disqualifyRecipients = await getTeamRecipients(serviceClient, orgId, ["hr_manager", "recruiter"])

        result = await sendNotification(serviceClient, {
          eventCode: "candidate_disqualified",
          orgId,
          recipients: disqualifyRecipients,
          variables: {
            candidate_name: `${candidate?.first_name || ""} ${candidate?.last_name || ""}`.trim() || "A candidate",
            job_title: job?.title || "the position",
            disqualification_reason: data.reason || "Not specified",
            reason: data.reason || "Not specified",
            disqualified_by: getFullName(disqualifier) || "A team member",
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
          .select("first_name, last_name")
          .eq("id", user.id)
          .single()

        // Notify HR manager (offer created)
        const offerRecipients = await getTeamRecipients(serviceClient, orgId, ["hr_manager"])

        result = await sendNotification(serviceClient, {
          eventCode: "offer_created",
          orgId,
          recipients: offerRecipients,
          variables: {
            candidate_name: `${offerCandidate?.first_name || ""} ${offerCandidate?.last_name || ""}`.trim() || "A candidate",
            job_title: offerApp?.jobs?.title || "the position",
            salary: offer.salary ? `$${offer.salary.toLocaleString()}` : "Not specified",
            start_date: offer.start_date ? new Date(offer.start_date).toLocaleDateString() : "TBD",
            created_by: getFullName(creator) || "A team member",
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

        // Notify HR manager (offer expired)
        const expiredRecipients = await getTeamRecipients(serviceClient, orgId, ["hr_manager"])

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
          .select("first_name, last_name")
          .eq("id", user.id)
          .single()

        // Notify ATS team (job closed)
        const jobClosedDeptId = data.jobId ? await getJobDepartmentId(serviceClient, data.jobId) : null
        const jobClosedRecipients = await getTeamRecipients(serviceClient, orgId, ["hr_manager", "recruiter", "hiring_manager"], jobClosedDeptId)

        result = await sendNotification(serviceClient, {
          eventCode: "job_closed",
          orgId,
          recipients: jobClosedRecipients,
          variables: {
            job_title: job.title || "the position",
            closed_by: getFullName(closer) || "A team member",
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

        // Notify ATS team (job expiring)
        const jobExpiringDeptId = data.jobId ? await getJobDepartmentId(serviceClient, data.jobId) : null
        const jobExpiringRecipients = await getTeamRecipients(serviceClient, orgId, ["hr_manager", "recruiter", "hiring_manager"], jobExpiringDeptId)

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
          .from("job_requisitions")
          .select("id, title, positions_count, requested_by, departments(id, name)")
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
          .select("first_name, last_name")
          .eq("id", requisition.requested_by || user.id)
          .single()

        // Notify HR managers (sole approvers for requisitions)
        const requisitionRecipients = await getTeamRecipients(serviceClient, orgId, ["hr_manager"])

        result = await sendNotification(serviceClient, {
          eventCode: "requisition_created",
          orgId,
          recipients: requisitionRecipients,
          variables: {
            requisition_title: requisition.title || "New Requisition",
            department: (requisition.departments as any)?.name || "Not specified",
            positions_count: String(requisition.positions_count || 1),
            created_by: getFullName(creator) || "A team member",
            org_name: org?.name || "the organization",
            requisition_url: `/org/requisitions?id=${data.requisitionId}`,
          },
        })
        break
      }

      case "requisition_approved": {
        // Get requisition details
        const { data: requisition } = await serviceClient
          .from("job_requisitions")
          .select("id, title, requested_by, departments(id, name)")
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
          .select("first_name, last_name")
          .eq("id", user.id)
          .single()

        // Get creator to notify them
        const { data: creator } = requisition.requested_by
          ? await serviceClient
              .from("profiles")
              .select("id, first_name, last_name, email")
              .eq("id", requisition.requested_by)
              .single()
          : { data: null }

        const approvedRecipients = creator
          ? [{ userId: creator.id, email: creator.email, name: getFullName(creator) || creator.email }]
          : await getTeamRecipients(serviceClient, orgId, ["hr_manager"])

        result = await sendNotification(serviceClient, {
          eventCode: "requisition_approved",
          orgId,
          recipients: approvedRecipients,
          variables: {
            requisition_title: requisition.title || "Requisition",
            department: (requisition.departments as any)?.name || "Not specified",
            approved_by: getFullName(approver) || "An approver",
            org_name: org?.name || "the organization",
            requisition_url: `/org/requisitions?id=${data.requisitionId}`,
          },
        })
        break
      }

      case "requisition_rejected": {
        // Get requisition details
        const { data: requisition } = await serviceClient
          .from("job_requisitions")
          .select("id, title, requested_by, departments(id, name)")
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
          .select("first_name, last_name")
          .eq("id", user.id)
          .single()

        // Get creator to notify them
        const { data: creator } = requisition.requested_by
          ? await serviceClient
              .from("profiles")
              .select("id, first_name, last_name, email")
              .eq("id", requisition.requested_by)
              .single()
          : { data: null }

        const rejectedRecipients = creator
          ? [{ userId: creator.id, email: creator.email, name: getFullName(creator) || creator.email }]
          : await getTeamRecipients(serviceClient, orgId, ["hr_manager"])

        result = await sendNotification(serviceClient, {
          eventCode: "requisition_rejected",
          orgId,
          recipients: rejectedRecipients,
          variables: {
            requisition_title: requisition.title || "Requisition",
            department: (requisition.departments as any)?.name || "Not specified",
            rejected_by: getFullName(rejector) || "An approver",
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
          .select("id, first_name, last_name, email")
          .eq("id", data.interviewerId)
          .single()

        if (!interviewer) {
          return NextResponse.json({ error: "Interviewer not found" }, { status: 404 })
        }

        const interviewerFullName = getFullName(interviewer)
        result = await sendNotification(serviceClient, {
          eventCode: "scorecard_reminder",
          orgId,
          recipients: [{
            userId: interviewer.id,
            email: interviewer.email,
            name: interviewerFullName || interviewer.email,
          }],
          variables: {
            interviewer_name: interviewerFullName || "Interviewer",
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
      success: result?.success ?? false,
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
