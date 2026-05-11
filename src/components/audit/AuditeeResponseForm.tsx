'use client';

import { useState } from 'react';
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
import { useRouter } from 'next/navigation';
import { uploadFileAction } from '@/app/actions/file-actions';
import { respondToFinding } from '@/app/actions/findings';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';

type AuditeeResponseFormProps = {
  finding: AuditFinding;
};

export function AuditeeResponseForm({ finding }: AuditeeResponseFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [agreement, setAgreement] = useState<AuditeeAgreement>(
    finding.auditeeAgreement
  );
  const [mitigationDueDate, setMitigationDueDate] = useState<Date | undefined>(
    finding.mitigationDueDate ? new Date(finding.mitigationDueDate) : undefined
  );
  const [disagreementReason, setDisagreementReason] = useState(
    finding.auditeeResponse || ''
  );
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let attachmentId: string | undefined;

      // 1. Upload file if present
      if (attachment) {
        const formData = new FormData();
        formData.append('file', attachment);
        const uploadRes = await uploadFileAction(formData, finding.id, 'auditee_response');
        if (!uploadRes.success) {
          toast({ variant: 'destructive', title: 'Upload Failed', description: uploadRes.error });
          setIsSubmitting(false);
          return;
        }
        attachmentId = uploadRes.attachment?.id;
      }

      // 2. Submit response
      const res = await respondToFinding(finding.id, {
        agreement,
        mitigationDueDate,
        response: disagreementReason,
        attachmentId,
      });

      if (res.success) {
        toast({ title: 'Response Submitted', description: 'Your response has been saved securely.' });
        router.push('/dashboard');
      } else {
        toast({ variant: 'destructive', title: 'Error', description: res.error });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachment(e.target.files[0]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Response</CardTitle>
        <CardDescription>
          Review the finding and provide your response.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 py-4">
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Do you agree with this finding?</Label>
          <RadioGroup
            value={agreement}
            onValueChange={(value: string) =>
              setAgreement(value as AuditeeAgreement)
            }
            className="flex flex-wrap gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Agreed" id="agreed" />
              <Label htmlFor="agreed" className="font-normal">Agree</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Partially Agreed" id="partially" />
              <Label htmlFor="partially" className="font-normal">Partially Agree</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Declined" id="declined" />
              <Label htmlFor="declined" className="font-normal">Decline</Label>
            </div>
          </RadioGroup>
        </div>

        {(agreement === 'Agreed' || agreement === 'Partially Agreed') && (
          <div className="space-y-2 pt-2">
            <Label htmlFor="mitigation-date" className="text-sm font-semibold">
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

        {(agreement === 'Declined' || agreement === 'Partially Agreed') && (
          <div className="grid gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="disagreement-reason" className="text-sm font-semibold">
                {agreement === 'Partially Agreed' ? 'Reason for Partial Disagreement' : 'Reason for Disagreement'}
              </Label>
              <Textarea
                id="disagreement-reason"
                placeholder="Clearly describe the basis of your response..."
                value={disagreementReason}
                onChange={(e) => setDisagreementReason(e.target.value)}
                className="h-24"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attachment" className="text-sm font-semibold">Attach Supporting File</Label>
              <Input id="attachment" type="file" onChange={handleFileChange} />
              {attachment && (
                <p className="text-xs text-muted-foreground">
                  Selected: {attachment.name}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline" onClick={() => router.push('/dashboard')} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Response
        </Button>
      </CardFooter>
    </Card>
  );
}
