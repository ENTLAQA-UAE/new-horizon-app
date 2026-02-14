// Landing Page Builder Types

export type LandingBlockType =
  | 'hero'
  | 'features'
  | 'about'
  | 'stats'
  | 'testimonials'
  | 'pricing'
  | 'clients'
  | 'how_it_works'
  | 'cta'
  | 'faq'
  | 'contact'
  | 'custom'

export interface LandingPageBlock {
  id: string
  type: LandingBlockType
  order: number
  enabled: boolean
  content: LandingBlockContent
  styles: LandingBlockStyles
}

export interface LandingBlockContent {
  // Common
  title?: string
  titleAr?: string
  subtitle?: string
  subtitleAr?: string
  description?: string
  descriptionAr?: string

  // Hero specific
  backgroundImage?: string
  ctaText?: string
  ctaTextAr?: string
  ctaLink?: string
  secondaryCtaText?: string
  secondaryCtaTextAr?: string
  secondaryCtaLink?: string
  badge?: string
  badgeAr?: string

  // Items (for features, stats, testimonials, pricing, clients, how_it_works, faq)
  items?: LandingContentItem[]

  // Contact
  email?: string
  phone?: string
  address?: string
  addressAr?: string

  // Custom HTML
  html?: string
  htmlAr?: string
}

export interface LandingContentItem {
  id: string
  icon?: string
  image?: string
  title: string
  titleAr?: string
  description: string
  descriptionAr?: string
  // For testimonials
  author?: string
  authorAr?: string
  authorRole?: string
  authorRoleAr?: string
  authorImage?: string
  // For stats
  value?: string
  valueAr?: string
  label?: string
  labelAr?: string
  // For pricing
  price?: string
  priceAr?: string
  period?: string
  periodAr?: string
  featured?: boolean
  features?: string[]
  featuresAr?: string[]
  ctaText?: string
  ctaTextAr?: string
  ctaLink?: string
  // For how it works
  step?: number
}

export interface LandingBlockStyles {
  backgroundColor?: string
  textColor?: string
  padding?: 'none' | 'small' | 'medium' | 'large'
  alignment?: 'left' | 'center' | 'right'
  layout?: 'default' | 'grid' | 'list'
  columns?: 2 | 3 | 4
  showDivider?: boolean
  fullWidth?: boolean
}

export interface LandingPageConfig {
  published: boolean
  styles: LandingPageStyles
  seo: LandingPageSeo
  navbar: LandingNavbar
  footer: LandingFooter
}

export interface LandingPageStyles {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  textColor: string
  fontFamily: string
  borderRadius: string
}

export interface LandingPageSeo {
  title?: string
  titleAr?: string
  description?: string
  descriptionAr?: string
  ogImage?: string
}

export interface LandingNavbar {
  showLogo: boolean
  logoUrl?: string
  ctaText?: string
  ctaTextAr?: string
  ctaLink?: string
  links?: { label: string; labelAr?: string; href: string }[]
}

export interface LandingFooter {
  companyName?: string
  companyNameAr?: string
  description?: string
  descriptionAr?: string
  copyright?: string
  copyrightAr?: string
  links?: { label: string; labelAr?: string; href: string }[]
  socialLinks?: { platform: string; url: string }[]
}

