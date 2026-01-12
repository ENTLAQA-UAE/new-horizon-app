import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Organization {
  id: string;
  name: string;
  nameAr: string;
  tier: string;
  status: 'active' | 'trial' | 'suspended' | 'cancelled';
  users: number;
  jobs: number;
  candidates: number;
  createdAt: string;
}

interface RecentOrganizationsTableProps {
  organizations: Organization[];
}

const statusLabels = {
  active: { en: 'Active', ar: 'نشط' },
  trial: { en: 'Trial', ar: 'تجريبي' },
  suspended: { en: 'Suspended', ar: 'معلق' },
  cancelled: { en: 'Cancelled', ar: 'ملغي' },
};

export function RecentOrganizationsTable({ organizations }: RecentOrganizationsTableProps) {
  const { t, language, direction } = useLanguage();

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {t('Recent Organizations', 'المؤسسات الأخيرة')}
        </h3>
        <Button variant="ghost" size="sm">
          {t('View All', 'عرض الكل')}
          <ExternalLink className="w-4 h-4 ltr:ml-2 rtl:mr-2" />
        </Button>
      </div>
      
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
                {t('Users', 'المستخدمين')}
              </th>
              <th className="px-6 py-3 text-start text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('Jobs', 'الوظائف')}
              </th>
              <th className="px-6 py-3 text-start text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('Candidates', 'المرشحين')}
              </th>
              <th className="px-6 py-3 text-end text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('Actions', 'الإجراءات')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {organizations.map((org) => (
              <tr key={org.id} className="table-row-hover">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-accent">
                        {org.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {language === 'ar' ? org.nameAr : org.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{org.createdAt}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="secondary">{org.tier}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {org.users}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {org.jobs}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {org.candidates.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={direction === 'rtl' ? 'start' : 'end'}>
                      <DropdownMenuItem>{t('View Details', 'عرض التفاصيل')}</DropdownMenuItem>
                      <DropdownMenuItem>{t('Edit', 'تعديل')}</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        {t('Suspend', 'تعليق')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
