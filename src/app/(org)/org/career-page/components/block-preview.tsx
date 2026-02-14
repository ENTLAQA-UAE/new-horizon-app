"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CareerPageBlock,
  CareerPageStyles,
  CareerPageSettings,
} from "@/lib/career-page/types"
import {
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  ChevronRight,
  Search,
  Mail,
  Phone,
  MapPinned,
  Heart,
  Star,
  Users,
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
  Quote,
  ExternalLink,
  ArrowRight,
} from "lucide-react"

interface Organization {
  id: string
  name: string
  name_ar: string | null
  slug: string
  logo_url: string | null
}

interface BlockPreviewProps {
  blocks: CareerPageBlock[]
  styles: CareerPageStyles
  settings: CareerPageSettings
  organization: Organization
  jobsCount: number
  previewMode: "desktop" | "mobile"
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

const paddingMap = {
  none: "py-0",
  small: "py-8",
  medium: "py-16",
  large: "py-24",
}

const alignmentMap = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
}

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
  "IBM Plex Sans Arabic": "IBM+Plex+Sans+Arabic:wght@400;500;600;700",
}

const fontSizeMap: Record<string, { headingHero: string; headingSection: string; body: string; small: string }> = {
  small: { headingHero: "text-3xl", headingSection: "text-xl", body: "text-sm", small: "text-xs" },
  medium: { headingHero: "text-5xl", headingSection: "text-2xl", body: "text-base", small: "text-sm" },
  large: { headingHero: "text-6xl", headingSection: "text-3xl", body: "text-lg", small: "text-base" },
}

