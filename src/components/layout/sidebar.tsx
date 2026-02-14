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
  ChevronDown,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useState } from "react"

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
  collapsible?: boolean
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
      { href: "/admin", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
      { href: "/organizations", label: "Organizations", labelAr: "المؤسسات", icon: Building2 },
      { href: "/users", label: "Users", labelAr: "المستخدمون", icon: Users },
      { href: "/tiers", label: "Subscription Tiers", labelAr: "باقات الاشتراك", icon: Layers },
      { href: "/billing", label: "Billing & Payments", labelAr: "الفواتير والمدفوعات", icon: CreditCard },
      { href: "/landing-page", label: "Landing Page", labelAr: "الصفحة الرئيسية", icon: Globe },
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
    collapsible: true,
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
    collapsible: true,
    links: [
      { href: "/org/settings", label: "General", labelAr: "عام", icon: Settings },
      { href: "/org/settings/ai", label: "AI Configuration", labelAr: "إعدادات الذكاء الاصطناعي", icon: Sparkles },
      { href: "/org/settings/integrations", label: "Video Integration", labelAr: "تكامل الفيديو", icon: Plug },
      { href: "/org/settings/email", label: "Email Integration", labelAr: "تكامل البريد", icon: Mail },
      { href: "/org/settings/domain", label: "Domain", labelAr: "النطاق", icon: Globe },
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
    collapsible: true,
    links: [
      { href: "/org/jobs", label: "Jobs", labelAr: "الوظائف", icon: Briefcase },
      { href: "/org/candidates", label: "Candidates", labelAr: "المرشحين", icon: UserSearch },
      { href: "/org/applications", label: "Applications", labelAr: "الطلبات", icon: FileText },
      { href: "/org/interviews", label: "Interviews", labelAr: "المقابلات", icon: CalendarDays },
      { href: "/org/scorecards", label: "Scorecards", labelAr: "بطاقات التقييم", icon: ClipboardList },
      { href: "/org/offers", label: "Offers", labelAr: "العروض", icon: Gift },
      { href: "/org/requisitions", label: "Requisitions", labelAr: "طلبات التوظيف", icon: FileCheck },
      { href: "/org/documents", label: "Documents", labelAr: "المستندات", icon: Files },
    ],
  },
  {
    title: "Configuration",
    titleAr: "الإعدادات",
    collapsible: true,
    links: [
      { href: "/org/offers/templates", label: "Offer Templates", labelAr: "قوالب العروض", icon: FileSignature },
      { href: "/org/scorecard-templates", label: "Scorecard Templates", labelAr: "قوالب التقييم", icon: ClipboardList },
      { href: "/org/pipelines", label: "Pipelines", labelAr: "مسارات التوظيف", icon: GitBranch },
      { href: "/org/screening-questions", label: "Screening Questions", labelAr: "أسئلة الفحص", icon: HelpCircle },
      { href: "/org/vacancy-settings", label: "Vacancy Settings", labelAr: "إعدادات الوظائف", icon: SlidersHorizontal },
      { href: "/org/settings/notifications", label: "Notification Settings", labelAr: "إعدادات الإشعارات", icon: Bell },
    ],
  },
]

