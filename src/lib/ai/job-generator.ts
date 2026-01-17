import { anthropic, DEFAULT_MODEL, GeneratedJobDescription } from "./client"

interface JobGenerationInput {
  title: string
  department: string | null
  location: string | null
  employmentType: string
  experienceLevel: string
  industry: string | null
  companyDescription: string | null
  additionalContext: string | null
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

Return a valid JSON object:
{
  "title": "English job title",
  "titleAr": "Arabic job title",
  "description": "2-3 paragraph English description of the role",
  "descriptionAr": "Arabic description",
  "requirements": ["English requirement 1", "requirement 2", ...],
  "requirementsAr": ["Arabic requirement 1", ...],
  "responsibilities": ["English responsibility 1", ...],
  "responsibilitiesAr": ["Arabic responsibility 1", ...],
  "benefits": ["English benefit 1", ...],
  "benefitsAr": ["Arabic benefit 1", ...],
  "skills": ["skill1", "skill2", ...]
}

IMPORTANT: Return ONLY the JSON object, no markdown or additional text.`

export async function generateJobDescription(
  input: JobGenerationInput
): Promise<GeneratedJobDescription> {
  const prompt = `${JOB_GENERATION_PROMPT}

Generate a job description for:
Title: ${input.title}
Department: ${input.department || "Not specified"}
Location: ${input.location || "Not specified"}
Employment Type: ${input.employmentType}
Experience Level: ${input.experienceLevel}
Industry: ${input.industry || "Not specified"}
Company Description: ${input.companyDescription || "A leading company in the region"}
Additional Context: ${input.additionalContext || "None"}`

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== "text") {
    throw new Error("Unexpected response type from AI")
  }

  try {
    let jsonText = content.text.trim()
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7)
    }
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3)
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3)
    }
    jsonText = jsonText.trim()

    return JSON.parse(jsonText) as GeneratedJobDescription
  } catch {
    console.error("Failed to parse AI response:", content.text)
    throw new Error("Failed to parse job description from AI response")
  }
}

// Generate interview questions based on job and candidate
export async function generateInterviewQuestions(
  jobTitle: string,
  jobDescription: string,
  candidateSkills: string[],
  interviewType: "screening" | "technical" | "behavioral" | "final"
): Promise<string[]> {
  const typeGuidelines: Record<string, string> = {
    screening:
      "Basic qualification and interest questions, salary expectations, availability",
    technical: "Technical skills assessment, problem-solving, hands-on knowledge",
    behavioral:
      "Past experiences, STAR method questions, cultural fit, teamwork",
    final:
      "Career goals, leadership, strategic thinking, company alignment",
  }

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Generate 8-10 interview questions for a ${interviewType} interview.

Job: ${jobTitle}
Description: ${jobDescription}
Candidate Skills: ${candidateSkills.join(", ")}
Interview Focus: ${typeGuidelines[interviewType]}

Consider MENA region work culture. Include a mix of role-specific and general questions.

Return as a JSON array of strings:
["Question 1?", "Question 2?", ...]

Return ONLY the JSON array, no markdown.`,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== "text") {
    throw new Error("Unexpected response type from AI")
  }

  try {
    let jsonText = content.text.trim()
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7)
    }
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3)
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3)
    }
    jsonText = jsonText.trim()

    return JSON.parse(jsonText) as string[]
  } catch {
    console.error("Failed to parse AI response:", content.text)
    throw new Error("Failed to parse interview questions from AI response")
  }
}
