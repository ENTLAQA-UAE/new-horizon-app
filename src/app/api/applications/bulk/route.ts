// @ts-nocheck
// Note: Supabase nested relation queries cause type inference issues
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserAuthInfo } from "@/lib/auth"
import { triggerWorkflows } from "@/lib/workflows/workflow-engine"
import { emails } from "@/lib/email/resend"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, applicationIds, data } = body

    if (!action || !applicationIds || !Array.isArray(applicationIds)) {
      return NextResponse.json(
        { error: "Invalid request. Provide action and applicationIds array." },
        { status: 400 }
      )
    }

    // Get user's organization from auth helper
    const authInfo = await getUserAuthInfo(supabase, user.id)

    if (!authInfo?.orgId) {
      return NextResponse.json({ error: "Not a member of any organization" }, { status: 403 })
    }

    // Role check - only hr_manager and recruiter can perform bulk actions
    const allowedRoles = ["super_admin", "hr_manager", "recruiter"]
    if (!authInfo.role || !allowedRoles.includes(authInfo.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const organizationId = authInfo.orgId
    let successCount = 0
    let failCount = 0

    switch (action) {
      case "change_status": {
        const newStatus = data?.status
        if (!newStatus) {
          return NextResponse.json({ error: "Status is required" }, { status: 400 })
        }

        // Get applications with their previous status
        const { data: applications } = await supabase
          .from("applications")
          .select("id, status, candidate_id, job_id")
          .in("id", applicationIds)

        for (const app of applications || []) {
          const statusUpdate: Record<string, unknown> = {
            status: newStatus,
            updated_at: new Date().toISOString(),
          }
          if (newStatus === "hired") {
            statusUpdate.hired_at = new Date().toISOString()
          }

          const { error } = await supabase
            .from("applications")
            .update(statusUpdate)
            .eq("id", app.id)

          if (error) {
            failCount++
            continue
          }

          successCount++

          // Trigger workflows
          triggerWorkflows(supabase, "status_changed", {
            organizationId,
            applicationId: app.id,
            candidateId: app.candidate_id,
            jobId: app.job_id,
            previousStatus: app.status,
            newStatus,
          }).catch(console.error)
        }
        break
      }

      case "move_to_stage": {
        const stageId = data?.stageId
        if (!stageId) {
          return NextResponse.json({ error: "Stage ID is required" }, { status: 400 })
        }

        // Look up the stage to determine the corresponding status
        const { data: stageData } = await supabase
          .from("pipeline_stages")
          .select("stage_type")
          .eq("id", stageId)
          .single()

        const stageTypeStatusMap: Record<string, string> = {
          applied: "new",
          screening: "screening",
          interview: "interview",
          assessment: "assessment",
          offer: "offer",
          hired: "hired",
          rejected: "rejected",
        }

        const updatePayload: Record<string, unknown> = {
          stage_id: stageId,
          updated_at: new Date().toISOString(),
        }
        if (stageData?.stage_type && stageTypeStatusMap[stageData.stage_type]) {
          updatePayload.status = stageTypeStatusMap[stageData.stage_type]
        }
        if (stageData?.stage_type === "hired") {
          updatePayload.hired_at = new Date().toISOString()
        }

        const { error } = await supabase
          .from("applications")
          .update(updatePayload)
          .in("id", applicationIds)

        if (error) {
          failCount = applicationIds.length
        } else {
          successCount = applicationIds.length
        }
        break
      }

      case "assign_to": {
        const assigneeId = data?.userId
        if (!assigneeId) {
          return NextResponse.json({ error: "User ID is required" }, { status: 400 })
        }

        const { error } = await supabase
          .from("applications")
          .update({
            assigned_to: assigneeId,
            updated_at: new Date().toISOString(),
          })
          .in("id", applicationIds)

        if (error) {
          failCount = applicationIds.length
        } else {
          successCount = applicationIds.length
        }
        break
      }

      case "send_email": {
        const templateSlug = data?.templateSlug
        if (!templateSlug) {
          return NextResponse.json({ error: "Template slug is required" }, { status: 400 })
        }

        // Get template
        const { data: template } = await supabase
          .from("email_templates")
          .select("subject, body_html")
          .eq("slug", templateSlug)
          .single()

        if (!template) {
          return NextResponse.json({ error: "Template not found" }, { status: 404 })
        }

        // Get applications with candidate and job info
        const { data: applications } = await supabase
          .from("applications")
          .select(`
            id,
            candidates (id, first_name, last_name, email),
            jobs (id, title)
          `)
          .in("id", applicationIds)

        for (const app of applications || []) {
          const candidate = app.candidates as { first_name: string; last_name: string; email: string }
          const job = app.jobs as { title: string }

          if (!candidate?.email) {
            failCount++
            continue
          }

          // Replace variables in template
          let subject = template.subject
          let body = template.body_html

          const variables: Record<string, string> = {
            first_name: candidate.first_name,
            last_name: candidate.last_name,
            full_name: `${candidate.first_name} ${candidate.last_name}`,
            job_title: job?.title || "",
          }

          Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, "g")
            subject = subject.replace(regex, value)
            body = body.replace(regex, value)
          })

          const result = await emails.statusUpdate(
            candidate.email,
            candidate.first_name,
            job?.title || "Position",
            data?.customSubject || subject,
            body
          )

          if (result.success) {
            successCount++
          } else {
            failCount++
          }
        }
        break
      }

      case "delete": {
        const { error } = await supabase
          .from("applications")
          .delete()
          .in("id", applicationIds)

        if (error) {
          failCount = applicationIds.length
        } else {
          successCount = applicationIds.length
        }
        break
      }

      case "export": {
        // Get applications with all related data
        const { data: applications } = await supabase
          .from("applications")
          .select(`
            id,
            status,
            source,
            applied_at,
            ai_score,
            candidates (first_name, last_name, email, phone, current_job_title, skills),
            jobs (title, department, location)
          `)
          .in("id", applicationIds)

        return NextResponse.json({
          success: true,
          data: applications,
          format: "json",
        })
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      successCount,
      failCount,
      total: applicationIds.length,
    })
  } catch (error) {
    console.error("Bulk action error:", error)
    return NextResponse.json(
      { error: "Failed to perform bulk action" },
      { status: 500 }
    )
  }
}
