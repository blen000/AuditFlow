'use client';
import type {
  AuditFinding,
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
  ChevronDown,
  CircleDollarSign,
} from 'lucide-react';
import { RiskBadge } from './RiskBadge';
import { StatusBadge } from './StatusBadge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { AgreementBadge } from './AgreementBadge';
import { useState } from 'react';
import { AddProgressUpdateDialog } from './AddProgressUpdateDialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { statuses as allStatuses } from '@/lib/statuses';

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
  const [isProgressDialogOpen, setProgressDialogOpen] = useState(false);

  const handleStatusChange = (status: FindingStatus) => {
    onUpdate(finding.id, { status });
  };

  const handleDateSelect = (date: Date | undefined) => {
    onUpdate(finding.id, { revalidationDate: date });
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

  const allAttachments = [
    ...(finding.findingAttachments || []),
    ...(finding.auditCauseAttachments || []),
    ...(finding.auditEffectAttachments || []),
    ...(finding.mitigationAttachments || []),
    ...(finding.auditeeAttachmentFilename ? [finding.auditeeAttachmentFilename] : []),
  ];

  const totalAmount = finding.involvedAmounts?.reduce((sum, item) => sum + item.amount, 0) || 0;


  return (
    <>
      <Card className="flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <RiskBadge riskLevel={finding.riskLevel} />
              <span className="text-xs font-mono text-muted-foreground">
                Case No: {finding.id}
              </span>
            </div>
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
                <DropdownMenuItem asChild>
                  <Link href={`/findings/respond/${finding.id}`}>
                    <Handshake className="mr-2 h-4 w-4" />
                    Auditee Response
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProgressDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Progress
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {allStatuses.map((status) => (
                      <DropdownMenuItem
                        key={status.name}
                        onClick={() => handleStatusChange(status.name)}
                        disabled={finding.status === status.name}
                      >
                        {status.name}
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
          </div>
          
          {totalAmount > 0 && (
             <div className="flex items-center gap-1.5 pt-2 text-xs text-muted-foreground">
                <CircleDollarSign className="h-3.5 w-3.5" />
                <span className='font-semibold'>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalAmount)}
                </span>
                <span>involved</span>
             </div>
          )}

          {allAttachments.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-2">
              {allAttachments.map((filename, index) => (
                <div key={index} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Paperclip className="h-3.5 w-3.5" />
                  <span className="truncate" title={filename}>{filename.length > 20 ? `${filename.slice(0,20)}...` : filename}</span>
                </div>
              ))}
            </div>
          )}

          {finding.progressUpdates && finding.progressUpdates.length > 0 && (
            <Collapsible className="mt-2 space-y-2 pt-2">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="group flex w-full items-center justify-start gap-2 p-0 text-sm font-semibold text-muted-foreground hover:bg-transparent hover:text-foreground"
                >
                  <MessageSquare className="h-4 w-4" />
                  <h4>
                    {finding.progressUpdates.length} Progress Update
                    {finding.progressUpdates.length > 1 && 's'}
                  </h4>
                  <ChevronDown className="h-4 w-4 transform transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 space-y-3 rounded-md border bg-muted/50 p-3">
                  {[...finding.progressUpdates]
                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                    .map((update) => (
                    <div key={update.id} className="text-xs">
                      <p className="font-semibold text-foreground">
                        {format(update.date, 'MMM d, yyyy')}:{' '}
                        <span className="font-normal text-muted-foreground">
                          {update.details}
                        </span>
                      </p>
                      {update.attachmentFilename && (
                        <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                          <Paperclip className="h-3 w-3" />
                          <span>{update.attachmentFilename}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex shrink-0 items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="whitespace-nowrap">
              {finding.revalidationDate
                ? `Re-validate by`
                : 'No reminder set'}
            </span>
            {finding.revalidationDate && 
              <span className="whitespace-nowrap font-medium text-foreground">
                {format(finding.revalidationDate, 'MMM d, yyyy')}
              </span>
            }
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'justify-start text-left font-normal',
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
      <AddProgressUpdateDialog
        open={isProgressDialogOpen}
        onOpenChange={setProgressDialogOpen}
        onSubmit={handleAddProgress}
      />
    </>
  );
}
