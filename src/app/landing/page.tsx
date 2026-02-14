"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import {
  LandingPageBlock,
  LandingPageConfig,
  LandingBlockType,
  LandingContentItem,
  LandingPageSettings,
  defaultLandingConfig,
  defaultLandingBlocks,
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
  ArrowLeft,
  Star,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  Loader2,
  Layers,
  Clock,
  Target,
  Award,
  TrendingUp,
  MousePointer,
  Play,
  Languages,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Lang = "en" | "ar"

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, Users, BarChart3, Globe, Shield, Briefcase, Heart, Rocket,
  UserPlus, FileText, CheckCircle, ArrowRight, Star, Mail, Phone,
  MapPin, Layers, Clock, Target, Award, TrendingUp, MousePointer, Play,
}

function getIcon(name?: string) {
  if (!name) return Star
  return iconMap[name] || Star
}

/** Pick English or Arabic text, falling back to English */
function t(en?: string, ar?: string, lang: Lang = "en") {
  if (lang === "ar") return ar || en || ""
  return en || ""
}

export default function LandingPage() {
  const [blocks, setBlocks] = useState<LandingPageBlock[]>([])
  const [config, setConfig] = useState<LandingPageConfig>(defaultLandingConfig)
  const [isLoading, setIsLoading] = useState(true)
  const [platformLogo, setPlatformLogo] = useState<string | null>(null)
  const [lang, setLang] = useState<Lang>("en")
  const [langInit, setLangInit] = useState(false)

  // Load Google Fonts dynamically (both EN and AR fonts)
  useEffect(() => {
    const fontFamily = config.styles.fontFamily || "Inter"
    const fontFamilyAr = config.styles.fontFamilyAr || "Cairo"
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
      "Noto Sans Arabic": "Noto+Sans+Arabic:wght@400;500;600;700;800",
      Almarai: "Almarai:wght@300;400;700;800",
      "El Messiri": "El+Messiri:wght@400;500;600;700",
      Changa: "Changa:wght@300;400;500;600;700;800",
      "Readex Pro": "Readex+Pro:wght@300;400;500;600;700",
    }
    const families: string[] = []
    const fontParam = googleFontMap[fontFamily]
    if (fontParam) families.push(`family=${fontParam}`)
    if (fontFamilyAr !== fontFamily) {
      const arParam = googleFontMap[fontFamilyAr]
      if (arParam) families.push(`family=${arParam}`)
    }
    if (families.length > 0) {
      const linkId = "landing-google-font"
      let link = document.getElementById(linkId) as HTMLLinkElement | null
      if (!link) {
        link = document.createElement("link")
        link.id = linkId
        link.rel = "stylesheet"
        document.head.appendChild(link)
      }
      link.href = `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`
    }
  }, [config.styles.fontFamily, config.styles.fontFamilyAr])

  const toggleLang = () => {
    const next = lang === "en" ? "ar" : "en"
    setLang(next)
    try { localStorage.setItem("kawadir_landing_lang", next) } catch { /* ignore */ }
  }

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      try {
        // Load blocks
        const { data: blocksData, error: blocksError } = await supabase
          .from("landing_page_blocks")
          .select("*")
          .eq("enabled", true)
          .order("block_order")

        if (blocksError) {
          console.error("Error loading landing page blocks:", blocksError)
        }

        if (blocksData && blocksData.length > 0) {
          setBlocks(
            blocksData.map((b) => ({
              id: b.id,
              type: b.block_type as LandingBlockType,
              order: b.block_order,
              enabled: b.enabled,
              content: b.content as any,
              styles: b.styles as any,
            }))
          )
        } else {
          // Show defaults
          const defaults: LandingPageBlock[] = (
            Object.entries(defaultLandingBlocks) as [LandingBlockType, Partial<LandingPageBlock>][]
          )
            .filter(([, b]) => b.enabled)
            .map(([type, block], index) => ({
              id: type,
              type,
              order: index,
              enabled: true,
              content: block.content ?? {},
              styles: block.styles ?? {},
            }))
          setBlocks(defaults)
        }

        // Load config
        const { data: configData, error: configError } = await supabase
          .from("platform_settings")
          .select("key, value")
          .in("key", ["landing_page_config", "platform_logo"])

        if (configError) {
          console.error("Error loading landing page config:", configError)
        }

        if (configData) {
          configData.forEach((row) => {
            if (row.key === "landing_page_config") {
              try {
                // Value may be a raw object (JSONB) or a JSON-encoded string (legacy)
                const parsed = typeof row.value === 'string' ? JSON.parse(row.value) : row.value
                const merged = { ...defaultLandingConfig, ...parsed, settings: { ...defaultLandingConfig.settings, ...parsed?.settings }, styles: { ...defaultLandingConfig.styles, ...parsed?.styles } }
                setConfig(merged)
                // Set initial language from settings
                if (!langInit) {
                  const s = merged.settings
                  // If only one language, force that language
                  if (s.language === "ar") {
                    setLang("ar")
                  } else if (s.language === "en") {
                    setLang("en")
                  } else {
                    // Both: check localStorage, or use default
                    try {
                      const saved = localStorage.getItem("kawadir_landing_lang")
                      if (saved === "ar" || saved === "en") {
                        setLang(saved)
                      } else {
                        setLang(s.defaultLanguage || "en")
                      }
                    } catch {
                      setLang(s.defaultLanguage || "en")
                    }
                  }
                  setLangInit(true)
                }
              } catch { /* use defaults */ }
            }
            if (row.key === "platform_logo" && row.value) {
              // Value may be a plain string URL (JSONB) or JSON-encoded (legacy)
              let logoVal = row.value as string
              if (typeof logoVal === 'string' && logoVal.startsWith('"') && logoVal.endsWith('"')) {
                try { logoVal = JSON.parse(logoVal) } catch { /* keep as-is */ }
              }
              setPlatformLogo(logoVal)
            }
          })
        }
      } catch (error) {
        console.error("Error loading landing page data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const { styles, navbar, footer } = config
  const settings = config.settings || defaultLandingConfig.settings
  const gradient = `linear-gradient(135deg, ${styles.primaryColor} 0%, ${styles.secondaryColor} 100%)`
  const logoUrl = navbar.logoUrl || platformLogo
  const isRtl = lang === "ar"
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight
  const showLangToggle = settings.language === "both"

  const activeFont = isRtl ? (styles.fontFamilyAr || "Cairo") : (styles.fontFamily || "Inter")

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      style={{ backgroundColor: styles.backgroundColor, color: styles.textColor, fontFamily: `"${activeFont}", sans-serif` }}
    >
      {/* ── Navbar ── */}
      {settings.showHeader && (
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-gray-100",
          styles.headerStyle === "bold" ? "shadow-lg" : ""
        )}
        style={{
          backgroundColor: styles.headerStyle === "bold" ? styles.primaryColor + "ee" : "rgba(255,255,255,0.8)",
          color: styles.headerStyle === "bold" ? "white" : styles.textColor,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo */}
            {navbar.showLogo && (
              <Link href="/landing" className="flex items-center gap-2.5">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-8 object-contain" />
                ) : (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: gradient }}
                    >
                      <Layers className="h-4.5 w-4.5 text-white" />
                    </div>
                    <span className="text-lg font-bold" style={{ color: styles.primaryColor }}>
                      {t(footer.companyName || 'Kawadir', footer.companyNameAr, lang)}
                    </span>
                  </div>
                )}
              </Link>
            )}
            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              {(navbar.links || []).map((link, i) => (
                <a
                  key={i}
                  href={link.href}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {t(link.label, link.labelAr, lang)}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            {showLangToggle && (
              <button
                onClick={toggleLang}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle language"
              >
                <Languages className="h-4 w-4" />
                {lang === "en" ? "العربية" : "English"}
              </button>
            )}
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {lang === "ar" ? "تسجيل الدخول" : "Sign In"}
            </Link>
            {(navbar.ctaText || navbar.ctaTextAr) && (
              <Link
                href={navbar.ctaLink || '/signup'}
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 hover:shadow-lg"
                style={{ background: gradient }}
              >
                {t(navbar.ctaText, navbar.ctaTextAr, lang)}
              </Link>
            )}
          </div>
        </div>
      </nav>
      )}

      {/* Spacer for fixed navbar */}
      {settings.showHeader && <div className="h-16" />}

      {/* ── Blocks ── */}
      {blocks.map((block) => (
        <section key={block.id} id={block.type}>
          <BlockRenderer block={block} config={config} gradient={gradient} lang={lang} ArrowIcon={ArrowIcon} />
        </section>
      ))}

      {/* ── Footer ── */}
      {settings.showFooter && (
      <footer className="bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-8 object-contain brightness-200" />
                ) : (
                  <>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: gradient }}
                    >
                      <Layers className="h-4.5 w-4.5 text-white" />
                    </div>
                    <span className="text-lg font-bold">
                      {t(footer.companyName || 'Kawadir', footer.companyNameAr, lang)}
                    </span>
                  </>
                )}
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t(footer.description || 'AI-Powered Recruitment Platform', footer.descriptionAr, lang)}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">
                {lang === "ar" ? "روابط سريعة" : "Quick Links"}
              </h4>
              <div className="space-y-2">
                {(navbar.links || []).map((link, i) => (
                  <a
                    key={i}
                    href={link.href}
                    className="block text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {t(link.label, link.labelAr, lang)}
                  </a>
                ))}
                <Link href="/login" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  {lang === "ar" ? "تسجيل الدخول" : "Sign In"}
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">
                {lang === "ar" ? "قانوني" : "Legal"}
              </h4>
              <div className="space-y-2">
                {(footer.links || []).map((link, i) => (
                  <a
                    key={i}
                    href={link.href}
                    className="block text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {t(link.label, link.labelAr, lang)}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-sm text-gray-500">
              {t(
                footer.copyright || `\u00A9 ${new Date().getFullYear()} Kawadir. All rights reserved.`,
                footer.copyrightAr,
                lang
              )}
            </p>
          </div>
        </div>
      </footer>
      )}
    </div>
  )
}

