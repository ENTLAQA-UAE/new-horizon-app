import Anthropic from "@anthropic-ai/sdk"

// Initialize Anthropic client
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Default model to use
export const DEFAULT_MODEL = "claude-sonnet-4-20250514"

// Types for AI responses
export interface ParsedResume {
  firstName: string
  lastName: string
  email: string
  phone: string | null
  city: string | null
  country: string | null
  nationality: string | null
  currentJobTitle: string | null
  currentCompany: string | null
  yearsOfExperience: number | null
  highestEducation: string | null
  skills: string[]
  languages: string[]
  education: {
    degree: string
    institution: string
    year: number | null
    gpa: string | null
  }[]
  experience: {
    title: string
    company: string
    location: string | null
    startDate: string | null
    endDate: string | null
    description: string | null
  }[]
  summary: string | null
  linkedinUrl: string | null
  portfolioUrl: string | null
}

export interface CandidateMatchScore {
  overallScore: number
  breakdown: {
    skillsMatch: number
    experienceMatch: number
    educationMatch: number
    locationMatch: number
  }
  matchedSkills: string[]
  missingSkills: string[]
  recommendation: "strong_match" | "good_match" | "potential_match" | "weak_match"
  summary: string
}

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
