"use client"

import { useState } from "react"
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

interface CareerPageClientProps {
  organization: Organization
  jobs: Job[]
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
  small: "py-6",
  medium: "py-12",
  large: "py-20",
}

export function CareerPageClient({
  organization,
  jobs,
  blocks,
  styles,
  settings,
}: CareerPageClientProps) {
  const [language, setLanguage] = useState<"en" | "ar">(settings.defaultLanguage)
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const isRtl = language === "ar"

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

  // If no blocks configured, show default layout
  if (blocks.length === 0) {
    return <DefaultCareerPage organization={organization} jobs={jobs} styles={styles} settings={settings} />
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
      {/* Header */}
      {settings.showHeader && (
        <header
          className={`
            border-b px-4 py-3 flex items-center justify-between
            ${styles.headerStyle === "bold" ? "shadow-md" : ""}
          `}
          style={{
            backgroundColor: styles.headerStyle === "bold" ? styles.primaryColor : "white",
            color: styles.headerStyle === "bold" ? "white" : styles.textColor,
          }}
        >
          <div className="flex items-center gap-3">
            {settings.showLogo && organization.logoUrl ? (
              <img
                src={organization.logoUrl}
                alt={organization.name}
                className="h-10 object-contain"
              />
            ) : settings.showLogo ? (
              <div
                className="w-10 h-10 rounded flex items-center justify-center text-white"
                style={{ backgroundColor: styles.primaryColor }}
              >
                <Building2 className="h-5 w-5" />
              </div>
            ) : null}
            {styles.headerStyle !== "minimal" && (
              <span className="font-semibold text-lg">
                {isRtl && organization.nameAr ? organization.nameAr : organization.name}
              </span>
            )}
          </div>
          {settings.language === "both" && (
            <div className="flex gap-2 text-sm">
              <button
                className={`px-3 py-1 rounded ${language === "en" ? "bg-black/10" : ""}`}
                onClick={() => setLanguage("en")}
              >
                EN
              </button>
              <button
                className={`px-3 py-1 rounded ${language === "ar" ? "bg-black/10" : ""}`}
                onClick={() => setLanguage("ar")}
              >
                عربي
              </button>
            </div>
          )}
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
          formatSalary={formatSalary}
        />
      ))}

      {/* Footer */}
      {settings.showFooter && (
        <footer
          className={`
            border-t px-4 py-6 text-center text-sm
            ${styles.footerStyle === "detailed" ? "py-10" : ""}
          `}
          style={{ color: styles.textColor + "80" }}
        >
          {styles.footerStyle === "detailed" && organization.logoUrl && (
            <div className="mb-4">
              <img
                src={organization.logoUrl}
                alt={organization.name}
                className="h-10 mx-auto mb-2 object-contain"
              />
              <p className="font-medium">
                {isRtl && organization.nameAr ? organization.nameAr : organization.name}
              </p>
            </div>
          )}
          <p>
            &copy; {new Date().getFullYear()}{" "}
            {isRtl && organization.nameAr ? organization.nameAr : organization.name}.{" "}
            {isRtl ? "جميع الحقوق محفوظة" : "All rights reserved"}.
          </p>
          <p className="mt-1 text-xs">Powered by Jadarat ATS</p>
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
  formatSalary,
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
  formatSalary: (job: Job) => string | null
}) {
  const isRtl = language === "ar"
  const padding = paddingMap[block.styles.padding || "medium"]
  const alignment = block.styles.alignment || "left"
  const bgColor = block.styles.backgroundColor || "transparent"
  const textColor = block.styles.textColor || styles.textColor

  const containerClass = block.styles.fullWidth
    ? "px-4"
    : "container mx-auto px-4 max-w-5xl"

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
          className={`${padding} relative flex items-center`}
          style={{
            backgroundColor: block.content.backgroundImage ? undefined : styles.primaryColor,
            backgroundImage: block.content.backgroundImage
              ? `url(${block.content.backgroundImage})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            minHeight: "400px",
          }}
        >
          {block.content.backgroundImage && (
            <div className="absolute inset-0 bg-black/50" />
          )}
          <div
            className={`${containerClass} relative z-10`}
            style={{ textAlign: alignment as any }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {getContent("title", "titleAr")}
            </h1>
            {block.content.subtitle && (
              <p className="text-xl text-white/80 mb-8">
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
                  className="bg-white hover:bg-white/90"
                  style={{ color: styles.primaryColor, borderRadius: styles.borderRadius }}
                  asChild
                >
                  <a href={block.content.ctaLink || "#jobs"}>
                    {getContent("ctaText", "ctaTextAr")}
                    <ChevronRight className={`h-4 w-4 ${isRtl ? "mr-2 rotate-180" : "ml-2"}`} />
                  </a>
                </Button>
              )}
              {block.content.secondaryCtaText && (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
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
            <h2 className="text-3xl font-bold mb-6">{getContent("title", "titleAr")}</h2>
            {block.content.description && (
              <div className="prose max-w-none">
                <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
                  {getContent("description", "descriptionAr")}
                </p>
              </div>
            )}
          </div>
          {block.styles.showDivider && <hr className="mt-12 border-border max-w-5xl mx-auto" />}
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
            <h2 className="text-3xl font-bold mb-10">{getContent("title", "titleAr")}</h2>
            <div
              className={`grid gap-8 ${
                columns === 2 ? "md:grid-cols-2" : columns === 4 ? "md:grid-cols-4" : "md:grid-cols-3"
              }`}
            >
              {items.map((item: any) => {
                const Icon = iconMap[item.icon || "Star"] || Star
                return (
                  <div key={item.id} style={{ textAlign: alignment as any }}>
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                        alignment === "center" ? "mx-auto" : ""
                      }`}
                      style={{ backgroundColor: styles.primaryColor + "15" }}
                    >
                      <Icon className="h-7 w-7" style={{ color: styles.primaryColor }} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {isRtl && item.titleAr ? item.titleAr : item.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {isRtl && item.descriptionAr ? item.descriptionAr : item.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
          {block.styles.showDivider && <hr className="mt-12 border-border max-w-5xl mx-auto" />}
        </section>
      )

    case "stats":
      const statItems = block.content.items || []
      const statColumns = block.styles.columns || 3
      return (
        <section
          className={padding}
          style={{ backgroundColor: bgColor, color: textColor, textAlign: "center" }}
        >
          <div className={containerClass}>
            {block.content.title && (
              <h2 className="text-3xl font-bold mb-10">{getContent("title", "titleAr")}</h2>
            )}
            <div
              className={`grid gap-8 ${
                statColumns === 2
                  ? "grid-cols-2"
                  : statColumns === 4
                  ? "grid-cols-2 md:grid-cols-4"
                  : "grid-cols-3"
              }`}
            >
              {statItems.map((item: any) => (
                <div key={item.id}>
                  <div
                    className="text-4xl md:text-5xl font-bold mb-2"
                    style={{ color: styles.primaryColor }}
                  >
                    {isRtl && item.valueAr ? item.valueAr : item.value}
                  </div>
                  <div className="text-muted-foreground">
                    {isRtl && item.labelAr ? item.labelAr : item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {block.styles.showDivider && <hr className="mt-12 border-border max-w-5xl mx-auto" />}
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
            <h2 className="text-3xl font-bold mb-10">{getContent("title", "titleAr")}</h2>
            <div
              className={`grid gap-8 ${
                teamColumns === 2
                  ? "grid-cols-2"
                  : teamColumns === 3
                  ? "grid-cols-2 md:grid-cols-3"
                  : "grid-cols-2 md:grid-cols-4"
              }`}
            >
              {teamItems.map((item: any) => (
                <div key={item.id} className="text-center">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-28 h-28 rounded-full mx-auto mb-4 object-cover"
                    />
                  ) : (
                    <div
                      className="w-28 h-28 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold"
                      style={{ backgroundColor: styles.primaryColor }}
                    >
                      {item.title?.charAt(0)}
                    </div>
                  )}
                  <h3 className="font-semibold text-lg">
                    {isRtl && item.titleAr ? item.titleAr : item.title}
                  </h3>
                  {item.role && (
                    <p className="text-muted-foreground">
                      {isRtl && item.roleAr ? item.roleAr : item.role}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          {block.styles.showDivider && <hr className="mt-12 border-border max-w-5xl mx-auto" />}
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
            <h2 className="text-3xl font-bold mb-10">{getContent("title", "titleAr")}</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {testimonialItems.map((item: any) => (
                <Card key={item.id} style={{ borderRadius: styles.borderRadius }}>
                  <CardContent className="p-6">
                    <Quote className="h-10 w-10 text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground mb-6 text-lg">
                      {isRtl && item.descriptionAr ? item.descriptionAr : item.description}
                    </p>
                    <div className="flex items-center gap-4">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.author}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: styles.primaryColor }}
                        >
                          {item.author?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold">{item.author}</div>
                        {item.authorRole && (
                          <div className="text-sm text-muted-foreground">{item.authorRole}</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          {block.styles.showDivider && <hr className="mt-12 border-border max-w-5xl mx-auto" />}
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
            <h2 className="text-3xl font-bold mb-8" style={{ textAlign: alignment as any }}>
              {getContent("title", "titleAr")}
            </h2>

            {/* Search and Filters */}
            {(settings.showJobSearch || settings.showJobFilters) && (
              <Card className="mb-8" style={{ borderRadius: styles.borderRadius }}>
                <CardContent className="pt-6">
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
                          className={isRtl ? "pr-9" : "pl-9"}
                          style={{ borderRadius: styles.borderRadius }}
                        />
                      </div>
                    )}
                    {settings.showJobFilters && (
                      <>
                        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                          <SelectTrigger className="w-full md:w-48" style={{ borderRadius: styles.borderRadius }}>
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
                          <SelectTrigger className="w-full md:w-48" style={{ borderRadius: styles.borderRadius }}>
                            <Briefcase className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                            <SelectValue placeholder={isRtl ? "نوع الوظيفة" : "Job Type"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              {isRtl ? "جميع الأنواع" : "All Types"}
                            </SelectItem>
                            {Object.entries(employmentTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Job Count */}
            <p className="text-muted-foreground mb-6">
              {isRtl
                ? `${jobs.length} ${jobs.length === 1 ? "وظيفة متاحة" : "وظائف متاحة"}`
                : `${jobs.length} ${jobs.length === 1 ? "position" : "positions"} available`}
            </p>

            {/* Jobs List */}
            <div className="space-y-4">
              {jobs.length === 0 ? (
                <Card style={{ borderRadius: styles.borderRadius }}>
                  <CardContent className="py-16 text-center">
                    <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">
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
                  </CardContent>
                </Card>
              ) : (
                jobs.map((job) => (
                  <Card
                    key={job.id}
                    className="hover:shadow-md transition-shadow"
                    style={{ borderRadius: styles.borderRadius }}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        {/* Job Thumbnail */}
                        {job.thumbnail_url && (
                          <div className="shrink-0">
                            <img
                              src={job.thumbnail_url}
                              alt={job.title}
                              className="w-full md:w-32 h-24 object-cover rounded-lg"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-2 flex-wrap">
                            <h3 className="text-xl font-semibold">
                              {isRtl && job.title_ar ? job.title_ar : job.title}
                            </h3>
                            {job.remote_allowed && (
                              <Badge variant="outline" className="shrink-0">
                                <Globe className={`h-3 w-3 ${isRtl ? "ml-1" : "mr-1"}`} />
                                {isRtl ? "عن بعد" : "Remote"}
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.location}
                              </span>
                            )}
                            {job.department && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {job.department}
                              </span>
                            )}
                            {job.employment_type && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-4 w-4" />
                                {employmentTypeLabels[job.employment_type] || job.employment_type}
                              </span>
                            )}
                            {job.experience_level && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {experienceLevelLabels[job.experience_level] || job.experience_level}
                              </span>
                            )}
                          </div>


                          {job.description && (
                            <p className="text-muted-foreground line-clamp-2">
                              {(isRtl && job.description_ar
                                ? job.description_ar
                                : job.description
                              )
                                ?.replace(/<[^>]*>/g, "")
                                .substring(0, 200)}
                              ...
                            </p>
                          )}
                        </div>

                        <div className="flex md:flex-col gap-2">
                          <Link href={`/careers/${organization.slug}/jobs/${job.id}`}>
                            <Button style={{ backgroundColor: styles.primaryColor, borderRadius: styles.borderRadius }}>
                              {isRtl ? "عرض وتقديم" : "View & Apply"}
                              <ChevronRight className={`h-4 w-4 ${isRtl ? "mr-2 rotate-180" : "ml-2"}`} />
                            </Button>
                          </Link>
                          {job.closing_date && (
                            <p className="text-xs text-muted-foreground text-center">
                              {isRtl ? "ينتهي" : "Closes"}{" "}
                              {new Date(job.closing_date).toLocaleDateString(isRtl ? "ar-SA" : "en-US")}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
          {block.styles.showDivider && <hr className="mt-12 border-border max-w-5xl mx-auto" />}
        </section>
      )

    case "cta":
      return (
        <section
          className={`${padding}`}
          style={{ backgroundColor: styles.primaryColor, textAlign: alignment as any }}
        >
          <div className={containerClass}>
            <h2 className="text-3xl font-bold text-white mb-3">
              {getContent("title", "titleAr")}
            </h2>
            {block.content.subtitle && (
              <p className="text-xl text-white/80 mb-8">
                {getContent("subtitle", "subtitleAr")}
              </p>
            )}
            {block.content.ctaText && (
              <Button
                size="lg"
                className="bg-white hover:bg-white/90"
                style={{ color: styles.primaryColor, borderRadius: styles.borderRadius }}
                asChild
              >
                <a href={block.content.ctaLink || "#jobs"}>
                  {getContent("ctaText", "ctaTextAr")}
                  <ChevronRight className={`h-4 w-4 ${isRtl ? "mr-2 rotate-180" : "ml-2"}`} />
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
            <h2 className="text-3xl font-bold mb-8">{getContent("title", "titleAr")}</h2>
            <div
              className={`space-y-6 ${alignment === "center" ? "max-w-md mx-auto" : ""}`}
            >
              {block.content.email && (
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: styles.primaryColor + "15" }}
                  >
                    <Mail className="h-6 w-6" style={{ color: styles.primaryColor }} />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {isRtl ? "البريد الإلكتروني" : "Email"}
                    </div>
                    <a href={`mailto:${block.content.email}`} className="font-medium hover:underline">
                      {block.content.email}
                    </a>
                  </div>
                </div>
              )}
              {block.content.phone && (
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: styles.primaryColor + "15" }}
                  >
                    <Phone className="h-6 w-6" style={{ color: styles.primaryColor }} />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {isRtl ? "الهاتف" : "Phone"}
                    </div>
                    <a href={`tel:${block.content.phone}`} className="font-medium hover:underline">
                      {block.content.phone}
                    </a>
                  </div>
                </div>
              )}
              {block.content.address && (
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: styles.primaryColor + "15" }}
                  >
                    <MapPinned className="h-6 w-6" style={{ color: styles.primaryColor }} />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
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
          {block.styles.showDivider && <hr className="mt-12 border-border max-w-5xl mx-auto" />}
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
              <h2 className="text-3xl font-bold mb-8">{getContent("title", "titleAr")}</h2>
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
                    className="aspect-video overflow-hidden"
                    style={{ borderRadius: styles.borderRadius }}
                  >
                    <img
                      src={image.url}
                      alt={isRtl && image.altAr ? image.altAr : image.alt || ""}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          {block.styles.showDivider && <hr className="mt-12 border-border max-w-5xl mx-auto" />}
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
  styles,
  settings,
}: {
  organization: Organization
  jobs: Job[]
  styles: PageStyles
  settings: PageSettings
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const departments = [...new Set(jobs.map((j) => j.department).filter(Boolean))]

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
    <div className="min-h-screen bg-background">
      <header
        className="relative h-64 md:h-80"
        style={{ backgroundColor: styles.primaryColor }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
            {organization.logoUrl ? (
              <img
                src={organization.logoUrl}
                alt={organization.name}
                className="h-16 w-16 rounded-lg bg-white p-2 object-contain"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-white/20 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Careers at {organization.name}
              </h1>
              <p className="text-white/80 mt-1">Join our team and make an impact</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full md:w-48">
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
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(employmentTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <p className="text-muted-foreground mb-6">
          {filteredJobs.length} {filteredJobs.length === 1 ? "position" : "positions"} available
        </p>

        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No open positions</h3>
                <p className="text-muted-foreground">Check back later for new opportunities</p>
              </CardContent>
            </Card>
          ) : (
            filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                        )}
                        {job.employment_type && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {employmentTypeLabels[job.employment_type] || job.employment_type}
                          </span>
                        )}
                      </div>
                      {formatSalary(job) && (
                        <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                          <DollarSign className="h-4 w-4" />
                          {formatSalary(job)}
                        </div>
                      )}
                    </div>
                    <Link href={`/careers/${organization.slug}/jobs/${job.id}`}>
                      <Button style={{ backgroundColor: styles.primaryColor }}>
                        View & Apply
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      <footer className="border-t mt-12 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {organization.name}. All rights reserved.</p>
          <p className="text-sm mt-2">Powered by Jadarat ATS</p>
        </div>
      </footer>
    </div>
  )
}
