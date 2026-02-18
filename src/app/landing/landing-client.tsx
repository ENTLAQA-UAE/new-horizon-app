"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { KawadirIcon } from "@/components/ui/kawadir-icon"
import {
  Brain,
  Users,
  BarChart3,
  Globe,
  Zap,
  FileSearch,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Clock,
  Target,
  Shield,
  MessageSquare,
  CalendarCheck,
  PieChart,
  Workflow,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  Check,
  Award,
  Building2,
  Send,
  Star,
  Menu,
  X,
} from "lucide-react"

type Lang = "en" | "ar"

const content = {
  nav: {
    home: { en: "Home", ar: "الرئيسية" },
    features: { en: "Features", ar: "المميزات" },
    pricing: { en: "Pricing", ar: "الأسعار" },
    contact: { en: "Contact Us", ar: "تواصل معنا" },
    signIn: { en: "Sign In", ar: "تسجيل الدخول" },
    getStarted: { en: "Get Started", ar: "ابدأ الآن" },
  },
  hero: {
    badge: { en: "AI-Powered Recruitment Platform", ar: "منصة توظيف مدعومة بالذكاء الاصطناعي" },
    title: {
      en: "Hire the Right Talent,",
      ar: "وظّف الكفاءات المناسبة،",
    },
    titleHighlight: {
      en: "Faster with AI",
      ar: "أسرع مع الذكاء الاصطناعي",
    },
    subtitle: {
      en: "Transform your hiring process with Kawadir's intelligent ATS. AI-powered screening, smart matching, and collaborative tools — built for the MENA region.",
      ar: "حوّل عملية التوظيف مع نظام كوادر الذكي. فرز مدعوم بالذكاء الاصطناعي، مطابقة ذكية، وأدوات تعاونية — مصمّم لمنطقة الشرق الأوسط.",
    },
    cta: { en: "Start Free Trial", ar: "ابدأ تجربتك المجانية" },
    demo: { en: "Book a Demo", ar: "احجز عرض تجريبي" },
  },
  features: {
    label: { en: "Features", ar: "المميزات" },
    title: {
      en: "Everything You Need to Hire Smarter",
      ar: "كل ما تحتاجه للتوظيف بذكاء",
    },
    subtitle: {
      en: "Powerful AI-driven tools that streamline every step of your recruitment pipeline.",
      ar: "أدوات قوية مدعومة بالذكاء الاصطناعي تبسّط كل خطوة في عملية التوظيف.",
    },
  },
  featureItems: [
    {
      icon: "Brain",
      title: { en: "AI Resume Screening", ar: "فرز السير الذاتية بالذكاء الاصطناعي" },
      description: {
        en: "Automatically parse, analyze, and rank hundreds of resumes in seconds. Our AI understands context, skills, and experience to surface the best candidates.",
        ar: "تحليل وترتيب مئات السير الذاتية تلقائيًا في ثوانٍ. يفهم الذكاء الاصطناعي السياق والمهارات والخبرة لإظهار أفضل المرشحين.",
      },
      highlights: {
        en: ["Smart resume parsing", "Skill extraction & matching", "Automatic candidate ranking", "Bias-free screening"],
        ar: ["تحليل ذكي للسير الذاتية", "استخراج ومطابقة المهارات", "ترتيب تلقائي للمرشحين", "فرز بدون تحيز"],
      },
      mockup: "screening",
    },
    {
      icon: "Target",
      title: { en: "Smart Job Matching", ar: "مطابقة ذكية للوظائف" },
      description: {
        en: "Our AI engine matches candidates to job requirements with precision. Get compatibility scores, skill gap analysis, and intelligent recommendations.",
        ar: "يطابق محرك الذكاء الاصطناعي المرشحين مع متطلبات الوظيفة بدقة. احصل على نسب التوافق وتحليل فجوات المهارات وتوصيات ذكية.",
      },
      highlights: {
        en: ["AI compatibility scoring", "Skill gap analysis", "Smart recommendations", "Cultural fit assessment"],
        ar: ["تسجيل التوافق بالذكاء الاصطناعي", "تحليل فجوات المهارات", "توصيات ذكية", "تقييم التوافق الثقافي"],
      },
      mockup: "matching",
    },
    {
      icon: "PieChart",
      title: { en: "Advanced Analytics", ar: "تحليلات متقدمة" },
      description: {
        en: "Real-time dashboards and reports that give you full visibility into your hiring pipeline. Track time-to-hire, source effectiveness, and team performance.",
        ar: "لوحات معلومات وتقارير فورية تمنحك رؤية كاملة لعملية التوظيف. تتبع وقت التوظيف وفعالية المصادر وأداء الفريق.",
      },
      highlights: {
        en: ["Real-time dashboards", "Pipeline analytics", "Source tracking", "Custom reports"],
        ar: ["لوحات معلومات فورية", "تحليلات خط الأنابيب", "تتبع المصادر", "تقارير مخصصة"],
      },
      mockup: "analytics",
    },
    {
      icon: "Users",
      title: { en: "Collaborative Hiring", ar: "التوظيف التعاوني" },
      description: {
        en: "Bring your entire hiring team together. Share candidate profiles, leave structured feedback, and make data-driven decisions as a team.",
        ar: "اجمع فريق التوظيف بالكامل معًا. شارك ملفات المرشحين وقدم ملاحظات منظمة واتخذ قرارات مبنية على البيانات كفريق.",
      },
      highlights: {
        en: ["Team scorecards", "Structured interviews", "Real-time collaboration", "Role-based access"],
        ar: ["بطاقات تقييم الفريق", "مقابلات منظمة", "تعاون فوري", "صلاحيات حسب الدور"],
      },
      mockup: "collaboration",
    },
  ],
  featureGrid: [
    {
      icon: "Globe",
      title: { en: "Arabic & English", ar: "عربي وإنجليزي" },
      desc: { en: "Full RTL support with native Arabic interface", ar: "دعم كامل للعربية مع واجهة أصلية" },
    },
    {
      icon: "Workflow",
      title: { en: "Automated Workflows", ar: "سير عمل آلي" },
      desc: { en: "Auto-emails, scheduling, and pipeline stages", ar: "رسائل تلقائية وجدولة ومراحل التوظيف" },
    },
    {
      icon: "Shield",
      title: { en: "Enterprise Security", ar: "أمان المؤسسات" },
      desc: { en: "SOC 2 compliant with role-based permissions", ar: "متوافق مع SOC 2 مع صلاحيات حسب الدور" },
    },
    {
      icon: "CalendarCheck",
      title: { en: "Interview Scheduling", ar: "جدولة المقابلات" },
      desc: { en: "One-click scheduling with calendar sync", ar: "جدولة بنقرة واحدة مع مزامنة التقويم" },
    },
    {
      icon: "FileSearch",
      title: { en: "Talent Pool", ar: "قاعدة المواهب" },
      desc: { en: "Build and search your candidate database", ar: "بناء والبحث في قاعدة بيانات المرشحين" },
    },
    {
      icon: "MessageSquare",
      title: { en: "Communication Hub", ar: "مركز التواصل" },
      desc: { en: "In-app messaging and email templates", ar: "رسائل داخلية وقوالب بريد إلكتروني" },
    },
  ],
  howItWorks: {
    label: { en: "How It Works", ar: "كيف يعمل" },
    title: { en: "Get Started in Minutes", ar: "ابدأ في دقائق" },
    subtitle: {
      en: "Three simple steps to transform your recruitment process.",
      ar: "ثلاث خطوات بسيطة لتحويل عملية التوظيف.",
    },
    steps: [
      {
        step: 1,
        icon: "Zap",
        title: { en: "Post Your Jobs", ar: "انشر وظائفك" },
        desc: {
          en: "Create job listings with AI-assisted descriptions. Publish to your career page and job boards instantly.",
          ar: "أنشئ إعلانات وظيفية بمساعدة الذكاء الاصطناعي. انشرها على صفحة التوظيف ومنصات العمل فورًا.",
        },
      },
      {
        step: 2,
        icon: "Brain",
        title: { en: "AI Screens Candidates", ar: "الذكاء الاصطناعي يفرز المرشحين" },
        desc: {
          en: "Our AI automatically parses resumes, ranks candidates, and provides match scores for each applicant.",
          ar: "يحلل الذكاء الاصطناعي السير الذاتية تلقائيًا ويرتب المرشحين ويقدم نسب التوافق لكل متقدم.",
        },
      },
      {
        step: 3,
        icon: "CheckCircle",
        title: { en: "Hire Top Talent", ar: "وظّف أفضل الكفاءات" },
        desc: {
          en: "Collaborate with your team, conduct structured interviews, and make confident hiring decisions.",
          ar: "تعاون مع فريقك وأجرِ مقابلات منظمة واتخذ قرارات توظيف واثقة.",
        },
      },
    ],
  },
  stats: [
    { numericValue: 10, suffix: "K+", icon: "Users", label: { en: "Candidates Screened", ar: "مرشح تم فرزهم" } },
    { numericValue: 85, suffix: "%", icon: "Zap", label: { en: "Faster Hiring", ar: "توظيف أسرع" } },
    { numericValue: 200, suffix: "+", icon: "Building2", label: { en: "Companies Trust Us", ar: "شركة تثق بنا" } },
    { numericValue: 98, suffix: "%", icon: "Award", label: { en: "Satisfaction Rate", ar: "نسبة الرضا" } },
  ],
  pricing: {
    label: { en: "Pricing", ar: "الأسعار" },
    title: { en: "Invest in Smarter Hiring", ar: "استثمر في توظيف أذكى" },
    subtitle: {
      en: "Every plan unlocks the full power of AI recruitment. Pick the scale that fits your team — upgrade or downgrade anytime.",
      ar: "كل خطة تمنحك القوة الكاملة للتوظيف بالذكاء الاصطناعي. اختر الحجم المناسب لفريقك — طوّر أو غيّر خطتك في أي وقت.",
    },
    monthly: { en: "Monthly", ar: "شهري" },
    yearly: { en: "Yearly", ar: "سنوي" },
    popular: { en: "Most Popular", ar: "الأكثر شيوعًا" },
    cta: { en: "Start Now", ar: "ابدأ الآن" },
    contactSales: { en: "Contact Sales", ar: "تواصل مع المبيعات" },
    loading: { en: "Loading plans...", ar: "جاري تحميل الخطط..." },
    plans: [
      {
        name: { en: "Starter", ar: "المبتدئ" },
        price: { en: "$100", ar: "$100" },
        period: { en: "/month", ar: "/شهريًا" },
        description: { en: "Perfect for small teams getting started with recruitment", ar: "مثالي للفرق الصغيرة التي تبدأ في التوظيف" },
        features: {
          en: ["Up to 10 active jobs", "3 team members", "500 candidates", "AI Resume Parsing", "Basic Analytics", "Email Templates"],
          ar: ["حتى 10 وظائف نشطة", "3 أعضاء فريق", "500 مرشح", "تحليل السير الذاتية بالذكاء الاصطناعي", "تحليلات أساسية", "قوالب بريد إلكتروني"],
        },
        highlighted: false,
      },
      {
        name: { en: "Professional", ar: "المحترف" },
        price: { en: "$250", ar: "$250" },
        period: { en: "/month", ar: "/شهريًا" },
        description: { en: "For growing teams with advanced hiring needs", ar: "للفرق النامية ذات احتياجات التوظيف المتقدمة" },
        features: {
          en: ["Up to 50 active jobs", "10 team members", "5,000 candidates", "AI Resume Parsing", "Advanced Analytics", "Custom Workflows", "Email Templates", "White-label Solution"],
          ar: ["حتى 50 وظيفة نشطة", "10 أعضاء فريق", "5,000 مرشح", "تحليل السير الذاتية بالذكاء الاصطناعي", "تحليلات متقدمة", "سير عمل مخصصة", "قوالب بريد إلكتروني", "حل العلامة البيضاء"],
        },
        highlighted: true,
      },
      {
        name: { en: "Enterprise", ar: "المؤسسة" },
        price: { en: "$500", ar: "$500" },
        period: { en: "/month", ar: "/شهريًا" },
        description: { en: "Full-featured solution for large organizations", ar: "حل كامل للمؤسسات الكبيرة" },
        features: {
          en: ["Unlimited active jobs", "Unlimited team members", "Unlimited candidates", "AI Resume Parsing", "Advanced Analytics", "White-label Solution", "API Access", "Custom Workflows", "Email Templates", "Dedicated Support", "SSO Authentication"],
          ar: ["وظائف نشطة غير محدودة", "أعضاء فريق غير محدودين", "مرشحون غير محدودين", "تحليل السير الذاتية بالذكاء الاصطناعي", "تحليلات متقدمة", "حل العلامة البيضاء", "وصول API", "سير عمل مخصصة", "قوالب بريد إلكتروني", "دعم مخصص", "تسجيل دخول موحد SSO"],
        },
        highlighted: false,
      },
    ],
  },
  contact: {
    label: { en: "Contact Us", ar: "تواصل معنا" },
    title: { en: "Get in Touch", ar: "تواصل معنا" },
    subtitle: {
      en: "Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
      ar: "لديك أسئلة؟ يسعدنا سماع رأيك. أرسل لنا رسالة وسنرد في أقرب وقت ممكن.",
    },
    nameField: { en: "Full Name", ar: "الاسم الكامل" },
    emailField: { en: "Email Address", ar: "البريد الإلكتروني" },
    messageField: { en: "Message", ar: "الرسالة" },
    send: { en: "Send Message", ar: "إرسال الرسالة" },
    info: [
      { icon: "Mail", value: "info@kawadir.io", label: { en: "Email Us", ar: "راسلنا" } },
      { icon: "Phone", value: { en: "Egypt: +201004778643", ar: "مصر: +201004778643" }, label: { en: "Egypt", ar: "مصر" } },
      { icon: "Phone", value: { en: "UAE: +971565626269", ar: "الإمارات: +971565626269" }, label: { en: "UAE", ar: "الإمارات" } },
      { icon: "Phone", value: { en: "KSA: +966 50 223 9955", ar: "السعودية: +966 50 223 9955" }, label: { en: "KSA", ar: "السعودية" } },
    ],
  },
  faq: {
    title: { en: "Frequently Asked Questions", ar: "الأسئلة الشائعة" },
    items: [
      {
        q: { en: "How does the AI screening work?", ar: "كيف يعمل الفرز بالذكاء الاصطناعي؟" },
        a: {
          en: "Our AI analyzes resumes by extracting skills, experience, and qualifications, then matches them against your job requirements. It provides a compatibility score and ranks candidates, saving you hours of manual screening.",
          ar: "يحلل الذكاء الاصطناعي السير الذاتية باستخراج المهارات والخبرات والمؤهلات، ثم يطابقها مع متطلبات الوظيفة. يقدم نسبة توافق ويرتب المرشحين، مما يوفر ساعات من الفرز اليدوي.",
        },
      },
      {
        q: { en: "Does Kawadir support Arabic?", ar: "هل يدعم كوادر اللغة العربية؟" },
        a: {
          en: "Yes! Kawadir is built with full Arabic support including RTL interface, Arabic resume parsing, and bilingual job postings. It's designed specifically for the MENA region.",
          ar: "نعم! كوادر مصمم بدعم كامل للعربية بما في ذلك واجهة RTL وتحليل السير الذاتية بالعربية وإعلانات الوظائف ثنائية اللغة. مصمم خصيصًا لمنطقة الشرق الأوسط.",
        },
      },
      {
        q: { en: "Can I integrate with my existing tools?", ar: "هل يمكنني التكامل مع أدواتي الحالية؟" },
        a: {
          en: "Kawadir integrates with popular HR tools, calendars, email platforms, and job boards. We also offer a REST API for custom integrations.",
          ar: "يتكامل كوادر مع أدوات الموارد البشرية الشائعة والتقويمات ومنصات البريد الإلكتروني ومنصات التوظيف. نقدم أيضًا واجهة REST API للتكاملات المخصصة.",
        },
      },
      {
        q: { en: "Is there a free trial?", ar: "هل هناك تجربة مجانية؟" },
        a: {
          en: "Yes, we offer a 14-day free trial with full access to all features. No credit card required to get started.",
          ar: "نعم، نقدم تجربة مجانية لمدة 14 يومًا مع وصول كامل لجميع المميزات. لا حاجة لبطاقة ائتمان للبدء.",
        },
      },
    ],
  },
  cta: {
    title: { en: "Ready to Transform Your Hiring?", ar: "مستعد لتحويل عملية التوظيف؟" },
    subtitle: {
      en: "Join hundreds of companies across MENA who hire smarter with Kawadir.",
      ar: "انضم لمئات الشركات في الشرق الأوسط التي توظّف بذكاء مع كوادر.",
    },
    cta: { en: "Start Free Trial", ar: "ابدأ تجربتك المجانية" },
    demo: { en: "Contact Sales", ar: "تواصل مع المبيعات" },
  },
  footer: {
    desc: {
      en: "AI-powered recruitment platform built for the MENA region. Hire smarter, faster, and fairer.",
      ar: "منصة توظيف مدعومة بالذكاء الاصطناعي مصممة لمنطقة الشرق الأوسط. وظّف بذكاء وسرعة وعدالة.",
    },
    product: { en: "Product", ar: "المنتج" },
    company: { en: "Company", ar: "الشركة" },
    legal: { en: "Legal", ar: "قانوني" },
    copyright: {
      en: `\u00A9 ${new Date().getFullYear()} Kawadir. All rights reserved.`,
      ar: `\u00A9 ${new Date().getFullYear()} كوادر. جميع الحقوق محفوظة.`,
    },
  },
}

