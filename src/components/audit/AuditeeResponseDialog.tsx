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
    finding.mitigationDueDate
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Auditee Response</DialogTitle>
          <DialogDescription>
            Review the finding and provide your response.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">{finding.title}</h4>
            <p className="text-sm text-muted-foreground">{finding.details}</p>
          </div>
          <div className="space-y-2">
            <Label>Do you agree with this finding?</Label>
            <RadioGroup
              value={agreement}
              onValueChange={(value: string) =>
                setAgreement(value as AuditeeAgreement)
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Agreed" id="agreed" />
                <Label htmlFor="agreed">Agree</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Declined" id="declined" />
                <Label htmlFor="declined">Decline</Label>
              </div>
            </RadioGroup>
          </div>
          {agreement === 'Agreed' && (
            <div className="space-y-2">
              <Label htmlFor="mitigation-date">
                Proposed Mitigation Due Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="mitigation-date"
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
          {agreement === 'Declined' && (
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="disagreement-reason">
                  Reason for Disagreement
                </Label>
                <Textarea
                  id="disagreement-reason"
                  placeholder="Clearly describe why you disagree with the finding..."
                  value={disagreementReason}
                  onChange={(e) => setDisagreementReason(e.target.value)}
                  className="h-24"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attachment">Attach Supporting File</Label>
                <Input
                  id="attachment"
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Submit Response</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
