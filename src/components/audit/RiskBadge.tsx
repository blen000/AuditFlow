import { Badge } from '@/components/ui/badge';
import type { RiskLevel } from '@/types';
import { cn } from '@/lib/utils';
import { Flame, ShieldAlert, ShieldCheck } from 'lucide-react';

const riskConfig = {
  High: {
    label: 'High',
    icon: Flame,
    className:
      'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-500/30',
  },
  Medium: {
    label: 'Medium',
    icon: ShieldAlert,
    className:
      'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-500/30',
  },
  Low: {
    label: 'Low',
    icon: ShieldCheck,
    className:
      'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-500/30',
  },
};

export function RiskBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  const config = riskConfig[riskLevel];
  const Icon = config.icon;

  return (
    <Badge
      className={cn(
        'flex w-fit items-center gap-1.5 border py-1 px-2.5 text-xs font-semibold',
        config.className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </Badge>
  );
}