/* ─── Tier type from API ─── */
export interface Tier {
  id: string
  name: string
  name_ar: string | null
  description: string | null
  description_ar: string | null
  price_monthly: number
  price_yearly: number | null
  currency: string | null
  max_jobs: number
  max_users: number
  max_candidates: number
  features: Record<string, boolean | number> | null
  sort_order: number | null
}

/* Feature flag display labels (bilingual)
   Covers both admin-form keys (ai_resume_parsing …) and seed-data keys (ai_parsing …) */
const featureLabels: Record<string, { en: string; ar: string }> = {
  // Admin form keys
  ai_resume_parsing: { en: "AI Resume Parsing", ar: "تحليل السير الذاتية بالذكاء الاصطناعي" },
  ai_candidate_scoring: { en: "AI Candidate Scoring", ar: "تقييم المرشحين بالذكاء الاصطناعي" },
  custom_pipelines: { en: "Custom Pipelines", ar: "مسارات توظيف مخصصة" },
  api_access: { en: "API Access", ar: "وصول API" },
  advanced_analytics: { en: "Advanced Analytics", ar: "تحليلات متقدمة" },
  white_label: { en: "White-label Solution", ar: "حل العلامة البيضاء" },
  priority_support: { en: "Priority Support", ar: "دعم ذو أولوية" },
  sso_integration: { en: "SSO Authentication", ar: "تسجيل دخول موحد SSO" },
  // Seed-data / legacy keys
  ai_parsing: { en: "AI Resume Parsing", ar: "تحليل السير الذاتية بالذكاء الاصطناعي" },
  basic_analytics: { en: "Basic Analytics", ar: "تحليلات أساسية" },
  email_templates: { en: "Email Templates", ar: "قوالب بريد إلكتروني" },
  custom_workflows: { en: "Custom Workflows", ar: "سير عمل مخصصة" },
  dedicated_support: { en: "Dedicated Support", ar: "دعم مخصص" },
  sso: { en: "SSO Authentication", ar: "تسجيل دخول موحد SSO" },
}

