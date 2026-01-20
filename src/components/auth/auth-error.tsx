"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, LogIn, Home } from "lucide-react"
import { AuthError } from "@/lib/auth"

interface AuthErrorDisplayProps {
  error: AuthError
  onRetry?: () => void
}

export function AuthErrorDisplay({ error, onRetry }: AuthErrorDisplayProps) {
  const router = useRouter()

  const handleLogin = () => {
    window.location.href = "/login"
  }

  const handleHome = () => {
    router.push("/")
  }

  // Determine what actions to show based on error type
  const showLoginButton = [
    "NO_SESSION",
    "SESSION_EXPIRED",
  ].includes(error.code)

  const showRetryButton = [
    "PROFILE_FETCH_ERROR",
    "ROLES_FETCH_ERROR",
    "ORG_FETCH_ERROR",
    "NETWORK_ERROR",
    "UNKNOWN_ERROR",
  ].includes(error.code)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        {/* Error Icon */}
        <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {getErrorTitle(error.code)}
        </h1>
        <p className="text-muted-foreground mb-6">
          {error.message}
        </p>

        {/* Error Details (collapsible for debugging) */}
        {error.details && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Technical details
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-32">
              {error.details}
            </pre>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {showRetryButton && onRetry && (
            <Button onClick={onRetry} variant="default" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}

          {showLoginButton && (
            <Button onClick={handleLogin} variant="default" className="gap-2">
              <LogIn className="w-4 h-4" />
              Go to Login
            </Button>
          )}

          <Button onClick={handleHome} variant="outline" className="gap-2">
            <Home className="w-4 h-4" />
            Home
          </Button>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-sm text-muted-foreground">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  )
}

function getErrorTitle(code: string): string {
  switch (code) {
    case "NO_SESSION":
      return "Not Logged In"
    case "SESSION_EXPIRED":
      return "Session Expired"
    case "PROFILE_NOT_FOUND":
      return "Profile Not Found"
    case "PROFILE_FETCH_ERROR":
      return "Unable to Load Profile"
    case "ROLES_FETCH_ERROR":
      return "Unable to Load Permissions"
    case "ORG_FETCH_ERROR":
      return "Unable to Load Organization"
    case "NETWORK_ERROR":
      return "Connection Error"
    default:
      return "Something Went Wrong"
  }
}
