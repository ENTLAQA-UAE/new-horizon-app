// Career Page Builder Types

export type BlockType =
  | 'hero'
  | 'about'
  | 'values'
  | 'benefits'
  | 'team'
  | 'testimonials'
  | 'jobs'
  | 'stats'
  | 'gallery'
  | 'cta'
  | 'contact'
  | 'custom'

export interface CareerPageBlock {
  id: string
  type: BlockType
  order: number
  enabled: boolean
  content: BlockContent
  styles: BlockStyles
}

export interface BlockContent {
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

  // Items (for values, benefits, team, testimonials, stats)
  items?: ContentItem[]

  // Gallery
  images?: GalleryImage[]

  // Contact
  email?: string
  phone?: string
  address?: string
  addressAr?: string
  socialLinks?: SocialLink[]

  // Custom HTML
  html?: string
  htmlAr?: string
}

export interface ContentItem {
  id: string
  icon?: string
  image?: string
  title: string
  titleAr?: string
  description: string
  descriptionAr?: string
  // For team
  role?: string
  roleAr?: string
  // For testimonials
  author?: string
  authorRole?: string
  // For stats
  value?: string
  valueAr?: string
  label?: string
  labelAr?: string
}

export interface GalleryImage {
  id: string
  url: string
  alt?: string
  altAr?: string
  caption?: string
  captionAr?: string
}

export interface SocialLink {
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'website'
  url: string
}

export interface BlockStyles {
  backgroundColor?: string
  textColor?: string
  padding?: 'none' | 'small' | 'medium' | 'large'
  alignment?: 'left' | 'center' | 'right'
  layout?: 'default' | 'grid' | 'list' | 'carousel'
  columns?: 2 | 3 | 4
  showDivider?: boolean
  fullWidth?: boolean
}

export interface CareerPageStyles {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  textColor: string
  fontFamily: string
  borderRadius: string
  headerStyle: 'minimal' | 'standard' | 'bold'
  footerStyle: 'minimal' | 'standard' | 'detailed'
}

export interface CareerPageSeo {
  title?: string
  titleAr?: string
  description?: string
  descriptionAr?: string
  keywords: string[]
  ogImage?: string
}

export interface CareerPageSettings {
  showHeader: boolean
  showFooter: boolean
  showLogo: boolean
  showJobSearch: boolean
  showJobFilters: boolean
  language: 'en' | 'ar' | 'both'
  defaultLanguage: 'en' | 'ar'
}

export interface CareerPageConfig {
  blocks: CareerPageBlock[]
  styles: CareerPageStyles
  seo: CareerPageSeo
  settings: CareerPageSettings
}

