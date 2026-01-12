import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  icon?: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
  onClick?: () => void;
}

const variantStyles = {
  default: 'before:bg-gradient-to-r before:from-accent before:to-accent/70',
  success: 'before:bg-gradient-to-r before:from-success before:to-success/70',
  warning: 'before:bg-gradient-to-r before:from-warning before:to-warning/70',
  destructive: 'before:bg-gradient-to-r before:from-destructive before:to-destructive/70',
  info: 'before:bg-gradient-to-r before:from-info before:to-info/70',
};

export function KpiCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon,
  variant = 'default',
  onClick 
}: KpiCardProps) {
  const TrendIcon = trend 
    ? (trend.value > 0 ? TrendingUp : trend.value < 0 ? TrendingDown : Minus)
    : null;

  const trendColor = trend
    ? (trend.value > 0 ? 'text-success' : trend.value < 0 ? 'text-destructive' : 'text-muted-foreground')
    : '';

  return (
    <div 
      className={cn(
        "kpi-card card-hover-lift cursor-pointer group",
        variantStyles[variant],
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
            {icon}
          </div>
        )}
      </div>
      
      {trend && TrendIcon && (
        <div className={cn("flex items-center gap-1 mt-4 text-sm", trendColor)}>
          <TrendIcon className="w-4 h-4" />
          <span className="font-medium">{Math.abs(trend.value)}%</span>
          <span className="text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
