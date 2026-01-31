"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Check, ChevronRight } from "lucide-react"
import type { OnboardingStep } from "./onboarding-steps-config"

interface OnboardingStepItemProps {
  step: OnboardingStep
  completed: boolean
  stepNumber: number
  onComplete: (stepKey: string) => void
}

export function OnboardingStepItem({
  step,
  completed,
  stepNumber,
  onComplete,
}: OnboardingStepItemProps) {
  const router = useRouter()
  const Icon = step.icon

  const handleAction = () => {
    // Mark as complete when user clicks to navigate
    if (!completed) {
      onComplete(step.key)
    }
    router.push(step.actionPath)
  }

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border p-3 transition-all",
        completed
          ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
          : "border-border bg-card hover:border-primary/30 hover:bg-accent/50"
      )}
    >
      {/* Step indicator */}
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
          completed
            ? "bg-emerald-500 text-white"
            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        )}
      >
        {completed ? <Check className="h-3.5 w-3.5" /> : stepNumber}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              completed ? "text-emerald-500" : "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "text-sm font-medium leading-tight",
              completed && "text-muted-foreground line-through"
            )}
          >
            {step.title}
          </span>
        </div>
        {!completed && (
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {step.description}
          </p>
        )}
      </div>

      {/* Action button */}
      {!completed && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-0.5 h-7 shrink-0 px-2 text-xs"
          onClick={handleAction}
        >
          Go
          <ChevronRight className="ml-0.5 h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
