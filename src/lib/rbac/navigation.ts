import type { PermissionCode, SystemRoleCode, NavItem } from "./types"
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  Briefcase,
  UserSearch,
  FileText,
  Calendar,
  Gift,
  BarChart3,
  Mail,
  Shield,
  FolderOpen,
  Workflow,
  Bell,
  Globe,
  ClipboardList,
  type LucideIcon,
} from "lucide-react"

// =====================================================
// ROLE-BASED NAVIGATION CONFIGURATION
// =====================================================

export interface NavigationItem {
  id: string
  title: string
  titleAr: string
  href: string
  icon: LucideIcon
  permissions?: PermissionCode[]
  roles?: SystemRoleCode[]
  badge?: string
  children?: NavigationItem[]
}

export interface NavigationSection {
  id: string
  title: string
  titleAr: string
  items: NavigationItem[]
  roles?: SystemRoleCode[]
}

// Super Admin Navigation
export const superAdminNavigation: NavigationSection[] = [
  {
    id: "platform",
    title: "Platform",
    titleAr: "المنصة",
    roles: ["super_admin"],
    items: [
      {
        id: "dashboard",
        title: "Dashboard",
        titleAr: "لوحة التحكم",
        href: "/",
        icon: LayoutDashboard,
        permissions: ["platform.manage"],
      },
      {
        id: "organizations",
        title: "Organizations",
        titleAr: "المؤسسات",
        href: "/organizations",
        icon: Building2,
        permissions: ["platform.organizations.read"],
      },
      {
        id: "users",
        title: "All Users",
        titleAr: "جميع المستخدمين",
        href: "/users",
        icon: Users,
        permissions: ["platform.users.manage"],
      },
      {
        id: "tiers",
        title: "Subscription Tiers",
        titleAr: "باقات الاشتراك",
        href: "/tiers",
        icon: CreditCard,
        permissions: ["platform.tiers.manage"],
      },
      {
        id: "billing",
        title: "Billing",
        titleAr: "الفواتير",
        href: "/billing",
        icon: CreditCard,
        permissions: ["platform.billing.manage"],
      },
      {
        id: "email-templates",
        title: "Email Templates",
        titleAr: "قوالب البريد",
        href: "/email-templates",
        icon: Mail,
        permissions: ["emails.templates.read"],
      },
      {
        id: "audit-logs",
        title: "Audit Logs",
        titleAr: "سجلات التدقيق",
        href: "/audit-logs",
        icon: Shield,
        permissions: ["audit.logs.view"],
      },
      {
        id: "settings",
        title: "Platform Settings",
        titleAr: "إعدادات المنصة",
        href: "/settings",
        icon: Settings,
        permissions: ["platform.settings.manage"],
      },
    ],
  },
]

