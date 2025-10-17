'use client';
import { Badge } from '@/components/ui/badge';
import type { AuditeeAgreement } from '@/types';
import { cn } from '@/lib/utils';
import { ThumbsUp, ThumbsDown, HelpCircle } from 'lucide-react';

const agreementConfig = {
  Pending: {
    label: 'Pending',
    icon: HelpCircle,
    className:
      'border-gray-500/50 bg-gray-500/10 text-gray-600 dark:text-gray-400 dark:bg-gray-500/20 dark:border-gray-500/40',
  },
  Agreed: {
    label: 'Agreed',
    icon: ThumbsUp,
    className:
      'border-green-500/50 bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:border-green-500/40',
  },
  Declined: {
    label: 'Declined',
    icon: ThumbsDown,
    className:
      'border-red-500/50 bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:border-red-500/40',
  },
};

export function AgreementBadge({ agreement }: { agreement: AuditeeAgreement }) {
  const config = agreementConfig[agreement];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'w-fit gap-1.5 whitespace-nowrap py-1 px-2.5 text-xs font-semibold',
        config.className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </Badge>
  );
}