function getCurrencySymbol(currency: string | null) {
  switch (currency) {
    case "USD": return "$"
    case "SAR": return "SAR "
    case "AED": return "AED "
    case "EGP": return "EGP "
    default: return "$"
  }
}

/* Convert API tiers to the same plan format used by the hardcoded fallback */
function tiersToPlans(tiers: Tier[]) {
  return tiers.map((tier, i) => {
    const currency = getCurrencySymbol(tier.currency)
    const priceStr = `${currency}${tier.price_monthly.toLocaleString()}`

    // Build bilingual feature lists from limits + feature flags
    const featuresEn: string[] = []
    const featuresAr: string[] = []

    // Limits (-1 or any negative value = unlimited)
    if (tier.max_jobs < 0 || tier.max_jobs >= 999999) {
      featuresEn.push("Unlimited active jobs")
      featuresAr.push("وظائف نشطة غير محدودة")
    } else {
      featuresEn.push(`Up to ${tier.max_jobs.toLocaleString()} active jobs`)
      featuresAr.push(`حتى ${tier.max_jobs.toLocaleString()} وظائف نشطة`)
    }

    if (tier.max_users < 0 || tier.max_users >= 999999) {
      featuresEn.push("Unlimited team members")
      featuresAr.push("أعضاء فريق غير محدودين")
    } else {
      featuresEn.push(`${tier.max_users.toLocaleString()} team members`)
      featuresAr.push(`${tier.max_users.toLocaleString()} أعضاء فريق`)
    }

    if (tier.max_candidates < 0 || tier.max_candidates >= 999999) {
      featuresEn.push("Unlimited candidates")
      featuresAr.push("مرشحون غير محدودين")
    } else {
      featuresEn.push(`${tier.max_candidates.toLocaleString()} candidates`)
      featuresAr.push(`${tier.max_candidates.toLocaleString()} مرشح`)
    }

    // Feature flags
    if (tier.features) {
      Object.entries(tier.features).forEach(([key, enabled]) => {
        if (enabled && featureLabels[key]) {
          featuresEn.push(featureLabels[key].en)
          featuresAr.push(featureLabels[key].ar)
        }
      })
    }

    return {
      name: { en: tier.name, ar: tier.name_ar || tier.name },
      price: { en: priceStr, ar: priceStr },
      period: { en: "/month", ar: "/شهريًا" },
      description: { en: tier.description || "", ar: tier.description_ar || tier.description || "" },
      features: { en: featuresEn, ar: featuresAr },
      highlighted: tiers.length >= 3 ? i === 1 : false,
    }
  })
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  Users,
  BarChart3,
  Globe,
  Shield,
  Zap,
  FileSearch,
  Target,
  PieChart,
  MessageSquare,
  CalendarCheck,
  Workflow,
  CheckCircle,
  Clock,
  Award,
  Building2,
  Mail,
  Phone,
  MapPin,
}

