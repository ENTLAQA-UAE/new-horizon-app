"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Settings,
  Layers,
  Users,
  Briefcase,
  UserSearch,
  FileText,
  ChevronLeft,
  ChevronRight,
  Mail,
  History,
  Palette,
  FolderTree,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

export type UserRole = "super_admin" | "org_admin" | "hr_manager" | "recruiter" | "hiring_manager" | "interviewer"

interface SidebarProps {
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
  userRole?: UserRole
}

const superAdminLinks = [
  { href: "/", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/organizations", label: "Organizations", labelAr: "المؤسسات", icon: Building2 },
  { href: "/users", label: "Users", labelAr: "المستخدمون", icon: Users },
  { href: "/tiers", label: "Subscription Tiers", labelAr: "باقات الاشتراك", icon: Layers },
  { href: "/billing", label: "Billing & Payments", labelAr: "الفواتير والمدفوعات", icon: CreditCard },
  { href: "/email-templates", label: "Email Templates", labelAr: "قوالب البريد", icon: Mail },
  { href: "/audit-logs", label: "Audit Logs", labelAr: "سجل المراجعة", icon: History },
  { href: "/settings", label: "Platform Settings", labelAr: "إعدادات المنصة", icon: Settings },
]

const orgAdminLinks = [
  { href: "/org", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/org/jobs", label: "Jobs", labelAr: "الوظائف", icon: Briefcase },
  { href: "/org/candidates", label: "Candidates", labelAr: "المرشحين", icon: UserSearch },
  { href: "/org/applications", label: "Applications", labelAr: "الطلبات", icon: FileText },
  { href: "/org/team", label: "Team", labelAr: "الفريق", icon: Users },
  { href: "/org/departments", label: "Departments", labelAr: "الأقسام", icon: FolderTree },
  { href: "/org/branding", label: "Branding", labelAr: "الهوية", icon: Palette },
  { href: "/org/settings", label: "Settings", labelAr: "الإعدادات", icon: Settings },
]

// Links for HR Manager, Recruiter, etc. (subset of org admin)
const staffLinks = [
  { href: "/org", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/org/jobs", label: "Jobs", labelAr: "الوظائف", icon: Briefcase },
  { href: "/org/candidates", label: "Candidates", labelAr: "المرشحين", icon: UserSearch },
  { href: "/org/applications", label: "Applications", labelAr: "الطلبات", icon: FileText },
]

function getLinksForRole(role?: UserRole) {
  switch (role) {
    case "super_admin":
      return superAdminLinks
    case "org_admin":
      return orgAdminLinks
    case "hr_manager":
    case "recruiter":
    case "hiring_manager":
    case "interviewer":
      return staffLinks
    default:
      // Default to staff links for unknown roles
      return staffLinks
  }
}

export function Sidebar({ collapsed = false, onCollapse, userRole }: SidebarProps) {
  const pathname = usePathname()
  const { language, isRTL } = useI18n()

  // Get links based on actual user role
  const links = getLinksForRole(userRole)

  const CollapseIcon = isRTL ? ChevronRight : ChevronLeft
  const ExpandIcon = isRTL ? ChevronLeft : ChevronRight

  // Determine the home link based on role
  const homeHref = userRole === "super_admin" ? "/" : "/org"

  return (
    <aside
      className={cn(
        "flex flex-col border-border bg-card transition-all duration-300",
        isRTL ? "border-l" : "border-r",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <Link href={homeHref} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">{language === "ar" ? "جدارات" : "Jadarat"}</span>
          </Link>
        )}
        {collapsed && (
          <Link href={homeHref} className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </Link>
        )}
        {onCollapse && !collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onCollapse(true)}
          >
            <CollapseIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {links.map((link) => {
            const isActive = pathname === link.href ||
              (link.href !== "/" && link.href !== "/org" && pathname.startsWith(link.href))
            const label = language === "ar" ? link.labelAr : link.label
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <link.icon className={cn("h-5 w-5 shrink-0")} />
                {!collapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Collapse button (when collapsed) */}
      {collapsed && onCollapse && (
        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-8"
            onClick={() => onCollapse(false)}
          >
            <ExpandIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
    </aside>
  )
}