// ─── Block Renderer ─────────────────────────────────────────────────
function BlockRenderer({
  block,
  config,
  gradient,
  lang,
  ArrowIcon,
}: {
  block: LandingPageBlock
  config: LandingPageConfig
  gradient: string
  lang: Lang
  ArrowIcon: React.ComponentType<{ className?: string }>
}) {
  const { styles } = config
  const paddings = { none: 'py-0', small: 'py-12', medium: 'py-20', large: 'py-28' }
  const paddingClass = paddings[block.styles.padding || 'large']

  switch (block.type) {
    case 'hero':
      return <HeroBlock block={block} gradient={gradient} styles={styles} lang={lang} ArrowIcon={ArrowIcon} />
    case 'features':
      return <FeaturesBlock block={block} gradient={gradient} styles={styles} paddingClass={paddingClass} lang={lang} />
    case 'about':
      return <AboutBlock block={block} gradient={gradient} styles={styles} paddingClass={paddingClass} lang={lang} />
    case 'stats':
      return <StatsBlock block={block} gradient={gradient} styles={styles} paddingClass={paddingClass} lang={lang} />
    case 'testimonials':
      return <TestimonialsBlock block={block} gradient={gradient} styles={styles} paddingClass={paddingClass} lang={lang} />
    case 'pricing':
      return <PricingBlock block={block} gradient={gradient} styles={styles} paddingClass={paddingClass} lang={lang} ArrowIcon={ArrowIcon} />
    case 'how_it_works':
      return <HowItWorksBlock block={block} gradient={gradient} styles={styles} paddingClass={paddingClass} lang={lang} />
    case 'cta':
      return <CtaBlock block={block} gradient={gradient} styles={styles} lang={lang} ArrowIcon={ArrowIcon} />
    case 'faq':
      return <FaqBlock block={block} gradient={gradient} styles={styles} paddingClass={paddingClass} lang={lang} />
    case 'contact':
      return <ContactBlock block={block} gradient={gradient} styles={styles} paddingClass={paddingClass} lang={lang} />
    case 'clients':
      return <ClientsBlock block={block} gradient={gradient} styles={styles} paddingClass={paddingClass} lang={lang} />
    case 'custom':
      return (
        <div className={cn("max-w-7xl mx-auto px-6", paddingClass)}>
          <div dangerouslySetInnerHTML={{ __html: t(block.content.html, block.content.htmlAr, lang) || '' }} />
        </div>
      )
    default:
      return null
  }
}