export function BlockPreview({
  blocks,
  styles,
  settings,
  organization,
  jobsCount,
  previewMode,
}: BlockPreviewProps) {
  const isMobile = previewMode === "mobile"
  const fs = fontSizeMap[styles.fontSize || "medium"]

  // Load Google Fonts dynamically
  useEffect(() => {
    const fontFamily = styles.fontFamily || "Inter"
    const fontParam = googleFontMap[fontFamily]
    if (fontParam) {
      const linkId = "career-preview-google-font"
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

  return (
    <div
      className="min-h-[600px]"
      style={{
        fontFamily: styles.fontFamily,
        color: styles.textColor,
        backgroundColor: styles.backgroundColor,
      }}
    >
      {/* Header - Frosted Glass Sticky */}
      {settings.showHeader && (
        <header
          className={`
            sticky top-0 z-50 px-4 py-3 flex items-center justify-between
            backdrop-blur-xl border-b border-white/10 transition-all duration-300
            ${styles.headerStyle === "bold" ? "shadow-lg" : "shadow-sm"}
          `}
          style={{
            backgroundColor: styles.headerStyle === "bold"
              ? styles.primaryColor + "ee"
              : "rgba(255,255,255,0.85)",
            color: styles.headerStyle === "bold" ? "white" : styles.textColor,
          }}
        >
          <div className="flex items-center gap-3">
            <span className="font-semibold text-xs">{organization.name}</span>
          </div>
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
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  styles.headerStyle === "bold"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "bg-gray-900 text-white shadow-sm"
                }`}
              >
                EN
              </button>
              <button className="px-3 py-1 rounded-full text-xs opacity-60">
                عربي
              </button>
            </div>
          )}
        </header>
      )}

      {/* Blocks */}
      {blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          styles={styles}
          settings={settings}
          organization={organization}
          jobsCount={jobsCount}
          isMobile={isMobile}
          fs={fs}
        />
      ))}

      {/* Footer */}
      {settings.showFooter && (
        <footer
          className={`
            px-4 text-center
            ${styles.footerStyle === "detailed" ? "py-12" : "py-8"}
          `}
          style={{ color: styles.textColor + "80" }}
        >
          <div
            className="h-px mb-6 mx-auto"
            style={{
              background: `linear-gradient(90deg, transparent, ${styles.textColor}20, transparent)`,
              maxWidth: "400px",
            }}
          />
          {styles.footerStyle === "detailed" && (
            <div className="mb-4">
              {organization.logo_url && (
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className="h-8 mx-auto mb-2 object-contain opacity-70"
                />
              )}
            </div>
          )}
          <p className="text-xs">&copy; {new Date().getFullYear()} {organization.name}. All rights reserved.</p>
          <p className="mt-1 text-xs opacity-50">Powered by Kawadir ATS</p>
        </footer>
      )}
    </div>
  )
}

function BlockRenderer({
  block,
  styles,
  settings,
  organization,
  jobsCount,
  isMobile,
  fs,
}: {
  block: CareerPageBlock
  styles: CareerPageStyles
  settings: CareerPageSettings
  organization: Organization
  jobsCount: number
  isMobile: boolean
  fs: { headingHero: string; headingSection: string; body: string; small: string }
}) {
  const padding = paddingMap[block.styles.padding || "medium"]
  const alignment = alignmentMap[block.styles.alignment || "left"]
  const bgColor = block.styles.backgroundColor || "transparent"
  const textColor = block.styles.textColor || styles.textColor

  const containerClass = block.styles.fullWidth
    ? "px-4"
    : "container mx-auto px-4 max-w-5xl"

  switch (block.type) {
    case "hero":
      return (
        <section
          className={`relative overflow-hidden flex items-center`}
          style={{
            backgroundColor: block.content.backgroundImage ? undefined : styles.primaryColor,
            backgroundImage: block.content.backgroundImage
              ? `url(${block.content.backgroundImage})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            minHeight: isMobile ? "300px" : "400px",
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
            <div className="absolute top-10 -right-10 w-48 h-48 rounded-full blur-3xl bg-white" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-3xl bg-white" />
          </div>
          <div className={`${containerClass} relative z-10 ${padding} flex flex-col justify-center h-full ${alignment}`}>
            {/* Logo in Hero */}
            {settings.showLogo && organization.logo_url && (
              <div className="mb-6">
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className={`${isMobile ? "h-10" : "h-14"} object-contain bg-white/10 backdrop-blur-sm rounded-xl p-2 shadow-xl`}
                  style={{ display: block.styles.alignment === "center" ? "block" : "inline-block", marginInline: block.styles.alignment === "center" ? "auto" : undefined }}
                />
              </div>
            )}
            <h1
              className={`
                font-extrabold text-white mb-4 tracking-tight leading-tight
                ${isMobile ? "text-3xl" : fs.headingHero}
              `}
            >
              {block.content.title}
            </h1>
            {block.content.subtitle && (
              <p className={`text-white/80 mb-8 ${isMobile ? "text-base" : fs.body}`}>
                {block.content.subtitle}
              </p>
            )}
            <div className={`flex gap-3 ${block.styles.alignment === "center" ? "justify-center" : ""}`}>
              {block.content.ctaText && (
                <Button
                  size={isMobile ? "sm" : "lg"}
                  className="bg-white hover:bg-white/90 shadow-xl font-semibold"
                  style={{ color: styles.primaryColor, borderRadius: styles.borderRadius }}
                >
                  {block.content.ctaText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {block.content.secondaryCtaText && (
                <Button
                  size={isMobile ? "sm" : "lg"}
                  variant="outline"
                  className="border-2 border-white/40 text-white hover:bg-white/10 backdrop-blur-sm font-semibold"
                  style={{ borderRadius: styles.borderRadius }}
                >
                  {block.content.secondaryCtaText}
                </Button>
              )}
            </div>
          </div>
        </section>
      )

    case "about":
      return (
        <section className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
          <div className={containerClass}>
            <h2 className={`font-bold mb-4 ${alignment} ${isMobile ? "text-xl" : fs.headingSection}`}>
              {block.content.title}
            </h2>
            {block.content.description && (
              <p className={`text-muted-foreground leading-relaxed ${alignment} ${isMobile ? "text-sm" : fs.body}`}>
                {block.content.description}
              </p>
            )}
          </div>
          {block.styles.showDivider && (
            <div className="mt-8 mx-auto" style={{ maxWidth: "600px" }}>
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
        <section className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
          <div className={containerClass}>
            <h2 className={`font-bold mb-10 ${alignment} ${isMobile ? "text-xl" : fs.headingSection}`}>
              {block.content.title}
            </h2>
            <div
              className={`grid gap-5 ${
                isMobile
                  ? "grid-cols-1"
                  : columns === 2
                  ? "grid-cols-2"
                  : columns === 4
                  ? "grid-cols-4"
                  : "grid-cols-3"
              }`}
            >
              {items.map((item) => {
                const Icon = iconMap[item.icon || "Star"] || Star
                return (
                  <div
                    key={item.id}
                    className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100/50"
                    style={{
                      textAlign: (block.styles.alignment as any) || "left",
                      borderRadius: styles.borderRadius,
                    }}
                  >
                    <div
                      className={`
                        w-12 h-12 rounded-2xl flex items-center justify-center mb-4
                        ${block.styles.alignment === "center" ? "mx-auto" : ""}
                      `}
                      style={{ backgroundColor: styles.primaryColor + "12" }}
                    >
                      <Icon className="h-6 w-6" style={{ color: styles.primaryColor }} />
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className={`${fs.small} text-muted-foreground leading-relaxed`}>{item.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
          {block.styles.showDivider && (
            <div className="mt-8 mx-auto" style={{ maxWidth: "600px" }}>
              <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${styles.textColor}15, transparent)` }} />
            </div>
          )}
        </section>
      )

    case "stats":
      const statItems = block.content.items || []
      const statColumns = block.styles.columns || 3
      return (
        <section className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
          <div className={containerClass}>
            {block.content.title && (
              <h2 className={`font-bold mb-10 ${alignment} ${isMobile ? "text-xl" : fs.headingSection}`}>
                {block.content.title}
              </h2>
            )}
            <div
              className={`grid gap-6 ${
                isMobile
                  ? "grid-cols-2"
                  : statColumns === 2
                  ? "grid-cols-2"
                  : statColumns === 4
                  ? "grid-cols-4"
                  : "grid-cols-3"
              }`}
            >
              {statItems.map((item) => (
                <div key={item.id} className="text-center group">
                  <div
                    className={`font-extrabold mb-1 ${isMobile ? "text-3xl" : "text-4xl"}`}
                    style={{ color: styles.primaryColor }}
                  >
                    {item.value}
                  </div>
                  <div className={`text-muted-foreground font-medium ${fs.small}`}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          {block.styles.showDivider && (
            <div className="mt-8 mx-auto" style={{ maxWidth: "600px" }}>
              <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${styles.textColor}15, transparent)` }} />
            </div>
          )}
        </section>
      )

    case "team":
      const teamItems = block.content.items || []
      const teamColumns = block.styles.columns || 4
      return (
        <section className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
          <div className={containerClass}>
            <h2 className={`font-bold mb-10 ${alignment} ${isMobile ? "text-xl" : fs.headingSection}`}>
              {block.content.title}
            </h2>
            <div
              className={`grid gap-8 ${
                isMobile
                  ? "grid-cols-2"
                  : teamColumns === 2
                  ? "grid-cols-2"
                  : teamColumns === 3
                  ? "grid-cols-3"
                  : "grid-cols-4"
              }`}
            >
              {teamItems.map((item) => (
                <div key={item.id} className="text-center group">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-24 h-24 rounded-full mx-auto mb-3 object-cover ring-4 ring-white shadow-lg transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-full mx-auto mb-3 flex items-center justify-center ring-4 ring-white shadow-lg"
                      style={{ backgroundColor: styles.primaryColor + "12" }}
                    >
                      <Users className="h-10 w-10" style={{ color: styles.primaryColor }} />
                    </div>
                  )}
                  <h3 className="font-semibold">{item.title}</h3>
                  {item.role && (
                    <p className={`${fs.small} text-muted-foreground mt-1`}>{item.role}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          {block.styles.showDivider && (
            <div className="mt-8 mx-auto" style={{ maxWidth: "600px" }}>
              <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${styles.textColor}15, transparent)` }} />
            </div>
          )}
        </section>
      )

    case "testimonials":
      const testimonialItems = block.content.items || []
      return (
        <section className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
          <div className={containerClass}>
            <h2 className={`font-bold mb-10 ${alignment} ${isMobile ? "text-xl" : fs.headingSection}`}>
              {block.content.title}
            </h2>
            <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
              {testimonialItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100/50"
                  style={{ borderRadius: styles.borderRadius }}
                >
                  <Quote className="h-8 w-8 mb-3 opacity-20" style={{ color: styles.primaryColor }} />
                  <p className="text-muted-foreground mb-4 italic leading-relaxed">{item.description}</p>
                  <div className="flex items-center gap-3">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.author}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: styles.primaryColor + "12" }}
                      >
                        <Users className="h-5 w-5" style={{ color: styles.primaryColor }} />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-sm">{item.author || item.title}</div>
                      {item.authorRole && (
                        <div className="text-xs text-muted-foreground">{item.authorRole}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {block.styles.showDivider && (
            <div className="mt-8 mx-auto" style={{ maxWidth: "600px" }}>
              <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${styles.textColor}15, transparent)` }} />
            </div>
          )}
        </section>
      )

    case "jobs":
      return (
        <section id="jobs" className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
          <div className={containerClass}>
            <h2 className={`font-bold mb-8 ${alignment} ${isMobile ? "text-xl" : fs.headingSection}`}>
              {block.content.title}
            </h2>

            {settings.showJobSearch && (
              <div
                className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
                style={{ borderRadius: styles.borderRadius }}
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
                    style={{ borderRadius: styles.borderRadius }}
                    disabled
                  />
                </div>
              </div>
            )}

            <p className={`text-muted-foreground mb-6 ${fs.small}`}>
              {jobsCount} {jobsCount === 1 ? "position" : "positions"} available
            </p>

            {/* Job Cards Grid */}
            <div className={`grid gap-5 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
                  style={{ borderRadius: styles.borderRadius }}
                >
                  {/* Thumbnail placeholder */}
                  <div
                    className="relative h-28 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${styles.primaryColor}12 0%, ${styles.primaryColor}06 100%)`,
                    }}
                  >
                    <Briefcase className="h-8 w-8" style={{ color: styles.primaryColor + "40" }} />
                  </div>
                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 text-sm">Sample Job Title {i}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Location
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        Full-time
                      </span>
                    </div>
                    <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                      <span
                        className="text-xs font-semibold flex items-center gap-1"
                        style={{ color: styles.primaryColor }}
                      >
                        View & Apply
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {block.styles.showDivider && (
            <div className="mt-8 mx-auto" style={{ maxWidth: "600px" }}>
              <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${styles.textColor}15, transparent)` }} />
            </div>
          )}
        </section>
      )

    case "cta":
      return (
        <section
          className={`${padding} ${alignment} relative overflow-hidden`}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${styles.primaryColor} 0%, ${styles.secondaryColor || styles.primaryColor}cc 100%)`,
            }}
          />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-5 right-5 w-32 h-32 rounded-full blur-3xl bg-white" />
            <div className="absolute bottom-5 left-5 w-24 h-24 rounded-full blur-3xl bg-white" />
          </div>
          <div className={`${containerClass} relative z-10`}>
            <h2 className={`font-bold text-white mb-3 ${isMobile ? "text-xl" : fs.headingSection}`}>
              {block.content.title}
            </h2>
            {block.content.subtitle && (
              <p className="text-white/80 mb-8">{block.content.subtitle}</p>
            )}
            {block.content.ctaText && (
              <Button
                size={isMobile ? "default" : "lg"}
                className="bg-white hover:bg-white/90 shadow-xl font-semibold"
                style={{ color: styles.primaryColor, borderRadius: styles.borderRadius }}
              >
                {block.content.ctaText}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </section>
      )

    case "contact":
      return (
        <section className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
          <div className={containerClass}>
            <h2 className={`font-bold mb-8 ${alignment} ${isMobile ? "text-xl" : fs.headingSection}`}>
              {block.content.title}
            </h2>
            <div className={`space-y-5 ${block.styles.alignment === "center" ? "max-w-md mx-auto" : ""}`}>
              {block.content.email && (
                <div className="flex items-center gap-4 group">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: styles.primaryColor + "12" }}
                  >
                    <Mail className="h-5 w-5" style={{ color: styles.primaryColor }} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Email</div>
                    <div className="font-medium text-sm">{block.content.email}</div>
                  </div>
                </div>
              )}
              {block.content.phone && (
                <div className="flex items-center gap-4 group">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: styles.primaryColor + "12" }}
                  >
                    <Phone className="h-5 w-5" style={{ color: styles.primaryColor }} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="font-medium text-sm">{block.content.phone}</div>
                  </div>
                </div>
              )}
              {block.content.address && (
                <div className="flex items-center gap-4 group">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: styles.primaryColor + "12" }}
                  >
                    <MapPinned className="h-5 w-5" style={{ color: styles.primaryColor }} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Address</div>
                    <div className="font-medium text-sm">{block.content.address}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {block.styles.showDivider && (
            <div className="mt-8 mx-auto" style={{ maxWidth: "600px" }}>
              <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${styles.textColor}15, transparent)` }} />
            </div>
          )}
        </section>
      )

    case "gallery":
      const images = block.content.images || []
      const galleryColumns = block.styles.columns || 3
      return (
        <section className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
          <div className={containerClass}>
            {block.content.title && (
              <h2 className={`font-bold mb-8 ${alignment} ${isMobile ? "text-xl" : fs.headingSection}`}>
                {block.content.title}
              </h2>
            )}
            {images.length > 0 ? (
              <div
                className={`grid gap-4 ${
                  isMobile
                    ? "grid-cols-2"
                    : galleryColumns === 2
                    ? "grid-cols-2"
                    : galleryColumns === 4
                    ? "grid-cols-4"
                    : "grid-cols-3"
                }`}
              >
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="aspect-video rounded-lg overflow-hidden group"
                    style={{ borderRadius: styles.borderRadius }}
                  >
                    <img
                      src={image.url}
                      alt={image.alt || ""}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="aspect-video bg-muted rounded-lg flex items-center justify-center"
                    style={{ borderRadius: styles.borderRadius }}
                  >
                    <span className="text-muted-foreground text-sm">Image {i}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {block.styles.showDivider && (
            <div className="mt-8 mx-auto" style={{ maxWidth: "600px" }}>
              <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${styles.textColor}15, transparent)` }} />
            </div>
          )}
        </section>
      )

    case "custom":
      return (
        <section className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
          <div className={containerClass}>
            {block.content.html ? (
              <div dangerouslySetInnerHTML={{ __html: block.content.html }} />
            ) : (
              <div className="p-8 border-2 border-dashed rounded-2xl text-center text-muted-foreground">
                Custom HTML content will appear here
              </div>
            )}
          </div>
          {block.styles.showDivider && (
            <div className="mt-8 mx-auto" style={{ maxWidth: "600px" }}>
              <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${styles.textColor}15, transparent)` }} />
            </div>
          )}
        </section>
      )

    default:
      return null
  }
}
