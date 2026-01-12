import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { direction } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />
      
      <main 
        className={cn(
          "min-h-screen transition-all duration-300",
          sidebarCollapsed ? "w-[calc(100%-5rem)]" : "w-[calc(100%-16rem)]",
          direction === 'rtl' 
            ? (sidebarCollapsed ? 'mr-20' : 'mr-64')
            : (sidebarCollapsed ? 'ml-20' : 'ml-64')
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
