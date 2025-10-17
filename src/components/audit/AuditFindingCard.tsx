'use client';
import type {
  AuditFinding,
  AuditeeAgreement,
  FindingStatus,
  ProgressUpdate,
} from '@/types';
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
  PlusCircle,
  MessageSquare,
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
import { AddProgressUpdateDialog } from './AddProgressUpdateDialog';
import { Separator } from '../ui/separator';

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
  const [isProgressDialogOpen, setProgressDialogOpen] = useState(false);

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

  const handleAddProgress = (update: {
    details: string;
    attachmentFilename?: string;
  }) => {
    const newProgressUpdate: ProgressUpdate = {
      id: `PROG-${Date.now()}`,
      date: new Date(),
      ...update,
    };
    const updatedProgress = [
      ...(finding.progressUpdates || []),
      newProgressUpdate,
    ];
    onUpdate(finding.id, { progressUpdates: updatedProgress });
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
                <DropdownMenuItem onClick={() => setProgressDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Progress
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
        <CardContent className="flex flex-grow flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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
          </div>
          {finding.progressUpdates && finding.progressUpdates.length > 0 && (
            <div className="mt-2 space-y-3 pt-2">
               <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Progress Updates</h4>
              </div>
              <div className="space-y-3 rounded-md border bg-muted/50 p-3">
                {finding.progressUpdates.slice(0, 2).map((update) => (
                  <div key={update.id} className="text-xs">
                    <p className="font-semibold text-foreground">
                      {format(update.date, 'MMM d, yyyy')}:{' '}
                      <span className="font-normal text-muted-foreground">{update.details}</span>
                    </p>
                    {update.attachmentFilename && (
                       <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                        <Paperclip className="h-3 w-3" />
                        <span>{update.attachmentFilename}</span>
                      </div>
                    )}
                  </div>
                ))}
                {finding.progressUpdates.length > 2 && (
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">View all updates</Button>
                )}
              </div>
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
      <AddProgressUpdateDialog
        open={isProgressDialogOpen}
        onOpenChange={setProgressDialogOpen}
        onSubmit={handleAddProgress}
      />
    </>
  );
}
