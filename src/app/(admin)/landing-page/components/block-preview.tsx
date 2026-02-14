"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  LandingPageBlock,
  LandingPageStyles,
  LandingPageSettings,
  LandingNavbar,
  LandingFooter,
} from "@/lib/landing-page/types"
import {
  Zap,
  Users,
  BarChart3,
  Globe,
  Shield,
  Briefcase,
  Heart,
  Rocket,
  UserPlus,
  FileText,
  CheckCircle,
  ArrowRight,
  Star,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  Layers,
  Clock,
  Target,
  Award,
  TrendingUp,
  Lightbulb,
  Coffee,
  Gift,
  Smile,
  MousePointer,
  Quote,
  Languages,
} from "lucide-react"

interface BlockPreviewProps {
  blocks: LandingPageBlock[]
  styles: LandingPageStyles
  settings: LandingPageSettings
  navbar: LandingNavbar
  footer: LandingFooter
  previewMode: "desktop" | "mobile"
  platformLogo?: string | null
}

const iconMap: Record<string, any> = {
  Zap, Users, BarChart3, Globe, Shield, Briefcase, Heart, Rocket,
  UserPlus, FileText, CheckCircle, Star, Target, TrendingUp,
  Lightbulb, Clock, Award, Layers, MousePointer, Gift, Coffee, Smile,
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
  navbar,
  footer,
  previewMode,
  platformLogo,
}: BlockPreviewProps) {
  const isMobile = previewMode === "mobile"
  const fs = fontSizeMap[styles.fontSize || "medium"]
  const gradient = `linear-gradient(135deg, ${styles.primaryColor} 0%, ${styles.secondaryColor} 100%)`
  const logoUrl = navbar.logoUrl || platformLogo

  useEffect(() => {
    const fontFamily = styles.fontFamily || "Inter"
    const fontParam = googleFontMap[fontFamily]
    if (fontParam) {
      const linkId = "landing-preview-google-font"
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
      {/* Header */}
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
            {settings.showLogo && logoUrl && (
              <img src={logoUrl} alt="Logo" className="h-6 object-contain" />
            )}
            {settings.showLogo && !logoUrl && (
              <div className="flex items-center gap-1.5">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ background: styles.headerStyle === "bold" ? "rgba(255,255,255,0.2)" : gradient }}
                >
                  <Layers className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-semibold text-xs">{footer.companyName || "Company"}</span>
              </div>
            )}
            {!isMobile && (
              <div className="flex items-center gap-3 ml-4">
                {(navbar.links || []).map((link, i) => (
                  <span key={i} className="text-xs opacity-70">{link.label}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {settings.language === "both" && (
              <div
                className="flex rounded-full p-0.5"
                style={{
                  backgroundColor: styles.headerStyle === "bold"
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.05)",
                }}
              >
                <button
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    styles.headerStyle === "bold"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "bg-gray-900 text-white shadow-sm"
                  }`}
                >
                  EN
                </button>
                <button className="px-2 py-0.5 rounded-full text-[10px] opacity-60">
                  عربي
                </button>
              </div>
            )}
            {navbar.ctaText && (
              <button
                className="px-3 py-1 text-[10px] font-semibold text-white rounded-md"
                style={{ background: styles.headerStyle === "bold" ? "rgba(255,255,255,0.2)" : gradient }}
              >
                {navbar.ctaText}
              </button>
            )}
          </div>
        </header>
      )}

      {/* Blocks */}
      {blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          styles={styles}
          isMobile={isMobile}
          fs={fs}
          gradient={gradient}
        />
      ))}

      {/* Footer */}
      {settings.showFooter && (
        <footer
          className={`px-4 text-center ${styles.footerStyle === "detailed" ? "py-12" : "py-8"}`}
          style={{ backgroundColor: "#111827", color: "rgba(255,255,255,0.6)" }}
        >
          <div
            className="h-px mb-6 mx-auto"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
              maxWidth: "400px",
            }}
          />
          {styles.footerStyle === "detailed" && (
            <div className="mb-4">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-6 mx-auto mb-2 object-contain opacity-70"
                />
              )}
              {footer.description && (
                <p className="text-xs opacity-60 max-w-md mx-auto">{footer.description}</p>
              )}
            </div>
          )}
          <p className="text-[10px] opacity-60">
            {footer.copyright || `© ${new Date().getFullYear()} ${footer.companyName || "Company"}. All rights reserved.`}
          </p>
        </footer>
      )}
    </div>
  )
}

function BlockRenderer({
  block,
  styles,
  isMobile,
  fs,
  gradient,
}: {
  block: LandingPageBlock
  styles: LandingPageStyles
  isMobile: boolean
  fs: { headingHero: string; headingSection: string; body: string; small: string }
  gradient: string
}) {
  const padding = paddingMap[block.styles.padding || "medium"]
  const alignment = alignmentMap[block.styles.alignment || "left"]
  const bgColor = block.styles.backgroundColor || "transparent"
  const textColor = block.styles.textColor || styles.textColor
  const containerClass = block.styles.fullWidth ? "px-4" : "container mx-auto px-4 max-w-5xl"

  switch (block.type) {
    case "hero":
      return (
        <section
          className="relative overflow-hidden flex items-center"
          style={{
            backgroundColor: block.content.backgroundImage ? undefined : styles.primaryColor,
            backgroundImage: block.content.backgroundImage ? `url(${block.content.backgroundImage})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            minHeight: isMobile ? "300px" : "400px",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: block.content.backgroundImage
                ? `linear-gradient(135deg, ${styles.primaryColor}cc 0%, rgba(0,0,0,0.6) 100%)`
                : gradient,
            }}
          />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 -right-10 w-48 h-48 rounded-full blur-3xl bg-white" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-3xl bg-white" />
          </div>
          <div className={`${containerClass} relative z-10 ${padding} flex flex-col justify-center h-full ${alignment}`}>
            {block.content.badge && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4 bg-white/15 text-white backdrop-blur-sm" style={{ display: block.styles.alignment === "center" ? "inline-flex" : undefined, marginInline: block.styles.alignment === "center" ? "auto" : undefined }}>
                <Zap className="h-3 w-3" />
                {block.content.badge}
              </div>
            )}
            <h1
              className={`font-extrabold text-white mb-4 tracking-tight leading-tight ${isMobile ? "text-3xl" : fs.headingHero}`}
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

    case "features":
    case "how_it_works": {
      const items = block.content.items || []
      const columns = block.styles.columns || 3
      return (
        <section className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
          <div className={containerClass}>
            <h2 className={`font-bold mb-3 ${alignment} ${isMobile ? "text-xl" : fs.headingSection}`}>
              {block.content.title}
            </h2>
            {block.content.subtitle && (
              <p className={`text-muted-foreground mb-10 ${alignment} ${fs.small}`}>
                {block.content.subtitle}
              </p>
            )}
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
              {items.map((item, i) => {
                const Icon = iconMap[item.icon || "Star"] || Star
                return (
                  <div
                    key={item.id}
                    className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100/50"
                    style={{ textAlign: (block.styles.alignment as any) || "left", borderRadius: styles.borderRadius }}
                  >
                    {block.type === "how_it_works" && (
                      <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: styles.primaryColor }}>
                        Step {item.step || i + 1}
                      </div>
                    )}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${block.styles.alignment === "center" ? "mx-auto" : ""}`}
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
    }

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

    case "stats": {
      const statItems = block.content.items || []
      const statColumns = block.styles.columns || 4
      return (
        <section className={padding} style={{ backgroundColor: bgColor || `${styles.primaryColor}05`, color: textColor }}>
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
                  : statColumns === 3
                  ? "grid-cols-3"
                  : "grid-cols-4"
              }`}
            >
              {statItems.map((item) => (
                <div key={item.id} className="text-center">
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
    }

    case "testimonials": {
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
                  <Quote className="h-6 w-6 mb-3 opacity-20" style={{ color: styles.primaryColor }} />
                  <p className="text-muted-foreground mb-4 italic leading-relaxed text-sm">{item.description}</p>
                  <div className="flex items-center gap-3">
                    {item.authorImage ? (
                      <img src={item.authorImage} alt={item.author} className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100" />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: gradient }}
                      >
                        {(item.author || "?")[0]}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-xs">{item.author || item.title}</div>
                      {item.authorRole && (
                        <div className="text-[10px] text-muted-foreground">{item.authorRole}</div>
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
    }

    case "pricing": {
      const pricingItems = block.content.items || []
      return (
        <section className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
          <div className={containerClass}>
            <h2 className={`font-bold mb-3 ${alignment} ${isMobile ? "text-xl" : fs.headingSection}`}>
              {block.content.title}
            </h2>
            {block.content.subtitle && (
              <p className={`text-muted-foreground mb-10 ${alignment} ${fs.small}`}>
                {block.content.subtitle}
              </p>
            )}
            <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-3"} max-w-4xl mx-auto`}>
              {pricingItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    item.featured ? "border-transparent shadow-xl relative" : "border-gray-100 bg-white"
                  }`}
                  style={item.featured ? { borderColor: styles.primaryColor, background: `linear-gradient(180deg, ${styles.primaryColor}08, white)` } : { borderRadius: styles.borderRadius }}
                >
                  {item.featured && (
                    <div
                      className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
                      style={{ background: gradient }}
                    >
                      POPULAR
                    </div>
                  )}
                  <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-xs mb-3">{item.description}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-extrabold">{item.price}</span>
                    {item.period && <span className="text-muted-foreground text-sm">{item.period}</span>}
                  </div>
                  <div className="space-y-2 mb-6">
                    {(item.features || []).map((feature, fi) => (
                      <div key={fi} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3.5 w-3.5 shrink-0" style={{ color: styles.primaryColor }} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className={`w-full font-semibold ${item.featured ? "text-white" : ""}`}
                    variant={item.featured ? "default" : "outline"}
                    style={item.featured
                      ? { background: gradient, borderRadius: styles.borderRadius }
                      : { borderColor: styles.primaryColor, color: styles.primaryColor, borderRadius: styles.borderRadius }
                    }
                    size="sm"
                  >
                    {item.ctaText || "Get Started"}
                  </Button>
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
    }

    case "clients": {
      const clientItems = block.content.items || []
      return (
        <section className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
          <div className={containerClass}>
            <h2 className={`text-lg font-semibold text-muted-foreground mb-8 ${alignment}`}>
              {block.content.title}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-10">
              {clientItems.map((item) => (
                <div key={item.id} className="grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="h-8 object-contain" />
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">{item.title}</span>
                  )}
                </div>
              ))}
              {clientItems.length === 0 && (
                <p className="text-muted-foreground text-sm">Add client logos to display here</p>
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
    }

    case "faq": {
      const faqItems = block.content.items || []
      return (
        <section className={padding} style={{ backgroundColor: bgColor, color: textColor }}>
          <div className={containerClass + " max-w-3xl"}>
            <h2 className={`font-bold mb-10 ${alignment} ${isMobile ? "text-xl" : fs.headingSection}`}>
              {block.content.title}
            </h2>
            <div className="space-y-3">
              {faqItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                  style={{ borderRadius: styles.borderRadius }}
                >
                  <div className="flex items-center justify-between p-4 font-medium text-sm">
                    {item.title}
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </div>
              ))}
              {faqItems.length === 0 && (
                <p className="text-muted-foreground text-sm text-center">Add FAQ items to display here</p>
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
    }

    case "cta":
      return (
        <section className={`${padding} ${alignment} relative overflow-hidden`}>
          <div className="absolute inset-0" style={{ background: gradient }} />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-5 right-5 w-32 h-32 rounded-full blur-3xl bg-white" />
            <div className="absolute bottom-5 left-5 w-24 h-24 rounded-full blur-3xl bg-white" />
          </div>
          <div className={`${containerClass} relative z-10`}>
            <h2 className={`font-bold text-white mb-3 ${isMobile ? "text-xl" : fs.headingSection}`}>
              {block.content.title}
            </h2>
            {block.content.subtitle && (
              <p className="text-white/80 mb-8 text-sm">{block.content.subtitle}</p>
            )}
            <div className={`flex gap-3 ${block.styles.alignment === "center" ? "justify-center" : ""}`}>
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
              {block.content.secondaryCtaText && (
                <Button
                  size={isMobile ? "default" : "lg"}
                  variant="outline"
                  className="border-2 border-white/40 text-white hover:bg-white/10"
                  style={{ borderRadius: styles.borderRadius }}
                >
                  {block.content.secondaryCtaText}
                </Button>
              )}
            </div>
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
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
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
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
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
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: styles.primaryColor + "12" }}
                  >
                    <MapPin className="h-5 w-5" style={{ color: styles.primaryColor }} />
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
