'use client';
import type { AuditFinding, AuditeeAgreement, FindingStatus } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  Calendar as CalendarIcon,
  Check,
  MoreHorizontal,
  Trash2,
  Handshake,
  Paperclip,
} from 'lucide-react';
import { RiskBadge } from './RiskBadge';
import { StatusBadge } from './StatusBadge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { AgreementBadge } from './AgreementBadge';
import { AuditeeResponseDialog } from './AuditeeResponseDialog';
import { useState } from 'react';

type AuditFindingCardProps = {
  finding: AuditFinding;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<AuditFinding>) => void;
};

export function AuditFindingCard({
  finding,
  onDelete,
  onUpdate,
}: AuditFindingCardProps) {
  const [isResponseDialogOpen, setResponseDialogOpen] = useState(false);

  const statuses: FindingStatus[] = [
    'Open',
    'In Progress',
    'Mitigated',
    'Closed',
  ];

  const handleStatusChange = (status: FindingStatus) => {
    onUpdate(finding.id, { status });
  };

  const handleDateSelect = (date: Date | undefined) => {
    onUpdate(finding.id, { revalidationDate: date });
  };

  const handleAuditeeResponse = (
    agreement: AuditeeAgreement,
    updates: {
      mitigationDueDate?: Date;
      auditeeResponse?: string;
      auditeeAttachmentFilename?: string;
    }
  ) => {
    onUpdate(finding.id, {
      auditeeAgreement: agreement,
      status: agreement === 'Agreed' ? 'In Progress' : 'Open',
      ...updates,
    });
  };

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <RiskBadge riskLevel={finding.riskLevel} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/findings/edit/${finding.id}`}>Edit</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setResponseDialogOpen(true)}>
                  <Handshake className="mr-2 h-4 w-4" />
                  Auditee Response
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {statuses.map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        disabled={finding.status === status}
                      >
                        {status}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(finding.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardTitle className="pt-2 text-lg">{finding.title}</CardTitle>
          <CardDescription className="line-clamp-2 text-sm">
            {finding.branchOrDepartment} &mdash; {finding.details}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-grow flex-wrap items-center gap-x-4 gap-y-2">
          <StatusBadge status={finding.status} />
          <AgreementBadge agreement={finding.auditeeAgreement} />
          {finding.mitigationDueDate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5" />
              <span>
                Due {format(finding.mitigationDueDate, 'MMM d, yyyy')}
              </span>
            </div>
          )}
          {finding.auditeeAttachmentFilename && (
             <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Paperclip className="h-3.5 w-3.5" />
              <span>{finding.auditeeAttachmentFilename}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>
              {finding.revalidationDate
                ? `Re-validate by ${format(
                    finding.revalidationDate,
                    'MMM d, yyyy'
                  )}`
                : 'No reminder set'}
            </span>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'w-[150px] justify-start text-left font-normal',
                  !finding.revalidationDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {finding.revalidationDate ? (
                  format(finding.revalidationDate, 'PPP')
                ) : (
                  <span>Set Date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={finding.revalidationDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </CardFooter>
      </Card>
      <AuditeeResponseDialog
        open={isResponseDialogOpen}
        onOpenChange={setResponseDialogOpen}
        finding={finding}
        onSubmit={handleAuditeeResponse}
      />
    </>
  );
}
