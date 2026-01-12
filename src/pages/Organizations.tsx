import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Plus, Search, MoreHorizontal, Building2, Users, Briefcase, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Organization {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  tier: string;
  status: 'active' | 'trial' | 'suspended' | 'cancelled';
  adminEmail: string;
  users: number;
  jobs: number;
  candidates: number;
  subscriptionEnd: string;
  createdAt: string;
}

const mockOrganizations: Organization[] = [
  { id: '1', name: 'Saudi National Bank', nameAr: 'البنك الأهلي السعودي', slug: 'saudi-bank', tier: 'Enterprise', status: 'active', adminEmail: 'fatima@snb.com', users: 45, jobs: 23, candidates: 4520, subscriptionEnd: 'Jan 15, 2026', createdAt: 'Jan 15, 2025' },
  { id: '2', name: 'Emirates Healthcare', nameAr: 'الإمارات للرعاية الصحية', slug: 'emirates-health', tier: 'Professional', status: 'active', adminEmail: 'ahmed@emirateshealth.ae', users: 12, jobs: 8, candidates: 890, subscriptionEnd: 'Mar 10, 2025', createdAt: 'Jan 10, 2025' },
  { id: '3', name: 'Tech Innovators UAE', nameAr: 'مبتكرون التقنية الإمارات', slug: 'tech-innovators', tier: 'Starter', status: 'trial', adminEmail: 'sara@techinnovators.ae', users: 3, jobs: 5, candidates: 234, subscriptionEnd: 'Feb 8, 2025', createdAt: 'Jan 8, 2025' },
  { id: '4', name: 'Qatar Airways', nameAr: 'الخطوط الجوية القطرية', slug: 'qatar-airways', tier: 'Enterprise', status: 'active', adminEmail: 'hr@qatarairways.com', users: 89, jobs: 45, candidates: 12450, subscriptionEnd: 'Dec 20, 2025', createdAt: 'Dec 20, 2024' },
  { id: '5', name: 'Bahrain Fintech', nameAr: 'البحرين للتقنية المالية', slug: 'bahrain-fintech', tier: 'Professional', status: 'suspended', adminEmail: 'admin@bahrainfintech.bh', users: 8, jobs: 0, candidates: 156, subscriptionEnd: 'Dec 15, 2024', createdAt: 'Dec 15, 2024' },
  { id: '6', name: 'Kuwait Oil Company', nameAr: 'شركة نفط الكويت', slug: 'kuwait-oil', tier: 'Enterprise', status: 'active', adminEmail: 'hr@koc.com.kw', users: 67, jobs: 34, candidates: 8900, subscriptionEnd: 'Jun 1, 2025', createdAt: 'Jun 1, 2024' },
  { id: '7', name: 'Oman Tourism', nameAr: 'عمان للسياحة', slug: 'oman-tourism', tier: 'Starter', status: 'active', adminEmail: 'careers@omantourism.om', users: 5, jobs: 3, candidates: 445, subscriptionEnd: 'Apr 15, 2025', createdAt: 'Oct 15, 2024' },
];

const statusLabels = {
  active: { en: 'Active', ar: 'نشط' },
  trial: { en: 'Trial', ar: 'تجريبي' },
  suspended: { en: 'Suspended', ar: 'معلق' },
  cancelled: { en: 'Cancelled', ar: 'ملغي' },
};

