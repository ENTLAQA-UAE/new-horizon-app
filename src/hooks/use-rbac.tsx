"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// Note: This file uses tables that don't match the database schema (role_permissions, etc.)

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { PermissionCode, RoleContext, SystemRoleCode } from "@/lib/rbac/types"

// =====================================================
// RBAC CONTEXT & HOOKS
// =====================================================

interface RBACContextValue {
  context: RoleContext | null
  isLoading: boolean
  error: string | null
  hasPermission: (permission: PermissionCode) => boolean
  hasAnyPermission: (permissions: PermissionCode[]) => boolean
  hasAllPermissions: (permissions: PermissionCode[]) => boolean
  hasRole: (role: SystemRoleCode) => boolean
  hasAnyRole: (roles: SystemRoleCode[]) => boolean
  refresh: () => Promise<void>
}

const RBACContext = createContext<RBACContextValue | undefined>(undefined)

interface RBACProviderProps {
  children: ReactNode
  userId: string
  orgId?: string | null
  initialContext?: RoleContext | null
}

/**
 * RBAC Provider Component
 */
export function RBACProvider({
  children,
  userId,
  orgId,
  initialContext,
}: RBACProviderProps) {
  const [context, setContext] = useState<RoleContext | null>(initialContext || null)
  const [isLoading, setIsLoading] = useState(!initialContext)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchContext = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch user roles
      // Note: This query uses a schema that doesn't match current database - casting to any
      const { data: userRoles, error: rolesError } = await (supabase as any)
        .from("user_roles")
        .select(`
          id,
          org_id,
          is_primary,
          role:roles (
            id,
            code,
            name
          )
        `)
        .eq("user_id", userId) as { data: any[] | null; error: any }

      if (rolesError) {
        throw new Error(rolesError.message)
      }

      if (!userRoles || userRoles.length === 0) {
        setContext({
          userId,
          orgId: orgId || null,
          roles: [],
          permissions: [],
          primaryRole: null,
          isSuperAdmin: false,
          isOrgAdmin: false,
          isHRManager: false,
          isRecruiter: false,
          isHiringManager: false,
          isCandidate: false,
        })
        return
      }

      // Get permissions
      // Note: This query uses a schema that doesn't match current database
      const roleIds = userRoles.map((ur: any) => ur.role?.id || ur.role)
      const { data: rolePermissions, error: permError } = await (supabase as any)
        .from("role_permissions")
        .select(`
          permission:permissions (
            code
          )
        `)
        .in("role_id", roleIds) as { data: any[] | null; error: any }

      if (permError) {
        console.error("Error fetching permissions:", permError)
      }

      const permissions: PermissionCode[] = rolePermissions
        ? [...new Set(rolePermissions.map((rp) => (rp.permission as any).code as PermissionCode))]
        : []

      const roles = userRoles.map((ur) => ({
        id: (ur.role as any).id,
        code: (ur.role as any).code,
        name: (ur.role as any).name,
        orgId: ur.org_id,
        isPrimary: ur.is_primary,
      }))

      const roleCodes = roles.map((r) => r.code)
      const primaryRole = roles.find((r) => r.isPrimary)?.code || roles[0]?.code || null

      setContext({
        userId,
        orgId: orgId || null,
        roles,
        permissions,
        primaryRole,
        isSuperAdmin: roleCodes.includes("super_admin"),
        isOrgAdmin: roleCodes.includes("org_admin"),
        isHRManager: roleCodes.includes("hr_manager"),
        isRecruiter: roleCodes.includes("recruiter"),
        isHiringManager: roleCodes.includes("hiring_manager"),
        isCandidate: roleCodes.includes("candidate"),
      })
    } catch (err) {
      console.error("Error fetching RBAC context:", err)
      setError(err instanceof Error ? err.message : "Failed to load permissions")
    } finally {
      setIsLoading(false)
    }
  }, [userId, orgId, supabase])

  useEffect(() => {
    if (!initialContext) {
      fetchContext()
    }
  }, [fetchContext, initialContext])

  const hasPermission = useCallback(
    (permission: PermissionCode): boolean => {
      if (!context) return false
      return context.permissions.includes(permission)
    },
    [context]
  )

  const hasAnyPermission = useCallback(
    (permissions: PermissionCode[]): boolean => {
      if (!context) return false
      return permissions.some((p) => context.permissions.includes(p))
    },
    [context]
  )

  const hasAllPermissions = useCallback(
    (permissions: PermissionCode[]): boolean => {
      if (!context) return false
      return permissions.every((p) => context.permissions.includes(p))
    },
    [context]
  )

  const hasRole = useCallback(
    (role: SystemRoleCode): boolean => {
      if (!context) return false
      return context.roles.some((r) => r.code === role)
    },
    [context]
  )

  const hasAnyRole = useCallback(
    (roles: SystemRoleCode[]): boolean => {
      if (!context) return false
      return roles.some((role) => context.roles.some((r) => r.code === role))
    },
    [context]
  )

  const value: RBACContextValue = {
    context,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    refresh: fetchContext,
  }

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>
}

/**
 * Hook to use RBAC context
 */
export function useRBAC(): RBACContextValue {
  const context = useContext(RBACContext)
  if (context === undefined) {
    throw new Error("useRBAC must be used within an RBACProvider")
  }
  return context
}

/**
 * Hook to check a specific permission
 */
export function usePermission(permission: PermissionCode): {
  allowed: boolean
  isLoading: boolean
} {
  const { hasPermission, isLoading } = useRBAC()
  return {
    allowed: hasPermission(permission),
    isLoading,
  }
}

/**
 * Hook to check multiple permissions (any)
 */
export function useAnyPermission(permissions: PermissionCode[]): {
  allowed: boolean
  isLoading: boolean
} {
  const { hasAnyPermission, isLoading } = useRBAC()
  return {
    allowed: hasAnyPermission(permissions),
    isLoading,
  }
}

/**
 * Hook to check multiple permissions (all)
 */
export function useAllPermissions(permissions: PermissionCode[]): {
  allowed: boolean
  isLoading: boolean
} {
  const { hasAllPermissions, isLoading } = useRBAC()
  return {
    allowed: hasAllPermissions(permissions),
    isLoading,
  }
}

/**
 * Hook to check a specific role
 */
export function useRole(role: SystemRoleCode): {
  hasRole: boolean
  isLoading: boolean
} {
  const { hasRole: checkRole, isLoading } = useRBAC()
  return {
    hasRole: checkRole(role),
    isLoading,
  }
}

/**
 * Hook to get current user's primary role
 */
export function usePrimaryRole(): {
  role: string | null
  isLoading: boolean
} {
  const { context, isLoading } = useRBAC()
  return {
    role: context?.primaryRole || null,
    isLoading,
  }
}

/**
 * Hook to check if user is super admin
 */
export function useIsSuperAdmin(): boolean {
  const { context } = useRBAC()
  return context?.isSuperAdmin || false
}

/**
 * Hook to check if user is org admin
 */
export function useIsOrgAdmin(): boolean {
  const { context } = useRBAC()
  return context?.isOrgAdmin || false
}

/**
 * Hook to check if user has any admin role
 */
export function useIsAdmin(): boolean {
  const { context } = useRBAC()
  return context?.isSuperAdmin || context?.isOrgAdmin || false
}
