"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Search,
  Building2,
  Globe,
  Filter,
  ChevronRight,
  Mail,
  Phone,
  MapPinned,
  Heart,
  Star,
  Users,
  Rocket,
  Award,
  GraduationCap,
  Shield,
  Zap,
  Target,
  TrendingUp,
  Lightbulb,
  Coffee,
  Gift,
  Smile,
  Quote,
  ArrowRight,
} from "lucide-react"

interface Job {
  id: string
  title: string
  title_ar: string | null
  slug: string | null
  description: string | null
  description_ar: string | null
  location: string | null
  location_ar: string | null
  department: string | null
  department_ar: string | null
  employment_type: string | null
  experience_level: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  remote_allowed: boolean | null
  published_at: string | null
  closing_date: string | null
  thumbnail_url: string | null
}

interface Organization {
  id: string
  name: string
  nameAr: string | null
  slug: string
  logoUrl: string | null
}

interface CareerBlock {
  id: string
  type: string
  order: number
  enabled: boolean
  content: any
  styles: any
}

interface PageStyles {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  textColor: string
  fontFamily: string
  fontSize?: "small" | "medium" | "large"
  borderRadius: string
  headerStyle: "minimal" | "standard" | "bold"
  footerStyle: "minimal" | "standard" | "detailed"
}

interface PageSettings {
  showHeader: boolean
  showFooter: boolean
  showLogo: boolean
  showJobSearch: boolean
  showJobFilters: boolean
  language: "en" | "ar" | "both"
  defaultLanguage: "en" | "ar"
}

interface JobType {
  value: string
  label: string
  labelAr: string | null
}

interface CareerPageClientProps {
  organization: Organization
  jobs: Job[]
  jobTypes: JobType[]
  blocks: CareerBlock[]
  styles: PageStyles
  settings: PageSettings
}

const employmentTypeLabels: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  temporary: "Temporary",
}

const experienceLevelLabels: Record<string, string> = {
  entry: "Entry Level",
  junior: "Junior",
  mid: "Mid Level",
  senior: "Senior",
  lead: "Lead",
  manager: "Manager",
  director: "Director",
  executive: "Executive",
}

const iconMap: Record<string, any> = {
  Heart,
  Star,
  Users,
  Briefcase,
  Building2,
  Rocket,
  Globe,
  Award,
  GraduationCap,
  Clock,
  Shield,
  Zap,
  Target,
  TrendingUp,
  Lightbulb,
  Coffee,
  Gift,
  Smile,
}

const paddingMap: Record<string, string> = {
  none: "py-0",
  small: "py-8",
  medium: "py-16",
  large: "py-24",
}

const fontSizeMap: Record<string, { base: string; headingHero: string; headingSection: string; body: string; small: string }> = {
  small: { base: "text-sm", headingHero: "text-4xl md:text-5xl", headingSection: "text-2xl", body: "text-sm", small: "text-xs" },
  medium: { base: "text-base", headingHero: "text-5xl md:text-6xl", headingSection: "text-3xl", body: "text-base", small: "text-sm" },
  large: { base: "text-lg", headingHero: "text-5xl md:text-7xl", headingSection: "text-3xl md:text-4xl", body: "text-lg", small: "text-base" },
}

// Google Fonts mapping
const googleFontMap: Record<string, string> = {
  Inter: "Inter:wght@400;500;600;700;800",
  Poppins: "Poppins:wght@400;500;600;700;800",
  "DM Sans": "DM+Sans:wght@400;500;600;700",
  Montserrat: "Montserrat:wght@400;500;600;700;800",
  Raleway: "Raleway:wght@400;500;600;700;800",
  "Plus Jakarta Sans": "Plus+Jakarta+Sans:wght@400;500;600;700;800",
  Outfit: "Outfit:wght@400;500;600;700;800",
  Manrope: "Manrope:wght@400;500;600;700;800",
  Rubik: "Rubik:wght@400;500;600;700",
  Cairo: "Cairo:wght@400;500;600;700;800",
  Tajawal: "Tajawal:wght@400;500;700",
  IBM_Plex_Sans_Arabic: "IBM+Plex+Sans+Arabic:wght@400;500;600;700",
}

