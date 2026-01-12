import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus, Check, X, Edit, Building2, Users, Briefcase, HardDrive, Sparkles, BarChart, Globe, Webhook } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tier {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  priceMonthly: number;
  priceYearly: number;
  maxJobs: number;
  maxCandidates: number;
  maxUsers: number;
  maxStorageGb: number;
  features: {
    aiParsing: boolean;
    advancedAnalytics: boolean;
    whiteLabel: boolean;
    customDomain: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    saudizationTracking: boolean;
    emiratizationTracking: boolean;
  };
  isActive: boolean;
  organizationCount: number;
}

const mockTiers: Tier[] = [
  {
    id: '1',
    name: 'Starter',
    nameAr: 'مبتدئ',
    description: 'Perfect for small teams getting started with ATS',
    descriptionAr: 'مثالي للفرق الصغيرة التي تبدأ مع نظام تتبع المتقدمين',
    priceMonthly: 299,
    priceYearly: 2990,
    maxJobs: 5,
    maxCandidates: 1000,
    maxUsers: 3,
    maxStorageGb: 10,
    features: {
      aiParsing: true,
      advancedAnalytics: false,
      whiteLabel: false,
      customDomain: false,
      apiAccess: false,
      prioritySupport: false,
      saudizationTracking: false,
      emiratizationTracking: false,
    },
    isActive: true,
    organizationCount: 8,
  },
  {
    id: '2',
    name: 'Professional',
    nameAr: 'محترف',
    description: 'For growing teams that need advanced features',
    descriptionAr: 'للفرق المتنامية التي تحتاج ميزات متقدمة',
    priceMonthly: 799,
    priceYearly: 7990,
    maxJobs: 25,
    maxCandidates: 10000,
    maxUsers: 15,
    maxStorageGb: 50,
    features: {
      aiParsing: true,
      advancedAnalytics: true,
      whiteLabel: true,
      customDomain: false,
      apiAccess: false,
      prioritySupport: true,
      saudizationTracking: true,
      emiratizationTracking: true,
    },
    isActive: true,
    organizationCount: 5,
  },
  {
    id: '3',
    name: 'Enterprise',
    nameAr: 'مؤسسات',
    description: 'Unlimited access for large organizations',
    descriptionAr: 'وصول غير محدود للمؤسسات الكبيرة',
    priceMonthly: 2999,
    priceYearly: 29990,
    maxJobs: -1,
    maxCandidates: -1,
    maxUsers: -1,
    maxStorageGb: 500,
    features: {
      aiParsing: true,
      advancedAnalytics: true,
      whiteLabel: true,
      customDomain: true,
      apiAccess: true,
      prioritySupport: true,
      saudizationTracking: true,
      emiratizationTracking: true,
    },
    isActive: true,
    organizationCount: 2,
  },
];

const featureLabels = {
  aiParsing: { en: 'AI Resume Parsing', ar: 'تحليل السيرة الذاتية بالذكاء الاصطناعي', icon: Sparkles },
  advancedAnalytics: { en: 'Advanced Analytics', ar: 'التحليلات المتقدمة', icon: BarChart },
  whiteLabel: { en: 'White-Label Branding', ar: 'العلامة التجارية المخصصة', icon: Building2 },
  customDomain: { en: 'Custom Domain', ar: 'النطاق المخصص', icon: Globe },
  apiAccess: { en: 'API Access', ar: 'الوصول إلى API', icon: Webhook },
  prioritySupport: { en: 'Priority Support', ar: 'الدعم ذو الأولوية', icon: Users },
  saudizationTracking: { en: 'Saudization Tracking', ar: 'تتبع السعودة', icon: Check },
  emiratizationTracking: { en: 'Emiratization Tracking', ar: 'تتبع التوطين', icon: Check },
};

