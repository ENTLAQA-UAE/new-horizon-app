// @ts-nocheck
// Note: This file uses tables that require type regeneration
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAICompletion, parseJSONFromAI, hasAIConfigured } from "@/lib/ai/unified-client"

export interface CandidateScreeningResult {
  overallScore: number // 0-100
  matchPercentage: number // 0-100
  recommendation: "strong_match" | "good_match" | "potential_match" | "weak_match" | "not_recommended"
  summary: string
  summaryAr: string
  skillAnalysis: {
    matched: Array<{ skill: string; proficiency: "expert" | "proficient" | "familiar" | "basic" }>
    missing: Array<{ skill: string; importance: "critical" | "important" | "nice_to_have" }>
    additional: string[] // Skills candidate has but not required
  }
  experienceAnalysis: {
    yearsRelevant: number
    relevanceScore: number // 0-100
    highlights: string[]
    concerns: string[]
  }
  educationAnalysis: {
    meetsRequirements: boolean
    details: string
  }
  strengths: string[]
  strengthsAr: string[]
  weaknesses: string[]
  weaknessesAr: string[]
  interviewFocus: string[] // Areas to probe during interview
  culturalFit: {
    score: number // 0-100
    notes: string
  }
}

interface ScreeningInput {
  applicationId: string
  candidateInfo: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    currentTitle?: string
    resumeText?: string
    resumeUrl?: string
  }
  jobInfo: {
    title: string
    titleAr?: string
    description?: string
    descriptionAr?: string
    requirements?: string
    department?: string
    experienceLevel?: string
  }
  screeningResponses?: Array<{
    question: string
    answer: string
    isKnockout: boolean
    knockoutTriggered: boolean
  }>
  includeScorecard?: boolean
  scorecardData?: {
    overallScore: number
    recommendation: string
    strengths?: string
    weaknesses?: string
  }
}

