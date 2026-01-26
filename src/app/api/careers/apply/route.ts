// @ts-nocheck
// Note: This file has Supabase type issues
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { notify } from "@/lib/notifications/send-notification"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const formData = await request.formData()

    const jobId = formData.get("jobId") as string
    const organizationId = formData.get("organizationId") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const linkedIn = formData.get("linkedIn") as string
    const coverLetter = formData.get("coverLetter") as string
    const resumeFile = formData.get("resume") as File
    const screeningAnswersRaw = formData.get("screeningAnswers") as string | null
    const screeningAnswers = screeningAnswersRaw ? JSON.parse(screeningAnswersRaw) : {}

    // Validate required fields
    if (!jobId || !firstName || !lastName || !email || !resumeFile) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if job exists and is open, include pipeline_id
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, org_id, pipeline_id, organizations(name)")
      .eq("id", jobId)
      .eq("status", "open")
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: "Job not found or not accepting applications" },
        { status: 404 }
      )
    }

    // Get the "Applied" stage from the job's pipeline
    let appliedStageId: string | null = null
    if (job.pipeline_id) {
      const { data: appliedStage } = await supabase
        .from("pipeline_stages")
        .select("id")
        .eq("pipeline_id", job.pipeline_id)
        .eq("stage_type", "applied")
        .single()

      if (appliedStage) {
        appliedStageId = appliedStage.id
      }
    }

    // Check if candidate already exists by email
    let candidateId: string
    const { data: existingCandidate } = await supabase
      .from("candidates")
      .select("id")
      .eq("email", email)
      .eq("org_id", organizationId)
      .single()

    if (existingCandidate) {
      candidateId = existingCandidate.id
    } else {
      // Create new candidate
      const { data: newCandidate, error: createError } = await supabase
        .from("candidates")
        .insert({
          org_id: organizationId,
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone || null,
          linkedin_url: linkedIn || null,
          source: "career_page",
        })
        .select("id")
        .single()

      if (createError || !newCandidate) {
        console.error("Failed to create candidate:", createError)
        return NextResponse.json(
          { error: "Failed to create candidate profile" },
          { status: 500 }
        )
      }

      candidateId = newCandidate.id
    }

    // Check if already applied to this job
    const { data: existingApp } = await supabase
      .from("applications")
      .select("id")
      .eq("candidate_id", candidateId)
      .eq("job_id", jobId)
      .single()

    if (existingApp) {
      return NextResponse.json(
        { error: "You have already applied to this position" },
        { status: 400 }
      )
    }

    // Upload resume
    const fileExt = resumeFile.name.split(".").pop()
    const fileName = `${candidateId}-${Date.now()}.${fileExt}`
    const filePath = `${candidateId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(filePath, resumeFile, {
        cacheControl: "3600",
        upsert: true,
      })

    if (uploadError) {
      console.error("Resume upload error:", uploadError)
      // Continue without resume URL
    }

    // Get resume URL
    const { data: urlData } = supabase.storage
      .from("resumes")
      .getPublicUrl(filePath)

    const resumeUrl = urlData?.publicUrl || null

    // Update candidate with resume URL
    if (resumeUrl) {
      await supabase
        .from("candidates")
        .update({ resume_url: resumeUrl })
        .eq("id", candidateId)
    }

    // Create application with the Applied stage from job's pipeline
    const applicationInsert: Record<string, any> = {
      org_id: organizationId,
      candidate_id: candidateId,
      job_id: jobId,
      status: "new",
      source: "career_page",
      cover_letter: coverLetter || null,
      applied_at: new Date().toISOString(),
    }

    // Add stage_id if we found the Applied stage
    if (appliedStageId) {
      applicationInsert.stage_id = appliedStageId
    }

    const { data: application, error: appError } = await supabase
      .from("applications")
      .insert(applicationInsert)
      .select("id")
      .single()

    if (appError || !application) {
      console.error("Failed to create application:", appError?.message, appError?.details, appError?.hint)
      return NextResponse.json(
        { error: appError?.message || "Failed to submit application" },
        { status: 500 }
      )
    }

    // Save screening question responses
    if (Object.keys(screeningAnswers).length > 0) {
      // Get screening questions to check for knockouts
      const { data: questions } = await supabase
        .from("screening_questions")
        .select("id, question, is_knockout, knockout_value")
        .in("id", Object.keys(screeningAnswers))

      let isKnockout = false

      // Prepare responses for insertion
      const responses = Object.entries(screeningAnswers).map(([questionId, answer]) => {
        const question = questions?.find(q => q.id === questionId)
        const answerStr = typeof answer === 'object' ? JSON.stringify(answer) : String(answer)

        // Check for knockout
        let knockoutTriggered = false
        if (question?.is_knockout && question.knockout_value) {
          // For boolean questions, compare the string values
          if (answerStr === question.knockout_value ||
              answerStr === String(question.knockout_value)) {
            knockoutTriggered = true
            isKnockout = true
          }
        }

        return {
          application_id: application.id,
          question_id: questionId,
          answer: typeof answer === 'string' ? answer : null,
          answer_json: typeof answer === 'object' ? answer : null,
          is_knockout_triggered: knockoutTriggered,
        }
      })

      // Insert responses
      const { error: responsesError } = await supabase
        .from("screening_responses")
        .insert(responses)

      if (responsesError) {
        console.error("Failed to save screening responses:", responsesError)
        // Don't fail the whole application, just log the error
      }

      // If knockout was triggered, update application status and move to rejected stage
      if (isKnockout) {
        // Find the rejected stage from the job's pipeline
        let rejectedStageId: string | null = null
        if (job.pipeline_id) {
          const { data: rejectedStage } = await supabase
            .from("pipeline_stages")
            .select("id")
            .eq("pipeline_id", job.pipeline_id)
            .eq("stage_type", "rejected")
            .single()

          if (rejectedStage) {
            rejectedStageId = rejectedStage.id
          }
        }

        // Build the knockout question details for the rejection reason
        const knockoutDetails = responses
          .filter((r: { is_knockout_triggered: boolean }) => r.is_knockout_triggered)
          .map((r: { question_id: string }) => {
            const q = questions?.find((q: { id: string; question: string }) => q.id === r.question_id)
            return q?.question ? `"${q.question.slice(0, 50)}${q.question.length > 50 ? '...' : ''}"` : 'Unknown question'
          })

        const updateData: Record<string, unknown> = {
          status: "rejected",
          rejection_reason: `Failed screening question(s): ${knockoutDetails.join(', ')}`,
          rejected_at: new Date().toISOString(),
        }

        if (rejectedStageId) {
          updateData.stage_id = rejectedStageId
        }

        await supabase
          .from("applications")
          .update(updateData)
          .eq("id", application.id)
      }
    }

    // Send notifications (async, don't wait)
    const orgName = (job.organizations as { name: string })?.name || "the company"
    const candidateName = `${firstName} ${lastName}`

    // Send application confirmation to candidate
    notify.applicationReceived(supabase, job.org_id, {
      candidateName,
      candidateEmail: email,
      jobTitle: job.title,
      applicationId: application.id,
    }).catch((err) => {
      console.error("Failed to send application confirmation:", err)
    })

    // Notify recruiters about new application
    // Get org admins and hiring managers for this job
    supabase
      .from("user_roles")
      .select("user_id")
      .eq("org_id", job.org_id)
      .in("role", ["org_admin", "hiring_manager", "recruiter"])
      .then(({ data: recruiters }) => {
        if (recruiters && recruiters.length > 0) {
          notify.newApplication(supabase, job.org_id, recruiters.map(r => r.user_id), {
            candidateName,
            candidateEmail: email,
            jobTitle: job.title,
            applicationId: application.id,
            jobId: job.id,
          }).catch((err) => {
            console.error("Failed to notify recruiters:", err)
          })
        }
      }).catch((err) => {
        console.error("Failed to fetch recruiters for notification:", err)
      })

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
    })
  } catch (error) {
    console.error("Application submission error:", error)
    return NextResponse.json(
      { error: "Failed to process application" },
      { status: 500 }
    )
  }
}
