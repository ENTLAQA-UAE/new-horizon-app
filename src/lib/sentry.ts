import * as Sentry from "@sentry/nextjs"

interface SentryUser {
  id: string
  email?: string
  username?: string
  orgId?: string
  orgName?: string
  role?: string
}

/**
 * Set user context for Sentry error reports
 * Call this when user logs in or user data changes
 */
export function setSentryUser(user: SentryUser | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    })

    // Set organization context
    if (user.orgId) {
      Sentry.setTag("org_id", user.orgId)
      Sentry.setTag("org_name", user.orgName || "Unknown")
    }

    // Set role context
    if (user.role) {
      Sentry.setTag("user_role", user.role)
    }
  } else {
    // Clear user on logout
    Sentry.setUser(null)
    Sentry.setTag("org_id", undefined)
    Sentry.setTag("org_name", undefined)
    Sentry.setTag("user_role", undefined)
  }
}

/**
 * Capture a custom error with additional context
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context)
    }
    Sentry.captureException(error)
  })
}

/**
 * Log a custom message to Sentry
 */
export function logMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: Record<string, unknown>
) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context)
    }
    Sentry.captureMessage(message, level)
  })
}

/**
 * Add breadcrumb for better error context
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
  level: "info" | "warning" | "error" = "info"
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level,
    timestamp: Date.now() / 1000,
  })
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startInactiveSpan({
    name,
    op,
  })
}
