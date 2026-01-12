import { Header } from '@/components/layout/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { DollarSign, TrendingUp, AlertTriangle, Clock } from 'lucide-react';

export default function Billing() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      <Header title="Billing & Payments" titleAr="الفوترة والمدفوعات" />
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title={t('MRR', 'الإيرادات الشهرية')} value="$52.8K" icon={<DollarSign className="w-6 h-6" />} trend={{ value: 15, label: t('vs last month', 'مقارنة بالشهر الماضي') }} variant="success" />
          <KpiCard title={t('ARR', 'الإيرادات السنوية')} value="$634K" icon={<TrendingUp className="w-6 h-6" />} />
          <KpiCard title={t('Overdue', 'متأخرة')} value="$4,798" icon={<AlertTriangle className="w-6 h-6" />} subtitle={t('2 organizations', 'مؤسستان')} variant="destructive" />
          <KpiCard title={t('Renewals', 'التجديدات')} value="5" icon={<Clock className="w-6 h-6" />} subtitle={t('Next 30 days', 'خلال 30 يوم')} variant="warning" />
        </div>
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground">{t('Connect Supabase to enable billing management', 'قم بتوصيل Supabase لتفعيل إدارة الفوترة')}</p>
        </div>
      </div>
    </div>
  );
}
