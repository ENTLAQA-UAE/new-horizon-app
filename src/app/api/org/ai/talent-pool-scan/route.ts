// @ts-nocheck
// Note: Supabase nested relation queries cause type inference issues
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAICompletion, parseJSONFromAI, hasAIConfigured } from "@/lib/ai/unified-client"
import { aiLimiter, getRateLimitKey, rateLimitResponse } from "@/lib/rate-limit"

interface PoolCandidate {
  candidateId: string
  candidateName: string
  score: number
  recommendation: "strong_match" | "good_match" | "potential_match" | "weak_match" | "not_recommended"
  summary: string
  summaryAr: string
  strengths: string[]
  concerns: string[]
  skillAnalysis: {
    matched: Array<{ skill: string; proficiency: string }>
    missing: Array<{ skill: string; importance: string }>
    additional: string[]
  }
  experienceAnalysis: {
    yearsRelevant: number
    relevanceScore: number
    highlights: string[]
  }
  interviewFocus: string[]
}

const POOL_SCAN_PROMPT = `You are an expert HR talent scout specializing in matching candidates from a talent pool to new job openings in the MENA region.

You are given a job description and a list of candidates from the organization's existing talent pool (people who applied to previous jobs). Your task is to analyze each candidate and determine how well they fit the NEW job.

Return a valid JSON object with this exact structure:
{
  "candidates": [
    {
      "candidateId": "uuid",
      "candidateName": "Full Name",
      "score": 85,
      "recommendation": "strong_match",
      "summary": "Brief explanation of fit in English",
      "summaryAr": "ملخص مختصر بالعربية",
      "strengths": ["Strength 1", "Strength 2"],
      "concerns": ["Concern 1"],
      "skillAnalysis": {
        "matched": [{"skill": "JavaScript", "proficiency": "expert"}],
        "missing": [{"skill": "Go", "importance": "nice_to_have"}],
        "additional": ["Python"]
      },
      "experienceAnalysis": {
        "yearsRelevant": 5,
        "relevanceScore": 80,
        "highlights": ["Led team of 10 engineers"]
      },
      "interviewFocus": ["Technical depth in system design"]
    }
  ]
}

Recommendation thresholds:
- "strong_match": 80-100 score
- "good_match": 65-79 score
- "potential_match": 50-64 score
- "weak_match": 35-49 score
- "not_recommended": 0-34 score

IMPORTANT:
- Only include candidates with score >= 35 (skip not_recommended)
- Rank by score descending
- Be objective and thorough
- Consider skills, experience, education, and cultural fit
- Return ONLY the JSON object, no markdown code blocks`

