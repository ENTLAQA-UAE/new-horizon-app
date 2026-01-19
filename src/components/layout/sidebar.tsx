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
  SlidersHorizontal,
  Plug,
  CalendarDays,
  ClipboardList,
  Gift,
  GitBranch,
  HelpCircle,
  FileCheck,
  BarChart3,
  Files,
  FileSignature,
  PanelTop,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

export type UserRole = "super_admin" | "org_admin" | "hr_manager" | "recruiter" | "hiring_manager" | "interviewer"

interface NavLink {
  href: string
  label: string
  labelAr: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  title?: string
  titleAr?: string
  links: NavLink[]
}

interface SidebarProps {
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
  userRole?: UserRole
}

// Super Admin - Platform management only
const superAdminSections: NavSection[] = [
  {
    links: [
      { href: "/", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
      { href: "/organizations", label: "Organizations", labelAr: "المؤسسات", icon: Building2 },
      { href: "/users", label: "Users", labelAr: "المستخدمون", icon: Users },
      { href: "/tiers", label: "Subscription Tiers", labelAr: "باقات الاشتراك", icon: Layers },
      { href: "/billing", label: "Billing & Payments", labelAr: "الفواتير والمدفوعات", icon: CreditCard },
      { href: "/email-templates", label: "Email Templates", labelAr: "قوالب البريد", icon: Mail },
      { href: "/audit-logs", label: "Audit Logs", labelAr: "سجل المراجعة", icon: History },
      { href: "/settings", label: "Platform Settings", labelAr: "إعدادات المنصة", icon: Settings },
    ],
  },
]

// Org Admin - Administration only (Team, Settings, Branding, Analytics)
const orgAdminSections: NavSection[] = [
  {
    links: [
      { href: "/org", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
      { href: "/org/analytics", label: "Analytics", labelAr: "التحليلات", icon: BarChart3 },
    ],
  },
  {
    title: "Organization",
    titleAr: "المؤسسة",
    links: [
      { href: "/org/team", label: "Team Members", labelAr: "أعضاء الفريق", icon: Users },
      { href: "/org/departments", label: "Departments", labelAr: "الأقسام", icon: FolderTree },
      { href: "/org/branding", label: "Branding", labelAr: "الهوية", icon: Palette },
      { href: "/org/career-page", label: "Career Page", labelAr: "صفحة التوظيف", icon: PanelTop },
    ],
  },
  {
    title: "Settings",
    titleAr: "الإعدادات",
    links: [
      { href: "/org/settings", label: "General", labelAr: "عام", icon: Settings },
      { href: "/org/settings/integrations", label: "Integrations", labelAr: "التكاملات", icon: Plug },
      { href: "/org/settings/notifications", label: "Notifications", labelAr: "الإشعارات", icon: Bell },
    ],
  },
]

// HR Manager - Workflow configuration + hiring operations
const hrManagerSections: NavSection[] = [
  {
    links: [
      { href: "/org", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
      { href: "/org/analytics", label: "Analytics", labelAr: "التحليلات", icon: BarChart3 },
    ],
  },
  {
    title: "Hiring",
    titleAr: "التوظيف",
    links: [
      { href: "/org/jobs", label: "Jobs", labelAr: "الوظائف", icon: Briefcase },
      { href: "/org/candidates", label: "Candidates", labelAr: "المرشحين", icon: UserSearch },
      { href: "/org/applications", label: "Applications", labelAr: "الطلبات", icon: FileText },
      { href: "/org/interviews", label: "Interviews", labelAr: "المقابلات", icon: CalendarDays },
      { href: "/org/interviews/scorecards", label: "Scorecards", labelAr: "بطاقات التقييم", icon: ClipboardList },
      { href: "/org/offers", label: "Offers", labelAr: "العروض", icon: Gift },
      { href: "/org/requisitions", label: "Requisitions", labelAr: "طلبات التوظيف", icon: FileCheck },
    ],
  },
  {
    title: "Configuration",
    titleAr: "الإعدادات",
    links: [
      { href: "/org/offers/templates", label: "Offer Templates", labelAr: "قوالب العروض", icon: FileSignature },
      { href: "/org/pipelines", label: "Pipelines", labelAr: "مسارات التوظيف", icon: GitBranch },
      { href: "/org/screening-questions", label: "Screening Questions", labelAr: "أسئلة الفحص", icon: HelpCircle },
      { href: "/org/vacancy-settings", label: "Vacancy Settings", labelAr: "إعدادات الوظائف", icon: SlidersHorizontal },
      { href: "/org/documents", label: "Documents", labelAr: "المستندات", icon: Files },
    ],
  },
]

// Recruiter - Day-to-day hiring operations
const recruiterSections: NavSection[] = [
  {
    links: [
      { href: "/org", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
    ],
  },
  {
    title: "Hiring",
    titleAr: "التوظيف",
    links: [
      { href: "/org/jobs", label: "Jobs", labelAr: "الوظائف", icon: Briefcase },
      { href: "/org/candidates", label: "Candidates", labelAr: "المرشحين", icon: UserSearch },
      { href: "/org/applications", label: "Applications", labelAr: "الطلبات", icon: FileText },
      { href: "/org/interviews", label: "Interviews", labelAr: "المقابلات", icon: CalendarDays },
      { href: "/org/offers", label: "Offers", labelAr: "العروض", icon: Gift },
    ],
  },
]

// Hiring Manager - Department-level hiring (approvals, reviews)
const hiringManagerSections: NavSection[] = [
  {
    links: [
      { href: "/org", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
    ],
  },
  {
    title: "My Team Hiring",
    titleAr: "توظيف فريقي",
    links: [
      { href: "/org/requisitions", label: "Requisitions", labelAr: "طلبات التوظيف", icon: FileCheck },
      { href: "/org/candidates", label: "Candidates", labelAr: "المرشحين", icon: UserSearch },
      { href: "/org/interviews", label: "Interviews", labelAr: "المقابلات", icon: CalendarDays },
      { href: "/org/interviews/scorecards", label: "Scorecards", labelAr: "بطاقات التقييم", icon: ClipboardList },
    ],
  },
]

// Interviewer - Interviews and scorecards only
const interviewerSections: NavSection[] = [
  {
    links: [
      { href: "/org", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
    ],
  },
  {
    title: "My Interviews",
    titleAr: "مقابلاتي",
    links: [
      { href: "/org/interviews", label: "Interviews", labelAr: "المقابلات", icon: CalendarDays },
      { href: "/org/interviews/scorecards", label: "Scorecards", labelAr: "بطاقات التقييم", icon: ClipboardList },
    ],
  },
]

function getSectionsForRole(role?: UserRole): NavSection[] {
  switch (role) {
    case "super_admin":
      return superAdminSections
    case "org_admin":
      return orgAdminSections
    case "hr_manager":
      return hrManagerSections
    case "recruiter":
      return recruiterSections
    case "hiring_manager":
      return hiringManagerSections
    case "interviewer":
      return interviewerSections
    default:
      return recruiterSections
  }
}

export function Sidebar({ collapsed = false, onCollapse, userRole }: SidebarProps) {
  const pathname = usePathname()
  const { language, isRTL } = useI18n()

  const sections = getSectionsForRole(userRole)

  const CollapseIcon = isRTL ? ChevronRight : ChevronLeft
  const ExpandIcon = isRTL ? ChevronLeft : ChevronRight

  const homeHref = userRole === "super_admin" ? "/" : "/org"

  const isLinkActive = (href: string) => {
    if (pathname === href) return true
    if (href !== "/" && href !== "/org" && !href.includes("/settings")) {
      return pathname.startsWith(href + "/")
    }
    return false
  }

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
        <nav className="space-y-4 px-2">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-1">
              {/* Section Title */}
              {section.title && !collapsed && (
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {language === "ar" ? section.titleAr : section.title}
                  </h3>
                </div>
              )}
              {section.title && collapsed && (
                <div className="h-px bg-border mx-2 my-2" />
              )}

              {/* Section Links */}
              {section.links.map((link) => {
                const isActive = isLinkActive(link.href)
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
                    title={collapsed ? label : undefined}
                  >
                    <link.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{label}</span>}
                  </Link>
                )
              })}
            </div>
          ))}
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