// Default block templates
export const defaultBlocks: Record<BlockType, Partial<CareerPageBlock>> = {
  hero: {
    type: 'hero',
    enabled: true,
    content: {
      title: 'Join Our Team',
      titleAr: 'انضم إلى فريقنا',
      subtitle: 'Build your career with us',
      subtitleAr: 'ابنِ مسيرتك المهنية معنا',
      ctaText: 'View Open Positions',
      ctaTextAr: 'عرض الوظائف المتاحة',
      ctaLink: '#jobs',
    },
    styles: {
      padding: 'large',
      alignment: 'center',
    },
  },
  about: {
    type: 'about',
    enabled: true,
    content: {
      title: 'About Us',
      titleAr: 'من نحن',
      description: 'Tell your company story here...',
      descriptionAr: 'اكتب قصة شركتك هنا...',
    },
    styles: {
      padding: 'medium',
      alignment: 'left',
    },
  },
  values: {
    type: 'values',
    enabled: true,
    content: {
      title: 'Our Values',
      titleAr: 'قيمنا',
      items: [
        { id: '1', icon: 'Heart', title: 'Integrity', titleAr: 'النزاهة', description: 'We act with honesty and transparency', descriptionAr: 'نتصرف بصدق وشفافية' },
        { id: '2', icon: 'Users', title: 'Teamwork', titleAr: 'العمل الجماعي', description: 'We achieve more together', descriptionAr: 'نحقق المزيد معاً' },
        { id: '3', icon: 'Rocket', title: 'Innovation', titleAr: 'الابتكار', description: 'We embrace new ideas', descriptionAr: 'نتبنى الأفكار الجديدة' },
      ],
    },
    styles: {
      padding: 'medium',
      columns: 3,
      layout: 'grid',
    },
  },
  benefits: {
    type: 'benefits',
    enabled: true,
    content: {
      title: 'Why Join Us?',
      titleAr: 'لماذا تنضم إلينا؟',
      items: [
        { id: '1', icon: 'Briefcase', title: 'Career Growth', titleAr: 'النمو الوظيفي', description: 'Advance your career with us', descriptionAr: 'طور مسيرتك المهنية معنا' },
        { id: '2', icon: 'Heart', title: 'Health Benefits', titleAr: 'المزايا الصحية', description: 'Comprehensive health coverage', descriptionAr: 'تغطية صحية شاملة' },
        { id: '3', icon: 'Clock', title: 'Flexible Hours', titleAr: 'ساعات مرنة', description: 'Work-life balance matters', descriptionAr: 'التوازن بين العمل والحياة' },
        { id: '4', icon: 'GraduationCap', title: 'Learning', titleAr: 'التعلم', description: 'Continuous learning opportunities', descriptionAr: 'فرص التعلم المستمر' },
      ],
    },
    styles: {
      padding: 'medium',
      columns: 4,
      layout: 'grid',
    },
  },
  team: {
    type: 'team',
    enabled: false,
    content: {
      title: 'Meet Our Team',
      titleAr: 'تعرف على فريقنا',
      items: [],
    },
    styles: {
      padding: 'medium',
      columns: 4,
      layout: 'grid',
    },
  },
  testimonials: {
    type: 'testimonials',
    enabled: false,
    content: {
      title: 'What Our Team Says',
      titleAr: 'ماذا يقول فريقنا',
      items: [],
    },
    styles: {
      padding: 'medium',
      layout: 'carousel',
    },
  },
  jobs: {
    type: 'jobs',
    enabled: true,
    content: {
      title: 'Open Positions',
      titleAr: 'الوظائف المتاحة',
    },
    styles: {
      padding: 'medium',
    },
  },
  stats: {
    type: 'stats',
    enabled: false,
    content: {
      title: 'By the Numbers',
      titleAr: 'بالأرقام',
      items: [
        { id: '1', value: '500+', valueAr: '+500', label: 'Employees', labelAr: 'موظف', title: '', description: '' },
        { id: '2', value: '50+', valueAr: '+50', label: 'Countries', labelAr: 'دولة', title: '', description: '' },
        { id: '3', value: '10+', valueAr: '+10', label: 'Years', labelAr: 'سنوات', title: '', description: '' },
      ],
    },
    styles: {
      padding: 'medium',
      columns: 3,
      backgroundColor: '#F3F4F6',
    },
  },
  gallery: {
    type: 'gallery',
    enabled: false,
    content: {
      title: 'Life at Our Company',
      titleAr: 'الحياة في شركتنا',
      images: [],
    },
    styles: {
      padding: 'medium',
      columns: 3,
    },
  },
  cta: {
    type: 'cta',
    enabled: false,
    content: {
      title: 'Ready to Join Us?',
      titleAr: 'مستعد للانضمام إلينا؟',
      subtitle: 'Start your journey with us today',
      subtitleAr: 'ابدأ رحلتك معنا اليوم',
      ctaText: 'Apply Now',
      ctaTextAr: 'قدم الآن',
      ctaLink: '#jobs',
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
      title: 'Get in Touch',
      titleAr: 'تواصل معنا',
      email: '',
      phone: '',
      address: '',
    },
    styles: {
      padding: 'medium',
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

export const blockLabels: Record<BlockType, { en: string; ar: string; icon: string }> = {
  hero: { en: 'Hero Banner', ar: 'البانر الرئيسي', icon: 'Image' },
  about: { en: 'About Us', ar: 'من نحن', icon: 'Building2' },
  values: { en: 'Company Values', ar: 'قيم الشركة', icon: 'Heart' },
  benefits: { en: 'Benefits & Perks', ar: 'المزايا والامتيازات', icon: 'Gift' },
  team: { en: 'Team Members', ar: 'أعضاء الفريق', icon: 'Users' },
  testimonials: { en: 'Testimonials', ar: 'الشهادات', icon: 'MessageSquare' },
  jobs: { en: 'Job Listings', ar: 'قائمة الوظائف', icon: 'Briefcase' },
  stats: { en: 'Statistics', ar: 'الإحصائيات', icon: 'BarChart3' },
  gallery: { en: 'Image Gallery', ar: 'معرض الصور', icon: 'Images' },
  cta: { en: 'Call to Action', ar: 'دعوة للعمل', icon: 'MousePointer' },
  contact: { en: 'Contact Info', ar: 'معلومات الاتصال', icon: 'Mail' },
  custom: { en: 'Custom HTML', ar: 'HTML مخصص', icon: 'Code' },
}
