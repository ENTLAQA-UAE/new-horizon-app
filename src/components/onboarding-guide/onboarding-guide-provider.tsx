"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react"
import { useAuth } from "@/lib/auth"
import {
  getOnboardingConfig,
  type OnboardingStep,
  type OnboardingRoleConfig,
} from "./onboarding-steps-config"

interface OnboardingGuideState {
  /** Whether the guide data is still loading */
  isLoading: boolean
  /** The role config with step definitions */
  config: OnboardingRoleConfig | null
  /** Map of step_key -> completed */
  stepsCompleted: Record<string, boolean>
  /** Whether the user permanently dismissed the guide */
  dismissed: boolean
  /** Whether the widget is currently expanded */
  isExpanded: boolean
  /** Number of completed steps */
  completedCount: number
  /** Total number of steps */
  totalSteps: number
  /** Whether all steps are complete */
  allComplete: boolean
  /** Mark a step as completed */
  completeStep: (stepKey: string) => Promise<void>
  /** Toggle the expanded/collapsed state */
  toggleExpanded: () => void
  /** Dismiss the guide permanently */
  dismissGuide: () => Promise<void>
}

const OnboardingGuideContext = createContext<OnboardingGuideState | null>(null)

export function useOnboardingGuide() {
  const context = useContext(OnboardingGuideContext)
  if (!context) {
    throw new Error("useOnboardingGuide must be used within OnboardingGuideProvider")
  }
  return context
}

interface OnboardingGuideProviderProps {
  children: ReactNode
}

export function OnboardingGuideProvider({ children }: OnboardingGuideProviderProps) {
  const { primaryRole, profile, isAuthenticated, isLoading: authLoading } = useAuth()

  const [isLoading, setIsLoading] = useState(true)
  const [stepsCompleted, setStepsCompleted] = useState<Record<string, boolean>>({})
  const [dismissed, setDismissed] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const config = getOnboardingConfig(primaryRole)

  // Fetch progress from API
  const fetchProgress = useCallback(async () => {
    if (!isAuthenticated || !profile?.org_id || !config) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/onboarding-guide")
      if (response.ok) {
        const data = await response.json()
        setStepsCompleted(data.stepsCompleted || {})
        setDismissed(data.dismissed || false)
      }
    } catch (err) {
      console.error("Failed to fetch onboarding guide progress:", err)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, profile?.org_id, config])

  useEffect(() => {
    if (!authLoading) {
      fetchProgress()
    }
  }, [authLoading, fetchProgress])

  // Mark a step as completed
  const completeStep = useCallback(
    async (stepKey: string) => {
      if (!config || !primaryRole) return

      // Optimistic update
      setStepsCompleted((prev) => ({ ...prev, [stepKey]: true }))

      try {
        await fetch("/api/onboarding-guide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stepKey,
            role: primaryRole,
            completed: true,
          }),
        })
      } catch (err) {
        console.error("Failed to save step completion:", err)
        // Revert optimistic update
        setStepsCompleted((prev) => ({ ...prev, [stepKey]: false }))
      }
    },
    [config, primaryRole]
  )

  // Toggle widget expanded state
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  // Dismiss the guide permanently
  const dismissGuide = useCallback(async () => {
    setDismissed(true)
    setIsExpanded(false)

    try {
      await fetch("/api/onboarding-guide/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    } catch (err) {
      console.error("Failed to dismiss onboarding guide:", err)
      setDismissed(false)
    }
  }, [])

  const completedCount = config
    ? config.steps.filter((s) => stepsCompleted[s.key]).length
    : 0
  const totalSteps = config ? config.steps.length : 0
  const allComplete = totalSteps > 0 && completedCount === totalSteps

  const value: OnboardingGuideState = {
    isLoading,
    config,
    stepsCompleted,
    dismissed,
    isExpanded,
    completedCount,
    totalSteps,
    allComplete,
    completeStep,
    toggleExpanded,
    dismissGuide,
  }

  return (
    <OnboardingGuideContext.Provider value={value}>
      {children}
    </OnboardingGuideContext.Provider>
  )
}
