import { Header } from '@/components/layout/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Mail, Shield, Database } from 'lucide-react';

export default function Settings() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      <Header title="Platform Settings" titleAr="إعدادات المنصة" />
      <div className="p-6 space-y-6 animate-fade-in max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" />{t('General Settings', 'الإعدادات العامة')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t('Default Language', 'اللغة الافتراضية')}</Label><Select defaultValue="en"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="ar">العربية</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>{t('Default Timezone', 'المنطقة الزمنية')}</Label><Select defaultValue="dubai"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="dubai">Asia/Dubai (GMT+4)</SelectItem><SelectItem value="riyadh">Asia/Riyadh (GMT+3)</SelectItem></SelectContent></Select></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" />{t('Email Settings', 'إعدادات البريد')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t('Sender Name', 'اسم المرسل')}</Label><Input defaultValue="Jadarat ATS" /></div>
              <div className="space-y-2"><Label>{t('Support Email', 'بريد الدعم')}</Label><Input defaultValue="support@jadarat.com" /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />{t('Feature Flags', 'الميزات')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"><Label>{t('AI Features', 'ميزات الذكاء الاصطناعي')}</Label><Switch defaultChecked /></div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"><Label>{t('Calendar Integrations', 'تكامل التقويم')}</Label><Switch defaultChecked /></div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"><Label>{t('Video Integrations', 'تكامل الفيديو')}</Label><Switch /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="w-5 h-5" />{t('Data Retention', 'حفظ البيانات')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t('Candidate Data (days)', 'بيانات المرشحين (أيام)')}</Label><Input type="number" defaultValue="730" /></div>
              <div className="space-y-2"><Label>{t('Audit Logs (days)', 'سجلات التدقيق (أيام)')}</Label><Input type="number" defaultValue="1095" /></div>
            </div>
          </CardContent>
        </Card>

        <Button className="bg-accent hover:bg-accent/90">{t('Save Settings', 'حفظ الإعدادات')}</Button>
      </div>
    </div>
  );
}
