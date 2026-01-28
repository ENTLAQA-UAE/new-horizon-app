import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAICompletion, parseJSONFromAI, hasAIConfigured } from "@/lib/ai/unified-client"

export interface ApplicantRanking {
  applicationId: string
  candidateName: string
  rank: number
  score: number // 0-100
  recommendation: "strong_match" | "good_match" | "potential_match" | "weak_match" | "not_recommended"
  summary: string
  keyStrengths: string[]
  keyWeaknesses: string[]
  standoutFactor?: string // What makes this candidate unique
}

export interface RankingResult {
  jobId: string
  jobTitle: string
  totalApplicants: number
  rankedAt: string
  rankings: ApplicantRanking[]
  insights: {
    topCandidatesCount: number // How many strong matches
    averageScore: number
    competitiveInsight: string // Summary of candidate pool quality
  }
}

interface RankingInput {
  jobId: string
  includeScorecard?: boolean // Include interview scorecard data
}

const RANKING_PROMPT = `You are an expert HR analyst specializing in candidate ranking and comparison for the MENA region job market.

Rank the candidates based on their fit for the job. Consider:
1. Skills match with job requirements
2. Relevant experience
3. Education requirements
4. Screening responses (if available)
5. Interview scores (if available)

Return a valid JSON object with this exact structure:
{
  "rankings": [
    {
      "applicationId": "uuid",
      "candidateName": "Full Name",
      "rank": 1,
      "score": 92,
      "recommendation": "strong_match",
      "summary": "Brief explanation of ranking",
      "keyStrengths": ["Strength 1", "Strength 2"],
      "keyWeaknesses": ["Weakness 1"],
      "standoutFactor": "What makes this candidate unique (optional)"
    }
  ],
  "insights": {
    "topCandidatesCount": 3,
    "averageScore": 68,
    "competitiveInsight": "Summary of candidate pool quality and recommendations"
  }
}

Recommendation values:
- "strong_match": 85-100 score
- "good_match": 70-84 score
- "potential_match": 55-69 score
- "weak_match": 40-54 score
- "not_recommended": 0-39 score

IMPORTANT:
- Rank ALL candidates provided, from best to worst fit
- Be objective and fair
- Return ONLY the JSON object, no markdown code blocks`

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const input: RankingInput = await request.json()

    if (!input.jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
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

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, title_ar, description, description_ar")
      .eq("id", input.jobId)
      .eq("org_id", orgId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Get all applications for the job with candidate info
    const { data: applications, error: appsError } = await supabase
      .from("applications")
      .select(`
        id,
        ai_match_score,
        manual_score,
        status,
        candidates (
          id,
          first_name,
          last_name,
          email,
          phone,
          current_title,
          resume_url
        )
      `)
      .eq("job_id", input.jobId)
      .neq("status", "withdrawn")
      .neq("status", "rejected")

    if (appsError) {
      throw appsError
    }

    if (!applications || applications.length === 0) {
      return NextResponse.json({ error: "No applications found for this job" }, { status: 400 })
    }

    // Get screening responses for all applications
    const applicationIds = applications.map(a => a.id)
    const { data: screeningResponses } = await supabase
      .from("application_screening_responses")
      .select(`
        application_id,
        answer,
        is_knockout_triggered,
        screening_questions (
          question,
          is_knockout
        )
      `)
      .in("application_id", applicationIds)

    // Get interview scorecards if requested
    let scorecards: Record<string, any> = {}
    if (input.includeScorecard) {
      const { data: interviews } = await supabase
        .from("interviews")
        .select(`
          id,
          application_id,
          interview_scorecards (
            overall_score,
            recommendation,
            strengths,
            weaknesses
          )
        `)
        .in("application_id", applicationIds)

      if (interviews) {
        for (const interview of interviews) {
          if (interview.interview_scorecards && interview.interview_scorecards.length > 0) {
            // Use the latest scorecard
            scorecards[interview.application_id] = interview.interview_scorecards[0]
          }
        }
      }
    }

    // Build candidate profiles for ranking
    const candidateProfiles = applications.map(app => {
      const candidate = app.candidates
      const appScreening = screeningResponses?.filter(s => s.application_id === app.id) || []
      const scorecard = scorecards[app.id]

      let profile = `
CANDIDATE: ${candidate?.first_name} ${candidate?.last_name} (Application ID: ${app.id})
- Email: ${candidate?.email}
- Current Title: ${candidate?.current_title || "Not specified"}
- Previous AI Score: ${app.ai_match_score || "Not screened"}
- Manual Rating: ${app.manual_score || "Not rated"}
`

      if (appScreening.length > 0) {
        profile += "\nScreening Responses:\n"
        appScreening.forEach((s, i) => {
          profile += `  ${i + 1}. Q: ${s.screening_questions?.question}\n     A: ${s.answer}${s.is_knockout_triggered ? " [KNOCKOUT]" : ""}\n`
        })
      }

      if (scorecard) {
        profile += `\nInterview Scorecard:
  - Overall Score: ${scorecard.overall_score}/5
  - Recommendation: ${scorecard.recommendation}
  - Strengths: ${scorecard.strengths || "N/A"}
  - Weaknesses: ${scorecard.weaknesses || "N/A"}\n`
      }

      return profile
    }).join("\n---\n")

    const fullPrompt = `${RANKING_PROMPT}

JOB DETAILS:
Title: ${job.title}
Description: ${job.description || "No description provided"}

CANDIDATES TO RANK:
${candidateProfiles}

Rank all ${applications.length} candidates from best to worst fit for this job.`

    // Generate ranking using unified AI client
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
        temperature: 0.3,
      },
      {
        feature: "applicant_ranking",
        jobId: input.jobId,
        triggeredBy: user.id,
      }
    )

    // Parse the JSON response
    const rankingData = parseJSONFromAI<{ rankings: ApplicantRanking[]; insights: RankingResult["insights"] }>(result.content)

    // Build full result
    const rankingResult: RankingResult = {
      jobId: input.jobId,
      jobTitle: job.title,
      totalApplicants: applications.length,
      rankedAt: new Date().toISOString(),
      rankings: rankingData.rankings,
      insights: rankingData.insights,
    }

    // Update applications with AI scores from ranking
    for (const ranking of rankingData.rankings) {
      await supabase
        .from("applications")
        .update({
          ai_match_score: ranking.score,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ranking.applicationId)
    }

    return NextResponse.json({
      success: true,
      data: rankingResult,
      provider: result.provider,
      model: result.model,
    })
  } catch (error) {
    console.error("Ranking error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to rank applicants" },
      { status: 500 }
    )
  }
}
