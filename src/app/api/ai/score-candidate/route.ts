import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { scoreCandidate } from "@/lib/ai/candidate-matcher"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Role check
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    const role = userRole?.role
    const allowedRoles = ["super_admin", "hr_manager", "recruiter"]
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { candidateId, jobId } = body

    if (!candidateId || !jobId) {
      return NextResponse.json(
        { error: "Candidate ID and Job ID are required" },
        { status: 400 }
      )
    }

    // Fetch candidate data
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", candidateId)
      .single()

    if (candidateError || !candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      )
    }

    // Fetch job data
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Prepare candidate profile
    const candidateProfile = {
      currentJobTitle: candidate.current_title,
      yearsOfExperience: candidate.years_of_experience,
      skills: candidate.skills || [],
      highestEducation: null, // education is stored as JSON array, not a simple field
      city: candidate.city,
      country: candidate.country,
      experience: candidate.experience || [],
    }

    // Prepare job requirements
    const jobRequirements = {
      title: job.title,
      description: job.description || "",
      requiredSkills: job.skills || [],
      preferredSkills: [],
      experienceLevel: job.experience_level || "mid",
      yearsExperienceMin: job.years_experience_min,
      yearsExperienceMax: job.years_experience_max,
      educationRequirement: job.education_requirement,
      location: null, // location requires join with job_locations table
      isRemote: job.is_remote || false,
    }

    // Score the candidate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const score = await scoreCandidate(candidateProfile as any, jobRequirements as any)

    // Optionally update the application with the score
    if (body.updateApplication) {
      const { error: updateError } = await supabase
        .from("applications")
        .update({
          ai_match_score: score.overallScore,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ai_score_details: score as any,
          updated_at: new Date().toISOString(),
        })
        .eq("candidate_id", candidateId)
        .eq("job_id", jobId)

      if (updateError) {
        console.error("Failed to update application score:", updateError)
      }
    }

    return NextResponse.json({
      success: true,
      data: score,
    })
  } catch (error) {
    console.error("Candidate scoring error:", error)
    return NextResponse.json(
      {
        error: "Failed to score candidate",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
