"use client"

import { cn } from "@/lib/utils"
import { Rocket, ChevronUp, ChevronDown } from "lucide-react"
import { useOnboardingGuide } from "./onboarding-guide-provider"
import { OnboardingGuideContent } from "./onboarding-guide-content"

export function OnboardingGuideWidget() {
  const {
    isLoading,
    config,
    dismissed,
    isExpanded,
    completedCount,
    totalSteps,
    allComplete,
    toggleExpanded,
  } = useOnboardingGuide()

  // Don't render if: loading, no config (super_admin/no role), dismissed, or all complete and dismissed
  if (isLoading || !config || dismissed) {
    return null
  }

  // Auto-hide after all steps are complete (user can dismiss from the panel)
  // But still show the expanded panel with the completion message if it's open
  if (allComplete && !isExpanded) {
    return null
  }

  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Expanded panel */}
      <div
        className={cn(
          "mb-2 w-[380px] overflow-hidden rounded-xl border bg-background shadow-xl transition-all duration-300 ease-in-out",
          isExpanded
            ? "max-h-[480px] opacity-100 translate-y-0"
            : "max-h-0 opacity-0 translate-y-4 pointer-events-none border-0 shadow-none mb-0"
        )}
      >
        <div className="h-[480px]">
          <OnboardingGuideContent />
        </div>
      </div>

      {/* Collapsed pill / toggle button */}
      <button
        onClick={toggleExpanded}
        className={cn(
          "group flex items-center gap-2.5 rounded-full border bg-background px-4 py-2.5 shadow-lg transition-all hover:shadow-xl",
          "hover:border-primary/30",
          isExpanded && "border-primary/30"
        )}
      >
        {/* Icon with subtle pulse for new users */}
        <div className="relative">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              allComplete
                ? "bg-emerald-100 dark:bg-emerald-900/30"
                : "bg-primary/10"
            )}
          >
            <Rocket
              className={cn(
                "h-4 w-4",
                allComplete
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-primary"
              )}
            />
          </div>
          {/* Pulse indicator when not all complete and not expanded */}
          {!allComplete && completedCount === 0 && !isExpanded && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
          )}
        </div>

        {/* Label and progress */}
        <div className="flex flex-col items-start">
          <span className="text-xs font-semibold leading-tight">
            Setup Guide
          </span>
          <span className="text-[10px] text-muted-foreground leading-tight">
            {allComplete
              ? "Complete!"
              : `${completedCount} of ${totalSteps} done`}
          </span>
        </div>

        {/* Mini progress bar */}
        {!allComplete && (
          <div className="ml-1 h-1.5 w-14 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Expand/collapse chevron */}
        <div className="ml-0.5 text-muted-foreground group-hover:text-foreground transition-colors">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </div>
      </button>
    </div>
  )
}
