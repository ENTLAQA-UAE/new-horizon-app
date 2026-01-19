"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useBranding } from "@/lib/branding/branding-context"
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
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
      { href: "/org/settings/integrations", label: "Video Integration", labelAr: "تكامل الفيديو", icon: Plug },
      { href: "/org/settings/email", label: "Email Integration", labelAr: "تكامل البريد", icon: Mail },
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
  const branding = useBranding()

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
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col bg-card transition-all duration-300 relative overflow-hidden",
          isRTL ? "border-l border-border" : "border-r border-border",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Decorative gradient background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ background: `var(--brand-gradient)` }}
        />

        {/* Logo Section */}
        <div className={cn(
          "flex h-16 items-center justify-between px-4 border-b border-border relative",
          collapsed ? "justify-center" : ""
        )}>
          <Link
            href={homeHref}
            className={cn(
              "flex items-center gap-3 group",
              collapsed ? "justify-center" : ""
            )}
          >
            {branding.logoUrl ? (
              <div className="relative">
                <img
                  src={branding.logoUrl}
                  alt={branding.orgName}
                  className={cn(
                    "object-contain transition-transform group-hover:scale-105",
                    collapsed ? "h-9 w-9" : "h-9 max-w-[140px]"
                  )}
                />
              </div>
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
                style={{ background: `var(--brand-gradient)` }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            )}
            {!collapsed && !branding.logoUrl && (
              <span className="font-bold text-lg gradient-text">
                {language === "ar" ? branding.orgNameAr : branding.orgName}
              </span>
            )}
          </Link>

          {onCollapse && !collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onCollapse(true)}
            >
              <CollapseIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-6 px-3">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-1">
                {/* Section Title */}
                {section.title && !collapsed && (
                  <div className="px-3 py-2">
                    <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {language === "ar" ? section.titleAr : section.title}
                    </h3>
                  </div>
                )}
                {section.title && collapsed && (
                  <div className="h-px bg-border mx-2 my-3" />
                )}

                {/* Section Links */}
                {section.links.map((link) => {
                  const isActive = isLinkActive(link.href)
                  const label = language === "ar" ? link.labelAr : link.label

                  const linkContent = (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "text-white shadow-lg"
                          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      )}
                      style={isActive ? { background: `var(--brand-gradient)` } : undefined}
                    >
                      <link.icon className={cn(
                        "h-5 w-5 shrink-0 transition-transform",
                        isActive ? "text-white" : "",
                        !isActive && "group-hover:scale-110"
                      )} />
                      {!collapsed && <span>{label}</span>}
                    </Link>
                  )

                  if (collapsed) {
                    return (
                      <Tooltip key={link.href}>
                        <TooltipTrigger asChild>
                          {linkContent}
                        </TooltipTrigger>
                        <TooltipContent side={isRTL ? "left" : "right"} className="font-medium">
                          {label}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  return linkContent
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Collapse button (when collapsed) */}
        {collapsed && onCollapse && (
          <div className="p-3 border-t border-border">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-9 rounded-xl hover:bg-muted"
                  onClick={() => onCollapse(false)}
                >
                  <ExpandIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isRTL ? "left" : "right"}>
                {language === "ar" ? "توسيع القائمة" : "Expand sidebar"}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Branding footer */}
        {!collapsed && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: `var(--brand-primary)` }}
              />
              <span>Powered by Jadarat</span>
            </div>
          </div>
        )}
      </aside>
    </TooltipProvider>
  )
}
