import { anthropic, DEFAULT_MODEL } from "./client"

export interface EmailTemplateInput {
  templateType:
    | "application_received"
    | "interview_invitation"
    | "interview_reminder"
    | "offer_letter"
    | "rejection"
    | "onboarding_welcome"
    | "status_update"
    | "custom"
  context?: {
    companyName?: string
    jobTitle?: string
    tone?: "formal" | "friendly" | "professional"
    includeArabic?: boolean
    customInstructions?: string
  }
}

export interface GeneratedEmailTemplate {
  name: string
  slug: string
  subject: string
  subject_ar?: string
  body_html: string
  body_html_ar?: string
  variables: string[]
  category: string
}

const templateTypeInfo: Record<
  string,
  { name: string; description: string; category: string }
> = {
  application_received: {
    name: "Application Received Confirmation",
    description:
      "Sent when a candidate submits an application to confirm receipt",
    category: "applications",
  },
  interview_invitation: {
    name: "Interview Invitation",
    description: "Invite a candidate to an interview with scheduling details",
    category: "interviews",
  },
  interview_reminder: {
    name: "Interview Reminder",
    description:
      "Remind candidates about their upcoming interview 24 hours before",
    category: "interviews",
  },
  offer_letter: {
    name: "Job Offer Letter",
    description: "Extend a job offer to a successful candidate",
    category: "offers",
  },
  rejection: {
    name: "Application Rejection",
    description:
      "Politely inform candidate their application was not successful",
    category: "applications",
  },
  onboarding_welcome: {
    name: "Onboarding Welcome",
    description: "Welcome new hire and provide onboarding information",
    category: "onboarding",
  },
  status_update: {
    name: "Application Status Update",
    description: "Notify candidate about changes in their application status",
    category: "applications",
  },
  custom: {
    name: "Custom Template",
    description: "Custom email template based on user requirements",
    category: "general",
  },
}

export async function generateEmailTemplate(
  input: EmailTemplateInput
): Promise<GeneratedEmailTemplate> {
  const { templateType, context = {} } = input
  const typeInfo = templateTypeInfo[templateType]

  const toneInstructions =
    context.tone === "formal"
      ? "Use formal, corporate language"
      : context.tone === "friendly"
        ? "Use warm, friendly, and approachable language"
        : "Use professional but warm language"

  const prompt = `You are an expert HR communications specialist. Generate a professional email template for: ${typeInfo.name}

Purpose: ${typeInfo.description}

Context:
- Company Name: ${context.companyName || "{{company_name}}"}
- Job Title: ${context.jobTitle || "{{job_title}}"}
- Tone: ${toneInstructions}
${context.customInstructions ? `- Additional Instructions: ${context.customInstructions}` : ""}

Requirements:
1. Use HTML for the body (simple, clean HTML with inline styles)
2. Include relevant placeholder variables in {{variable_name}} format
3. Make it mobile-friendly with responsive design principles
4. Keep the design clean and professional
5. Include a clear call-to-action when appropriate
${context.includeArabic ? "6. Also generate Arabic versions that are culturally appropriate for MENA region" : ""}

Common variables to use:
- {{first_name}} - Candidate's first name
- {{last_name}} - Candidate's last name
- {{full_name}} - Candidate's full name
- {{email}} - Candidate's email
- {{company_name}} - Company name
- {{job_title}} - Job title
- {{application_date}} - Date of application
- {{interview_date}} - Interview date
- {{interview_time}} - Interview time
- {{interview_location}} - Interview location or video link
- {{recruiter_name}} - Recruiter's name
- {{recruiter_email}} - Recruiter's email

Respond with a JSON object containing:
{
  "name": "Template display name",
  "slug": "template-slug-kebab-case",
  "subject": "Email subject line with {{variables}}",
  ${context.includeArabic ? '"subject_ar": "Arabic subject line",' : ""}
  "body_html": "Full HTML body with styling",
  ${context.includeArabic ? '"body_html_ar": "Full Arabic HTML body (RTL)",' : ""}
  "variables": ["array", "of", "used", "variables"]
}

IMPORTANT: Return ONLY the JSON object, no markdown code blocks or explanation.`

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== "text") {
    throw new Error("Unexpected response type")
  }

  // Parse the JSON response
  let parsed: GeneratedEmailTemplate
  try {
    // Clean the response - remove markdown code blocks if present
    let jsonText = content.text.trim()
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    }
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error("Failed to parse AI response as JSON")
  }

  return {
    ...parsed,
    category: typeInfo.category,
  }
}

export async function improveEmailTemplate(
  currentTemplate: {
    subject: string
    body_html: string
  },
  improvement: string
): Promise<{
  subject: string
  body_html: string
}> {
  const prompt = `You are an expert HR communications specialist. Improve this email template based on the requested changes.

Current Template:
Subject: ${currentTemplate.subject}
Body:
${currentTemplate.body_html}

Requested Improvement: ${improvement}

Requirements:
1. Maintain the same structure and variables
2. Keep it professional and appropriate for HR communications
3. Ensure HTML is clean and mobile-friendly

Respond with a JSON object containing:
{
  "subject": "Improved subject line",
  "body_html": "Improved HTML body"
}

IMPORTANT: Return ONLY the JSON object, no markdown code blocks or explanation.`

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== "text") {
    throw new Error("Unexpected response type")
  }

  let jsonText = content.text.trim()
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
  }

  return JSON.parse(jsonText)
}

export async function translateEmailToArabic(template: {
  subject: string
  body_html: string
}): Promise<{
  subject_ar: string
  body_html_ar: string
}> {
  const prompt = `You are an expert translator specializing in HR and corporate communications for the MENA region.

Translate this email template to Arabic:

Subject: ${template.subject}
Body:
${template.body_html}

Requirements:
1. Translate naturally, not word-for-word
2. Keep all {{variable}} placeholders exactly as they are (in English)
3. Make it culturally appropriate for MENA region
4. Ensure the HTML maintains RTL direction
5. Keep the same HTML structure but adapt styling for RTL

Respond with a JSON object containing:
{
  "subject_ar": "Arabic subject",
  "body_html_ar": "Arabic HTML body with dir='rtl' attribute"
}

IMPORTANT: Return ONLY the JSON object, no markdown code blocks or explanation.`

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== "text") {
    throw new Error("Unexpected response type")
  }

  let jsonText = content.text.trim()
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
  }

  return JSON.parse(jsonText)
}
