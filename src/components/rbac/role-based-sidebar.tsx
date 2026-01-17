"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useRBAC } from "@/hooks/use-rbac"
import {
  getNavigationForRole,
  filterNavigationByPermissions,
  type NavigationSection,
} from "@/lib/rbac/navigation"
import type { SystemRoleCode, PermissionCode } from "@/lib/rbac/types"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"

interface RoleBasedSidebarProps {
  className?: string
}

export function RoleBasedSidebar({ className }: RoleBasedSidebarProps) {
  const pathname = usePathname()
  const { context, isLoading } = useRBAC()
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  if (isLoading) {
    return <SidebarSkeleton />
  }

  if (!context || context.roles.length === 0) {
    return (
      <div className={cn("flex flex-col", className)}>
        <div className="p-4 text-sm text-muted-foreground">
          No role assigned. Please contact your administrator.
        </div>
      </div>
    )
  }

  // Get navigation for primary role
  const primaryRole = context.primaryRole as SystemRoleCode
  const baseNavigation = getNavigationForRole(primaryRole)

  // Filter by permissions
  const roleCodes = context.roles.map((r) => r.code)
  const navigation = filterNavigationByPermissions(
    baseNavigation,
    context.permissions,
    roleCodes
  )

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  return (
    <ScrollArea className={cn("flex flex-col h-full", className)}>
      <div className="space-y-4 py-4">
        {navigation.map((section) => (
          <div key={section.id} className="px-3">
            <div
              className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
              onClick={() => toggleSection(section.id)}
            >
              <span>{section.title}</span>
              {expandedSections.includes(section.id) ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </div>
            <div
              className={cn(
                "mt-1 space-y-1 overflow-hidden transition-all",
                expandedSections.includes(section.id) ? "max-h-0" : "max-h-screen"
              )}
            >
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                const Icon = item.icon

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Role indicator at bottom */}
      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">
            {getRoleDisplayName(context.primaryRole)}
          </span>
        </div>
      </div>
    </ScrollArea>
  )
}

function getRoleDisplayName(roleCode: string | null): string {
  switch (roleCode) {
    case "super_admin":
      return "Super Admin"
    case "org_admin":
      return "Organization Admin"
    case "hr_manager":
      return "HR Manager"
    case "recruiter":
      return "Recruiter"
    case "hiring_manager":
      return "Hiring Manager"
    case "candidate":
      return "Candidate"
    default:
      return "Unknown Role"
  }
}

function SidebarSkeleton() {
  return (
    <div className="space-y-4 py-4">
      {[1, 2, 3].map((section) => (
        <div key={section} className="px-3">
          <Skeleton className="h-4 w-20 mb-2" />
          <div className="space-y-1">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-9 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
