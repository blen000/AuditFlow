'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { AuditFinding, AuditeeAgreement } from '@/types';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

type AuditeeResponseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finding: AuditFinding;
  onSubmit: (
    agreement: AuditeeAgreement,
    updates: {
      mitigationDueDate?: Date;
      auditeeResponse?: string;
      auditeeAttachmentFilename?: string;
    }
  ) => void;
};

export function AuditeeResponseDialog({
  open,
  onOpenChange,
  finding,
  onSubmit,
}: AuditeeResponseDialogProps) {
  const [agreement, setAgreement] = useState<AuditeeAgreement>(
    finding.auditeeAgreement
  );
  const [mitigationDueDate, setMitigationDueDate] = useState<Date | undefined>(
    finding.mitigationDueDate as Date | undefined
  );
  const [disagreementReason, setDisagreementReason] = useState(
    finding.auditeeResponse || ''
  );
  const [attachment, setAttachment] = useState<File | null>(null);

  const handleSubmit = () => {
    const updates: {
      mitigationDueDate?: Date;
      auditeeResponse?: string;
      auditeeAttachmentFilename?: string;
    } = {};

    if (agreement === 'Agreed') {
      updates.mitigationDueDate = mitigationDueDate;
      updates.auditeeResponse = '';
      updates.auditeeAttachmentFilename = '';
    } else if (agreement === 'Partially Agreed') {
      updates.mitigationDueDate = mitigationDueDate;
      updates.auditeeResponse = disagreementReason;
      updates.auditeeAttachmentFilename = attachment?.name;
    } else {
      updates.mitigationDueDate = undefined;
      updates.auditeeResponse = disagreementReason;
      updates.auditeeAttachmentFilename = attachment?.name;
    }
    onSubmit(agreement, updates);
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachment(e.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border-none">
        <DialogHeader className="p-6 pb-2 shrink-0 border-b bg-background">
          <DialogTitle>Auditee Response</DialogTitle>
          <DialogDescription>
            Review the finding and provide your response.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 min-h-0">
          <div className="grid gap-6 p-6">
            <div className="space-y-2">
              <h4 className="font-bold text-primary">{finding.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{finding.details}</p>
            </div>
            
            <div className="space-y-3 bg-muted/30 p-4 rounded-lg border">
              <Label className="text-sm font-bold uppercase tracking-wider text-primary">Agreement Status</Label>
              <RadioGroup
                value={agreement}
                onValueChange={(value: string) =>
                  setAgreement(value as AuditeeAgreement)
                }
                className="flex flex-col gap-2 mt-2"
              >
                <div className="flex items-center space-x-2 bg-background p-2 rounded border">
                  <RadioGroupItem value="Agreed" id="agreed-dialog" />
                  <Label htmlFor="agreed-dialog" className="font-normal cursor-pointer w-full">Agree</Label>
                </div>
                <div className="flex items-center space-x-2 bg-background p-2 rounded border">
                  <RadioGroupItem value="Partially Agreed" id="partially-dialog" />
                  <Label htmlFor="partially-dialog" className="font-normal cursor-pointer w-full">Partially Agree</Label>
                </div>
                <div className="flex items-center space-x-2 bg-background p-2 rounded border">
                  <RadioGroupItem value="Declined" id="declined-dialog" />
                  <Label htmlFor="declined-dialog" className="font-normal cursor-pointer w-full">Decline</Label>
                </div>
              </RadioGroup>
            </div>

            {(agreement === 'Agreed' || agreement === 'Partially Agreed') && (
              <div className="space-y-2">
                <Label htmlFor="mitigation-date-dialog" className="text-sm font-semibold">
                  Proposed Mitigation Due Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="mitigation-date-dialog"
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !mitigationDueDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {mitigationDueDate ? (
                        format(mitigationDueDate, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={mitigationDueDate}
                      onSelect={setMitigationDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {(agreement === 'Declined' || agreement === 'Partially Agreed') && (
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="disagreement-reason-dialog" className="text-sm font-semibold">
                    {agreement === 'Partially Agreed' ? 'Reason for Partial Disagreement' : 'Reason for Disagreement'}
                  </Label>
                  <Textarea
                    id="disagreement-reason-dialog"
                    placeholder="Clearly describe the basis of your response..."
                    value={disagreementReason}
                    onChange={(e) => setDisagreementReason(e.target.value)}
                    className="h-24"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attachment-dialog" className="text-sm font-semibold">Attach Supporting File</Label>
                  <Input
                    id="attachment-dialog"
                    type="file"
                    onChange={handleFileChange}
                  />
                  {attachment && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {attachment.name}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-muted/10 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Submit Response</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}