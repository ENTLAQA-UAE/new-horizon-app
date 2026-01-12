import { Bell, Search, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface HeaderProps {
  title: string;
  titleAr: string;
}

export function Header({ title, titleAr }: HeaderProps) {
  const { t, direction } = useLanguage();

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      {/* Title */}
      <h1 className="text-xl font-semibold text-foreground">
        {t(title, titleAr)}
      </h1>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ltr:left-3 rtl:right-3" />
          <Input
            placeholder={t('Search...', 'بحث...')}
            className="w-64 ltr:pl-10 rtl:pr-10 bg-muted/50"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <Badge 
                className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-[10px] bg-destructive"
              >
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={direction === 'rtl' ? 'start' : 'end'} className="w-80">
            <DropdownMenuLabel>{t('Notifications', 'الإشعارات')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium text-sm">
                {t('New organization registered', 'تسجيل مؤسسة جديدة')}
              </span>
              <span className="text-xs text-muted-foreground">
                Saudi Bank - {t('2 hours ago', 'منذ ساعتين')}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium text-sm">
                {t('Payment received', 'تم استلام الدفعة')}
              </span>
              <span className="text-xs text-muted-foreground">
                Tech Corp - $2,999 - {t('5 hours ago', 'منذ 5 ساعات')}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium text-sm text-warning">
                {t('Subscription expiring soon', 'الاشتراك ينتهي قريباً')}
              </span>
              <span className="text-xs text-muted-foreground">
                UAE Healthcare - {t('3 days left', 'باقي 3 أيام')}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-3 px-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                  SA
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-start">
                <p className="text-sm font-medium">{t('Super Admin', 'المدير العام')}</p>
                <p className="text-xs text-muted-foreground">admin@jadarat.com</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={direction === 'rtl' ? 'start' : 'end'}>
            <DropdownMenuLabel>{t('My Account', 'حسابي')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
              {t('Profile', 'الملف الشخصي')}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              {t('Logout', 'تسجيل الخروج')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
