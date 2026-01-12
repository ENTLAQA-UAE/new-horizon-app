import { Header } from '@/components/layout/Header';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { RecentOrganizationsTable } from '@/components/dashboard/RecentOrganizationsTable';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { TierDistributionChart } from '@/components/dashboard/TierDistributionChart';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { useLanguage } from '@/contexts/LanguageContext';
import { Building2, Users, DollarSign, TrendingUp, AlertTriangle, CreditCard } from 'lucide-react';

// Mock data - would come from Supabase
const mockOrganizations = [
  { id: '1', name: 'Saudi National Bank', nameAr: 'البنك الأهلي السعودي', tier: 'Enterprise', status: 'active' as const, users: 45, jobs: 23, candidates: 4520, createdAt: 'Jan 15, 2025' },
  { id: '2', name: 'Emirates Healthcare', nameAr: 'الإمارات للرعاية الصحية', tier: 'Professional', status: 'active' as const, users: 12, jobs: 8, candidates: 890, createdAt: 'Jan 10, 2025' },
  { id: '3', name: 'Tech Innovators UAE', nameAr: 'مبتكرون التقنية الإمارات', tier: 'Starter', status: 'trial' as const, users: 3, jobs: 5, candidates: 234, createdAt: 'Jan 8, 2025' },
  { id: '4', name: 'Qatar Airways', nameAr: 'الخطوط الجوية القطرية', tier: 'Enterprise', status: 'active' as const, users: 89, jobs: 45, candidates: 12450, createdAt: 'Dec 20, 2024' },
  { id: '5', name: 'Bahrain Fintech', nameAr: 'البحرين للتقنية المالية', tier: 'Professional', status: 'suspended' as const, users: 8, jobs: 0, candidates: 156, createdAt: 'Dec 15, 2024' },
];

const mockActivities = [
  { id: '1', type: 'org_created' as const, title: 'New organization registered', titleAr: 'تسجيل مؤسسة جديدة', description: 'Tech Innovators UAE joined the platform', descriptionAr: 'انضم مبتكرون التقنية الإمارات إلى المنصة', time: '2 hours ago', timeAr: 'منذ ساعتين' },
  { id: '2', type: 'payment_received' as const, title: 'Payment received', titleAr: 'تم استلام الدفعة', description: 'Saudi National Bank - $2,999 Enterprise', descriptionAr: 'البنك الأهلي السعودي - $2,999 المؤسسات', time: '5 hours ago', timeAr: 'منذ 5 ساعات' },
  { id: '3', type: 'tier_upgraded' as const, title: 'Subscription upgraded', titleAr: 'ترقية الاشتراك', description: 'Emirates Healthcare upgraded to Professional', descriptionAr: 'ترقية الإمارات للرعاية الصحية إلى المحترف', time: 'Yesterday', timeAr: 'أمس' },
  { id: '4', type: 'org_suspended' as const, title: 'Organization suspended', titleAr: 'تعليق المؤسسة', description: 'Bahrain Fintech - Payment overdue', descriptionAr: 'البحرين للتقنية المالية - تأخر الدفع', time: '2 days ago', timeAr: 'منذ يومين' },
  { id: '5', type: 'user_added' as const, title: 'New admin added', titleAr: 'إضافة مدير جديد', description: 'Qatar Airways added 5 new recruiters', descriptionAr: 'الخطوط القطرية أضافت 5 موظفين توظيف', time: '3 days ago', timeAr: 'منذ 3 أيام' },
];

const tierDistributionData = [
  { name: 'Starter', nameAr: 'مبتدئ', value: 8, color: 'hsl(38, 92%, 50%)' },
  { name: 'Professional', nameAr: 'محترف', value: 5, color: 'hsl(187, 92%, 35%)' },
  { name: 'Enterprise', nameAr: 'مؤسسات', value: 2, color: 'hsl(222, 47%, 11%)' },
];

const revenueData = [
  { month: 'Aug', monthAr: 'أغسطس', revenue: 28500 },
  { month: 'Sep', monthAr: 'سبتمبر', revenue: 32000 },
  { month: 'Oct', monthAr: 'أكتوبر', revenue: 35200 },
  { month: 'Nov', monthAr: 'نوفمبر', revenue: 41000 },
  { month: 'Dec', monthAr: 'ديسمبر', revenue: 48500 },
  { month: 'Jan', monthAr: 'يناير', revenue: 52800 },
];

export default function Dashboard() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" titleAr="لوحة التحكم" />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            title={t('Total Organizations', 'إجمالي المؤسسات')}
            value="15"
            icon={<Building2 className="w-6 h-6" />}
            trend={{ value: 12, label: t('vs last month', 'مقارنة بالشهر الماضي') }}
          />
          <KpiCard
            title={t('Active Users', 'المستخدمون النشطون')}
            value="157"
            icon={<Users className="w-6 h-6" />}
            trend={{ value: 8, label: t('vs last month', 'مقارنة بالشهر الماضي') }}
            variant="success"
          />
          <KpiCard
            title={t('MRR', 'الإيرادات الشهرية')}
            value="$52.8K"
            icon={<DollarSign className="w-6 h-6" />}
            trend={{ value: 15, label: t('vs last month', 'مقارنة بالشهر الماضي') }}
            variant="info"
          />
          <KpiCard
            title={t('ARR', 'الإيرادات السنوية')}
            value="$634K"
            icon={<TrendingUp className="w-6 h-6" />}
            trend={{ value: 22, label: t('YoY growth', 'نمو سنوي') }}
          />
          <KpiCard
            title={t('Trial Orgs', 'المؤسسات التجريبية')}
            value="3"
            icon={<CreditCard className="w-6 h-6" />}
            subtitle={t('Expires in 7 days', 'تنتهي خلال 7 أيام')}
            variant="warning"
          />
          <KpiCard
            title={t('Overdue Payments', 'المدفوعات المتأخرة')}
            value="2"
            icon={<AlertTriangle className="w-6 h-6" />}
            subtitle="$4,798"
            variant="destructive"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart data={revenueData} />
          </div>
          <TierDistributionChart data={tierDistributionData} />
        </div>

        {/* Table and Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <RecentOrganizationsTable organizations={mockOrganizations} />
          </div>
          <ActivityFeed activities={mockActivities} />
        </div>
      </div>
    </div>
  );
}
