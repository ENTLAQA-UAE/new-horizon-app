"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Settings, FileText, Layers, Briefcase, Award, MapPin, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Application Form",
    href: "/org/vacancy-settings/application-form",
    icon: FileText,
  },
  {
    title: "Hiring Stage",
    href: "/org/vacancy-settings/hiring-stages",
    icon: Layers,
  },
  {
    title: "Job Type",
    href: "/org/vacancy-settings/job-types",
    icon: Briefcase,
  },
  {
    title: "Job Grade",
    href: "/org/vacancy-settings/job-grades",
    icon: Award,
  },
  {
    title: "Location",
    href: "/org/vacancy-settings/locations",
    icon: MapPin,
  },
]

export default function VacancySettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex gap-6">
      {/* Sidebar Navigation */}
      <div className="w-64 shrink-0">
        <div className="sticky top-6">
          <div className="flex items-center gap-2 mb-6 text-muted-foreground">
            <Settings className="h-5 w-5" />
            <span className="font-medium">Vacancy Settings</span>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
