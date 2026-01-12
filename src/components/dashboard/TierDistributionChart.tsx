import { useLanguage } from '@/contexts/LanguageContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TierDistributionChartProps {
  data: {
    name: string;
    nameAr: string;
    value: number;
    color: string;
  }[];
}

export function TierDistributionChart({ data }: TierDistributionChartProps) {
  const { t, language } = useLanguage();

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-lg font-semibold mb-4">
        {t('Organizations by Tier', 'المؤسسات حسب المستوى')}
      </h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => [
                value,
                language === 'ar' 
                  ? data.find(d => d.name === name)?.nameAr || name
                  : name
              ]}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend 
              formatter={(value: string) => (
                <span className="text-sm text-muted-foreground">
                  {language === 'ar' 
                    ? data.find(d => d.name === value)?.nameAr || value
                    : value
                  }
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
