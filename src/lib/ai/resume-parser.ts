import { anthropic, DEFAULT_MODEL, ParsedResume } from "./client"

const RESUME_PARSING_PROMPT = `You are an expert resume parser for an Applicant Tracking System used in the MENA region (Saudi Arabia, UAE, Egypt, GCC countries).

Parse the following resume text and extract structured information. Be thorough and accurate.

For the education level, use one of these values: high_school, diploma, bachelors, masters, phd

For years of experience, calculate the total years based on work history if not explicitly stated.

Return the data as a valid JSON object with this exact structure:
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string or null",
  "city": "string or null",
  "country": "string or null",
  "nationality": "string or null",
  "currentJobTitle": "string or null",
  "currentCompany": "string or null",
  "yearsOfExperience": "number or null",
  "highestEducation": "high_school | diploma | bachelors | masters | phd or null",
  "skills": ["array of skills"],
  "languages": ["array of languages with proficiency, e.g., 'Arabic (Native)', 'English (Fluent)'"],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "year": "number or null",
      "gpa": "string or null"
    }
  ],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "location": "string or null",
      "startDate": "YYYY-MM or null",
      "endDate": "YYYY-MM or 'Present' or null",
      "description": "string or null"
    }
  ],
  "summary": "string or null - brief professional summary",
  "linkedinUrl": "string or null",
  "portfolioUrl": "string or null"
}

IMPORTANT:
- Return ONLY the JSON object, no markdown code blocks or additional text
- If information is not found, use null for optional fields
- Extract all skills mentioned anywhere in the resume
- Properly handle Arabic names and transliterate if needed
- For MENA region, pay attention to nationality and visa status mentions`

export async function parseResume(resumeText: string): Promise<ParsedResume> {
  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `${RESUME_PARSING_PROMPT}\n\nResume Text:\n${resumeText}`,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== "text") {
    throw new Error("Unexpected response type from AI")
  }

  try {
    // Clean the response - remove any markdown code blocks if present
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

    const parsed = JSON.parse(jsonText) as ParsedResume
    return parsed
  } catch {
    console.error("Failed to parse AI response:", content.text)
    throw new Error("Failed to parse resume data from AI response")
  }
}

// Parse resume from PDF/DOCX file content
export async function parseResumeFromFile(
  fileContent: string,
  fileType: "pdf" | "docx" | "text"
): Promise<ParsedResume> {
  // For now, we'll pass the text content directly
  // In production, you'd use pdf-parse or mammoth for extraction
  return parseResume(fileContent)
}
