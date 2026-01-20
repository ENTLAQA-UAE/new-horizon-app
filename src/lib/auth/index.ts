// Re-export everything from auth-context (the new centralized auth)
export {
  AuthProvider,
  useAuth,
  type AuthState,
  type AuthError,
  type AuthErrorCode,
  type UserProfile,
  type UserOrganization,
  type UserRole,
} from "./auth-context"

// Re-export functions from the original auth.ts for backwards compatibility
export {
  getUserAuthInfo,
  verifyOrgAdmin,
  verifyOrgMember,
  type AppRole,
} from "./auth-helpers"