const CV_SCREENING_PROMPT = `You are an expert HR analyst specializing in candidate screening and CV evaluation for the MENA region job market (Saudi Arabia, UAE, Egypt, GCC).

Analyze the candidate's profile against the job requirements and provide a comprehensive screening assessment.

Guidelines:
- Be objective and fair in your assessment
- Consider MENA region work culture and expectations
- Evaluate technical skills, soft skills, and cultural fit
- Identify skill gaps and development areas
- Provide actionable interview focus areas
- Score objectively based on evidence in the CV/profile
- Arabic content should be natural business Arabic

Return a valid JSON object with this exact structure:
{
  "overallScore": 75,
  "matchPercentage": 70,
  "recommendation": "good_match",
  "summary": "2-3 sentence English summary of the candidate fit",
  "summaryAr": "Arabic summary",
  "skillAnalysis": {
    "matched": [{"skill": "JavaScript", "proficiency": "expert"}],
    "missing": [{"skill": "TypeScript", "importance": "important"}],
    "additional": ["Python", "Docker"]
  },
  "experienceAnalysis": {
    "yearsRelevant": 5,
    "relevanceScore": 80,
    "highlights": ["Led team of 5 developers", "Delivered 3 major projects"],
    "concerns": ["No remote team experience"]
  },
  "educationAnalysis": {
    "meetsRequirements": true,
    "details": "Bachelor's in Computer Science from reputable university"
  },
  "strengths": ["Strong technical skills", "Leadership experience"],
  "strengthsAr": ["مهارات تقنية قوية", "خبرة قيادية"],
  "weaknesses": ["Limited industry experience", "No Arabic language skills"],
  "weaknessesAr": ["خبرة محدودة في الصناعة", "لا يوجد مهارات لغة عربية"],
  "interviewFocus": ["Probe technical depth in React", "Assess team collaboration"],
  "culturalFit": {
    "score": 75,
    "notes": "Good alignment with company values, may need support with local practices"
  }
}

Recommendation values:
- "strong_match": 85-100 score, highly recommended
- "good_match": 70-84 score, recommended
- "potential_match": 55-69 score, worth considering
- "weak_match": 40-54 score, significant gaps
- "not_recommended": 0-39 score, does not meet requirements

IMPORTANT: Return ONLY the JSON object, no markdown code blocks or additional text.`

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const input: ScreeningInput = await request.json()

    if (!input.applicationId) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 })
    }

    // Get user's org_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 })
    }

    const orgId = profile.org_id

    // Check if AI is configured
    const hasAI = await hasAIConfigured(supabase, orgId)
    if (!hasAI) {
      return NextResponse.json(
        { error: "AI not configured. Please configure an AI provider in Settings > AI Configuration." },
        { status: 400 }
      )
    }

    // Build the candidate profile for analysis
    const candidateProfile = `
CANDIDATE PROFILE:
Name: ${input.candidateInfo.firstName} ${input.candidateInfo.lastName}
Email: ${input.candidateInfo.email}
${input.candidateInfo.phone ? `Phone: ${input.candidateInfo.phone}` : ""}
${input.candidateInfo.currentTitle ? `Current Title: ${input.candidateInfo.currentTitle}` : ""}
${input.candidateInfo.resumeText ? `\nRESUME CONTENT:\n${input.candidateInfo.resumeText}` : ""}
`

    // Build job requirements
    const jobRequirements = `
JOB DETAILS:
Title: ${input.jobInfo.title}${input.jobInfo.titleAr ? ` / ${input.jobInfo.titleAr}` : ""}
${input.jobInfo.department ? `Department: ${input.jobInfo.department}` : ""}
${input.jobInfo.experienceLevel ? `Experience Level: ${input.jobInfo.experienceLevel}` : ""}
${input.jobInfo.description ? `\nDescription:\n${input.jobInfo.description}` : ""}
${input.jobInfo.requirements ? `\nRequirements:\n${input.jobInfo.requirements}` : ""}
`

    // Include screening responses if available
    let screeningSection = ""
    if (input.screeningResponses && input.screeningResponses.length > 0) {
      screeningSection = `
SCREENING RESPONSES:
${input.screeningResponses.map((r, i) => `${i + 1}. Q: ${r.question}\n   A: ${r.answer}${r.knockoutTriggered ? " [KNOCKOUT TRIGGERED]" : ""}`).join("\n")}
`
    }

    // Include scorecard data if available (for re-ranking)
    let scorecardSection = ""
    if (input.includeScorecard && input.scorecardData) {
      scorecardSection = `
INTERVIEW SCORECARD DATA:
Overall Interview Score: ${input.scorecardData.overallScore}/5
Recommendation: ${input.scorecardData.recommendation}
${input.scorecardData.strengths ? `Interviewer-noted Strengths: ${input.scorecardData.strengths}` : ""}
${input.scorecardData.weaknesses ? `Interviewer-noted Weaknesses: ${input.scorecardData.weaknesses}` : ""}
`
    }

    const fullPrompt = `${CV_SCREENING_PROMPT}

Analyze the following candidate against the job requirements:

${candidateProfile}

${jobRequirements}
${screeningSection}
${scorecardSection}

Provide a comprehensive screening assessment.`

    // Generate screening using unified AI client
    const result = await getAICompletion(
      supabase,
      orgId,
      {
        messages: [
          {
            role: "user",
            content: fullPrompt,
          },
        ],
        maxTokens: 4096,
        temperature: 0.3, // Lower temperature for more consistent scoring
      },
      {
        feature: "cv_screening",
        applicationId: input.applicationId,
        triggeredBy: user.id,
      }
    )

    // Parse the JSON response
    const screeningResult = parseJSONFromAI<CandidateScreeningResult>(result.content)

    // Store screening result in database
    const { data: screening, error: screeningError } = await supabase
      .from("candidate_ai_screening")
      .upsert({
        application_id: input.applicationId,
        org_id: orgId,
        provider: result.provider,
        model: result.model,
        overall_score: screeningResult.overallScore,
        match_percentage: screeningResult.matchPercentage,
        recommendation: screeningResult.recommendation,
        screening_data: screeningResult,
        screened_by: user.id,
        screened_at: new Date().toISOString(),
      }, {
        onConflict: "application_id",
      })
      .select()
      .single()

    if (screeningError) {
      console.error("Error saving screening:", screeningError)
      // Don't fail the request, just log the error
    }

    // Update application with AI score
    await supabase
      .from("applications")
      .update({
        ai_match_score: screeningResult.overallScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.applicationId)

    return NextResponse.json({
      success: true,
      data: screeningResult,
      provider: result.provider,
      model: result.model,
      screeningId: screening?.id,
    })
  } catch (error) {
    console.error("CV screening error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to screen candidate" },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve existing screening
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get("applicationId")

    if (!applicationId) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 })
    }

    // Get user's org_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 })
    }

    const { data: screening, error } = await supabase
      .from("candidate_ai_screening")
      .select("*")
      .eq("application_id", applicationId)
      .eq("org_id", profile.org_id)
      .single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: screening?.screening_data || null,
      screeningId: screening?.id,
      screenedAt: screening?.screened_at,
    })
  } catch (error) {
    console.error("Error fetching screening:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch screening" },
      { status: 500 }
    )
  }
}
