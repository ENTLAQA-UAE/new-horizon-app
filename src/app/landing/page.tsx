"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Sparkles,
  Brain,
  Users,
  BarChart3,
  Globe,
  Zap,
  FileSearch,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Languages,
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
} from "lucide-react"

type Lang = "en" | "ar"

const content = {
  nav: {
    features: { en: "Features", ar: "المميزات" },
    howItWorks: { en: "How It Works", ar: "كيف يعمل" },
    pricing: { en: "Pricing", ar: "الأسعار" },
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
    { value: "10K+", label: { en: "Candidates Screened", ar: "مرشح تم فرزهم" } },
    { value: "85%", label: { en: "Faster Hiring", ar: "توظيف أسرع" } },
    { value: "200+", label: { en: "Companies Trust Us", ar: "شركة تثق بنا" } },
    { value: "98%", label: { en: "Satisfaction Rate", ar: "نسبة الرضا" } },
  ],
  cta: {
    title: { en: "Ready to Transform Your Hiring?", ar: "مستعد لتحويل عملية التوظيف؟" },
    subtitle: {
      en: "Join hundreds of companies across MENA who hire smarter with Kawadir.",
      ar: "انضم لمئات الشركات في الشرق الأوسط التي توظّف بذكاء مع كوادر.",
    },
    cta: { en: "Start Free Trial", ar: "ابدأ تجربتك المجانية" },
    demo: { en: "Contact Sales", ar: "تواصل مع المبيعات" },
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
}

function t(obj: { en: string; ar: string }, lang: Lang) {
  return lang === "ar" ? obj.ar : obj.en
}

function Icon({ name, className }: { name: string; className?: string }) {
  const Comp = iconMap[name] || Sparkles
  return <Comp className={className} />
}

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("ar")
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const isRtl = lang === "ar"
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      style={{ fontFamily: isRtl ? "'IBM Plex Sans Arabic', sans-serif" : "'Poppins', sans-serif" }}
      className="bg-white text-gray-900 overflow-x-hidden"
    >
      {/* ═══════════════════════════════════════════
          NAVBAR
          ═══════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/landing" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2D4CFF] to-[#6B7FFF] flex items-center justify-center shadow-lg shadow-[#2D4CFF]/20">
              <span className="text-white font-extrabold text-lg">K</span>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              {isRtl ? "كوادر" : "kawadir"}
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              {t(content.nav.features, lang)}
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              {t(content.nav.howItWorks, lang)}
            </a>
            <a href="#faq" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              FAQ
            </a>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Languages className="h-4 w-4" />
              {lang === "en" ? "العربية" : "English"}
            </button>
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {t(content.nav.signIn, lang)}
            </Link>
            <Link
              href="/signup"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#2D4CFF] to-[#6B7FFF] rounded-xl hover:shadow-lg hover:shadow-[#2D4CFF]/20 hover:-translate-y-0.5 transition-all"
            >
              {t(content.nav.getStarted, lang)}
            </Link>
          </div>
        </div>
      </nav>

      {/* Spacer */}
      <div className="h-16" />

      {/* ═══════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0A1340] to-[#1E3ACC]" />
        <div className="absolute inset-0">
          <div className="absolute top-[-30%] right-[-10%] w-[700px] h-[700px] rounded-full bg-[#2D4CFF]/[0.06]0/20 blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#7C4DFF]/15 blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8 bg-white/10 text-white/90 backdrop-blur-sm border border-white/10 animate-fade-in-up">
              <Sparkles className="h-4 w-4 text-[#6B7FFF]" />
              {t(content.hero.badge, lang)}
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] mb-6 text-white tracking-tight animate-fade-in-up">
              {t(content.hero.title, lang)}
              <br />
              <span className="bg-gradient-to-r from-[#6B7FFF] via-[#7C4DFF] to-[#A78BFA] bg-clip-text text-transparent">
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
                className="px-8 py-3.5 text-base font-semibold bg-white text-[#1E3ACC] rounded-xl hover:shadow-2xl hover:shadow-[#2D4CFF]/100/25 hover:-translate-y-0.5 transition-all flex items-center gap-2"
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
                <div className="p-6">
                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
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
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      { label: isRtl ? "جديد" : "New", count: 45, color: "from-blue-500 to-blue-600" },
                      { label: isRtl ? "مُراجعة" : "Screening", count: 32, color: "from-[#2D4CFF] to-[#1E3ACC]" },
                      { label: isRtl ? "مقابلة" : "Interview", count: 18, color: "from-[#7C4DFF] to-[#6B7FFF]" },
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
          STATS BAND
          ═══════════════════════════════════════════ */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {content.stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-[#2D4CFF] to-[#6B7FFF] bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-500 font-medium text-sm">{t(stat.label, lang)}</div>
              </div>
            ))}
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#2D4CFF] bg-[#2D4CFF]/[0.06] mb-4">
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
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#2D4CFF]/[0.06] mb-5">
                      <Icon name={feature.icon} className="h-6 w-6 text-[#2D4CFF]" />
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
                          <CheckCircle className="h-5 w-5 text-[#2D4CFF] shrink-0" />
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
          FEATURE GRID (smaller features)
          ═══════════════════════════════════════════ */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 tracking-tight">
            {lang === "ar" ? "وأكثر من ذلك..." : "And Much More..."}
          </h2>
          <p className="text-gray-500 text-lg text-center max-w-2xl mx-auto mb-16">
            {lang === "ar"
              ? "مجموعة شاملة من الأدوات لتحسين كل جانب من عملية التوظيف."
              : "A comprehensive suite of tools to improve every aspect of your hiring process."}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.featureGrid.map((f, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-[#2D4CFF]/10 hover:shadow-xl hover:shadow-[#2D4CFF]/10 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-[#2D4CFF]/[0.06] flex items-center justify-center mb-4">
                  <Icon name={f.icon} className="h-5 w-5 text-[#2D4CFF]" />
                </div>
                <h3 className="text-lg font-bold mb-2">{t(f.title, lang)}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{t(f.desc, lang)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#2D4CFF] bg-[#2D4CFF]/[0.06] mb-4">
              {t(content.howItWorks.label, lang)}
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
              {t(content.howItWorks.title, lang)}
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              {t(content.howItWorks.subtitle, lang)}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {content.howItWorks.steps.map((step, i) => (
              <div key={i} className="relative text-center">
                {/* Connector line */}
                {i < 2 && (
                  <div
                    className="hidden md:block absolute top-10 w-full h-[2px] bg-gradient-to-r from-[#2D4CFF]/20 to-[#6B7FFF]/20"
                    style={{ [isRtl ? "right" : "left"]: "60%" }}
                  />
                )}
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#2D4CFF] to-[#6B7FFF] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#2D4CFF]/20">
                    <Icon name={step.icon} className="h-9 w-9 text-white" />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-[0.15em] text-[#2D4CFF] mb-2">
                    {lang === "ar" ? `الخطوة ${step.step}` : `Step ${step.step}`}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{t(step.title, lang)}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{t(step.desc, lang)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FAQ
          ═══════════════════════════════════════════ */}
      <section id="faq" className="bg-gray-50 py-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12 tracking-tight">
            {t(content.faq.title, lang)}
          </h2>
          <div className="space-y-3">
            {content.faq.items.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-5 text-start font-semibold hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-[15px]">{t(item.q, lang)}</span>
                  {openFaq === i ? (
                    <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-gray-500 text-sm leading-relaxed animate-fade-in">
                    {t(item.a, lang)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA
          ═══════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden px-8 py-20 text-center bg-gradient-to-br from-[#2D4CFF] via-[#1E3ACC] to-[#2D4CFF]">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-[-40%] right-[-15%] w-[500px] h-[500px] rounded-full bg-white/10 blur-[80px]" />
              <div className="absolute bottom-[-40%] left-[-15%] w-[400px] h-[400px] rounded-full bg-[#7C4DFF]/10 blur-[80px]" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                {t(content.cta.title, lang)}
              </h2>
              <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10">
                {t(content.cta.subtitle, lang)}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="px-8 py-3.5 text-base font-semibold bg-white text-[#1E3ACC] rounded-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  {t(content.cta.cta, lang)}
                  <ArrowIcon className="h-4 w-4" />
                </Link>
                <a
                  href="mailto:sales@kawadir.io"
                  className="px-8 py-3.5 text-base font-semibold rounded-xl border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all"
                >
                  {t(content.cta.demo, lang)}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════ */}
      <footer className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2D4CFF] to-[#6B7FFF] flex items-center justify-center">
                  <span className="text-white font-extrabold text-lg">K</span>
                </div>
                <span className="text-xl font-bold tracking-tight">
                  {isRtl ? "كوادر" : "kawadir"}
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t(content.footer.desc, lang)}
              </p>
            </div>

            {/* Product links */}
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">
                {t(content.footer.product, lang)}
              </h4>
              <div className="space-y-2.5">
                {[
                  { en: "Features", ar: "المميزات", href: "#features" },
                  { en: "Pricing", ar: "الأسعار", href: "#" },
                  { en: "Integrations", ar: "التكاملات", href: "#" },
                  { en: "API", ar: "واجهة البرمجة", href: "#" },
                ].map((link, i) => (
                  <a key={i} href={link.href} className="block text-sm text-gray-400 hover:text-white transition-colors">
                    {lang === "ar" ? link.ar : link.en}
                  </a>
                ))}
              </div>
            </div>

            {/* Company links */}
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">
                {t(content.footer.company, lang)}
              </h4>
              <div className="space-y-2.5">
                {[
                  { en: "About Us", ar: "عن كوادر", href: "#" },
                  { en: "Blog", ar: "المدونة", href: "#" },
                  { en: "Careers", ar: "وظائف", href: "#" },
                  { en: "Contact", ar: "تواصل معنا", href: "#" },
                ].map((link, i) => (
                  <a key={i} href={link.href} className="block text-sm text-gray-400 hover:text-white transition-colors">
                    {lang === "ar" ? link.ar : link.en}
                  </a>
                ))}
              </div>
            </div>

            {/* Legal links */}
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">
                {t(content.footer.legal, lang)}
              </h4>
              <div className="space-y-2.5">
                {[
                  { en: "Privacy Policy", ar: "سياسة الخصوصية", href: "#" },
                  { en: "Terms of Service", ar: "شروط الخدمة", href: "#" },
                  { en: "Cookie Policy", ar: "سياسة ملفات الارتباط", href: "#" },
                ].map((link, i) => (
                  <a key={i} href={link.href} className="block text-sm text-gray-400 hover:text-white transition-colors">
                    {lang === "ar" ? link.ar : link.en}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">{t(content.footer.copyright, lang)}</p>
            <div className="flex items-center gap-6">
              <a href="mailto:support@kawadir.io" className="text-gray-400 hover:text-white transition-colors">
                <Mail className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Globe className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ═══════════════════════════════════════════
   FEATURE MOCKUPS
   ═══════════════════════════════════════════
   These are CSS-based dashboard mockups that
   simulate screenshots. Replace with actual
   screenshots by swapping in <img> tags.
   ═══════════════════════════════════════════ */
function FeatureMockup({ type, lang }: { type: string; lang: Lang }) {
  const isRtl = lang === "ar"

  const mockups: Record<string, React.ReactNode> = {
    screening: (
      <div className="space-y-3">
        {/* Candidate cards with AI scores */}
        {[
          { name: isRtl ? "أحمد الحربي" : "Ahmed Al-Harbi", score: 95, skills: ["React", "TypeScript", "Node.js"], status: "top" },
          { name: isRtl ? "سارة المالكي" : "Sara Al-Malki", score: 88, skills: ["Python", "ML", "AWS"], status: "good" },
          { name: isRtl ? "محمد العتيبي" : "Mohammed Al-Otaibi", score: 76, skills: ["Java", "Spring", "SQL"], status: "ok" },
        ].map((c, i) => (
          <div key={i} className="flex items-center gap-4 bg-white/80 rounded-xl p-4 border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2D4CFF] to-[#6B7FFF] flex items-center justify-center text-white font-bold text-sm shrink-0">
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
                  <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-[#2D4CFF]/[0.06] text-[#2D4CFF] font-medium">{s}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {/* AI insight bar */}
        <div className="flex items-center gap-2 bg-[#2D4CFF]/[0.06] rounded-xl p-3 border border-[#2D4CFF]/10">
          <Brain className="h-4 w-4 text-[#2D4CFF] shrink-0" />
          <span className="text-xs text-[#1E3ACC] font-medium">
            {isRtl
              ? "تم فرز 128 مرشح بالذكاء الاصطناعي — 12 مرشح مطابق بنسبة عالية"
              : "AI screened 128 candidates — 12 high-match candidates identified"}
          </span>
        </div>
      </div>
    ),
    matching: (
      <div className="space-y-4">
        {/* Job match card */}
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
          {/* Skill bars */}
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
                    className="h-full rounded-full bg-gradient-to-r from-[#2D4CFF] to-[#6B7FFF] transition-all"
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#7C4DFF]/[0.06] rounded-xl p-3 border border-[#7C4DFF]/10">
          <Target className="h-4 w-4 text-[#7C4DFF] shrink-0" />
          <span className="text-xs text-[#7C4DFF] font-medium">
            {isRtl
              ? "الذكاء الاصطناعي وجد 8 مرشحين متوافقين بنسبة أعلى من 85%"
              : "AI found 8 candidates with 85%+ compatibility score"}
          </span>
        </div>
      </div>
    ),
    analytics: (
      <div className="space-y-4">
        {/* Mini chart mockup */}
        <div className="bg-white/80 rounded-xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-sm text-gray-900">
              {isRtl ? "خط أنابيب التوظيف" : "Hiring Pipeline"}
            </h4>
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              +24% {isRtl ? "هذا الشهر" : "this month"}
            </span>
          </div>
          {/* Bar chart */}
          <div className="flex items-end gap-2 h-32">
            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-[#2D4CFF] to-[#6B7FFF] opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-gray-400">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
            <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
          </div>
        </div>
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: isRtl ? "وقت التوظيف" : "Time to Hire", val: "18 " + (isRtl ? "يوم" : "days"), icon: Clock },
            { label: isRtl ? "معدل القبول" : "Offer Rate", val: "34%", icon: Target },
            { label: isRtl ? "نسبة الرضا" : "Satisfaction", val: "4.8/5", icon: BarChart3 },
          ].map((m, i) => (
            <div key={i} className="bg-white/80 rounded-xl p-3 border border-gray-100 text-center">
              <m.icon className="h-4 w-4 text-[#2D4CFF] mx-auto mb-1" />
              <p className="text-lg font-extrabold text-gray-900">{m.val}</p>
              <p className="text-[10px] text-gray-500">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    ),
    collaboration: (
      <div className="space-y-3">
        {/* Team review card */}
        <div className="bg-white/80 rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm text-gray-900">
              {isRtl ? "تقييم الفريق" : "Team Evaluation"}
            </h4>
            <div className="flex -space-x-2">
              {["bg-[#2D4CFF]", "bg-[#7C4DFF]", "bg-pink-500", "bg-amber-500"].map((c, i) => (
                <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-white flex items-center justify-center text-white text-[10px] font-bold`}>
                  {["A", "S", "M", "N"][i]}
                </div>
              ))}
            </div>
          </div>
          {/* Scorecard */}
          <div className="space-y-2">
            {[
              { reviewer: isRtl ? "أحمد" : "Ahmed", score: 4.5, comment: isRtl ? "مرشح ممتاز، خبرة قوية" : "Excellent candidate, strong experience" },
              { reviewer: isRtl ? "سارة" : "Sara", score: 4.0, comment: isRtl ? "مهارات تقنية جيدة جدًا" : "Very good technical skills" },
              { reviewer: isRtl ? "محمد" : "Mohammed", score: 4.8, comment: isRtl ? "أفضل مرشح لهذا الدور" : "Best candidate for this role" },
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-[#2D4CFF]/10 flex items-center justify-center text-[#2D4CFF] text-xs font-bold shrink-0">
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