function t(obj: { en: string; ar: string }, lang: Lang) {
  return lang === "ar" ? obj.ar : obj.en
}

function Icon({ name, className }: { name: string; className?: string }) {
  const Comp = iconMap[name] || KawadirIcon
  return <Comp className={className} />
}

/* ─── Animated counter for stats ─── */
function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const duration = 2000
          const startTime = performance.now()
          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(eased * value))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [value])

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  )
}

/* ─── Logo Component ─── */
function KawadirLogo({ lang, variant = "default" }: { lang: Lang; variant?: "default" | "white" }) {
  return (
    <Image
      src="/new-logo-light-final.PNG"
      alt={lang === "ar" ? "كوادر" : "Kawadir"}
      width={140}
      height={45}
      priority
      className={variant === "white" ? "brightness-0 invert" : ""}
    />
  )
}

export default function LandingPage({ initialTiers }: { initialTiers?: Tier[] }) {
  const [lang, setLang] = useState<Lang>("ar")
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [tiers, setTiers] = useState<Tier[]>(initialTiers || [])
  const [tiersLoading, setTiersLoading] = useState(!initialTiers || initialTiers.length === 0)
  const isRtl = lang === "ar"
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight

  // Dynamically update <html> dir and lang so that position:fixed elements,
  // CSS logical properties, and the whole document inherit the correct direction.
  useEffect(() => {
    document.documentElement.dir = isRtl ? "rtl" : "ltr"
    document.documentElement.lang = lang
    // Also set the font on body for the nav (which is position:fixed)
    document.body.style.fontFamily = isRtl
      ? "'IBM Plex Sans Arabic', sans-serif"
      : "'Poppins', sans-serif"
    return () => {
      // Reset on unmount (e.g., navigating away from landing page)
      document.documentElement.dir = "ltr"
      document.documentElement.lang = "en"
      document.body.style.fontFamily = ""
    }
  }, [lang, isRtl])

  // Fetch subscription tiers from API (only if not provided server-side)
  useEffect(() => {
    if (initialTiers && initialTiers.length > 0) return
    async function fetchTiers() {
      try {
        const res = await fetch("/api/public/tiers")
        if (res.ok) {
          const data = await res.json()
          setTiers(data.tiers || [])
        }
      } catch {
        // Silent fail — will use hardcoded fallback plans
      } finally {
        setTiersLoading(false)
      }
    }
    fetchTiers()
  }, [initialTiers])

  // Use dynamic tiers when available, otherwise fall back to hardcoded plans
  const plans = tiers.length > 0 ? tiersToPlans(tiers) : content.pricing.plans

  return (
    <>
      {/* ═══════════════════════════════════════════
          NAVBAR — Outside main wrapper to avoid overflow/stacking issues.
          Direction and font inherited from <html>/<body> via useEffect.
          ═══════════════════════════════════════════ */}
      <nav className="fixed top-0 inset-x-0 z-[100] bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo — always at the start (right in RTL, left in LTR) */}
          <Link href="/landing" className="flex items-center gap-2 shrink-0">
            <KawadirLogo lang={lang} />
          </Link>

          {/* Nav Links — desktop, centered */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              {t(content.nav.home, lang)}
            </a>
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              {t(content.nav.features, lang)}
            </a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              {t(content.nav.pricing, lang)}
            </a>
            <a href="#contact" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              {t(content.nav.contact, lang)}
            </a>
          </div>

          {/* End side — always at the end (left in RTL, right in LTR) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title={lang === "en" ? "العربية" : "English"}
            >
              <Globe className="h-5 w-5" />
            </button>
            <Link
              href="/login"
              className="hidden sm:inline-flex text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {t(content.nav.signIn, lang)}
            </Link>
            <Link
              href="/signup"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#60A5FA] rounded-xl hover:shadow-lg hover:shadow-[#2563EB]/20 hover:-translate-y-0.5 transition-all"
            >
              {t(content.nav.getStarted, lang)}
            </Link>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="px-4 py-4 space-y-1">
              {[
                { href: "#", label: t(content.nav.home, lang) },
                { href: "#features", label: t(content.nav.features, lang) },
                { href: "#pricing", label: t(content.nav.pricing, lang) },
                { href: "#contact", label: t(content.nav.contact, lang) },
              ].map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <div className="border-t border-gray-100 pt-3 mt-3 flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  {t(content.nav.signIn, lang)}
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#60A5FA] rounded-xl text-center"
                >
                  {t(content.nav.getStarted, lang)}
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main content wrapper */}
      <div className="bg-white text-gray-900 overflow-x-hidden">
      {/* Spacer for fixed navbar */}
      <div className="h-16" />

      {/* ═══════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════ */}
      <section id="hero" className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0B1437] to-[#1D4ED8]" />
        <div className="absolute inset-0">
          <div className="absolute top-[-30%] right-[-10%] w-[700px] h-[700px] rounded-full bg-[#2563EB]/20 blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#3B82F6]/15 blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-20 sm:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-8 bg-white/10 text-white/90 backdrop-blur-sm border border-white/10 animate-fade-in-up">
              <KawadirIcon className="h-4 w-4 text-[#60A5FA]" />
              {t(content.hero.badge, lang)}
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.12] sm:leading-[1.08] mb-5 sm:mb-6 text-white tracking-tight animate-fade-in-up">
              {t(content.hero.title, lang)}
              <br />
              <span className="bg-gradient-to-r from-[#60A5FA] via-[#3B82F6] to-[#93C5FD] bg-clip-text text-transparent">
                {t(content.hero.titleHighlight, lang)}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up animate-delay-100">
              {t(content.hero.subtitle, lang)}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animate-delay-200">
              <Link
                href="/signup"
                className="px-8 py-3.5 text-base font-semibold bg-white text-[#1D4ED8] rounded-xl hover:shadow-2xl hover:shadow-[#2563EB]/25 hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                {t(content.hero.cta, lang)}
                <ArrowIcon className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="px-8 py-3.5 text-base font-semibold rounded-xl border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all"
              >
                {t(content.hero.demo, lang)}
              </a>
            </div>
          </div>

          {/* Dashboard Mockup */}
          <div className="mt-20 max-w-5xl mx-auto animate-fade-in-up animate-delay-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-2 shadow-2xl shadow-black/40">
              <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                    <div className="w-3 h-3 rounded-full bg-green-400/80" />
                  </div>
                  <div className="flex-1 text-center">
                    <div className="inline-block px-4 py-1 rounded-md bg-white/5 text-xs text-white/40">
                      app.kawadir.io/dashboard
                    </div>
                  </div>
                </div>
                {/* Dashboard content mockup */}
                <div className="p-3 sm:p-6">
                  {/* Stats row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                    {[
                      { label: isRtl ? "المرشحون" : "Candidates", val: "1,284", change: "+12%" },
                      { label: isRtl ? "الوظائف النشطة" : "Active Jobs", val: "24", change: "+3" },
                      { label: isRtl ? "مقابلات اليوم" : "Interviews Today", val: "8", change: "" },
                      { label: isRtl ? "معدل القبول" : "Hire Rate", val: "68%", change: "+5%" },
                    ].map((s, i) => (
                      <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <p className="text-xs text-white/40 mb-1">{s.label}</p>
                        <p className="text-2xl font-bold text-white">{s.val}</p>
                        {s.change && <p className="text-xs text-emerald-400 mt-1">{s.change}</p>}
                      </div>
                    ))}
                  </div>
                  {/* Pipeline mockup */}
                  <div className="hidden sm:grid grid-cols-5 gap-3">
                    {[
                      { label: isRtl ? "جديد" : "New", count: 45, color: "from-blue-500 to-blue-600" },
                      { label: isRtl ? "مُراجعة" : "Screening", count: 32, color: "from-[#2563EB] to-[#1D4ED8]" },
                      { label: isRtl ? "مقابلة" : "Interview", count: 18, color: "from-[#3B82F6] to-[#60A5FA]" },
                      { label: isRtl ? "عرض" : "Offer", count: 8, color: "from-pink-500 to-pink-600" },
                      { label: isRtl ? "تم التوظيف" : "Hired", count: 5, color: "from-emerald-500 to-emerald-600" },
                    ].map((stage, i) => (
                      <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-white/60">{stage.label}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${stage.color} text-white`}>
                            {stage.count}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {[...Array(Math.min(stage.count, 3))].map((_, j) => (
                            <div key={j} className="h-8 rounded-lg bg-white/5 animate-pulse" style={{ animationDelay: `${j * 200}ms` }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          STATS BAND — Premium with Individual Cards
          ═══════════════════════════════════════════ */}
      <section className="relative py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {content.stats.map((stat, i) => {
              const cardStyles = [
                { bg: "from-[#2563EB] to-[#1D4ED8]", iconBg: "bg-white/20", shadow: "shadow-[#2563EB]/25" },
                { bg: "from-[#1D4ED8] to-[#1E40AF]", iconBg: "bg-white/20", shadow: "shadow-[#1D4ED8]/25" },
                { bg: "from-[#3B82F6] to-[#2563EB]", iconBg: "bg-white/20", shadow: "shadow-[#3B82F6]/25" },
                { bg: "from-[#1E40AF] to-[#1E3A8A]", iconBg: "bg-white/20", shadow: "shadow-[#1E40AF]/25" },
              ]
              const style = cardStyles[i]
              return (
                <div
                  key={i}
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${style.bg} p-6 sm:p-8 shadow-xl ${style.shadow} hover:-translate-y-1 transition-all duration-300`}
                >
                  {/* Decorative circle */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-md" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5 blur-sm" />

                  <div className="relative">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl ${style.iconBg} mb-4`}>
                      <Icon name={stat.icon} className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1">
                      <AnimatedCounter value={stat.numericValue} suffix={stat.suffix} />
                    </div>
                    <div className="text-white/70 font-medium text-sm">{t(stat.label, lang)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURE HIGHLIGHTS (with screenshots)
          ═══════════════════════════════════════════ */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#2563EB] bg-[#2563EB]/6 mb-4">
              {t(content.features.label, lang)}
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
              {t(content.features.title, lang)}
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              {t(content.features.subtitle, lang)}
            </p>
          </div>

          {/* Feature sections with mockups */}
          <div className="space-y-32">
            {content.featureItems.map((feature, idx) => {
              const isReversed = idx % 2 === 1
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isReversed ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-12 lg:gap-20`}
                >
                  {/* Text */}
                  <div className="flex-1 max-w-xl">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#2563EB]/6 mb-5">
                      <Icon name={feature.icon} className="h-6 w-6 text-[#2563EB]" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">
                      {t(feature.title, lang)}
                    </h3>
                    <p className="text-gray-500 text-lg leading-relaxed mb-6">
                      {t(feature.description, lang)}
                    </p>
                    <ul className="space-y-3">
                      {(lang === "ar" ? feature.highlights.ar : feature.highlights.en).map((h, i) => (
                        <li key={i} className="flex items-center gap-3 text-gray-700">
                          <CheckCircle className="h-5 w-5 text-[#2563EB] shrink-0" />
                          <span className="font-medium">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Screenshot mockup */}
                  <div className="flex-1 w-full max-w-2xl">
                    <FeatureMockup type={feature.mockup} lang={lang} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURE GRID (smaller features) — 3D Cards
          ═══════════════════════════════════════════ */}
      <section className="py-28 bg-gradient-to-b from-gray-50 to-gray-100/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#2563EB] bg-[#2563EB]/6 mb-4">
              {lang === "ar" ? "المزيد من الأدوات" : "More Tools"}
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
              {lang === "ar" ? "وأكثر من ذلك..." : "And Much More..."}
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              {lang === "ar"
                ? "مجموعة شاملة من الأدوات لتحسين كل جانب من عملية التوظيف."
                : "A comprehensive suite of tools to improve every aspect of your hiring process."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.featureGrid.map((f, i) => {
              const cardThemes = [
                { gradient: "from-[#2563EB] to-[#1D4ED8]", iconBg: "bg-[#2563EB]", shadow: "shadow-[#2563EB]/20", lightBg: "bg-blue-50/50" },
                { gradient: "from-[#1D4ED8] to-[#1E40AF]", iconBg: "bg-[#1D4ED8]", shadow: "shadow-[#1D4ED8]/20", lightBg: "bg-blue-50/50" },
                { gradient: "from-[#3B82F6] to-[#2563EB]", iconBg: "bg-[#3B82F6]", shadow: "shadow-[#3B82F6]/20", lightBg: "bg-blue-50/50" },
                { gradient: "from-[#1E40AF] to-[#1E3A8A]", iconBg: "bg-[#1E40AF]", shadow: "shadow-[#1E40AF]/20", lightBg: "bg-blue-50/50" },
                { gradient: "from-[#2563EB] to-[#3B82F6]", iconBg: "bg-[#2563EB]", shadow: "shadow-[#2563EB]/20", lightBg: "bg-blue-50/50" },
                { gradient: "from-[#1D4ED8] to-[#2563EB]", iconBg: "bg-[#1D4ED8]", shadow: "shadow-[#1D4ED8]/20", lightBg: "bg-blue-50/50" },
              ]
              const theme = cardThemes[i]
              return (
                <div
                  key={i}
                  className={`group relative rounded-2xl bg-white p-7 border border-gray-200/80 shadow-lg ${theme.shadow} hover:shadow-2xl hover:-translate-y-2 transition-all duration-500`}
                >
                  {/* Colored accent line at top */}
                  <div className={`absolute top-0 left-6 right-6 h-1 rounded-b-full bg-gradient-to-r ${theme.gradient} opacity-80`} />
                  {/* Subtle colored background glow */}
                  <div className={`absolute top-0 right-0 w-32 h-32 ${theme.lightBg} rounded-bl-[60px] -z-0`} />

                  <div className="relative z-10">
                    <div className={`w-14 h-14 rounded-2xl ${theme.iconBg} flex items-center justify-center mb-5 shadow-lg ${theme.shadow} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon name={f.icon} className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{t(f.title, lang)}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{t(f.desc, lang)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          HOW IT WORKS — Premium
          ═══════════════════════════════════════════ */}
      <section id="how-it-works" className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#2563EB] bg-[#2563EB]/6 mb-4">
              {t(content.howItWorks.label, lang)}
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
              {t(content.howItWorks.title, lang)}
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              {t(content.howItWorks.subtitle, lang)}
            </p>
          </div>

          <div className="relative">
            {/* Connector line behind cards */}
            <div className="hidden md:block absolute top-24 left-[16.67%] right-[16.67%] h-[2px]">
              <div className="h-full bg-gradient-to-r from-[#2563EB]/5 via-[#2563EB]/20 to-[#2563EB]/5 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[2px] w-1/3 bg-gradient-to-r from-[#2563EB]/40 to-[#60A5FA]/40 rounded-full blur-sm" />
            </div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {content.howItWorks.steps.map((step, i) => {
                const stepGradients = [
                  { bg: "from-[#2563EB] to-[#3B82F6]", glow: "shadow-[#2563EB]/30" },
                  { bg: "from-[#3B82F6] to-[#60A5FA]", glow: "shadow-[#3B82F6]/30" },
                  { bg: "from-[#1D4ED8] to-[#2563EB]", glow: "shadow-[#1D4ED8]/30" },
                ]
                return (
                  <div key={i} className="relative group">
                    <div className="text-center">
                      {/* Step number + icon */}
                      <div className="relative mx-auto mb-8 w-24 h-24">
                        {/* Outer ring */}
                        <div className="absolute inset-0 rounded-3xl border-2 border-dashed border-gray-200 group-hover:border-[#2563EB]/30 transition-colors duration-500 rotate-6" />
                        {/* Main icon container */}
                        <div className={`relative w-24 h-24 rounded-3xl bg-gradient-to-br ${stepGradients[i].bg} flex items-center justify-center shadow-2xl ${stepGradients[i].glow} group-hover:scale-105 group-hover:-rotate-3 transition-all duration-500`}>
                          <Icon name={step.icon} className="h-10 w-10 text-white" />
                        </div>
                        {/* Step badge */}
                        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white shadow-lg border-2 border-gray-100 flex items-center justify-center">
                          <span className="text-xs font-extrabold text-[#2563EB]">{step.step}</span>
                        </div>
                      </div>

                      {/* Content card */}
                      <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-100 group-hover:bg-white group-hover:shadow-xl group-hover:shadow-gray-200/50 group-hover:border-gray-200 transition-all duration-500">
                        <h3 className="text-xl font-bold mb-3 text-gray-900">{t(step.title, lang)}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{t(step.desc, lang)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PRICING — Premium Dark
          ═══════════════════════════════════════════ */}
      <section id="pricing" className="relative overflow-hidden py-28">
        {/* Dark background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0B1437] to-slate-900" />
        <div className="absolute inset-0">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#2563EB]/8 blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#2563EB]/5 blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#60A5FA] bg-white/5 border border-white/10 mb-4">
              {t(content.pricing.label, lang)}
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
              {t(content.pricing.title, lang)}
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              {t(content.pricing.subtitle, lang)}
            </p>
          </div>

          {tiersLoading ? (
            <div className="text-center py-16">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#2563EB]/20 border-t-[#60A5FA]" />
              <p className="text-white/40 mt-4 text-sm">{t(content.pricing.loading, lang)}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 items-start">
              {plans.map((plan, i) => {
                const tierThemes = [
                  { accent: "from-[#3B82F6] to-[#2563EB]", accentSolid: "bg-[#3B82F6]", checkBg: "bg-[#3B82F6]/10", checkColor: "text-[#3B82F6]", btnGradient: "from-[#3B82F6] to-[#2563EB]", shadow: "shadow-[#3B82F6]/20", ring: "ring-[#3B82F6]/20" },
                  { accent: "from-[#2563EB] to-[#1D4ED8]", accentSolid: "bg-[#2563EB]", checkBg: "bg-[#2563EB]/10", checkColor: "text-[#2563EB]", btnGradient: "from-[#2563EB] to-[#1D4ED8]", shadow: "shadow-[#2563EB]/25", ring: "ring-[#2563EB]/20" },
                  { accent: "from-[#1D4ED8] to-[#1E40AF]", accentSolid: "bg-[#1D4ED8]", checkBg: "bg-[#1D4ED8]/10", checkColor: "text-[#1D4ED8]", btnGradient: "from-[#1D4ED8] to-[#1E40AF]", shadow: "shadow-[#1D4ED8]/20", ring: "ring-[#1D4ED8]/20" },
                ]
                const theme = tierThemes[i] || tierThemes[0]

                return (
                  <div
                    key={i}
                    className={`relative group rounded-3xl transition-all duration-500 ${
                      plan.highlighted
                        ? `bg-white shadow-2xl ${theme.shadow} md:scale-[1.04] md:-translate-y-4 ring-2 ${theme.ring}`
                        : "bg-white/95 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:-translate-y-2"
                    }`}
                  >
                    {/* Top accent bar */}
                    <div className={`absolute top-0 inset-x-0 h-1.5 rounded-t-3xl bg-gradient-to-r ${theme.accent}`} />

                    {plan.highlighted && (
                      <div className={`absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-5 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${theme.accent} shadow-lg ${theme.shadow}`}>
                        <Star className="h-3.5 w-3.5" />
                        {t(content.pricing.popular, lang)}
                      </div>
                    )}

                    <div className="p-8 pt-9">
                      {/* Plan name with icon */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.accent} flex items-center justify-center shadow-lg ${theme.shadow}`}>
                          {i === 0 && <Zap className="h-5 w-5 text-white" />}
                          {i === 1 && <Star className="h-5 w-5 text-white" />}
                          {i === 2 && <Building2 className="h-5 w-5 text-white" />}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {t(plan.name, lang)}
                          </h3>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mb-6">
                        {t(plan.description, lang)}
                      </p>

                      {/* Price */}
                      <div className="mb-8">
                        <span className="text-5xl font-extrabold text-gray-900">
                          {t(plan.price, lang)}
                        </span>
                        {plan.period.en && (
                          <span className="text-sm text-gray-400 ms-1">
                            {t(plan.period, lang)}
                          </span>
                        )}
                      </div>

                      {/* Divider */}
                      <div className={`h-px mb-8 bg-gradient-to-r ${theme.accent} opacity-20`} />

                      {/* Features */}
                      <ul className="space-y-3.5 mb-8">
                        {(lang === "ar" ? plan.features.ar : plan.features.en).map((feature, j) => (
                          <li key={j} className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${theme.checkBg}`}>
                              <Check className={`h-3 w-3 ${theme.checkColor}`} />
                            </div>
                            <span className="text-sm text-gray-600">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA Button */}
                      <Link
                        href="/signup"
                        className={`block w-full text-center py-3.5 px-6 rounded-xl text-sm font-semibold transition-all ${
                          plan.highlighted
                            ? `bg-gradient-to-r ${theme.btnGradient} text-white hover:shadow-xl ${theme.shadow} hover:-translate-y-0.5`
                            : `border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50`
                        }`}
                      >
                        {t(content.pricing.cta, lang)}
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FAQ — Premium
          ═══════════════════════════════════════════ */}
      <section id="faq" className="py-28 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#2563EB] bg-[#2563EB]/6 mb-4">
              {lang === "ar" ? "الأسئلة الشائعة" : "FAQ"}
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
              {t(content.faq.title, lang)}
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              {lang === "ar"
                ? "إجابات على الأسئلة الأكثر شيوعًا حول منصتنا."
                : "Answers to the most common questions about our platform."}
            </p>
          </div>

          <div className="space-y-4">
            {content.faq.items.map((item, i) => {
              const isOpen = openFaq === i
              return (
                <div
                  key={i}
                  className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                    isOpen
                      ? "bg-white shadow-xl shadow-[#2563EB]/5 border-[#2563EB]/20"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <button
                    className="w-full flex items-center gap-4 p-6 text-start"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                  >
                    {/* Number badge */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm transition-colors duration-300 ${
                      isOpen
                        ? "bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <span className={`flex-1 text-[15px] font-semibold transition-colors duration-300 ${
                      isOpen ? "text-[#2563EB]" : "text-gray-900"
                    }`}>
                      {t(item.q, lang)}
                    </span>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isOpen ? "bg-[#2563EB]/10 rotate-180" : "bg-gray-100"
                    }`}>
                      <ChevronDown className={`h-4 w-4 transition-colors duration-300 ${
                        isOpen ? "text-[#2563EB]" : "text-gray-400"
                      }`} />
                    </div>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96" : "max-h-0"}`}>
                    <div className={`px-6 pb-6 ${isRtl ? "pr-20" : "pl-20"}`}>
                      <p className="text-gray-500 leading-relaxed">
                        {t(item.a, lang)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CONTACT US — Premium Split Design
          ═══════════════════════════════════════════ */}
      <section id="contact" className="relative overflow-hidden py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="grid lg:grid-cols-2">
              {/* Left side — dark with contact info */}
              <div className="relative p-10 md:p-14 bg-gradient-to-br from-slate-950 via-[#0B1437] to-[#1D4ED8]">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-[-30%] right-[-20%] w-[400px] h-[400px] rounded-full bg-[#2563EB]/15 blur-[80px]" />
                  <div className="absolute bottom-[-30%] left-[-20%] w-[300px] h-[300px] rounded-full bg-[#3B82F6]/10 blur-[60px]" />
                </div>
                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#60A5FA] bg-white/10 border border-white/10 mb-6">
                    {t(content.contact.label, lang)}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
                    {t(content.contact.title, lang)}
                  </h2>
                  <p className="text-white/50 mb-10 leading-relaxed">
                    {t(content.contact.subtitle, lang)}
                  </p>

                  <div className="space-y-4">
                    {content.contact.info.map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2563EB]/30 to-[#3B82F6]/30 flex items-center justify-center shrink-0">
                          <Icon name={item.icon} className="h-5 w-5 text-[#60A5FA]" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white text-sm mb-0.5">{t(item.label, lang)}</h4>
                          <p className="text-white/40 text-sm">
                            {typeof item.value === "string" ? item.value : t(item.value, lang)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right side — form */}
              <div className="p-10 md:p-14 bg-white">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {lang === "ar" ? "أرسل لنا رسالة" : "Send Us a Message"}
                </h3>
                <p className="text-gray-400 text-sm mb-8">
                  {lang === "ar" ? "سنعود إليك في غضون 24 ساعة." : "We'll get back to you within 24 hours."}
                </p>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t(content.contact.nameField, lang)}
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 outline-none transition-all text-sm"
                      placeholder={lang === "ar" ? "أدخل اسمك الكامل" : "Enter your full name"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t(content.contact.emailField, lang)}
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 outline-none transition-all text-sm"
                      placeholder={lang === "ar" ? "أدخل بريدك الإلكتروني" : "Enter your email address"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t(content.contact.messageField, lang)}
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 outline-none transition-all text-sm resize-none"
                      placeholder={lang === "ar" ? "اكتب رسالتك هنا..." : "Write your message here..."}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 px-6 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-[#2563EB]/25 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-base"
                  >
                    <Send className="h-4 w-4" />
                    {t(content.contact.send, lang)}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA
          ═══════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden px-8 py-20 text-center bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#2563EB]">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-[-40%] right-[-15%] w-[500px] h-[500px] rounded-full bg-white/10 blur-[80px]" />
              <div className="absolute bottom-[-40%] left-[-15%] w-[400px] h-[400px] rounded-full bg-[#3B82F6]/10 blur-[80px]" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                {t(content.cta.title, lang)}
              </h2>
              <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10">
                {t(content.cta.subtitle, lang)}
              </p>
              <Link
                href="/signup"
                className="px-10 py-3.5 text-base font-semibold bg-white text-[#1D4ED8] rounded-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
              >
                {t(content.cta.cta, lang)}
                <ArrowIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER — Compact
          ═══════════════════════════════════════════ */}
      <footer className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <KawadirLogo lang={lang} variant="white" />
            <div className="flex items-center gap-6">
              {[
                { en: "Features", ar: "المميزات", href: "#features" },
                { en: "Pricing", ar: "الأسعار", href: "#pricing" },
                { en: "Contact", ar: "تواصل معنا", href: "#contact" },
              ].map((link, i) => (
                <a key={i} href={link.href} className="text-sm text-gray-500 hover:text-white transition-colors">
                  {lang === "ar" ? link.ar : link.en}
                </a>
              ))}
            </div>
            <p className="text-xs text-gray-600">{t(content.footer.copyright, lang)}</p>
          </div>
        </div>
      </footer>
      </div>{/* end main content wrapper */}
    </>
  )
}

/* ═══════════════════════════════════════════
   FEATURE MOCKUPS
   ═══════════════════════════════════════════ */
function FeatureMockup({ type, lang }: { type: string; lang: Lang }) {
  const isRtl = lang === "ar"

  const mockups: Record<string, React.ReactNode> = {
    screening: (
      <div className="space-y-3">
        {[
          { name: isRtl ? "أحمد الحربي" : "Ahmed Al-Harbi", score: 95, skills: ["React", "TypeScript", "Node.js"], status: "top" },
          { name: isRtl ? "سارة المالكي" : "Sara Al-Malki", score: 88, skills: ["Python", "ML", "AWS"], status: "good" },
          { name: isRtl ? "محمد العتيبي" : "Mohammed Al-Otaibi", score: 76, skills: ["Java", "Spring", "SQL"], status: "ok" },
        ].map((c, i) => (
          <div key={i} className="flex items-center gap-4 bg-white/80 rounded-xl p-4 border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#60A5FA] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {c.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-gray-900 truncate">{c.name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  c.status === "top" ? "bg-emerald-50 text-emerald-600" :
                  c.status === "good" ? "bg-blue-50 text-blue-600" :
                  "bg-gray-50 text-gray-600"
                }`}>
                  {c.score}% {isRtl ? "توافق" : "match"}
                </span>
              </div>
              <div className="flex gap-1.5">
                {c.skills.map((s, j) => (
                  <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-[#2563EB]/6 text-[#2563EB] font-medium">{s}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 bg-[#2563EB]/6 rounded-xl p-3 border border-[#2563EB]/10">
          <Brain className="h-4 w-4 text-[#2563EB] shrink-0" />
          <span className="text-xs text-[#1D4ED8] font-medium">
            {isRtl
              ? "تم فرز 128 مرشح بالذكاء الاصطناعي — 12 مرشح مطابق بنسبة عالية"
              : "AI screened 128 candidates — 12 high-match candidates identified"}
          </span>
        </div>
      </div>
    ),
    matching: (
      <div className="space-y-4">
        <div className="bg-white/80 rounded-xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-sm text-gray-900">
                {isRtl ? "مطور واجهات أمامية - أقدم" : "Senior Frontend Developer"}
              </h4>
              <p className="text-xs text-gray-500">{isRtl ? "الرياض، المملكة العربية السعودية" : "Riyadh, Saudi Arabia"}</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <span className="text-white font-extrabold text-lg">92%</span>
            </div>
          </div>
          <div className="space-y-2.5">
            {[
              { skill: isRtl ? "الخبرة التقنية" : "Technical Skills", pct: 95 },
              { skill: isRtl ? "سنوات الخبرة" : "Experience", pct: 88 },
              { skill: isRtl ? "التوافق الثقافي" : "Cultural Fit", pct: 90 },
              { skill: isRtl ? "القيادة" : "Leadership", pct: 78 },
            ].map((s, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 font-medium">{s.skill}</span>
                  <span className="text-gray-900 font-bold">{s.pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] transition-all"
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#3B82F6]/6 rounded-xl p-3 border border-[#3B82F6]/10">
          <Target className="h-4 w-4 text-[#3B82F6] shrink-0" />
          <span className="text-xs text-[#3B82F6] font-medium">
            {isRtl
              ? "الذكاء الاصطناعي وجد 8 مرشحين متوافقين بنسبة أعلى من 85%"
              : "AI found 8 candidates with 85%+ compatibility score"}
          </span>
        </div>
      </div>
    ),
    analytics: (
      <div className="space-y-4">
        <div className="bg-white/80 rounded-xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-sm text-gray-900">
              {isRtl ? "خط أنابيب التوظيف" : "Hiring Pipeline"}
            </h4>
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              +24% {isRtl ? "هذا الشهر" : "this month"}
            </span>
          </div>
          <div className="flex items-end gap-2 h-32">
            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-[#2563EB] to-[#60A5FA] opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-gray-400">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
            <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: isRtl ? "وقت التوظيف" : "Time to Hire", val: "18 " + (isRtl ? "يوم" : "days"), icon: Clock },
            { label: isRtl ? "معدل القبول" : "Offer Rate", val: "34%", icon: Target },
            { label: isRtl ? "نسبة الرضا" : "Satisfaction", val: "4.8/5", icon: BarChart3 },
          ].map((m, i) => (
            <div key={i} className="bg-white/80 rounded-xl p-3 border border-gray-100 text-center">
              <m.icon className="h-4 w-4 text-[#2563EB] mx-auto mb-1" />
              <p className="text-lg font-extrabold text-gray-900">{m.val}</p>
              <p className="text-[10px] text-gray-500">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    ),
    collaboration: (
      <div className="space-y-3">
        <div className="bg-white/80 rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm text-gray-900">
              {isRtl ? "تقييم الفريق" : "Team Evaluation"}
            </h4>
            <div className="flex -space-x-2">
              {["bg-[#2563EB]", "bg-[#3B82F6]", "bg-pink-500", "bg-amber-500"].map((c, i) => (
                <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-white flex items-center justify-center text-white text-[10px] font-bold`}>
                  {["A", "S", "M", "N"][i]}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {[
              { reviewer: isRtl ? "أحمد" : "Ahmed", score: 4.5, comment: isRtl ? "مرشح ممتاز، خبرة قوية" : "Excellent candidate, strong experience" },
              { reviewer: isRtl ? "سارة" : "Sara", score: 4.0, comment: isRtl ? "مهارات تقنية جيدة جدًا" : "Very good technical skills" },
              { reviewer: isRtl ? "محمد" : "Mohammed", score: 4.8, comment: isRtl ? "أفضل مرشح لهذا الدور" : "Best candidate for this role" },
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] text-xs font-bold shrink-0">
                  {r.reviewer[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-900">{r.reviewer}</span>
                    <span className="text-xs font-bold text-amber-500">{r.score}/5</span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">{r.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-3 border border-blue-100">
          <Users className="h-4 w-4 text-blue-600 shrink-0" />
          <span className="text-xs text-blue-700 font-medium">
            {isRtl
              ? "3 من أعضاء الفريق أكملوا تقييمهم — متوسط التقييم 4.4/5"
              : "3 team members completed their review — avg score 4.4/5"}
          </span>
        </div>
      </div>
    ),
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-6 border border-gray-200/50 shadow-xl shadow-gray-200/50">
      {mockups[type] || null}
    </div>
  )
}
