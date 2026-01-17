import { anthropic, DEFAULT_MODEL, CandidateMatchScore } from "./client"

interface JobRequirements {
  title: string
  description: string
  requiredSkills: string[]
  preferredSkills: string[]
  experienceLevel: string
  yearsExperienceMin: number | null
  yearsExperienceMax: number | null
  educationRequirement: string | null
  location: string | null
  isRemote: boolean
}

interface CandidateProfile {
  currentJobTitle: string | null
  yearsOfExperience: number | null
  skills: string[]
  highestEducation: string | null
  city: string | null
  country: string | null
  experience: {
    title: string
    company: string
    description: string | null
  }[]
}

const MATCHING_PROMPT = `You are an expert HR recruiter for the MENA region (Saudi Arabia, UAE, Egypt, GCC).
Analyze the candidate profile against the job requirements and provide a detailed match score.

Score each category from 0-100:
- Skills Match: How well the candidate's skills match required and preferred skills
- Experience Match: How well their experience level and work history matches
- Education Match: How well their education meets requirements
- Location Match: Geographic fit (consider remote options)

Calculate an overall weighted score:
- Skills: 40%
- Experience: 30%
- Education: 15%
- Location: 15%

Provide your response as a valid JSON object:
{
  "overallScore": number (0-100),
  "breakdown": {
    "skillsMatch": number (0-100),
    "experienceMatch": number (0-100),
    "educationMatch": number (0-100),
    "locationMatch": number (0-100)
  },
  "matchedSkills": ["skills the candidate has that match"],
  "missingSkills": ["required skills the candidate lacks"],
  "recommendation": "strong_match" | "good_match" | "potential_match" | "weak_match",
  "summary": "2-3 sentence summary of the candidate's fit for this role"
}

Recommendation thresholds:
- strong_match: 80-100
- good_match: 60-79
- potential_match: 40-59
- weak_match: 0-39

IMPORTANT: Return ONLY the JSON object, no markdown or additional text.`

export async function scoreCandidate(
  candidate: CandidateProfile,
  job: JobRequirements
): Promise<CandidateMatchScore> {
  const prompt = `${MATCHING_PROMPT}

JOB REQUIREMENTS:
Title: ${job.title}
Description: ${job.description}
Required Skills: ${job.requiredSkills.join(", ")}
Preferred Skills: ${job.preferredSkills.join(", ")}
Experience Level: ${job.experienceLevel}
Years Experience: ${job.yearsExperienceMin || 0} - ${job.yearsExperienceMax || "10+"} years
Education: ${job.educationRequirement || "Not specified"}
Location: ${job.location || "Not specified"}
Remote: ${job.isRemote ? "Yes" : "No"}

CANDIDATE PROFILE:
Current Title: ${candidate.currentJobTitle || "Not specified"}
Years of Experience: ${candidate.yearsOfExperience || "Not specified"}
Skills: ${candidate.skills.join(", ")}
Education: ${candidate.highestEducation || "Not specified"}
Location: ${candidate.city ? `${candidate.city}, ${candidate.country}` : candidate.country || "Not specified"}

Work History:
${candidate.experience.map((exp) => `- ${exp.title} at ${exp.company}: ${exp.description || "No description"}`).join("\n")}`

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1024,
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

    return JSON.parse(jsonText) as CandidateMatchScore
  } catch {
    console.error("Failed to parse AI response:", content.text)
    throw new Error("Failed to parse match score from AI response")
  }
}

// Batch score multiple candidates for a job
export async function scoreCandidates(
  candidates: CandidateProfile[],
  job: JobRequirements
): Promise<Map<number, CandidateMatchScore>> {
  const results = new Map<number, CandidateMatchScore>()

  // Process in parallel with rate limiting
  const batchSize = 5
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize)
    const promises = batch.map((candidate, index) =>
      scoreCandidate(candidate, job).then((score) => ({
        index: i + index,
        score,
      }))
    )

    const batchResults = await Promise.all(promises)
    batchResults.forEach(({ index, score }) => {
      results.set(index, score)
    })

    // Small delay between batches to respect rate limits
    if (i + batchSize < candidates.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  return results
}