export function CareerPageClient({
  organization,
  jobs,
  jobTypes,
  blocks,
  styles,
  settings,
}: CareerPageClientProps) {
  const [language, setLanguage] = useState<"en" | "ar">(settings.defaultLanguage)
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const isRtl = language === "ar"
  const fs = fontSizeMap[styles.fontSize || "medium"]

  // Load Google Fonts dynamically
  useEffect(() => {
    const fontFamily = styles.fontFamily || "Inter"
    const fontParam = googleFontMap[fontFamily]
    if (fontParam) {
      const linkId = "career-page-google-font"
      let link = document.getElementById(linkId) as HTMLLinkElement | null
      if (!link) {
        link = document.createElement("link")
        link.id = linkId
        link.rel = "stylesheet"
        document.head.appendChild(link)
      }
      link.href = `https://fonts.googleapis.com/css2?family=${fontParam}&display=swap`
    }
  }, [styles.fontFamily])

  // Get unique departments
  const departments = [...new Set(jobs.map((j) => j.department).filter(Boolean))]

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDepartment =
      departmentFilter === "all" || job.department === departmentFilter

    const matchesType = typeFilter === "all" || job.employment_type === typeFilter

    return matchesSearch && matchesDepartment && matchesType
  })

  const formatSalary = (job: Job) => {
    if (!job.salary_min && !job.salary_max) return null
    const currency = job.salary_currency || "SAR"
    if (job.salary_min && job.salary_max) {
      return `${currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
    }
    if (job.salary_min) {
      return `From ${currency} ${job.salary_min.toLocaleString()}`
    }
    return `Up to ${currency} ${job.salary_max?.toLocaleString()}`
  }

  // Helper to get job type label from jobTypes array
  const getJobTypeLabel = (type: string | null, isRtl: boolean) => {
    if (!type) return null
    const jt = jobTypes.find(j => j.value === type)
    if (jt) return isRtl && jt.labelAr ? jt.labelAr : jt.label
    return employmentTypeLabels[type] || type.replace(/_/g, " ")
  }

  // If no blocks configured, show default layout
  if (blocks.length === 0) {
    return <DefaultCareerPage organization={organization} jobs={jobs} jobTypes={jobTypes} styles={styles} settings={settings} />
  }

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: styles.fontFamily,
        color: styles.textColor,
        backgroundColor: styles.backgroundColor,
      }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Header - Frosted Glass Sticky Nav */}
      {settings.showHeader && (
        <header
          className={`
            sticky top-0 z-50 px-6 py-3 flex items-center justify-between
            backdrop-blur-xl border-b border-white/10 transition-all duration-300
            ${styles.headerStyle === "bold"
              ? "shadow-lg"
              : "shadow-sm"
            }
          `}
          style={{
            backgroundColor: styles.headerStyle === "bold"
              ? styles.primaryColor + "ee"
              : "rgba(255,255,255,0.85)",
            color: styles.headerStyle === "bold" ? "white" : styles.textColor,
          }}
        >
          <div className="flex items-center gap-3">
            <span className="font-semibold text-sm">
              {isRtl && organization.nameAr ? organization.nameAr : organization.name}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {settings.language === "both" && (
              <div
                className="flex rounded-full p-1"
                style={{
                  backgroundColor: styles.headerStyle === "bold"
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.05)",
                }}
              >
                <button
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    language === "en"
                      ? styles.headerStyle === "bold"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "bg-gray-900 text-white shadow-sm"
                      : "opacity-70 hover:opacity-100"
                  }`}
                  onClick={() => setLanguage("en")}
                >
                  EN
                </button>
                <button
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    language === "ar"
                      ? styles.headerStyle === "bold"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "bg-gray-900 text-white shadow-sm"
                      : "opacity-70 hover:opacity-100"
                  }`}
                  onClick={() => setLanguage("ar")}
                >
                  عربي
                </button>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Render Blocks */}
      {blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          styles={styles}
          settings={settings}
          organization={organization}
          jobs={filteredJobs}
          allJobs={jobs}
          language={language}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          departments={departments}
          jobTypes={jobTypes}
          getJobTypeLabel={getJobTypeLabel}
          formatSalary={formatSalary}
          fs={fs}
        />
      ))}

      {/* Footer */}
      {settings.showFooter && (
        <footer
          className={`
            px-6 text-center
            ${styles.footerStyle === "detailed" ? "py-14" : "py-8"}
          `}
          style={{ color: styles.textColor + "80" }}
        >
          <div className="max-w-5xl mx-auto">
            <div
              className="h-px mb-8 mx-auto"
              style={{
                background: `linear-gradient(90deg, transparent, ${styles.textColor}20, transparent)`,
                maxWidth: "600px",
              }}
            />
            {styles.footerStyle === "detailed" && organization.logoUrl && (
              <div className="mb-6">
                <img
                  src={organization.logoUrl}
                  alt={organization.name}
                  className="h-10 mx-auto mb-3 object-contain opacity-70"
                />
              </div>
            )}
            <p className={`${fs.small}`}>
              &copy; {new Date().getFullYear()}{" "}
              {isRtl && organization.nameAr ? organization.nameAr : organization.name}.{" "}
              {isRtl ? "جميع الحقوق محفوظة" : "All rights reserved"}.
            </p>
            <p className="mt-2 text-xs opacity-50">Powered by Jadarat ATS</p>
          </div>
        </footer>
      )}
    </div>
  )
}

// Block Renderer Component
function BlockRenderer({
  block,
  styles,
  settings,
  organization,
  jobs,
  allJobs,
  language,
  searchQuery,
  setSearchQuery,
  departmentFilter,
  setDepartmentFilter,
  typeFilter,
  setTypeFilter,
  departments,
  jobTypes,
  getJobTypeLabel,
  formatSalary,
  fs,
}: {
  block: CareerBlock
  styles: PageStyles
  settings: PageSettings
  organization: Organization
  jobs: Job[]
  allJobs: Job[]
  language: "en" | "ar"
  searchQuery: string
  setSearchQuery: (v: string) => void
  departmentFilter: string
  setDepartmentFilter: (v: string) => void
  typeFilter: string
  setTypeFilter: (v: string) => void
  departments: (string | null)[]
  jobTypes: JobType[]
  getJobTypeLabel: (type: string | null, isRtl: boolean) => string | null
  formatSalary: (job: Job) => string | null
  fs: { base: string; headingHero: string; headingSection: string; body: string; small: string }
}) {
  const isRtl = language === "ar"
  const padding = paddingMap[block.styles.padding || "medium"]
  const alignment = block.styles.alignment || "left"
  const bgColor = block.styles.backgroundColor || "transparent"
  const textColor = block.styles.textColor || styles.textColor

  const containerClass = block.styles.fullWidth
    ? "px-6"
    : "container mx-auto px-6 max-w-6xl"

  const getContent = (enKey: string, arKey?: string) => {
    if (isRtl && arKey && block.content[arKey]) {
      return block.content[arKey]
    }
    return block.content[enKey]
  }

  switch (block.type) {
    case "hero":
      return (
        <section
          className={`relative flex items-center overflow-hidden`}
          style={{
            backgroundColor: block.content.backgroundImage ? undefined : styles.primaryColor,
            backgroundImage: block.content.backgroundImage
              ? `url(${block.content.backgroundImage})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            minHeight: "500px",
          }}
        >
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: block.content.backgroundImage
                ? `linear-gradient(135deg, ${styles.primaryColor}cc 0%, rgba(0,0,0,0.6) 100%)`
                : `linear-gradient(135deg, ${styles.primaryColor} 0%, ${styles.secondaryColor || styles.primaryColor}dd 100%)`,
            }}
          />
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute top-20 -right-20 w-96 h-96 rounded-full blur-3xl"
              style={{ backgroundColor: "white" }}
            />
            <div
              className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl"
              style={{ backgroundColor: "white" }}
            />
          </div>
          <div
            className={`${containerClass} relative z-10 ${padding}`}
            style={{ textAlign: alignment as any }}
          >
            {/* Logo in Hero */}
            {settings.showLogo && organization.logoUrl && (
              <div className="mb-8">
                <img
                  src={organization.logoUrl}
                  alt={organization.name}
                  className="h-16 md:h-20 object-contain bg-white/10 backdrop-blur-sm rounded-2xl p-3 shadow-xl"
                  style={{ display: alignment === "center" ? "block" : "inline-block", marginInline: alignment === "center" ? "auto" : undefined }}
                />
              </div>
            )}
            <h1 className={`${fs.headingHero} font-extrabold text-white mb-6 tracking-tight leading-tight`}>
              {getContent("title", "titleAr")}
            </h1>
            {block.content.subtitle && (
              <p className="text-xl md:text-2xl text-white/80 mb-10 max-w-2xl leading-relaxed"
                style={{ marginInline: alignment === "center" ? "auto" : undefined }}
              >
                {getContent("subtitle", "subtitleAr")}
              </p>
            )}
            <div
              className={`flex gap-4 flex-wrap ${
                alignment === "center" ? "justify-center" : ""
              }`}
            >
              {block.content.ctaText && (
                <Button
                  size="lg"
                  className="bg-white hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 text-base px-8 py-6 font-semibold"
                  style={{ color: styles.primaryColor, borderRadius: styles.borderRadius }}
                  asChild
                >
                  <a href={block.content.ctaLink || "#jobs"}>
                    {getContent("ctaText", "ctaTextAr")}
                    <ArrowRight className={`h-5 w-5 ${isRtl ? "mr-2 rotate-180" : "ml-2"}`} />
                  </a>
                </Button>
              )}
              {block.content.secondaryCtaText && (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/40 text-white hover:bg-white/10 backdrop-blur-sm text-base px-8 py-6 font-semibold transition-all duration-300"
                  style={{ borderRadius: styles.borderRadius }}
                  asChild
                >
                  <a href={block.content.secondaryCtaLink || "#about"}>
                    {getContent("secondaryCtaText", "secondaryCtaTextAr")}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>
      )

    case "about":
      return (
        <section
          id="about"
          className={padding}
          style={{ backgroundColor: bgColor, color: textColor, textAlign: alignment as any }}
        >
          <div className={containerClass}>
            <h2 className={`${fs.headingSection} font-bold mb-6`}>{getContent("title", "titleAr")}</h2>
            {block.content.description && (
              <div className="prose max-w-none">
                <p className={`${fs.body} leading-relaxed text-muted-foreground whitespace-pre-line max-w-3xl`}>
                  {getContent("description", "descriptionAr")}
                </p>
              </div>
            )}
          </div>
          {block.styles.showDivider && (
            <div className="mt-12 max-w-5xl mx-auto">
              <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${styles.textColor}15, transparent)` }} />
            </div>
          )}
        </section>
      )

    case "values":
    case "benefits":
      const columns = block.styles.columns || 3
      const items = block.content.items || []
      return (
        <section
          className={padding}
          style={{ backgroundColor: bgColor, color: textColor, textAlign: alignment as any }}
        >
          <div className={containerClass}>
            <h2 className={`${fs.headingSection} font-bold mb-12`}>{getContent("title", "titleAr")}</h2>
            <div
              className={`grid gap-6 ${
                columns === 2
                  ? "grid-cols-1 md:grid-cols-2"
                  : columns === 4
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                  : "grid-cols-1 md:grid-cols-3"
              }`}
            >
              {items.map((item: any) => {
                const IconComponent = iconMap[item.icon] || Heart
                return (
                  <div
                    key={item.id}
                    className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100/50"
                    style={{ borderRadius: styles.borderRadius }}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl mb-5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: styles.primaryColor + "12" }}
                    >
                      <IconComponent className="h-7 w-7" style={{ color: styles.primaryColor }} />
                    </div>
                    <h3 className="font-semibold text-lg mb-3">
                      {isRtl && item.titleAr ? item.titleAr : item.title}
                    </h3>
                    <p className={`text-muted-foreground ${fs.small} leading-relaxed`}>
                      {isRtl && item.descriptionAr ? item.descriptionAr : item.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
          {block.styles.showDivider && (
            <div className="mt-12 max-w-5xl mx-auto">
              <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${styles.textColor}15, transparent)` }} />
            </div>
          )}
        </section>
      )

    case "stats":
      const statItems = block.content.items || []
      const statColumns = block.styles.columns || 3
      return (
        <section
          className={padding}
          style={{ backgroundColor: bgColor, color: textColor, textAlign: alignment as any }}
        >
          <div className={containerClass}>
            {block.content.title && (
              <h2 className={`${fs.headingSection} font-bold mb-12`}>{getContent("title", "titleAr")}</h2>
            )}
            <div
              className={`grid gap-8 ${
                statColumns === 2
                  ? "grid-cols-2"
                  : statColumns === 4
                  ? "grid-cols-2 md:grid-cols-4"
                  : "grid-cols-2 md:grid-cols-3"
              }`}
            >
              {statItems.map((item: any) => (
                <div key={item.id} className="text-center group">
                  <div
                    className="text-4xl md:text-5xl font-extrabold mb-2 transition-transform duration-300 group-hover:scale-110"
                    style={{ color: styles.primaryColor }}
                  >
                    {isRtl && item.valueAr ? item.valueAr : item.value}
                  </div>
                  <div className={`text-muted-foreground font-medium ${fs.small}`}>
                    {isRtl && item.labelAr ? item.labelAr : item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {block.styles.showDivider && (
            <div className="mt-12 max-w-5xl mx-auto">
              <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${styles.textColor}15, transparent)` }} />
            </div>
          )}
        </section>
      )

    case "team":
      const teamItems = block.content.items || []
      const teamColumns = block.styles.columns || 4
      return (
        <section
          className={padding}
          style={{ backgroundColor: bgColor, color: textColor, textAlign: alignment as any }}
        >
          <div className={containerClass}>
            <h2 className={`${fs.headingSection} font-bold mb-12`}>{getContent("title", "titleAr")}</h2>
            <div
              className={`grid gap-8 ${
                teamColumns === 2
                  ? "grid-cols-1 md:grid-cols-2"
                  : teamColumns === 3
                  ? "grid-cols-1 md:grid-cols-3"
                  : "grid-cols-2 md:grid-cols-4"
              }`}
            >
              {teamItems.map((item: any) => (
                <div key={item.id} className="group text-center">
                  <div className="relative mb-5 inline-block">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={isRtl && item.titleAr ? item.titleAr : item.title}
                        className="w-28 h-28 rounded-full object-cover ring-4 ring-white shadow-lg transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="w-28 h-28 rounded-full flex items-center justify-center ring-4 ring-white shadow-lg transition-transform duration-300 group-hover:scale-105"
                        style={{ backgroundColor: styles.primaryColor + "12" }}
                      >
                        <Users className="h-12 w-12" style={{ color: styles.primaryColor }} />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg">
                    {isRtl && item.titleAr ? item.titleAr : item.title}
                  </h3>
                  {(item.role || item.roleAr) && (
                    <p className={`${fs.small} text-muted-foreground mt-1`}>
                      {isRtl && item.roleAr ? item.roleAr : item.role}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          {block.styles.showDivider && (
            <div className="mt-12 max-w-5xl mx-auto">
              <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${styles.textColor}15, transparent)` }} />
            </div>
          )}
        </section>
      )

    case "testimonials":
      const testimonialItems = block.content.items || []
      return (
        <section
          className={padding}
          style={{ backgroundColor: bgColor, color: textColor, textAlign: alignment as any }}
        >
          <div className={containerClass}>
            <h2 className={`${fs.headingSection} font-bold mb-12`}>{getContent("title", "titleAr")}</h2>
            <div className="grid gap-8 md:grid-cols-2">
              {testimonialItems.map((item: any) => (
                <div
                  key={item.id}
                  className="relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100/50"
                  style={{ borderRadius: styles.borderRadius }}
                >
                  <Quote
                    className="h-10 w-10 mb-4 opacity-20"
                    style={{ color: styles.primaryColor }}
                  />
                  <p className={`text-muted-foreground mb-6 italic leading-relaxed ${fs.body}`}>
                    &ldquo;{isRtl && item.descriptionAr ? item.descriptionAr : item.description}&rdquo;
                  </p>
                  <div className="flex items-center gap-4">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={isRtl && item.titleAr ? item.titleAr : item.title}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: styles.primaryColor + "12" }}
                      >
                        <Users className="h-6 w-6" style={{ color: styles.primaryColor }} />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">
                        {isRtl && item.titleAr ? item.titleAr : item.title}
                      </div>
                      {item.authorRole && (
                        <div className={`${fs.small} text-muted-foreground`}>{item.authorRole}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {block.styles.showDivider && (
            <div className="mt-12 max-w-5xl mx-auto">
              <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${styles.textColor}15, transparent)` }} />
            </div>
          )}
        </section>
      )

    case "jobs":
      return (
        <section
          id="jobs"
          className={padding}
          style={{ backgroundColor: bgColor, color: textColor }}
        >
          <div className={containerClass}>
            <h2
              className={`${fs.headingSection} font-bold mb-10`}
              style={{ textAlign: alignment as any }}
            >
              {getContent("title", "titleAr")}
            </h2>

            {/* Search and Filters */}
            {(settings.showJobSearch || settings.showJobFilters) && (
              <div
                className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
                style={{ borderRadius: styles.borderRadius }}
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {settings.showJobSearch && (
                    <div className="relative flex-1">
                      <Search
                        className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${
                          isRtl ? "right-3" : "left-3"
                        }`}
                      />
                      <Input
                        placeholder={
                          isRtl
                            ? "ابحث عن الوظائف..."
                            : "Search jobs by title, description, or location..."
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`${isRtl ? "pr-9" : "pl-9"} border-gray-200 focus:border-gray-300`}
                        style={{ borderRadius: styles.borderRadius }}
                      />
                    </div>
                  )}
                  {settings.showJobFilters && (
                    <>
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-full md:w-48 border-gray-200" style={{ borderRadius: styles.borderRadius }}>
                          <Filter className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                          <SelectValue placeholder={isRtl ? "القسم" : "Department"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {isRtl ? "جميع الأقسام" : "All Departments"}
                          </SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept!}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full md:w-48 border-gray-200" style={{ borderRadius: styles.borderRadius }}>
                          <Briefcase className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                          <SelectValue placeholder={isRtl ? "نوع الوظيفة" : "Job Type"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {isRtl ? "جميع الأنواع" : "All Types"}
                          </SelectItem>
                          {jobTypes.length > 0
                            ? jobTypes.map((jt) => (
                                <SelectItem key={jt.value} value={jt.value}>
                                  {isRtl && jt.labelAr ? jt.labelAr : jt.label}
                                </SelectItem>
                              ))
                            : Object.entries(employmentTypeLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))
                          }
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Job Count */}
            <p className={`text-muted-foreground mb-8 ${fs.small}`}>
              {isRtl
                ? `${jobs.length} ${jobs.length === 1 ? "وظيفة متاحة" : "وظائف متاحة"}`
                : `${jobs.length} ${jobs.length === 1 ? "position" : "positions"} available`}
            </p>

            {/* Jobs Grid */}
            {jobs.length === 0 ? (
              <div
                className="bg-white rounded-2xl border border-gray-100 py-20 text-center"
                style={{ borderRadius: styles.borderRadius }}
              >
                <Briefcase className="mx-auto h-14 w-14 text-muted-foreground/30 mb-5" />
                <h3 className="text-lg font-semibold mb-2">
                  {isRtl ? "لا توجد وظائف متاحة" : "No open positions"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery || departmentFilter !== "all" || typeFilter !== "all"
                    ? isRtl
                      ? "جرب تعديل معايير البحث"
                      : "Try adjusting your filters to see more results"
                    : isRtl
                    ? "تحقق لاحقاً للحصول على فرص جديدة"
                    : "Check back later for new opportunities"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/careers/${organization.slug}/jobs/${job.id}`}
                    className="group"
                  >
                    <div
                      className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col"
                      style={{ borderRadius: styles.borderRadius }}
                    >
                      {/* Thumbnail */}
                      {job.thumbnail_url ? (
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={job.thumbnail_url}
                            alt={isRtl && job.title_ar ? job.title_ar : job.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          {job.department && (
                            <Badge
                              className="absolute top-3 left-3 bg-white/90 text-gray-800 hover:bg-white/90 font-medium shadow-sm backdrop-blur-sm"
                            >
                              {isRtl && job.department_ar ? job.department_ar : job.department}
                            </Badge>
                          )}
                          {job.remote_allowed && (
                            <Badge
                              className="absolute top-3 right-3 text-white font-medium shadow-sm backdrop-blur-sm"
                              style={{ backgroundColor: styles.primaryColor + "dd" }}
                            >
                              <Globe className={`h-3 w-3 ${isRtl ? "ml-1" : "mr-1"}`} />
                              {isRtl ? "عن بعد" : "Remote"}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div
                          className="relative h-32 flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${styles.primaryColor}15 0%, ${styles.primaryColor}08 100%)`,
                          }}
                        >
                          <Briefcase className="h-10 w-10" style={{ color: styles.primaryColor + "40" }} />
                          {job.department && (
                            <Badge
                              className="absolute top-3 left-3 font-medium"
                              variant="secondary"
                            >
                              {isRtl && job.department_ar ? job.department_ar : job.department}
                            </Badge>
                          )}
                          {job.remote_allowed && (
                            <Badge
                              className="absolute top-3 right-3 text-white font-medium"
                              style={{ backgroundColor: styles.primaryColor + "dd" }}
                            >
                              <Globe className={`h-3 w-3 ${isRtl ? "ml-1" : "mr-1"}`} />
                              {isRtl ? "عن بعد" : "Remote"}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-semibold text-lg mb-3 group-hover:text-primary transition-colors line-clamp-2">
                          {isRtl && job.title_ar ? job.title_ar : job.title}
                        </h3>

                        <div className={`flex flex-wrap items-center gap-3 ${fs.small} text-muted-foreground mb-4`}>
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {isRtl && job.location_ar ? job.location_ar : job.location}
                            </span>
                          )}
                          {job.employment_type && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3.5 w-3.5" />
                              {getJobTypeLabel(job.employment_type, isRtl)}
                            </span>
                          )}
                          {job.experience_level && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {experienceLevelLabels[job.experience_level] || job.experience_level}
                            </span>
                          )}
                        </div>

                        {job.description && (
                          <p className={`text-muted-foreground ${fs.small} line-clamp-2 mb-4 leading-relaxed`}>
                            {(isRtl && job.description_ar
                              ? job.description_ar
                              : job.description
                            )?.replace(/<[^>]*>/g, "").substring(0, 150)}
                          </p>
                        )}

                        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                          <span
                            className={`${fs.small} font-semibold flex items-center gap-1 transition-all duration-300 group-hover:gap-2`}
                            style={{ color: styles.primaryColor }}
                          >
                            {isRtl ? "عرض وتقديم" : "View & Apply"}
                            <ArrowRight className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
                          </span>
                          {job.closing_date && (
                            <span className="text-xs text-muted-foreground">
                              {isRtl ? "ينتهي" : "Closes"}{" "}
                              {new Date(job.closing_date).toLocaleDateString(isRtl ? "ar-SA" : "en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          {block.styles.showDivider && (
            <div className="mt-12 max-w-5xl mx-auto">
              <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${styles.textColor}15, transparent)` }} />
            </div>
          )}
        </section>
      )

    case "cta":
      return (
        <section
          className={`${padding} relative overflow-hidden`}
          style={{ textAlign: alignment as any }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${styles.primaryColor} 0%, ${styles.secondaryColor || styles.primaryColor}cc 100%)`,
            }}
          />
          {/* Decorative */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-64 h-64 rounded-full blur-3xl bg-white" />
            <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full blur-3xl bg-white" />
          </div>
          <div className={`${containerClass} relative z-10`}>
            <h2 className={`${fs.headingSection} font-bold text-white mb-4`}>
              {getContent("title", "titleAr")}
            </h2>
            {block.content.subtitle && (
              <p className="text-xl text-white/80 mb-10 max-w-xl"
                style={{ marginInline: alignment === "center" ? "auto" : undefined }}
              >
                {getContent("subtitle", "subtitleAr")}
              </p>
            )}
            {block.content.ctaText && (
              <Button
                size="lg"
                className="bg-white hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 text-base px-8 py-6 font-semibold"
                style={{ color: styles.primaryColor, borderRadius: styles.borderRadius }}
                asChild
              >
                <a href={block.content.ctaLink || "#jobs"}>
                  {getContent("ctaText", "ctaTextAr")}
                  <ArrowRight className={`h-5 w-5 ${isRtl ? "mr-2 rotate-180" : "ml-2"}`} />
                </a>
              </Button>
            )}
          </div>
        </section>
      )

    case "contact":
      return (
        <section
          className={padding}
          style={{ backgroundColor: bgColor, color: textColor, textAlign: alignment as any }}
        >
          <div className={containerClass}>
            <h2 className={`${fs.headingSection} font-bold mb-10`}>{getContent("title", "titleAr")}</h2>
            <div
              className={`space-y-6 ${alignment === "center" ? "max-w-md mx-auto" : ""}`}
            >
              {block.content.email && (
                <div className="flex items-center gap-4 group">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: styles.primaryColor + "12" }}
                  >
                    <Mail className="h-6 w-6" style={{ color: styles.primaryColor }} />
                  </div>
                  <div>
                    <div className={`${fs.small} text-muted-foreground`}>
                      {isRtl ? "البريد الإلكتروني" : "Email"}
                    </div>
                    <a href={`mailto:${block.content.email}`} className="font-medium hover:underline">
                      {block.content.email}
                    </a>
                  </div>
                </div>
              )}
              {block.content.phone && (
                <div className="flex items-center gap-4 group">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: styles.primaryColor + "12" }}
                  >
                    <Phone className="h-6 w-6" style={{ color: styles.primaryColor }} />
                  </div>
                  <div>
                    <div className={`${fs.small} text-muted-foreground`}>
                      {isRtl ? "الهاتف" : "Phone"}
                    </div>
                    <a href={`tel:${block.content.phone}`} className="font-medium hover:underline">
                      {block.content.phone}
                    </a>
                  </div>
                </div>
              )}
              {block.content.address && (
                <div className="flex items-center gap-4 group">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: styles.primaryColor + "12" }}
                  >
                    <MapPinned className="h-6 w-6" style={{ color: styles.primaryColor }} />
                  </div>
                  <div>
                    <div className={`${fs.small} text-muted-foreground`}>
                      {isRtl ? "العنوان" : "Address"}
                    </div>
                    <div className="font-medium">
                      {getContent("address", "addressAr")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {block.styles.showDivider && (
            <div className="mt-12 max-w-5xl mx-auto">
              <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${styles.textColor}15, transparent)` }} />
            </div>
          )}
        </section>
      )

    case "gallery":
      const images = block.content.images || []
      const galleryColumns = block.styles.columns || 3
      return (
        <section
          className={padding}
          style={{ backgroundColor: bgColor, color: textColor, textAlign: alignment as any }}
        >
          <div className={containerClass}>
            {block.content.title && (
              <h2 className={`${fs.headingSection} font-bold mb-10`}>{getContent("title", "titleAr")}</h2>
            )}
            {images.length > 0 ? (
              <div
                className={`grid gap-4 ${
                  galleryColumns === 2
                    ? "grid-cols-2"
                    : galleryColumns === 4
                    ? "grid-cols-2 md:grid-cols-4"
                    : "grid-cols-2 md:grid-cols-3"
                }`}
              >
                {images.map((image: any) => (
                  <div
                    key={image.id}
                    className="aspect-video overflow-hidden group"
                    style={{ borderRadius: styles.borderRadius }}
                  >
                    <img
                      src={image.url}
                      alt={isRtl && image.altAr ? image.altAr : image.alt || ""}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          {block.styles.showDivider && (
            <div className="mt-12 max-w-5xl mx-auto">
              <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${styles.textColor}15, transparent)` }} />
            </div>
          )}
        </section>
      )

    case "custom":
      if (block.content.html) {
        return (
          <section className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
            <div
              className={containerClass}
              dangerouslySetInnerHTML={{
                __html: isRtl && block.content.htmlAr ? block.content.htmlAr : block.content.html,
              }}
            />
          </section>
        )
      }
      return null

    default:
      return null
  }
}

