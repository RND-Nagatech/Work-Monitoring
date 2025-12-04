import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className, iconClassName }: StatCardProps) {
  return (
    <div className={cn('stat-card', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <p
              className={cn(
                'mt-2 text-sm font-medium',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}
            >
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              <span className="text-muted-foreground ml-1">vs last week</span>
            </p>
          )}
        </div>
        <div
          className={cn(
            'p-3 rounded-xl',
            iconClassName || 'bg-primary/10'
          )}
        >
          <Icon className={cn('w-6 h-6', iconClassName ? 'text-primary-foreground' : 'text-primary')} />
        </div>
      </div>
    </div>
  );
}