// ─── Hero ────────────────────────────────────────────────────────────
function HeroBlock({ block, gradient, styles, lang, ArrowIcon }: { block: LandingPageBlock; gradient: string; styles: any; lang: Lang; ArrowIcon: React.ComponentType<{ className?: string }> }) {
  const badge = t(block.content.badge, block.content.badgeAr, lang)
  const title = t(block.content.title, block.content.titleAr, lang)
  const subtitle = t(block.content.subtitle, block.content.subtitleAr, lang)
  const ctaText = t(block.content.ctaText, block.content.ctaTextAr, lang)
  const secondaryCta = t(block.content.secondaryCtaText, block.content.secondaryCtaTextAr, lang)

  return (
    <div className="relative overflow-hidden">
      {/* Background */}
      {block.content.backgroundImage ? (
        <>
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${block.content.backgroundImage})` }} />
          <div className="absolute inset-0 bg-black/50" />
        </>
      ) : (
        <div className="absolute inset-0">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.08] blur-3xl" style={{ background: styles.primaryColor }} />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.06] blur-3xl" style={{ background: styles.secondaryColor }} />
        </div>
      )}

      <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-28 text-center">
        {badge && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8 animate-fade-in-up" style={{ background: `${styles.primaryColor}12`, color: styles.primaryColor }}>
            <Zap className="h-4 w-4" />
            {badge}
          </div>
        )}
        <h1
          className={cn(
            "text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-6 animate-fade-in-up",
            block.content.backgroundImage ? "text-white" : ""
          )}
          style={!block.content.backgroundImage ? {
            background: `linear-gradient(135deg, ${styles.textColor} 0%, ${styles.primaryColor} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          } : undefined}
        >
          {title}
        </h1>
        <p className={cn(
          "text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-fade-in-up",
          block.content.backgroundImage ? "text-white/80" : "text-gray-600"
        )} style={{ animationDelay: '100ms' }}>
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          {ctaText && (
            <Link
              href={block.content.ctaLink || '/signup'}
              className="px-8 py-3.5 text-base font-semibold text-white rounded-xl transition-all hover:shadow-xl hover:-translate-y-0.5"
              style={{ background: gradient, boxShadow: `0 8px 32px -8px ${styles.primaryColor}50` }}
            >
              <span className="flex items-center gap-2">
                {ctaText}
                <ArrowIcon className="h-4 w-4" />
              </span>
            </Link>
          )}
          {secondaryCta && (
            <a
              href={block.content.secondaryCtaLink || '#'}
              className="px-8 py-3.5 text-base font-semibold rounded-xl border-2 transition-all hover:-translate-y-0.5"
              style={{
                borderColor: block.content.backgroundImage ? 'white' : styles.primaryColor,
                color: block.content.backgroundImage ? 'white' : styles.primaryColor,
              }}
            >
              {secondaryCta}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Features ────────────────────────────────────────────────────────
function FeaturesBlock({ block, gradient, styles, paddingClass, lang }: { block: LandingPageBlock; gradient: string; styles: any; paddingClass: string; lang: Lang }) {
  const cols = block.styles.columns || 3
  const gridCols = cols === 2 ? 'md:grid-cols-2' : cols === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3'

  return (
    <div className={cn("max-w-7xl mx-auto px-6", paddingClass)} style={{ backgroundColor: block.styles.backgroundColor }}>
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{t(block.content.title, block.content.titleAr, lang)}</h2>
        {(block.content.subtitle || block.content.subtitleAr) && (
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t(block.content.subtitle, block.content.subtitleAr, lang)}</p>
        )}
      </div>
      <div className={cn("grid gap-8", gridCols)}>
        {(block.content.items || []).map((item) => {
          const Icon = getIcon(item.icon)
          return (
            <div
              key={item.id}
              className="group p-6 rounded-2xl border border-gray-100 bg-white hover:border-transparent hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              style={{ borderRadius: styles.borderRadius }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
                style={{ background: `${styles.primaryColor}10` }}
              >
                <span style={{ color: styles.primaryColor }}><Icon className="h-6 w-6" /></span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t(item.title, item.titleAr, lang)}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{t(item.description, item.descriptionAr, lang)}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── About ───────────────────────────────────────────────────────────
function AboutBlock({ block, gradient, styles, paddingClass, lang }: { block: LandingPageBlock; gradient: string; styles: any; paddingClass: string; lang: Lang }) {
  return (
    <div className={cn("max-w-4xl mx-auto px-6", paddingClass)}>
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">{t(block.content.title, block.content.titleAr, lang)}</h2>
        <p className="text-lg text-gray-600 leading-relaxed">{t(block.content.description, block.content.descriptionAr, lang)}</p>
      </div>
    </div>
  )
}

// ─── Stats ───────────────────────────────────────────────────────────
function StatsBlock({ block, gradient, styles, paddingClass, lang }: { block: LandingPageBlock; gradient: string; styles: any; paddingClass: string; lang: Lang }) {
  const cols = block.styles.columns || 4
  const gridCols = cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4'

  return (
    <div className={cn(paddingClass)} style={{ background: block.styles.backgroundColor || `${styles.primaryColor}05` }}>
      <div className="max-w-7xl mx-auto px-6">
        {block.content.title && (
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{t(block.content.title, block.content.titleAr, lang)}</h2>
        )}
        <div className={cn("grid gap-8", gridCols)}>
          {(block.content.items || []).map((item) => (
            <div key={item.id} className="text-center">
              <div className="text-4xl md:text-5xl font-extrabold mb-2" style={{ color: styles.primaryColor }}>
                {t(item.value, item.valueAr, lang)}
              </div>
              <div className="text-gray-600 font-medium">{t(item.label, item.labelAr, lang)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Testimonials ────────────────────────────────────────────────────
function TestimonialsBlock({ block, gradient, styles, paddingClass, lang }: { block: LandingPageBlock; gradient: string; styles: any; paddingClass: string; lang: Lang }) {
  return (
    <div className={cn("max-w-7xl mx-auto px-6", paddingClass)}>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{t(block.content.title, block.content.titleAr, lang)}</h2>
      <div className="grid md:grid-cols-2 gap-8">
        {(block.content.items || []).map((item) => (
          <div
            key={item.id}
            className="p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-all"
            style={{ borderRadius: styles.borderRadius }}
          >
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-gray-700 mb-6 leading-relaxed italic">&ldquo;{t(item.description, item.descriptionAr, lang)}&rdquo;</p>
            <div className="flex items-center gap-3">
              {item.authorImage ? (
                <img src={item.authorImage} alt={item.author} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: gradient }}
                >
                  {(t(item.author, item.authorAr, lang) || '?')[0]}
                </div>
              )}
              <div>
                <p className="font-semibold text-sm">{t(item.author, item.authorAr, lang)}</p>
                <p className="text-gray-500 text-xs">{t(item.authorRole, item.authorRoleAr, lang)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Pricing ─────────────────────────────────────────────────────────
function PricingBlock({ block, gradient, styles, paddingClass, lang, ArrowIcon }: { block: LandingPageBlock; gradient: string; styles: any; paddingClass: string; lang: Lang; ArrowIcon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className={cn("max-w-7xl mx-auto px-6", paddingClass)}>
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{t(block.content.title, block.content.titleAr, lang)}</h2>
        {(block.content.subtitle || block.content.subtitleAr) && (
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t(block.content.subtitle, block.content.subtitleAr, lang)}</p>
        )}
      </div>
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {(block.content.items || []).map((item) => (
          <div
            key={item.id}
            className={cn(
              "p-8 rounded-2xl border-2 transition-all hover:-translate-y-1",
              item.featured ? "border-transparent shadow-xl relative" : "border-gray-100 bg-white"
            )}
            style={item.featured ? { borderColor: styles.primaryColor, background: `linear-gradient(180deg, ${styles.primaryColor}08, white)` } : { borderRadius: styles.borderRadius }}
          >
            {item.featured && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold text-white"
                style={{ background: gradient }}
              >
                {lang === "ar" ? "الأكثر شعبية" : "POPULAR"}
              </div>
            )}
            <h3 className="text-xl font-bold mb-1">{t(item.title, item.titleAr, lang)}</h3>
            <p className="text-gray-500 text-sm mb-4">{t(item.description, item.descriptionAr, lang)}</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold">{t(item.price, item.priceAr, lang)}</span>
              {(item.period || item.periodAr) && <span className="text-gray-500">{t(item.period, item.periodAr, lang)}</span>}
            </div>
            <div className="space-y-3 mb-8">
              {((lang === "ar" && item.featuresAr?.length ? item.featuresAr : item.features) || []).map((feature, fi) => (
                <div key={fi} className="flex items-center gap-2 text-sm">
                  <span style={{ color: styles.primaryColor }}><CheckCircle className="h-4 w-4 shrink-0" /></span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <Link
              href={item.ctaLink || '/signup'}
              className={cn(
                "block w-full text-center py-3 rounded-xl font-semibold transition-all",
                item.featured ? "text-white hover:opacity-90" : "border-2 hover:bg-gray-50"
              )}
              style={item.featured
                ? { background: gradient }
                : { borderColor: styles.primaryColor, color: styles.primaryColor }
              }
            >
              {t(item.ctaText || (lang === "en" ? 'Get Started' : undefined), item.ctaTextAr || (lang === "ar" ? 'ابدأ الآن' : undefined), lang)}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── How It Works ────────────────────────────────────────────────────
function HowItWorksBlock({ block, gradient, styles, paddingClass, lang }: { block: LandingPageBlock; gradient: string; styles: any; paddingClass: string; lang: Lang }) {
  return (
    <div className={cn("max-w-5xl mx-auto px-6", paddingClass)} style={{ backgroundColor: block.styles.backgroundColor }}>
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{t(block.content.title, block.content.titleAr, lang)}</h2>
        {(block.content.subtitle || block.content.subtitleAr) && (
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t(block.content.subtitle, block.content.subtitleAr, lang)}</p>
        )}
      </div>
      <div className="grid md:grid-cols-3 gap-12">
        {(block.content.items || []).map((item, i) => {
          const Icon = getIcon(item.icon)
          return (
            <div key={item.id} className="text-center relative">
              {/* Connector line */}
              {i < (block.content.items?.length || 0) - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[calc(100%-20%)] h-[2px]" style={{ background: `${styles.primaryColor}20` }} />
              )}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: gradient }}
              >
                <Icon className="h-7 w-7 text-white" />
              </div>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: styles.primaryColor }}>
                {lang === "ar" ? `الخطوة ${item.step || i + 1}` : `Step ${item.step || i + 1}`}
              </div>
              <h3 className="text-lg font-bold mb-2">{t(item.title, item.titleAr, lang)}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{t(item.description, item.descriptionAr, lang)}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── CTA ─────────────────────────────────────────────────────────────
function CtaBlock({ block, gradient, styles, lang, ArrowIcon }: { block: LandingPageBlock; gradient: string; styles: any; lang: Lang; ArrowIcon: React.ComponentType<{ className?: string }> }) {
  const ctaText = t(block.content.ctaText, block.content.ctaTextAr, lang)
  const secondaryCta = t(block.content.secondaryCtaText, block.content.secondaryCtaTextAr, lang)

  return (
    <div className="py-20">
      <div
        className="max-w-5xl mx-auto rounded-3xl px-8 py-16 text-center text-white relative overflow-hidden"
        style={{ background: gradient, margin: '0 1.5rem' }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-50%] right-[-20%] w-[400px] h-[400px] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-[-50%] left-[-20%] w-[300px] h-[300px] rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t(block.content.title, block.content.titleAr, lang)}</h2>
          {(block.content.subtitle || block.content.subtitleAr) && (
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">{t(block.content.subtitle, block.content.subtitleAr, lang)}</p>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {ctaText && (
              <Link
                href={block.content.ctaLink || '/signup'}
                className="px-8 py-3.5 bg-white text-base font-semibold rounded-xl transition-all hover:shadow-xl hover:-translate-y-0.5"
                style={{ color: styles.primaryColor }}
              >
                <span className="flex items-center gap-2">
                  {ctaText}
                  <ArrowIcon className="h-4 w-4" />
                </span>
              </Link>
            )}
            {secondaryCta && (
              <a
                href={block.content.secondaryCtaLink || '#'}
                className="px-8 py-3.5 text-base font-semibold rounded-xl border-2 border-white/50 text-white transition-all hover:-translate-y-0.5 hover:border-white"
              >
                {secondaryCta}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────
function FaqBlock({ block, gradient, styles, paddingClass, lang }: { block: LandingPageBlock; gradient: string; styles: any; paddingClass: string; lang: Lang }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className={cn("max-w-3xl mx-auto px-6", paddingClass)}>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{t(block.content.title, block.content.titleAr, lang)}</h2>
      <div className="space-y-3">
        {(block.content.items || []).map((item) => (
          <div
            key={item.id}
            className="border border-gray-200 rounded-xl overflow-hidden"
            style={{ borderRadius: styles.borderRadius }}
          >
            <button
              className="w-full flex items-center justify-between p-5 text-start font-medium hover:bg-gray-50 transition-colors"
              onClick={() => setOpenId(openId === item.id ? null : item.id)}
            >
              {t(item.title, item.titleAr, lang)}
              {openId === item.id ? <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />}
            </button>
            {openId === item.id && (
              <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed animate-fade-in">
                {t(item.description, item.descriptionAr, lang)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Contact ─────────────────────────────────────────────────────────
function ContactBlock({ block, gradient, styles, paddingClass, lang }: { block: LandingPageBlock; gradient: string; styles: any; paddingClass: string; lang: Lang }) {
  return (
    <div className={cn("max-w-3xl mx-auto px-6", paddingClass)}>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{t(block.content.title, block.content.titleAr, lang)}</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {block.content.email && (
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${styles.primaryColor}10` }}>
              <span style={{ color: styles.primaryColor }}><Mail className="h-6 w-6" /></span>
            </div>
            <p className="font-medium mb-1">{lang === "ar" ? "البريد الإلكتروني" : "Email"}</p>
            <a href={`mailto:${block.content.email}`} className="text-sm text-gray-600 hover:underline">{block.content.email}</a>
          </div>
        )}
        {block.content.phone && (
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${styles.primaryColor}10` }}>
              <span style={{ color: styles.primaryColor }}><Phone className="h-6 w-6" /></span>
            </div>
            <p className="font-medium mb-1">{lang === "ar" ? "الهاتف" : "Phone"}</p>
            <a href={`tel:${block.content.phone}`} className="text-sm text-gray-600 hover:underline">{block.content.phone}</a>
          </div>
        )}
        {(block.content.address || block.content.addressAr) && (
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${styles.primaryColor}10` }}>
              <span style={{ color: styles.primaryColor }}><MapPin className="h-6 w-6" /></span>
            </div>
            <p className="font-medium mb-1">{lang === "ar" ? "العنوان" : "Address"}</p>
            <p className="text-sm text-gray-600">{t(block.content.address, block.content.addressAr, lang)}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Clients ─────────────────────────────────────────────────────────
function ClientsBlock({ block, gradient, styles, paddingClass, lang }: { block: LandingPageBlock; gradient: string; styles: any; paddingClass: string; lang: Lang }) {
  return (
    <div className={cn("max-w-7xl mx-auto px-6", paddingClass)}>
      <h2 className="text-xl font-semibold text-center text-gray-400 mb-10">{t(block.content.title, block.content.titleAr, lang)}</h2>
      <div className="flex flex-wrap items-center justify-center gap-12">
        {(block.content.items || []).map((item) => (
          <div key={item.id} className="grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all">
            {item.image ? (
              <img src={item.image} alt={t(item.title, item.titleAr, lang)} className="h-10 object-contain" />
            ) : (
              <span className="text-xl font-bold text-gray-400">{t(item.title, item.titleAr, lang)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
