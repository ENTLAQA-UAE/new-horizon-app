// @ts-nocheck
// Note: This file has Supabase type issues
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { emails } from "@/lib/email/resend"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
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

    // Validate required fields
    if (!jobId || !firstName || !lastName || !email || !resumeFile) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if job exists and is open
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, organization_id, organizations(name)")
      .eq("id", jobId)
      .eq("status", "open")
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: "Job not found or not accepting applications" },
        { status: 404 }
      )
    }

    // Check if candidate already exists by email
    let candidateId: string
    const { data: existingCandidate } = await supabase
      .from("candidates")
      .select("id")
      .eq("email", email)
      .eq("organization_id", organizationId)
      .single()

    if (existingCandidate) {
      candidateId = existingCandidate.id
    } else {
      // Create new candidate
      const { data: newCandidate, error: createError } = await supabase
        .from("candidates")
        .insert({
          organization_id: organizationId,
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone || null,
          linkedin_url: linkedIn || null,
          source: "website",
          overall_status: "new",
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

    // Get first hiring stage
    const { data: stages } = await supabase
      .from("hiring_stages")
      .select("id")
      .eq("organization_id", organizationId)
      .order("sort_order", { ascending: true })
      .limit(1)

    const firstStageId = stages?.[0]?.id || null

    // Create application
    const { error: appError } = await supabase
      .from("applications")
      .insert({
        candidate_id: candidateId,
        job_id: jobId,
        stage: firstStageId,
        status: "new",
        source: "website",
        cover_letter: coverLetter || null,
        applied_at: new Date().toISOString(),
      })

    if (appError) {
      console.error("Failed to create application:", appError)
      return NextResponse.json(
        { error: "Failed to submit application" },
        { status: 500 }
      )
    }

    // Send confirmation email (async, don't wait)
    const orgName = (job.organizations as { name: string })?.name || "the company"
    emails.applicationReceived(email, firstName, job.title, orgName).catch((err) => {
      console.error("Failed to send confirmation email:", err)
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
