// @ts-nocheck
// Note: This file uses tables that require type regeneration
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAICompletion, parseJSONFromAI, hasAIConfigured } from "@/lib/ai/unified-client"

export interface GeneratedJobDescription {
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  requirements: string[]
  requirementsAr: string[]
  responsibilities: string[]
  responsibilitiesAr: string[]
  benefits: string[]
  benefitsAr: string[]
  skills: string[]
}

interface JobGenerationInput {
  title: string
  titleAr?: string
  department?: string
  location?: string
  employmentType?: string
  experienceLevel?: string
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  isRemote?: boolean
  additionalContext?: string
}

const JOB_GENERATION_PROMPT = `You are an expert HR content writer specializing in the MENA region job market (Saudi Arabia, UAE, Egypt, GCC).

Generate a comprehensive, professional job description in both English and Arabic.

Guidelines:
- Write in a professional, engaging tone
- Include industry-standard requirements for the role
- Be specific about responsibilities and qualifications
- Consider MENA region work culture and expectations
- Arabic content should be natural, not just translated - use business Arabic commonly used in the Gulf
- Include 5-8 requirements, responsibilities, and benefits each
- Skills should be technical and soft skills relevant to the role
- Format the description with clear sections that can be displayed on a job posting

Return a valid JSON object with this exact structure:
{
  "title": "English job title (improved if needed)",
  "titleAr": "Arabic job title",
  "description": "2-3 paragraph English description of the role. Use clear formatting.",
  "descriptionAr": "Arabic description (natural Arabic, not just translation)",
  "requirements": ["Requirement 1", "Requirement 2", ...],
  "requirementsAr": ["المتطلب الأول", ...],
  "responsibilities": ["Responsibility 1", ...],
  "responsibilitiesAr": ["المسؤولية الأولى", ...],
  "benefits": ["Benefit 1", ...],
  "benefitsAr": ["الميزة الأولى", ...],
  "skills": ["skill1", "skill2", ...]
}

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
    const input: JobGenerationInput = await request.json()

    if (!input.title) {
      return NextResponse.json({ error: "Job title is required" }, { status: 400 })
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

    // Build the prompt with job details
    const jobDetails = `
Job Title: ${input.title}
${input.titleAr ? `Job Title (Arabic): ${input.titleAr}` : ""}
Department: ${input.department || "Not specified"}
Location: ${input.location || "Not specified"}
Remote Work: ${input.isRemote ? "Yes" : "No"}
Employment Type: ${input.employmentType || "Full-time"}
Experience Level: ${input.experienceLevel || "Mid-level"}
${input.salaryMin || input.salaryMax ? `Salary Range: ${input.salaryCurrency || "SAR"} ${input.salaryMin || "0"} - ${input.salaryMax || "negotiable"}` : ""}
${input.additionalContext ? `Additional Context: ${input.additionalContext}` : ""}
`

    // Generate job description using unified AI client
    const result = await getAICompletion(
      supabase,
      orgId,
      {
        messages: [
          {
            role: "user",
            content: `${JOB_GENERATION_PROMPT}\n\nGenerate a job description for:\n${jobDetails}`,
          },
        ],
        maxTokens: 4096,
        temperature: 0.7,
      },
      {
        feature: "job_description",
        triggeredBy: user.id,
      }
    )

    // Parse the JSON response
    const generatedJob = parseJSONFromAI<GeneratedJobDescription>(result.content)

    return NextResponse.json({
      success: true,
      data: generatedJob,
      provider: result.provider,
      model: result.model,
    })
  } catch (error) {
    console.error("Job generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate job description" },
      { status: 500 }
    )
  }
}