// Recruiter - Day-to-day hiring operations
const recruiterSections: NavSection[] = [
  {
    links: [
      { href: "/org", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
      { href: "/org/analytics", label: "Analytics", labelAr: "التحليلات", icon: BarChart3 },
    ],
  },
  {
    title: "Hiring",
    titleAr: "التوظيف",
    collapsible: true,
    links: [
      { href: "/org/jobs", label: "Jobs", labelAr: "الوظائف", icon: Briefcase },
      { href: "/org/candidates", label: "Candidates", labelAr: "المرشحين", icon: UserSearch },
      { href: "/org/applications", label: "Applications", labelAr: "الطلبات", icon: FileText },
      { href: "/org/interviews", label: "Interviews", labelAr: "المقابلات", icon: CalendarDays },
      { href: "/org/offers", label: "Offers", labelAr: "العروض", icon: Gift },
    ],
  },
  {
    title: "Tools",
    titleAr: "الأدوات",
    collapsible: true,
    links: [
      { href: "/org/documents", label: "Documents", labelAr: "المستندات", icon: Files },
    ],
  },
]

// Department Manager - Department-level hiring (approvals, reviews)
const hiringManagerSections: NavSection[] = [
  {
    links: [
      { href: "/org", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
    ],
  },
  {
    title: "My Department Hiring",
    titleAr: "توظيف قسمي",
    collapsible: true,
    links: [
      { href: "/org/requisitions", label: "Requisitions", labelAr: "طلبات التوظيف", icon: FileCheck },
      { href: "/org/applications", label: "Applications", labelAr: "الطلبات", icon: FileText },
      { href: "/org/interviews", label: "Interviews", labelAr: "المقابلات", icon: CalendarDays },
      { href: "/org/scorecards", label: "Scorecards", labelAr: "بطاقات التقييم", icon: ClipboardList },
    ],
  },
]

// Interviewer - Interviews and scorecards only
const interviewerSections: NavSection[] = [
  {
    links: [
      { href: "/org", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
      { href: "/org/analytics", label: "Analytics", labelAr: "التحليلات", icon: BarChart3 },
    ],
  },
  {
    title: "My Interviews",
    titleAr: "مقابلاتي",
    collapsible: true,
    links: [
      { href: "/org/interviews", label: "Interviews", labelAr: "المقابلات", icon: CalendarDays },
      { href: "/org/scorecards", label: "Scorecards", labelAr: "بطاقات التقييم", icon: ClipboardList },
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
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  const sections = getSectionsForRole(userRole)

  const CollapseIcon = isRTL ? ChevronRight : ChevronLeft
  const ExpandIcon = isRTL ? ChevronLeft : ChevronRight

  const homeHref = userRole === "super_admin" ? "/" : "/org"

  // Collect all navigation hrefs to determine active state properly
  const allHrefs = sections.flatMap(section => section.links.map(link => link.href))

  const isLinkActive = (href: string) => {
    // Exact match is always active
    if (pathname === href) return true

    // For non-root paths, check if current path starts with this href
    if (href !== "/" && href !== "/org" && href !== "/admin" && !href.includes("/settings")) {
      const wouldMatchAsParent = pathname.startsWith(href + "/")

      // Only mark as active if no more specific link exists that matches the current path
      // This prevents parent links from being highlighted when a child link matches exactly
      if (wouldMatchAsParent) {
        const hasMoreSpecificMatch = allHrefs.some(
          otherHref => otherHref !== href && otherHref.startsWith(href + "/") && pathname.startsWith(otherHref)
        )
        return !hasMoreSpecificMatch
      }
    }
    return false
  }

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }))
  }

  const isSectionCollapsed = (sectionTitle: string) => {
    return collapsedSections[sectionTitle] ?? false
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col bg-card/95 backdrop-blur-xl transition-all duration-300 ease-out relative",
          isRTL ? "border-l border-border/50" : "border-r border-border/50",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        {/* Subtle gradient overlay */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{ background: `var(--brand-gradient)` }}
        />

        {/* Logo Section */}
        <div className={cn(
          "flex h-16 items-center gap-3 px-4 border-b border-border/50 relative",
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
              <div className="relative flex items-center gap-3">
                <img
                  src={branding.logoUrl}
                  alt={branding.orgName}
                  className={cn(
                    "object-contain transition-all duration-300 group-hover:scale-105",
                    collapsed ? "h-9 w-9" : "h-9 max-w-[140px]"
                  )}
                />
              </div>
            ) : (
              <>
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl"
                  style={{
                    background: `var(--brand-gradient)`,
                    boxShadow: '0 4px 14px -3px var(--brand-primary)'
                  }}
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                {!collapsed && (
                  <div className="flex flex-col">
                    <span className="font-bold text-lg tracking-tight gradient-text">
                      {language === "ar" ? branding.orgNameAr : branding.orgName}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">
                      ATS Platform
                    </span>
                  </div>
                )}
              </>
            )}
          </Link>

          {onCollapse && !collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all ml-auto",
                isRTL && "mr-auto ml-0"
              )}
              onClick={() => onCollapse(true)}
            >
              <CollapseIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-3">
            {sections.map((section, sectionIndex) => {
              const sectionTitle = section.title || `section-${sectionIndex}`
              const isCollapsible = section.collapsible && !collapsed
              const isSectionOpen = !isSectionCollapsed(sectionTitle)

              return (
                <div key={sectionIndex} className="space-y-1">
                  {/* Section Title */}
                  {section.title && !collapsed && (
                    <button
                      onClick={() => isCollapsible && toggleSection(sectionTitle)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 mt-4 first:mt-0",
                        isCollapsible && "cursor-pointer hover:bg-muted/50 rounded-lg transition-colors"
                      )}
                    >
                      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {language === "ar" ? section.titleAr : section.title}
                      </h3>
                      {isCollapsible && (
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                            !isSectionOpen && "-rotate-90"
                          )}
                        />
                      )}
                    </button>
                  )}
                  {section.title && collapsed && (
                    <div className="h-px bg-border/50 mx-2 my-3" />
                  )}

                  {/* Section Links */}
                  <div className={cn(
                    "space-y-0.5 overflow-hidden transition-all duration-200",
                    isCollapsible && !isSectionOpen && "h-0 opacity-0"
                  )}>
                    {section.links.map((link) => {
                      const isActive = isLinkActive(link.href)
                      const label = language === "ar" ? link.labelAr : link.label

                      const linkContent = (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={cn(
                            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                            isActive
                              ? "text-white"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                          )}
                          style={isActive ? {
                            background: `var(--brand-gradient)`,
                            boxShadow: '0 4px 12px -2px var(--brand-primary)'
                          } : undefined}
                        >
                          {/* Hover indicator */}
                          {!isActive && (
                            <span
                              className={cn(
                                "absolute inset-y-0 w-0.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100",
                                isRTL ? "right-0" : "left-0"
                              )}
                              style={{ background: `var(--brand-primary)` }}
                            />
                          )}

                          <span className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
                            isActive
                              ? "bg-white/20"
                              : "bg-muted/50 group-hover:bg-muted"
                          )}>
                            <link.icon className={cn(
                              "h-[18px] w-[18px] transition-transform duration-200",
                              isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground",
                              !isActive && "group-hover:scale-110"
                            )} />
                          </span>

                          {!collapsed && (
                            <span className="truncate">{label}</span>
                          )}

                          {/* Active indicator dot */}
                          {isActive && !collapsed && (
                            <span
                              className={cn(
                                "absolute w-1.5 h-1.5 rounded-full bg-white/80 top-1/2 -translate-y-1/2",
                                isRTL ? "left-2" : "right-2"
                              )}
                            />
                          )}
                        </Link>
                      )

                      if (collapsed) {
                        return (
                          <Tooltip key={link.href}>
                            <TooltipTrigger asChild>
                              {linkContent}
                            </TooltipTrigger>
                            <TooltipContent
                              side={isRTL ? "left" : "right"}
                              className="font-medium bg-foreground text-background px-3 py-1.5 rounded-lg"
                            >
                              {label}
                            </TooltipContent>
                          </Tooltip>
                        )
                      }

                      return linkContent
                    })}
                  </div>
                </div>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Collapse button (when collapsed) */}
        {collapsed && onCollapse && (
          <div className="p-3 border-t border-border/50">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-10 rounded-xl hover:bg-muted/80 transition-all"
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
          <div className="p-4 border-t border-border/50">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-muted/30">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: `var(--brand-gradient)` }}
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-foreground">Powered by Kawadir</span>
                <span className="text-[9px] text-muted-foreground">AI-Powered Recruitment</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </TooltipProvider>
  )
}