// Default block templates
export const defaultLandingBlocks: Record<LandingBlockType, Partial<LandingPageBlock>> = {
  hero: {
    type: 'hero',
    enabled: true,
    content: {
      badge: 'AI-Powered Recruitment Platform',
      badgeAr: 'منصة توظيف مدعومة بالذكاء الاصطناعي',
      title: 'Hire the Best Talent, Faster',
      titleAr: 'وظّف أفضل الكفاءات بسرعة',
      subtitle: 'Streamline your recruitment with intelligent automation, collaborative tools, and data-driven insights.',
      subtitleAr: 'بسّط عملية التوظيف مع الأتمتة الذكية والأدوات التعاونية والرؤى المبنية على البيانات.',
      ctaText: 'Get Started Free',
      ctaTextAr: 'ابدأ مجاناً',
      ctaLink: '/signup',
      secondaryCtaText: 'Book a Demo',
      secondaryCtaTextAr: 'احجز عرض تجريبي',
      secondaryCtaLink: '#contact',
    },
    styles: {
      padding: 'large',
      alignment: 'center',
    },
  },
  features: {
    type: 'features',
    enabled: true,
    content: {
      title: 'Everything You Need to Hire Smarter',
      titleAr: 'كل ما تحتاجه لتوظيف أذكى',
      subtitle: 'Powerful features designed for modern recruitment teams.',
      subtitleAr: 'ميزات قوية مصممة لفرق التوظيف الحديثة.',
      items: [
        { id: '1', icon: 'Zap', title: 'AI-Powered Screening', titleAr: 'فرز مدعوم بالذكاء الاصطناعي', description: 'Automatically screen and rank candidates based on job requirements.', descriptionAr: 'فرز وترتيب المرشحين تلقائياً بناءً على متطلبات الوظيفة.' },
        { id: '2', icon: 'Users', title: 'Team Collaboration', titleAr: 'تعاون الفريق', description: 'Seamless collaboration with hiring managers, interviewers, and HR teams.', descriptionAr: 'تعاون سلس مع مديري التوظيف والمحاورين وفرق الموارد البشرية.' },
        { id: '3', icon: 'BarChart3', title: 'Analytics & Insights', titleAr: 'التحليلات والرؤى', description: 'Data-driven dashboards to optimize your hiring pipeline.', descriptionAr: 'لوحات تحكم مبنية على البيانات لتحسين خط أنابيب التوظيف.' },
        { id: '4', icon: 'Globe', title: 'Multi-Language Support', titleAr: 'دعم متعدد اللغات', description: 'Full Arabic and English support with RTL layouts.', descriptionAr: 'دعم كامل للعربية والإنجليزية مع التخطيطات من اليمين لليسار.' },
        { id: '5', icon: 'Shield', title: 'Enterprise Security', titleAr: 'أمان المؤسسات', description: 'Bank-grade security with role-based access control.', descriptionAr: 'أمان على مستوى البنوك مع التحكم في الوصول القائم على الأدوار.' },
        { id: '6', icon: 'Briefcase', title: 'Career Page Builder', titleAr: 'منشئ صفحة التوظيف', description: 'Build beautiful, branded career pages without any code.', descriptionAr: 'أنشئ صفحات توظيف جميلة ومُعرَّفة دون أي كود.' },
      ],
    },
    styles: {
      padding: 'large',
      columns: 3,
      layout: 'grid',
      alignment: 'center',
    },
  },
  about: {
    type: 'about',
    enabled: false,
    content: {
      title: 'About Kawadir',
      titleAr: 'عن كوادر',
      description: 'Kawadir is the leading AI-powered recruitment platform built for the MENA region.',
      descriptionAr: 'كوادر هي منصة التوظيف الرائدة المدعومة بالذكاء الاصطناعي والمصممة لمنطقة الشرق الأوسط وشمال أفريقيا.',
    },
    styles: {
      padding: 'large',
      alignment: 'center',
    },
  },
  stats: {
    type: 'stats',
    enabled: true,
    content: {
      title: 'Trusted by Companies Across the Region',
      titleAr: 'موثوق من شركات في جميع أنحاء المنطقة',
      items: [
        { id: '1', value: '500+', valueAr: '+500', label: 'Companies', labelAr: 'شركة', title: '', description: '' },
        { id: '2', value: '50K+', valueAr: '+50K', label: 'Candidates Hired', labelAr: 'مرشح تم توظيفه', title: '', description: '' },
        { id: '3', value: '95%', valueAr: '%95', label: 'Customer Satisfaction', labelAr: 'رضا العملاء', title: '', description: '' },
        { id: '4', value: '40%', valueAr: '%40', label: 'Faster Hiring', labelAr: 'توظيف أسرع', title: '', description: '' },
      ],
    },
    styles: {
      padding: 'large',
      columns: 4,
      alignment: 'center',
    },
  },
  testimonials: {
    type: 'testimonials',
    enabled: false,
    content: {
      title: 'What Our Customers Say',
      titleAr: 'ماذا يقول عملاؤنا',
      items: [
        { id: '1', title: '', description: 'Kawadir transformed our hiring process. We reduced time-to-hire by 40%.', descriptionAr: 'حولت كوادر عملية التوظيف لدينا. قللنا وقت التوظيف بنسبة 40%.', author: 'Ahmed Al-Rashid', authorRole: 'HR Director, TechCorp', authorImage: '' },
        { id: '2', title: '', description: 'The AI screening saves our team hours every week. Highly recommended.', descriptionAr: 'يوفر الفرز بالذكاء الاصطناعي لفريقنا ساعات كل أسبوع. نوصي به بشدة.', author: 'Sarah Hassan', authorRole: 'Talent Acquisition, StartupX', authorImage: '' },
      ],
    },
    styles: {
      padding: 'large',
      columns: 2,
      alignment: 'center',
    },
  },
  pricing: {
    type: 'pricing',
    enabled: false,
    content: {
      title: 'Simple, Transparent Pricing',
      titleAr: 'تسعير بسيط وشفاف',
      subtitle: 'Choose the plan that fits your needs.',
      subtitleAr: 'اختر الخطة التي تناسب احتياجاتك.',
      items: [
        { id: '1', title: 'Starter', titleAr: 'المبتدئ', description: 'For small teams', descriptionAr: 'للفرق الصغيرة', price: '$49', period: '/month', features: ['Up to 5 active jobs', '100 candidates/month', 'Email support'], ctaText: 'Start Free Trial', ctaLink: '/signup' },
        { id: '2', title: 'Professional', titleAr: 'المحترف', description: 'For growing companies', descriptionAr: 'للشركات النامية', price: '$149', period: '/month', featured: true, features: ['Unlimited active jobs', '1000 candidates/month', 'AI screening', 'Priority support'], ctaText: 'Start Free Trial', ctaLink: '/signup' },
        { id: '3', title: 'Enterprise', titleAr: 'المؤسسة', description: 'For large organizations', descriptionAr: 'للمؤسسات الكبيرة', price: 'Custom', period: '', features: ['Everything in Professional', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee'], ctaText: 'Contact Sales', ctaLink: '#contact' },
      ],
    },
    styles: {
      padding: 'large',
      columns: 3,
      alignment: 'center',
    },
  },
  clients: {
    type: 'clients',
    enabled: false,
    content: {
      title: 'Trusted by Leading Companies',
      titleAr: 'موثوق من الشركات الرائدة',
      items: [],
    },
    styles: {
      padding: 'medium',
      alignment: 'center',
    },
  },
  how_it_works: {
    type: 'how_it_works',
    enabled: true,
    content: {
      title: 'How It Works',
      titleAr: 'كيف يعمل',
      subtitle: 'Get started in three simple steps.',
      subtitleAr: 'ابدأ في ثلاث خطوات بسيطة.',
      items: [
        { id: '1', step: 1, icon: 'UserPlus', title: 'Create Your Account', titleAr: 'أنشئ حسابك', description: 'Sign up and set up your organization profile in minutes.', descriptionAr: 'سجّل وأعدّ ملف مؤسستك في دقائق.' },
        { id: '2', step: 2, icon: 'FileText', title: 'Post Jobs & Screen', titleAr: 'انشر الوظائف وافرز', description: 'Create job listings and let AI screen candidates automatically.', descriptionAr: 'أنشئ إعلانات الوظائف ودع الذكاء الاصطناعي يفرز المرشحين تلقائياً.' },
        { id: '3', step: 3, icon: 'CheckCircle', title: 'Hire the Best', titleAr: 'وظّف الأفضل', description: 'Collaborate with your team, interview, and make the right hire.', descriptionAr: 'تعاون مع فريقك، أجرِ المقابلات، واتخذ القرار الصحيح.' },
      ],
    },
    styles: {
      padding: 'large',
      alignment: 'center',
    },
  },
  cta: {
    type: 'cta',
    enabled: true,
    content: {
      title: 'Ready to Transform Your Hiring?',
      titleAr: 'مستعد لتحويل عملية التوظيف؟',
      subtitle: 'Join hundreds of companies already using Kawadir to hire smarter.',
      subtitleAr: 'انضم إلى مئات الشركات التي تستخدم كوادر بالفعل للتوظيف بذكاء.',
      ctaText: 'Get Started Free',
      ctaTextAr: 'ابدأ مجاناً',
      ctaLink: '/signup',
      secondaryCtaText: 'Talk to Sales',
      secondaryCtaTextAr: 'تحدث مع المبيعات',
      secondaryCtaLink: '#contact',
    },
    styles: {
      padding: 'large',
      alignment: 'center',
    },
  },
  faq: {
    type: 'faq',
    enabled: false,
    content: {
      title: 'Frequently Asked Questions',
      titleAr: 'الأسئلة الشائعة',
      items: [
        { id: '1', title: 'How does AI screening work?', titleAr: 'كيف يعمل الفرز بالذكاء الاصطناعي؟', description: 'Our AI analyzes resumes and job descriptions to match candidates based on skills, experience, and qualifications.', descriptionAr: 'يحلل الذكاء الاصطناعي السير الذاتية ووصف الوظائف لمطابقة المرشحين بناءً على المهارات والخبرة والمؤهلات.' },
        { id: '2', title: 'Is there a free trial?', titleAr: 'هل يوجد نسخة تجريبية مجانية؟', description: 'Yes! You can try Kawadir free for 14 days with full access to all features.', descriptionAr: 'نعم! يمكنك تجربة كوادر مجاناً لمدة 14 يوماً مع الوصول الكامل لجميع الميزات.' },
      ],
    },
    styles: {
      padding: 'large',
      alignment: 'center',
    },
  },
  contact: {
    type: 'contact',
    enabled: false,
    content: {
      title: 'Contact Us',
      titleAr: 'تواصل معنا',
      email: 'support@kawadir.io',
      phone: '',
      address: '',
    },
    styles: {
      padding: 'large',
      alignment: 'center',
    },
  },
  custom: {
    type: 'custom',
    enabled: false,
    content: {
      html: '',
      htmlAr: '',
    },
    styles: {
      padding: 'medium',
    },
  },
}

export const landingBlockLabels: Record<LandingBlockType, { en: string; ar: string; icon: string }> = {
  hero: { en: 'Hero Banner', ar: 'البانر الرئيسي', icon: 'Image' },
  features: { en: 'Features', ar: 'المميزات', icon: 'Sparkles' },
  about: { en: 'About', ar: 'من نحن', icon: 'Building2' },
  stats: { en: 'Statistics', ar: 'الإحصائيات', icon: 'BarChart3' },
  testimonials: { en: 'Testimonials', ar: 'آراء العملاء', icon: 'MessageSquare' },
  pricing: { en: 'Pricing Plans', ar: 'خطط الأسعار', icon: 'CreditCard' },
  clients: { en: 'Client Logos', ar: 'شعارات العملاء', icon: 'Building' },
  how_it_works: { en: 'How It Works', ar: 'كيف يعمل', icon: 'ListOrdered' },
  cta: { en: 'Call to Action', ar: 'دعوة للعمل', icon: 'MousePointer' },
  faq: { en: 'FAQ', ar: 'الأسئلة الشائعة', icon: 'HelpCircle' },
  contact: { en: 'Contact', ar: 'تواصل معنا', icon: 'Mail' },
  custom: { en: 'Custom HTML', ar: 'HTML مخصص', icon: 'Code' },
}

export const defaultLandingConfig: LandingPageConfig = {
  published: false,
  styles: {
    primaryColor: '#2D4CFF',
    secondaryColor: '#6B7FFF',
    backgroundColor: '#FFFFFF',
    textColor: '#1A1A2E',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: '12px',
  },
  seo: {
    title: 'Kawadir - AI-Powered Recruitment Platform',
    titleAr: 'كوادر - منصة التوظيف المدعومة بالذكاء الاصطناعي',
    description: 'Streamline your hiring with AI-powered screening, team collaboration, and data-driven insights.',
    descriptionAr: 'بسّط عملية التوظيف مع الفرز المدعوم بالذكاء الاصطناعي والتعاون الجماعي والرؤى المبنية على البيانات.',
  },
  navbar: {
    showLogo: true,
    ctaText: 'Get Started',
    ctaTextAr: 'ابدأ الآن',
    ctaLink: '/signup',
    links: [
      { label: 'Features', labelAr: 'المميزات', href: '#features' },
      { label: 'Pricing', labelAr: 'الأسعار', href: '#pricing' },
      { label: 'Contact', labelAr: 'تواصل', href: '#contact' },
    ],
  },
  footer: {
    companyName: 'Kawadir',
    companyNameAr: 'كوادر',
    description: 'AI-Powered Recruitment Platform for the MENA Region.',
    descriptionAr: 'منصة التوظيف المدعومة بالذكاء الاصطناعي لمنطقة الشرق الأوسط.',
    copyright: '© 2025 Kawadir. All rights reserved.',
    copyrightAr: '© 2025 كوادر. جميع الحقوق محفوظة.',
    links: [
      { label: 'Privacy Policy', labelAr: 'سياسة الخصوصية', href: '/privacy' },
      { label: 'Terms of Service', labelAr: 'شروط الخدمة', href: '/terms' },
    ],
    socialLinks: [],
  },
}