export default function Organizations() {
  const { t, language, direction } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filteredOrgs = mockOrganizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          org.nameAr.includes(searchQuery) ||
                          org.adminEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
    const matchesTier = tierFilter === 'all' || org.tier === tierFilter;
    return matchesSearch && matchesStatus && matchesTier;
  });

  return (
    <div className="min-h-screen">
      <Header title="Organizations" titleAr="المؤسسات" />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ltr:left-3 rtl:right-3" />
              <Input
                placeholder={t('Search organizations...', 'البحث عن المؤسسات...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ltr:pl-10 rtl:pr-10"
              />
            </div>
            
            {/* Filters */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                <SelectValue placeholder={t('Status', 'الحالة')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All Status', 'جميع الحالات')}</SelectItem>
                <SelectItem value="active">{t('Active', 'نشط')}</SelectItem>
                <SelectItem value="trial">{t('Trial', 'تجريبي')}</SelectItem>
                <SelectItem value="suspended">{t('Suspended', 'معلق')}</SelectItem>
                <SelectItem value="cancelled">{t('Cancelled', 'ملغي')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('Tier', 'المستوى')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All Tiers', 'جميع المستويات')}</SelectItem>
                <SelectItem value="Starter">{t('Starter', 'مبتدئ')}</SelectItem>
                <SelectItem value="Professional">{t('Professional', 'محترف')}</SelectItem>
                <SelectItem value="Enterprise">{t('Enterprise', 'مؤسسات')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Create Button */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Plus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                {t('Add Organization', 'إضافة مؤسسة')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t('Create New Organization', 'إنشاء مؤسسة جديدة')}</DialogTitle>
                <DialogDescription>
                  {t('Add a new organization to the platform. They will receive an email to set up their account.', 
                     'أضف مؤسسة جديدة إلى المنصة. سيتلقون بريداً إلكترونياً لإعداد حسابهم.')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('Organization Name (EN)', 'اسم المؤسسة (إنجليزي)')}</Label>
                    <Input placeholder="Saudi Bank" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('Organization Name (AR)', 'اسم المؤسسة (عربي)')}</Label>
                    <Input placeholder="البنك السعودي" dir="rtl" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>{t('Admin Email', 'بريد المدير الإلكتروني')}</Label>
                  <Input type="email" placeholder="admin@company.com" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('Subscription Tier', 'مستوى الاشتراك')}</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder={t('Select tier', 'اختر المستوى')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">{t('Starter - $299/mo', 'مبتدئ - $299/شهر')}</SelectItem>
                        <SelectItem value="professional">{t('Professional - $799/mo', 'محترف - $799/شهر')}</SelectItem>
                        <SelectItem value="enterprise">{t('Enterprise - $2,999/mo', 'مؤسسات - $2,999/شهر')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('Data Residency', 'موقع البيانات')}</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder={t('Select region', 'اختر المنطقة')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mena">{t('MENA Region', 'منطقة الشرق الأوسط')}</SelectItem>
                        <SelectItem value="uae">{t('UAE Only', 'الإمارات فقط')}</SelectItem>
                        <SelectItem value="ksa">{t('KSA Only', 'السعودية فقط')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {t('Cancel', 'إلغاء')}
                </Button>
                <Button className="bg-accent hover:bg-accent/90">
                  {t('Create Organization', 'إنشاء المؤسسة')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">{t('Total', 'الإجمالي')}</p>
            <p className="text-2xl font-bold">{mockOrganizations.length}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">{t('Active', 'نشط')}</p>
            <p className="text-2xl font-bold text-success">{mockOrganizations.filter(o => o.status === 'active').length}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">{t('Trial', 'تجريبي')}</p>
            <p className="text-2xl font-bold text-warning">{mockOrganizations.filter(o => o.status === 'trial').length}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">{t('Suspended', 'معلق')}</p>
            <p className="text-2xl font-bold text-destructive">{mockOrganizations.filter(o => o.status === 'suspended').length}</p>
          </div>
        </div>

        {/* Organizations Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-start text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('Organization', 'المؤسسة')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('Tier', 'المستوى')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('Status', 'الحالة')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('Usage', 'الاستخدام')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('Subscription End', 'انتهاء الاشتراك')}
                  </th>
                  <th className="px-6 py-3 text-end text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('Actions', 'الإجراءات')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrgs.map((org) => (
                  <tr key={org.id} className="table-row-hover">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {language === 'ar' ? org.nameAr : org.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{org.adminEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary">{org.tier}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn(
                        "capitalize",
                        org.status === 'active' && 'status-active',
                        org.status === 'trial' && 'status-trial',
                        org.status === 'suspended' && 'status-suspended',
                        org.status === 'cancelled' && 'status-cancelled',
                      )}>
                        {language === 'ar' ? statusLabels[org.status].ar : statusLabels[org.status].en}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {org.users}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {org.jobs}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {org.subscriptionEnd}
                    </td>
                    <td className="px-6 py-4 text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={direction === 'rtl' ? 'start' : 'end'}>
                          <DropdownMenuItem>{t('View Details', 'عرض التفاصيل')}</DropdownMenuItem>
                          <DropdownMenuItem>{t('Edit', 'تعديل')}</DropdownMenuItem>
                          <DropdownMenuItem>{t('Change Tier', 'تغيير المستوى')}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {org.status === 'active' && (
                            <DropdownMenuItem className="text-warning">
                              {t('Suspend', 'تعليق')}
                            </DropdownMenuItem>
                          )}
                          {org.status === 'suspended' && (
                            <DropdownMenuItem className="text-success">
                              {t('Reactivate', 'إعادة التفعيل')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive">
                            {t('Delete', 'حذف')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredOrgs.length === 0 && (
            <div className="p-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {t('No organizations found', 'لم يتم العثور على مؤسسات')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
