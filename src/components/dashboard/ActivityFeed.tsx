import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'org_created' | 'payment_received' | 'tier_upgraded' | 'org_suspended' | 'user_added';
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  time: string;
  timeAr: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const typeColors = {
  org_created: 'bg-success',
  payment_received: 'bg-accent',
  tier_upgraded: 'bg-info',
  org_suspended: 'bg-destructive',
  user_added: 'bg-warning',
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const { t, language } = useLanguage();

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-lg font-semibold mb-6">
        {t('Recent Activity', 'النشاط الأخير')}
      </h3>
      
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div 
            key={activity.id} 
            className={cn(
              "flex gap-4 animate-fade-in",
              index !== activities.length - 1 && "pb-4 border-b border-border"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Timeline dot */}
            <div className="relative">
              <div className={cn(
                "w-3 h-3 rounded-full mt-1.5",
                typeColors[activity.type]
              )} />
              {index !== activities.length - 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-0.5 h-full bg-border" />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground">
                {language === 'ar' ? activity.titleAr : activity.title}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {language === 'ar' ? activity.descriptionAr : activity.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'ar' ? activity.timeAr : activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