// Default Career Page (fallback when no blocks configured)
function DefaultCareerPage({
  organization,
  jobs,
  jobTypes,
  styles,
  settings,
}: {
  organization: Organization
  jobs: Job[]
  jobTypes: JobType[]
  styles: PageStyles
  settings: PageSettings
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const departments = [...new Set(jobs.map((j) => j.department).filter(Boolean))]

  const fs = fontSizeMap[styles.fontSize || "medium"]

  // Helper to get job type label
  const getJobTypeLabel = (type: string | null) => {
    if (!type) return null
    const jt = jobTypes.find(j => j.value === type)
    if (jt) return jt.label
    return employmentTypeLabels[type] || type.replace(/_/g, " ")
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDepartment = departmentFilter === "all" || job.department === departmentFilter
    const matchesType = typeFilter === "all" || job.employment_type === typeFilter
    return matchesSearch && matchesDepartment && matchesType
  })

  const formatSalary = (job: Job) => {
    if (!job.salary_min && !job.salary_max) return null
    const currency = job.salary_currency || "SAR"
    if (job.salary_min && job.salary_max) {
      return `${currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
    }
    if (job.salary_min) return `From ${currency} ${job.salary_min.toLocaleString()}`
    return `Up to ${currency} ${job.salary_max?.toLocaleString()}`
  }

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: styles.fontFamily }}>
      {/* Hero Section */}
      <header className="relative overflow-hidden" style={{ minHeight: "500px" }}>
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${styles.primaryColor} 0%, ${styles.secondaryColor || styles.primaryColor}cc 100%)`,
          }}
        />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -right-20 w-96 h-96 rounded-full blur-3xl bg-white" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl bg-white" />
        </div>
        <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center" style={{ minHeight: "500px" }}>
          <div className="flex items-center gap-5 mb-8">
            {organization.logoUrl ? (
              <img
                src={organization.logoUrl}
                alt={organization.name}
                className="h-20 w-20 rounded-2xl bg-white p-3 object-contain shadow-xl"
              />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
                <Building2 className="h-10 w-10 text-white" />
              </div>
            )}
          </div>
          <h1 className={`${fs.headingHero} font-extrabold text-white tracking-tight mb-4`}>
            Careers at {organization.name}
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-2xl">
            Join our team and make an impact
          </p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Search & Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs by title, description, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-gray-200"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-48 border-gray-200">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept!}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48 border-gray-200">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {jobTypes.length > 0
                  ? jobTypes.map((jt) => (
                      <SelectItem key={jt.value} value={jt.value}>
                        {jt.label}
                      </SelectItem>
                    ))
                  : Object.entries(employmentTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))
                }
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className={`text-muted-foreground mb-8 ${fs.small}`}>
          {filteredJobs.length} {filteredJobs.length === 1 ? "position" : "positions"} available
        </p>

        {/* Jobs Grid */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
            <Briefcase className="mx-auto h-14 w-14 text-muted-foreground/30 mb-5" />
            <h3 className="text-lg font-semibold mb-2">No open positions</h3>
            <p className="text-muted-foreground">Check back later for new opportunities</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <Link
                key={job.id}
                href={`/careers/${organization.slug}/jobs/${job.id}`}
                className="group"
              >
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                  {/* Thumbnail */}
                  {job.thumbnail_url ? (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={job.thumbnail_url}
                        alt={job.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      {job.department && (
                        <Badge className="absolute top-3 left-3 bg-white/90 text-gray-800 hover:bg-white/90 font-medium shadow-sm backdrop-blur-sm">
                          {job.department}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div
                      className="relative h-32 flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${styles.primaryColor}15 0%, ${styles.primaryColor}08 100%)`,
                      }}
                    >
                      <Briefcase className="h-10 w-10" style={{ color: styles.primaryColor + "40" }} />
                      {job.department && (
                        <Badge className="absolute top-3 left-3 font-medium" variant="secondary">
                          {job.department}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-semibold text-lg mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {job.title}
                    </h3>

                    <div className={`flex flex-wrap items-center gap-3 ${fs.small} text-muted-foreground mb-4`}>
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                      )}
                      {job.employment_type && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          {getJobTypeLabel(job.employment_type)}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                      <span
                        className={`${fs.small} font-semibold flex items-center gap-1 transition-all duration-300 group-hover:gap-2`}
                        style={{ color: styles.primaryColor }}
                      >
                        View & Apply
                        <ArrowRight className="h-4 w-4" />
                      </span>
                      {job.closing_date && (
                        <span className="text-xs text-muted-foreground">
                          Closes {new Date(job.closing_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-10">
        <div className="container mx-auto px-6 text-center">
          <div
            className="h-px mb-8 mx-auto"
            style={{
              background: `linear-gradient(90deg, transparent, ${styles.textColor || "#000"}20, transparent)`,
              maxWidth: "600px",
            }}
          />
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} {organization.name}. All rights reserved.
          </p>
          <p className="text-xs mt-2 text-muted-foreground/50">Powered by Jadarat ATS</p>
        </div>
      </footer>
    </div>
  )
}
