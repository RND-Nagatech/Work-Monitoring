import { cn } from '@/lib/utils';
import { formatStatus } from '@/lib/utils';

type TaskStatus = 'OPEN' | 'ON PROGRESS' | 'DONE';

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const statusStyles: Record<TaskStatus, string> = {
  'OPEN': 'bg-warning/10 text-warning border-warning/20',
  'ON PROGRESS': 'bg-primary/10 text-primary border-primary/20',
  'DONE': 'bg-success/10 text-success border-success/20',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        statusStyles[status] || 'bg-muted text-muted-foreground',
        className
      )}
    >
      {formatStatus(status)}
    </span>
  );
}
