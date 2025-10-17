'use client';
import { Badge } from '@/components/ui/badge';
import type { FindingStatus } from '@/types';
import { cn } from '@/lib/utils';
import {
  CircleDashed,
  CircleDotDashed,
  CircleCheck,
  CircleX,
  HelpCircle,
  MessageSquareWarning,
} from 'lucide-react';

const statusConfig: {
  [key: string]: { icon: React.ElementType; className: string };
} = {
  Open: {
    icon: CircleDashed,
    className:
      'border-primary/50 bg-primary/10 text-primary dark:bg-primary/20 dark:border-primary/40',
  },
  'In Progress': {
    icon: CircleDotDashed,
    className:
      'border-accent/50 bg-accent/10 text-accent-foreground dark:text-accent dark:bg-accent/20 dark:border-accent/40',
  },
  Mitigated: {
    icon: CircleCheck,
    className:
      'border-green-500/50 bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:border-green-500/40',
  },
  Closed: {
    icon: CircleX,
    className:
      'border-gray-500/50 bg-gray-500/10 text-gray-600 dark:text-gray-400 dark:bg-gray-500/20 dark:border-gray-500/40',
  },
   'Awaiting Response': {
    icon: MessageSquareWarning,
    className:
      'border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400 dark:bg-orange-500/20 dark:border-orange-500/40',
  },
  default: {
    icon: HelpCircle,
    className:
      'border-gray-500/50 bg-gray-500/10 text-gray-600 dark:text-gray-400 dark:bg-gray-500/20 dark:border-gray-500/40',
  },
};

export function StatusBadge({ status }: { status: FindingStatus }) {
  const config = statusConfig[status] || statusConfig.default;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn('w-fit gap-1.5 whitespace-nowrap py-1 px-2.5 text-xs font-semibold', config.className)}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{status}</span>
    </Badge>
  );
}
