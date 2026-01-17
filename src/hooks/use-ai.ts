"use client"

import { useState } from "react"
import type { ParsedResume, CandidateMatchScore, GeneratedJobDescription } from "@/lib/ai/client"

export function useAI() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const scoreCandidate = async (
    candidateId: string,
    jobId: string,
    updateApplication = false
  ): Promise<CandidateMatchScore | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/score-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, jobId, updateApplication }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to score candidate")
      }

      return data.data as CandidateMatchScore
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to score candidate"
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const generateJobDescription = async (input: {
    title: string
    department?: string
    location?: string
    employmentType: string
    experienceLevel: string
    industry?: string
    companyDescription?: string
    additionalContext?: string
  }): Promise<GeneratedJobDescription | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/generate-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-description", ...input }),
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