export default function Tiers() {
  const { t, language } = useLanguage();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const formatLimit = (value: number) => {
    if (value === -1) return t('Unlimited', 'غير محدود');
    return value.toLocaleString();
  };

  return (
    <div className="min-h-screen">
      <Header title="Subscription Tiers" titleAr="مستويات الاشتراك" />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-muted-foreground">
              {t('Manage subscription plans and pricing for your platform', 
                 'إدارة خطط الاشتراك والتسعير للمنصة')}
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Plus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                {t('Create Tier', 'إنشاء مستوى')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('Create New Tier', 'إنشاء مستوى جديد')}</DialogTitle>
                <DialogDescription>
                  {t('Define a new subscription tier with custom limits and features.',
                     'حدد مستوى اشتراك جديد بحدود وميزات مخصصة.')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="font-medium">{t('Basic Information', 'المعلومات الأساسية')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('Tier Name (EN)', 'اسم المستوى (إنجليزي)')}</Label>
                      <Input placeholder="Professional" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('Tier Name (AR)', 'اسم المستوى (عربي)')}</Label>
                      <Input placeholder="محترف" dir="rtl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('Description (EN)', 'الوصف (إنجليزي)')}</Label>
                      <Textarea placeholder="For growing teams..." />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('Description (AR)', 'الوصف (عربي)')}</Label>
                      <Textarea placeholder="للفرق المتنامية..." dir="rtl" />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                  <h4 className="font-medium">{t('Pricing', 'التسعير')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('Monthly Price (USD)', 'السعر الشهري (دولار)')}</Label>
                      <Input type="number" placeholder="799" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('Yearly Price (USD)', 'السعر السنوي (دولار)')}</Label>
                      <Input type="number" placeholder="7990" />
                    </div>
                  </div>
                </div>

                {/* Limits */}
                <div className="space-y-4">
                  <h4 className="font-medium">{t('Limits', 'الحدود')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('Max Jobs (-1 = unlimited)', 'الحد الأقصى للوظائف (-1 = غير محدود)')}</Label>
                      <Input type="number" placeholder="25" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('Max Candidates', 'الحد الأقصى للمرشحين')}</Label>
                      <Input type="number" placeholder="10000" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('Max Users', 'الحد الأقصى للمستخدمين')}</Label>
                      <Input type="number" placeholder="15" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('Max Storage (GB)', 'الحد الأقصى للتخزين (جيجا)')}</Label>
                      <Input type="number" placeholder="50" />
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <h4 className="font-medium">{t('Features', 'الميزات')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(featureLabels).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <Label className="flex items-center gap-2">
                          <value.icon className="w-4 h-4 text-muted-foreground" />
                          {language === 'ar' ? value.ar : value.en}
                        </Label>
                        <Switch />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {t('Cancel', 'إلغاء')}
                </Button>
                <Button className="bg-accent hover:bg-accent/90">
                  {t('Create Tier', 'إنشاء المستوى')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockTiers.map((tier, index) => (
            <Card 
              key={tier.id} 
              className={cn(
                "relative overflow-hidden card-hover-lift",
                index === 1 && "border-accent ring-2 ring-accent/20"
              )}
            >
              {index === 1 && (
                <div className="absolute top-4 ltr:right-4 rtl:left-4">
                  <Badge className="bg-accent text-accent-foreground">
                    {t('Popular', 'الأكثر شعبية')}
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">
                    {language === 'ar' ? tier.nameAr : tier.name}
                  </CardTitle>
                  {!tier.isActive && (
                    <Badge variant="secondary">{t('Inactive', 'غير نشط')}</Badge>
                  )}
                </div>
                <CardDescription>
                  {language === 'ar' ? tier.descriptionAr : tier.description}
                </CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold">${tier.priceMonthly}</span>
                  <span className="text-muted-foreground">/{t('month', 'شهر')}</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    ${tier.priceYearly}/{t('year', 'سنة')} ({t('save', 'وفر')} ${tier.priceMonthly * 12 - tier.priceYearly})
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Limits */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="w-4 h-4" />
                      {t('Jobs', 'الوظائف')}
                    </span>
                    <span className="font-medium">{formatLimit(tier.maxJobs)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {t('Candidates', 'المرشحين')}
                    </span>
                    <span className="font-medium">{formatLimit(tier.maxCandidates)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {t('Users', 'المستخدمين')}
                    </span>
                    <span className="font-medium">{formatLimit(tier.maxUsers)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <HardDrive className="w-4 h-4" />
                      {t('Storage', 'التخزين')}
                    </span>
                    <span className="font-medium">{tier.maxStorageGb} GB</span>
                  </div>
                </div>

                {/* Features */}
                <div className="pt-4 border-t border-border space-y-2">
                  {Object.entries(tier.features).map(([key, enabled]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      {enabled ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/50" />
                      )}
                      <span className={cn(!enabled && 'text-muted-foreground/50')}>
                        {language === 'ar' 
                          ? featureLabels[key as keyof typeof featureLabels].ar 
                          : featureLabels[key as keyof typeof featureLabels].en}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{tier.organizationCount}</span>
                    {' '}{t('organizations using this tier', 'مؤسسات تستخدم هذا المستوى')}
                  </p>
                </div>
              </CardContent>

              <CardFooter>
                <Button variant="outline" className="w-full gap-2">
                  <Edit className="w-4 h-4" />
                  {t('Edit Tier', 'تعديل المستوى')}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