// Organization Admin Navigation
export const orgAdminNavigation: NavigationSection[] = [
  {
    id: "overview",
    title: "Overview",
    titleAr: "نظرة عامة",
    items: [
      {
        id: "dashboard",
        title: "Dashboard",
        titleAr: "لوحة التحكم",
        href: "/org",
        icon: LayoutDashboard,
      },
      {
        id: "analytics",
        title: "Analytics",
        titleAr: "التحليلات",
        href: "/org/analytics",
        icon: BarChart3,
        permissions: ["analytics.dashboard.view"],
      },
    ],
  },
  {
    id: "recruitment",
    title: "Recruitment",
    titleAr: "التوظيف",
    items: [
      {
        id: "jobs",
        title: "Jobs",
        titleAr: "الوظائف",
        href: "/org/jobs",
        icon: Briefcase,
        permissions: ["jobs.read"],
      },
      {
        id: "candidates",
        title: "Candidates",
        titleAr: "المرشحين",
        href: "/org/candidates",
        icon: UserSearch,
        permissions: ["candidates.read"],
      },
      {
        id: "applications",
        title: "Applications",
        titleAr: "الطلبات",
        href: "/org/applications",
        icon: FileText,
        permissions: ["applications.read"],
      },
      {
        id: "interviews",
        title: "Interviews",
        titleAr: "المقابلات",
        href: "/org/interviews",
        icon: Calendar,
        permissions: ["interviews.read"],
      },
    ],
  },
  {
    id: "management",
    title: "Management",
    titleAr: "الإدارة",
    items: [
      {
        id: "team",
        title: "Team",
        titleAr: "الفريق",
        href: "/org/team",
        icon: Users,
        permissions: ["users.read"],
      },
      {
        id: "workflows",
        title: "Workflows",
        titleAr: "الإجراءات",
        href: "/org/workflows",
        icon: Workflow,
        permissions: ["workflows.read"],
      },
      {
        id: "documents",
        title: "Documents",
        titleAr: "المستندات",
        href: "/org/documents",
        icon: FolderOpen,
        permissions: ["documents.read"],
      },
    ],
  },
  {
    id: "compliance",
    title: "Compliance",
    titleAr: "الامتثال",
    roles: ["super_admin", "org_admin", "hr_manager"],
    items: [
      {
        id: "compliance-dashboard",
        title: "Compliance",
        titleAr: "الامتثال",
        href: "/org/compliance",
        icon: Shield,
        permissions: ["compliance.view"],
      },
    ],
  },
  {
    id: "billing",
    title: "Billing",
    titleAr: "الفوترة",
    roles: ["super_admin", "org_admin"],
    items: [
      {
        id: "subscription",
        title: "Subscription",
        titleAr: "الاشتراك",
        href: "/org/billing",
        icon: CreditCard,
        roles: ["org_admin"],
      },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    titleAr: "الإعدادات",
    items: [
      {
        id: "org-settings",
        title: "Settings",
        titleAr: "الإعدادات",
        href: "/org/settings",
        icon: Settings,
        permissions: ["organization.settings.read"],
      },
      {
        id: "branding",
        title: "Branding",
        titleAr: "الهوية",
        href: "/org/branding",
        icon: Globe,
        permissions: ["organization.branding.manage"],
      },
      {
        id: "vacancy-settings",
        title: "Vacancy Settings",
        titleAr: "إعدادات الشواغر",
        href: "/org/vacancy-settings",
        icon: ClipboardList,
        permissions: ["organization.settings.read"],
      },
    ],
  },
]

// Recruiter Navigation (subset of org admin)
export const recruiterNavigation: NavigationSection[] = [
  {
    id: "overview",
    title: "Overview",
    titleAr: "نظرة عامة",
    items: [
      {
        id: "dashboard",
        title: "My Dashboard",
        titleAr: "لوحة التحكم",
        href: "/org",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: "recruitment",
    title: "Recruitment",
    titleAr: "التوظيف",
    items: [
      {
        id: "jobs",
        title: "Jobs",
        titleAr: "الوظائف",
        href: "/org/jobs",
        icon: Briefcase,
      },
      {
        id: "candidates",
        title: "Candidates",
        titleAr: "المرشحين",
        href: "/org/candidates",
        icon: UserSearch,
      },
      {
        id: "applications",
        title: "Applications",
        titleAr: "الطلبات",
        href: "/org/applications",
        icon: FileText,
      },
      {
        id: "interviews",
        title: "My Interviews",
        titleAr: "مقابلاتي",
        href: "/org/interviews",
        icon: Calendar,
      },
    ],
  },
  {
    id: "tools",
    title: "Tools",
    titleAr: "الأدوات",
    items: [
      {
        id: "documents",
        title: "Documents",
        titleAr: "المستندات",
        href: "/org/documents",
        icon: FolderOpen,
      },
    ],
  },
]

// Department Manager Navigation
export const hiringManagerNavigation: NavigationSection[] = [
  {
    id: "overview",
    title: "Overview",
    titleAr: "نظرة عامة",
    items: [
      {
        id: "dashboard",
        title: "My Dashboard",
        titleAr: "لوحة التحكم",
        href: "/org",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: "hiring",
    title: "Hiring",
    titleAr: "التوظيف",
    items: [
      {
        id: "my-jobs",
        title: "My Jobs",
        titleAr: "وظائفي",
        href: "/org/jobs?filter=mine",
        icon: Briefcase,
      },
      {
        id: "interviews",
        title: "My Interviews",
        titleAr: "مقابلاتي",
        href: "/org/interviews?filter=mine",
        icon: Calendar,
      },
    ],
  },
  {
    id: "approvals",
    title: "Approvals",
    titleAr: "الموافقات",
    items: [
      {
        id: "pending-offers",
        title: "Pending Offers",
        titleAr: "العروض المعلقة",
        href: "/org/offers?filter=pending",
        icon: Gift,
      },
    ],
  },
]

// Candidate Portal Navigation
export const candidateNavigation: NavigationSection[] = [
  {
    id: "portal",
    title: "Portal",
    titleAr: "البوابة",
    items: [
      {
        id: "dashboard",
        title: "Dashboard",
        titleAr: "لوحة التحكم",
        href: "/portal",
        icon: LayoutDashboard,
      },
      {
        id: "applications",
        title: "My Applications",
        titleAr: "طلباتي",
        href: "/portal/applications",
        icon: FileText,
      },
      {
        id: "interviews",
        title: "My Interviews",
        titleAr: "مقابلاتي",
        href: "/portal/interviews",
        icon: Calendar,
      },
      {
        id: "offers",
        title: "My Offers",
        titleAr: "عروضي",
        href: "/portal/offers",
        icon: Gift,
      },
      {
        id: "documents",
        title: "My Documents",
        titleAr: "مستنداتي",
        href: "/portal/documents",
        icon: FolderOpen,
      },
      {
        id: "profile",
        title: "My Profile",
        titleAr: "ملفي الشخصي",
        href: "/portal/profile",
        icon: Users,
      },
    ],
  },
]

/**
 * Get navigation based on user's primary role
 */
export function getNavigationForRole(role: SystemRoleCode): NavigationSection[] {
  switch (role) {
    case "super_admin":
      return superAdminNavigation
    case "org_admin":
      return orgAdminNavigation
    case "hr_manager":
      return orgAdminNavigation // Same as org admin but with fewer permissions
    case "recruiter":
      return recruiterNavigation
    case "hiring_manager":
      return hiringManagerNavigation
    case "candidate":
      return candidateNavigation
    default:
      return []
  }
}

/**
 * Filter navigation items based on user permissions
 */
export function filterNavigationByPermissions(
  sections: NavigationSection[],
  userPermissions: PermissionCode[],
  userRoles: string[]
): NavigationSection[] {
  return sections
    .filter((section) => {
      // Check section role requirement
      if (section.roles && section.roles.length > 0) {
        return section.roles.some((r) => userRoles.includes(r))
      }
      return true
    })
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        // Check item role requirement
        if (item.roles && item.roles.length > 0) {
          if (!item.roles.some((r) => userRoles.includes(r))) {
            return false
          }
        }
        // Check item permission requirement
        if (item.permissions && item.permissions.length > 0) {
          return item.permissions.some((p) => userPermissions.includes(p))
        }
        return true
      }),
    }))
    .filter((section) => section.items.length > 0)
}
