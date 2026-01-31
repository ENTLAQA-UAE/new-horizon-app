"use client"

import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, PartyPopper } from "lucide-react"
import { useOnboardingGuide } from "./onboarding-guide-provider"
import { OnboardingStepItem } from "./onboarding-step-item"

export function OnboardingGuideContent() {
  const {
    config,
    stepsCompleted,
    completedCount,
    totalSteps,
    allComplete,
    completeStep,
    toggleExpanded,
    dismissGuide,
  } = useOnboardingGuide()

  if (!config) return null

  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold truncate">{config.title}</h3>
          <p className="text-xs text-muted-foreground truncate">
            {config.description}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={toggleExpanded}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Progress
          </span>
          <span className="text-xs font-semibold">
            {completedCount}/{totalSteps}
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Steps list or completion state */}
      {allComplete ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <PartyPopper className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">All done!</p>
            <p className="mt-1 text-xs text-muted-foreground">
              You've completed the setup guide. You're ready to go.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 text-xs"
            onClick={dismissGuide}
          >
            Dismiss guide
          </Button>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-2 p-3">
            {config.steps.map((step, index) => (
              <OnboardingStepItem
                key={step.key}
                step={step}
                completed={!!stepsCompleted[step.key]}
                stepNumber={index + 1}
                onComplete={completeStep}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Footer with dismiss */}
      {!allComplete && (
        <div className="border-t px-4 py-2">
          <button
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={dismissGuide}
          >
            Skip setup guide
          </button>
        </div>
      )}
    </div>
  )
}
