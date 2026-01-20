"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  small: "py-6",
  medium: "py-12",
  large: "py-20",
}

const alignmentMap = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
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

  return (
    <div
      className="min-h-[600px]"
      style={{
        fontFamily: styles.fontFamily,
        color: styles.textColor,
        backgroundColor: styles.backgroundColor,
      }}
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
            {settings.showLogo && organization.logo_url ? (
              <img
                src={organization.logo_url}
                alt={organization.name}
                className="h-8 object-contain"
              />
            ) : settings.showLogo ? (
              <div
                className="w-8 h-8 rounded flex items-center justify-center text-white"
                style={{ backgroundColor: styles.primaryColor }}
              >
                <Building2 className="h-4 w-4" />
              </div>
            ) : null}
            {styles.headerStyle !== "minimal" && (
              <span className="font-semibold">{organization.name}</span>
            )}
          </div>
          {settings.language === "both" && (
            <div className="flex gap-2 text-sm">
              <button className="px-2 py-1 rounded hover:bg-black/10">EN</button>
              <button className="px-2 py-1 rounded hover:bg-black/10">عربي</button>
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
          {styles.footerStyle === "detailed" && (
            <div className="mb-4">
              {organization.logo_url && (
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className="h-8 mx-auto mb-2 object-contain"
                />
              )}
              <p className="font-medium">{organization.name}</p>
            </div>
          )}
          <p>&copy; {new Date().getFullYear()} {organization.name}. All rights reserved.</p>
          <p className="mt-1 text-xs">Powered by Jadarat ATS</p>
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
}: {
  block: CareerPageBlock
  styles: CareerPageStyles
  settings: CareerPageSettings
  organization: Organization
  jobsCount: number
  isMobile: boolean
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
          className={`${padding} relative`}
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
          {block.content.backgroundImage && (
            <div className="absolute inset-0 bg-black/50" />
          )}
          <div className={`${containerClass} relative z-10 flex flex-col justify-center h-full ${alignment}`}>
            <h1
              className={`
                font-bold text-white mb-3
                ${isMobile ? "text-2xl" : "text-4xl"}
              `}
            >
              {block.content.title}
            </h1>
            {block.content.subtitle && (
              <p className={`text-white/80 mb-6 ${isMobile ? "text-base" : "text-xl"}`}>
                {block.content.subtitle}
              </p>
            )}
            <div className={`flex gap-3 ${block.styles.alignment === "center" ? "justify-center" : ""}`}>
              {block.content.ctaText && (
                <Button
                  size={isMobile ? "sm" : "lg"}
                  className="bg-white hover:bg-white/90"
                  style={{ color: styles.primaryColor }}
                >
                  {block.content.ctaText}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
              {block.content.secondaryCtaText && (
                <Button
                  size={isMobile ? "sm" : "lg"}
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
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
            <h2 className={`font-bold mb-4 ${alignment} ${isMobile ? "text-xl" : "text-2xl"}`}>
              {block.content.title}
            </h2>
            {block.content.description && (
              <p className={`text-muted-foreground leading-relaxed ${alignment} ${isMobile ? "text-sm" : ""}`}>
                {block.content.description}
              </p>
            )}
          </div>
          {block.styles.showDivider && <hr className="mt-8 border-border" />}
        </section>
      )

    case "values":
    case "benefits":
      const columns = block.styles.columns || 3
      const items = block.content.items || []
      return (
        <section className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
          <div className={containerClass}>
            <h2 className={`font-bold mb-8 ${alignment} ${isMobile ? "text-xl" : "text-2xl"}`}>
              {block.content.title}
            </h2>
            <div
              className={`grid gap-6 ${
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
                  <Card
                    key={item.id}
                    className="border-none shadow-none bg-transparent"
                    style={{ textAlign: block.styles.alignment || "left" }}
                  >
                    <CardContent className="p-4">
                      <div
                        className={`
                          w-12 h-12 rounded-lg flex items-center justify-center mb-3
                          ${block.styles.alignment === "center" ? "mx-auto" : ""}
                        `}
                        style={{ backgroundColor: styles.primaryColor + "20" }}
                      >
                        <Icon className="h-6 w-6" style={{ color: styles.primaryColor }} />
                      </div>
                      <h3 className="font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
          {block.styles.showDivider && <hr className="mt-8 border-border" />}
        </section>
      )

    case "stats":
      const statItems = block.content.items || []
      const statColumns = block.styles.columns || 3
      return (
        <section className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
          <div className={containerClass}>
            {block.content.title && (
              <h2 className={`font-bold mb-8 ${alignment} ${isMobile ? "text-xl" : "text-2xl"}`}>
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
                <div key={item.id} className="text-center">
                  <div
                    className={`font-bold ${isMobile ? "text-3xl" : "text-4xl"}`}
                    style={{ color: styles.primaryColor }}
                  >
                    {item.value}
                  </div>
                  <div className="text-muted-foreground mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          {block.styles.showDivider && <hr className="mt-8 border-border" />}
        </section>
      )

    case "team":
      const teamItems = block.content.items || []
      const teamColumns = block.styles.columns || 4
      return (
        <section className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
          <div className={containerClass}>
            <h2 className={`font-bold mb-8 ${alignment} ${isMobile ? "text-xl" : "text-2xl"}`}>
              {block.content.title}
            </h2>
            <div
              className={`grid gap-6 ${
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
                <div key={item.id} className="text-center">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-24 h-24 rounded-full mx-auto mb-3 object-cover"
                    />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold"
                      style={{ backgroundColor: styles.primaryColor }}
                    >
                      {item.title?.charAt(0)}
                    </div>
                  )}
                  <h3 className="font-semibold">{item.title}</h3>
                  {item.role && (
                    <p className="text-sm text-muted-foreground">{item.role}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          {block.styles.showDivider && <hr className="mt-8 border-border" />}
        </section>
      )

    case "testimonials":
      const testimonialItems = block.content.items || []
      return (
        <section className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
          <div className={containerClass}>
            <h2 className={`font-bold mb-8 ${alignment} ${isMobile ? "text-xl" : "text-2xl"}`}>
              {block.content.title}
            </h2>
            <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
              {testimonialItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <Quote className="h-8 w-8 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground mb-4">{item.description}</p>
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.author}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: styles.primaryColor }}
                        >
                          {item.author?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-sm">{item.author}</div>
                        {item.authorRole && (
                          <div className="text-xs text-muted-foreground">{item.authorRole}</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          {block.styles.showDivider && <hr className="mt-8 border-border" />}
        </section>
      )

    case "jobs":
      return (
        <section id="jobs" className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
          <div className={containerClass}>
            <h2 className={`font-bold mb-6 ${alignment} ${isMobile ? "text-xl" : "text-2xl"}`}>
              {block.content.title}
            </h2>

            {settings.showJobSearch && (
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    style={{ borderRadius: styles.borderRadius }}
                    disabled
                  />
                </div>
              </div>
            )}

            <p className="text-muted-foreground mb-4">
              {jobsCount} {jobsCount === 1 ? "position" : "positions"} available
            </p>

            {/* Sample job cards */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} style={{ borderRadius: styles.borderRadius }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Sample Job Title {i}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Location
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            Full-time
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          This is a sample job description that would appear here...
                        </p>
                      </div>
                      <Button
                        size="sm"
                        style={{ backgroundColor: styles.primaryColor }}
                      >
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          {block.styles.showDivider && <hr className="mt-8 border-border" />}
        </section>
      )

    case "cta":
      return (
        <section
          className={`${padding} ${alignment}`}
          style={{ backgroundColor: styles.primaryColor }}
        >
          <div className={containerClass}>
            <h2 className={`font-bold text-white mb-2 ${isMobile ? "text-xl" : "text-2xl"}`}>
              {block.content.title}
            </h2>
            {block.content.subtitle && (
              <p className="text-white/80 mb-6">{block.content.subtitle}</p>
            )}
            {block.content.ctaText && (
              <Button
                size={isMobile ? "default" : "lg"}
                className="bg-white hover:bg-white/90"
                style={{ color: styles.primaryColor }}
              >
                {block.content.ctaText}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </section>
      )

    case "contact":
      return (
        <section className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
          <div className={containerClass}>
            <h2 className={`font-bold mb-6 ${alignment} ${isMobile ? "text-xl" : "text-2xl"}`}>
              {block.content.title}
            </h2>
            <div className={`space-y-4 ${block.styles.alignment === "center" ? "max-w-md mx-auto" : ""}`}>
              {block.content.email && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: styles.primaryColor + "20" }}
                  >
                    <Mail className="h-5 w-5" style={{ color: styles.primaryColor }} />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium">{block.content.email}</div>
                  </div>
                </div>
              )}
              {block.content.phone && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: styles.primaryColor + "20" }}
                  >
                    <Phone className="h-5 w-5" style={{ color: styles.primaryColor }} />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-medium">{block.content.phone}</div>
                  </div>
                </div>
              )}
              {block.content.address && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: styles.primaryColor + "20" }}
                  >
                    <MapPinned className="h-5 w-5" style={{ color: styles.primaryColor }} />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Address</div>
                    <div className="font-medium">{block.content.address}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {block.styles.showDivider && <hr className="mt-8 border-border" />}
        </section>
      )

    case "gallery":
      const images = block.content.images || []
      const galleryColumns = block.styles.columns || 3
      return (
        <section className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
          <div className={containerClass}>
            {block.content.title && (
              <h2 className={`font-bold mb-6 ${alignment} ${isMobile ? "text-xl" : "text-2xl"}`}>
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
                    className="aspect-video rounded-lg overflow-hidden"
                    style={{ borderRadius: styles.borderRadius }}
                  >
                    <img
                      src={image.url}
                      alt={image.alt || ""}
                      className="w-full h-full object-cover"
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
          {block.styles.showDivider && <hr className="mt-8 border-border" />}
        </section>
      )

    case "custom":
      return (
        <section className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
          <div className={containerClass}>
            {block.content.html ? (
              <div dangerouslySetInnerHTML={{ __html: block.content.html }} />
            ) : (
              <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                Custom HTML content will appear here
              </div>
            )}
          </div>
          {block.styles.showDivider && <hr className="mt-8 border-border" />}
        </section>
      )

    default:
      return null
  }
}