export async function POST(request: NextRequest) {
  const rlKey = getRateLimitKey(request)
  const rl = aiLimiter.check(`org-ai-pool-scan:${rlKey}`)
  if (!rl.success) return rateLimitResponse(rl)

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { jobId } = await request.json()

    if (!jobId) {
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
      .select("id, title, title_ar, description, description_ar, experience_level, job_type")
      .eq("id", jobId)
      .eq("org_id", orgId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Get ALL candidates in the org (the talent pool)
    // Exclude candidates who already have an application for THIS job
    const { data: existingApps } = await supabase
      .from("applications")
      .select("candidate_id")
      .eq("job_id", jobId)

    const excludeCandidateIds = existingApps?.map(a => a.candidate_id) || []

    let candidateQuery = supabase
      .from("candidates")
      .select(`
        id,
        first_name,
        last_name,
        email,
        current_title,
        city,
        country,
        years_of_experience,
        skills,
        education,
        experience,
        resume_parsed_data,
        summary
      `)
      .eq("org_id", orgId)
      .eq("is_blacklisted", false)
      .order("created_at", { ascending: false })
      .limit(50) // Limit to prevent excessive AI token usage

    if (excludeCandidateIds.length > 0) {
      // Filter out candidates who already applied to this job
      candidateQuery = candidateQuery.not("id", "in", `(${excludeCandidateIds.join(",")})`)
    }

    const { data: candidates, error: candidatesError } = await candidateQuery

    if (candidatesError) {
      throw candidatesError
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        success: true,
        data: { candidates: [], totalScanned: 0 },
        message: "No candidates in pool to scan",
      })
    }

    // Build candidate profiles for AI analysis
    const candidateProfiles = candidates.map(c => {
      let profile = `
CANDIDATE ID: ${c.id}
Name: ${c.first_name} ${c.last_name}
Current Title: ${c.current_title || "Not specified"}
Location: ${[c.city, c.country].filter(Boolean).join(", ") || "Not specified"}
Years of Experience: ${c.years_of_experience || "Not specified"}
`

      if (c.skills && Array.isArray(c.skills) && c.skills.length > 0) {
        profile += `Skills: ${c.skills.join(", ")}\n`
      }

      if (c.summary) {
        profile += `Summary: ${c.summary}\n`
      }

      if (c.experience && Array.isArray(c.experience) && c.experience.length > 0) {
        profile += `Experience:\n`
        c.experience.slice(0, 3).forEach((exp: any) => {
          profile += `  - ${exp.title || exp.position || "Role"} at ${exp.company || "Company"} (${exp.duration || exp.years || ""})\n`
        })
      }

      if (c.education && Array.isArray(c.education) && c.education.length > 0) {
        profile += `Education:\n`
        c.education.slice(0, 2).forEach((edu: any) => {
          profile += `  - ${edu.degree || edu.level || "Degree"} in ${edu.field || edu.major || "Field"} from ${edu.institution || edu.school || "Institution"}\n`
        })
      }

      if (c.resume_parsed_data && typeof c.resume_parsed_data === 'object') {
        const parsed = c.resume_parsed_data as any
        if (parsed.summary) profile += `Resume Summary: ${parsed.summary}\n`
        if (parsed.skills && Array.isArray(parsed.skills)) {
          profile += `Parsed Skills: ${parsed.skills.join(", ")}\n`
        }
      }

      return profile
    }).join("\n---\n")

    const fullPrompt = `${POOL_SCAN_PROMPT}

JOB DETAILS:
Title: ${job.title}
${job.title_ar ? `Title (Arabic): ${job.title_ar}` : ""}
Description: ${job.description || "No description provided"}
Experience Level: ${job.experience_level || "Not specified"}
Employment Type: ${job.job_type || "Not specified"}

TALENT POOL CANDIDATES (${candidates.length} candidates):
${candidateProfiles}

Analyze each candidate's fit for the job. Only return candidates with score >= 35.`

    // Generate analysis using unified AI client
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
        feature: "talent_pool_scan",
        jobId: jobId,
        triggeredBy: user.id,
      }
    )

    // Parse the JSON response
    const scanResult = parseJSONFromAI<{ candidates: PoolCandidate[] }>(result.content)

    // Save recommendations to candidate_ai_screening table
    let savedCount = 0
    for (const rec of scanResult.candidates) {
      const { error: upsertError } = await supabase
        .from("candidate_ai_screening")
        .upsert({
          org_id: orgId,
          job_id: jobId,
          candidate_id: rec.candidateId,
          application_id: null, // No application yet — this is a pool recommendation
          overall_score: rec.score,
          skills_match_score: rec.skillAnalysis?.matched?.length ? Math.min(100, rec.skillAnalysis.matched.length * 20) : null,
          experience_score: rec.experienceAnalysis?.relevanceScore || null,
          recommendation: rec.recommendation,
          recommendation_reason: rec.summary,
          screening_feedback: rec.summary,
          strengths: rec.strengths || [],
          concerns: rec.concerns || [],
          skill_gaps: rec.skillAnalysis?.missing || [],
          screening_data: rec,
          ai_provider: result.provider,
          ai_model: result.model,
          source: "talent_pool",
          screened_by: user.id,
        }, {
          onConflict: "job_id,candidate_id",
        })

      if (!upsertError) {
        savedCount++
      } else {
        console.error("Error saving pool recommendation:", upsertError)
      }
    }

    // Send notification about matches found
    const strongMatches = scanResult.candidates.filter(c => c.recommendation === "strong_match").length
    const goodMatches = scanResult.candidates.filter(c => c.recommendation === "good_match").length

    if (strongMatches > 0 || goodMatches > 0) {
      fetch(`${request.nextUrl.origin}/api/notifications/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "ai_talent_pool_matches",
          orgId: orgId,
          data: {
            jobTitle: job.title,
            jobId: job.id,
            strongMatches,
            goodMatches,
            totalMatches: scanResult.candidates.length,
          },
        }),
      }).catch((err) => {
        console.error("Failed to send talent pool match notification:", err)
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        candidates: scanResult.candidates,
        totalScanned: candidates.length,
        totalMatches: scanResult.candidates.length,
        strongMatches,
        goodMatches,
      },
      provider: result.provider,
      model: result.model,
    })
  } catch (error) {
    console.error("Talent pool scan error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to scan talent pool" },
      { status: 500 }
    )
  }
}
