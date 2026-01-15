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
  BarChart3,
  FileText,
  ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

const superAdminLinks = [
  { href: "/", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/organizations", label: "Organizations", labelAr: "المؤسسات", icon: Building2 },
  { href: "/tiers", label: "Subscription Tiers", labelAr: "مستويات الاشتراك", icon: Layers },
  { href: "/billing", label: "Billing", labelAr: "الفواتير", icon: CreditCard },
  { href: "/settings", label: "Settings", labelAr: "الإعدادات", icon: Settings },
]

const orgAdminLinks = [
  { href: "/", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", labelAr: "الوظائف", icon: Briefcase },
  { href: "/candidates", label: "Candidates", labelAr: "المرشحين", icon: UserSearch },
  { href: "/team", label: "Team", labelAr: "الفريق", icon: Users },
  { href: "/analytics", label: "Analytics", labelAr: "التحليلات", icon: BarChart3 },
  { href: "/reports", label: "Reports", labelAr: "التقارير", icon: FileText },
  { href: "/settings", label: "Settings", labelAr: "الإعدادات", icon: Settings },
]

export function Sidebar({ collapsed = false, onCollapse }: SidebarProps) {
  const pathname = usePathname()

  // TODO: Determine links based on user role
  const links = superAdminLinks

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Jadarat</span>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
        {onCollapse && !collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onCollapse(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {links.map((link) => {
            const isActive = pathname === link.href
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
                {!collapsed && <span>{link.label}</span>}
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
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      )}
    </aside>
  )
}
