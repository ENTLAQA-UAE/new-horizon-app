"use client"

import { ReactNode } from "react"
import { useRBAC } from "@/hooks/use-rbac"
import type { PermissionCode, SystemRoleCode } from "@/lib/rbac/types"
import { Loader2, ShieldX } from "lucide-react"

// =====================================================
// PERMISSION GATE COMPONENTS
// =====================================================

interface PermissionGateProps {
  children: ReactNode
  /**
   * Permission(s) required to render children
   * If array, behavior depends on `requireAll` prop
   */
  permission?: PermissionCode | PermissionCode[]
  /**
   * Role(s) that can access the content
   * If array, user needs at least one of the roles
   */
  role?: SystemRoleCode | SystemRoleCode[]
  /**
   * If true, user must have ALL permissions (default: false, any permission works)
   */
  requireAll?: boolean
  /**
   * What to render while loading
   */
  loadingFallback?: ReactNode
  /**
   * What to render when access is denied
   * Set to null to render nothing
   */
  fallback?: ReactNode
  /**
   * If true, shows loading state
   */
  showLoading?: boolean
}

/**
 * Component that conditionally renders children based on permissions/roles
 */
export function PermissionGate({
  children,
  permission,
  role,
  requireAll = false,
  loadingFallback,
  fallback = null,
  showLoading = true,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole, isLoading } = useRBAC()

  if (isLoading && showLoading) {
    return loadingFallback ?? (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Check permissions
  let hasRequiredPermission = true
  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission]
    hasRequiredPermission = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  }

  // Check roles
  let hasRequiredRole = true
  if (role) {
    const roles = Array.isArray(role) ? role : [role]
    hasRequiredRole = hasAnyRole(roles)
  }

  // Must have both permission AND role if both are specified
  const hasAccess = hasRequiredPermission && hasRequiredRole

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Component that shows access denied message
 */
interface AccessDeniedProps {
  title?: string
  message?: string
  showIcon?: boolean
}

export function AccessDenied({
  title = "Access Denied",
  message = "You don't have permission to view this content.",
  showIcon = true,
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {showIcon && (
        <div className="rounded-full bg-red-100 p-4 mb-4">
          <ShieldX className="h-8 w-8 text-red-600" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">{message}</p>
    </div>
  )
}

/**
 * Higher-order component for permission checking
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: PermissionCode | PermissionCode[],
  options?: {
    requireAll?: boolean
    fallback?: ReactNode
  }
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGate
        permission={permission}
        requireAll={options?.requireAll}
        fallback={options?.fallback ?? <AccessDenied />}
      >
        <WrappedComponent {...props} />
      </PermissionGate>
    )
  }
}

/**
 * Higher-order component for role checking
 */
export function withRole<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  role: SystemRoleCode | SystemRoleCode[],
  options?: {
    fallback?: ReactNode
  }
) {
  return function RoleWrappedComponent(props: P) {
    return (
      <PermissionGate
        role={role}
        fallback={options?.fallback ?? <AccessDenied />}
      >
        <WrappedComponent {...props} />
      </PermissionGate>
    )
  }
}

/**
 * Component for super admin only content
 */
export function SuperAdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate role="super_admin" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

/**
 * Component for org admin only content
 */
export function OrgAdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate role={["super_admin", "org_admin"]} fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

/**
 * Component for any admin content
 */
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate role={["super_admin", "org_admin", "hr_manager"]} fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

/**
 * Component for staff only content (excludes candidates)
 */
export function StaffOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate
      role={["super_admin", "org_admin", "hr_manager", "recruiter", "hiring_manager"]}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  )
}
