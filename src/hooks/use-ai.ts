"use client"

import { useState } from "react"

// Types moved from old client.ts - these are used by components
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

/**
 * Hook for AI operations using organization-level AI configuration.
 *
 * This hook uses the new per-organization AI configuration system.
 * AI providers must be configured in Settings > AI Configuration for each organization.
 */
export function useAI() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Parse resume text using AI.
   * Note: This feature uses legacy global AI config and will be migrated to org-level config.
   * @deprecated Will be updated to use org-level AI config
   */
  const parseResume = async (resumeText: string): Promise<ParsedResume | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse resume")
      }

      return data.data as ParsedResume
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse resume"
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Score a candidate against a job using AI.
   * Uses organization-level AI configuration.
   */
  const scoreCandidate = async (
    applicationId: string,
    candidateInfo: {
      firstName: string
      lastName: string
      email: string
      phone?: string
      currentTitle?: string
      resumeText?: string
    },
    jobInfo: {
      title: string
      titleAr?: string
      description?: string
      descriptionAr?: string
      requirements?: string
      department?: string
      experienceLevel?: string
    }
  ): Promise<CandidateMatchScore | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/org/ai/screen-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          candidateInfo,
          jobInfo,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to score candidate")
      }

      // Map the new screening result to the legacy CandidateMatchScore format
      const screeningData = data.data
      return {
        overallScore: screeningData.overallScore,
        breakdown: {
          skillsMatch: screeningData.skillAnalysis?.matched?.length > 0 ? 80 : 40,
          experienceMatch: screeningData.experienceAnalysis?.relevanceScore || 50,
          educationMatch: screeningData.educationAnalysis?.meetsRequirements ? 90 : 50,
          locationMatch: 75, // Default, not tracked in new system
        },
        matchedSkills: screeningData.skillAnalysis?.matched?.map((s: { skill: string }) => s.skill) || [],
        missingSkills: screeningData.skillAnalysis?.missing?.map((s: { skill: string }) => s.skill) || [],
        recommendation: screeningData.recommendation,
        summary: screeningData.summary,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to score candidate"
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Generate a job description using AI.
   * Uses organization-level AI configuration.
   */
  const generateJobDescription = async (input: {
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
    // Legacy fields (ignored but kept for backwards compatibility)
    industry?: string
    companyDescription?: string
  }): Promise<GeneratedJobDescription | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/org/ai/generate-job-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: input.title,
          titleAr: input.titleAr,
          department: input.department,
          location: input.location,
          employmentType: input.employmentType || "full-time",
          experienceLevel: input.experienceLevel || "mid",
          salaryMin: input.salaryMin,
          salaryMax: input.salaryMax,
          salaryCurrency: input.salaryCurrency,
          isRemote: input.isRemote,
          additionalContext: input.additionalContext,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate job description")
      }

      return data.data as GeneratedJobDescription
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate job description"
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Generate interview questions using AI.
   * Note: This feature uses legacy global AI config and will be migrated to org-level config.
   * @deprecated Will be updated to use org-level AI config
   */
  const generateInterviewQuestions = async (
    jobTitle: string,
    jobDescription: string,
    candidateSkills: string[],
    interviewType: "screening" | "technical" | "behavioral" | "final"
  ): Promise<string[] | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/generate-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-questions",
          jobTitle,
          jobDescription,
          candidateSkills,
          interviewType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate interview questions")
      }

      return data.data as string[]
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate interview questions"
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    parseResume,
    scoreCandidate,
    generateJobDescription,
    generateInterviewQuestions,
  }
}
