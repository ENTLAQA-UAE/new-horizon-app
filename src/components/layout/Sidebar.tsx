import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  CreditCard, 
  Receipt, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Globe
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const navItems = [
  { 
    path: '/', 
    icon: LayoutDashboard, 
    labelEn: 'Dashboard', 
    labelAr: 'لوحة التحكم' 
  },
  { 
    path: '/organizations', 
    icon: Building2, 
    labelEn: 'Organizations', 
    labelAr: 'المؤسسات' 
  },
  { 
    path: '/tiers', 
    icon: CreditCard, 
    labelEn: 'Subscription Tiers', 
    labelAr: 'مستويات الاشتراك' 
  },
  { 
    path: '/billing', 
    icon: Receipt, 
    labelEn: 'Billing & Payments', 
    labelAr: 'الفوترة والمدفوعات' 
  },
  { 
    path: '/settings', 
    icon: Settings, 
    labelEn: 'Platform Settings', 
    labelAr: 'إعدادات المنصة' 
  },
];

export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const location = useLocation();
  const { language, setLanguage, t, direction } = useLanguage();

  const CollapseIcon = direction === 'rtl' 
    ? (collapsed ? ChevronLeft : ChevronRight)
    : (collapsed ? ChevronRight : ChevronLeft);

  return (
    <aside 
      className={cn(
        "fixed top-0 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 z-50 flex flex-col",
        collapsed ? "w-20" : "w-64",
        direction === 'rtl' ? 'right-0' : 'left-0'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
            <span className="text-xl font-bold text-white">ج</span>
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold text-sidebar-foreground">Jadarat</h1>
              <p className="text-xs text-sidebar-foreground/60">
                {t('Super Admin', 'المدير العام')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive && "sidebar-item-active",
                collapsed && "justify-center"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 shrink-0",
                isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70"
              )} />
              {!collapsed && (
                <span className="animate-fade-in text-sm font-medium">
                  {language === 'ar' ? item.labelAr : item.labelEn}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                collapsed && "justify-center px-0"
              )}
            >
              <Globe className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="text-sm">{language === 'ar' ? 'العربية' : 'English'}</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={direction === 'rtl' ? 'end' : 'start'}>
            <DropdownMenuItem onClick={() => setLanguage('en')}>
              🇬🇧 English
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('ar')}>
              🇸🇦 العربية
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Logout */}
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && (
            <span className="text-sm">{t('Logout', 'تسجيل الخروج')}</span>
          )}
        </Button>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCollapse(!collapsed)}
          className="w-full text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <CollapseIcon className="w-5 h-5" />
        </Button>
      </div>
    </aside>
  );
}
