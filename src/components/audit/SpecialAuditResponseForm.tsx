'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { updateSpecialAuditCase } from '@/app/actions/special-audits';
import type { AuditeeAgreement, SpecialAudit } from '@/types';

/** Same "Your Response" card as the finding response page, for special audit cases. */
export function SpecialAuditResponseForm({ audit }: { audit: SpecialAudit }) {
  const router = useRouter();
  const { toast } = useToast();
  const [agreement, setAgreement] = useState<AuditeeAgreement>(audit.auditeeAgreement || 'Pending');
  const [mitigationDueDate, setMitigationDueDate] = useState<Date | undefined>(
    audit.mitigationDueDate ? new Date(audit.mitigationDueDate) : undefined
  );
  const [reason, setReason] = useState(audit.auditeeResponse || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const needsReason = agreement === 'Declined' || agreement === 'Partially Agreed';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await updateSpecialAuditCase(
        audit.id,
        { auditeeAgreement: agreement, auditeeResponse: reason, mitigationDueDate },
        'response'
      );
      if (res.success) {
        toast({ title: 'Response Submitted', description: 'Your response has been saved securely.' });
        router.push('/auditee-view?view=special');
      } else {
        toast({ variant: 'destructive', title: 'Error', description: res.error });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Response</CardTitle>
        <CardDescription>Review the finding and provide your response.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 py-4">
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Do you agree with this finding?</Label>
          <RadioGroup
            value={agreement === 'Pending' ? '' : agreement}
            onValueChange={(value: string) => setAgreement(value as AuditeeAgreement)}
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
            <Label htmlFor="rectification-date" className="text-sm font-semibold">Rectification Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="rectification-date"
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', !mitigationDueDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {mitigationDueDate ? format(mitigationDueDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={mitigationDueDate} onSelect={setMitigationDueDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {needsReason && (
          <div className="grid gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="disagreement-reason" className="text-sm font-semibold">
                {agreement === 'Partially Agreed' ? 'Reason for Partial Disagreement' : 'Reason for Disagreement'}
              </Label>
              <Textarea
                id="disagreement-reason"
                placeholder="Clearly describe the basis of your response..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-24"
              />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline" onClick={() => router.push('/auditee-view?view=special')} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || agreement === 'Pending' || (needsReason && !reason.trim())}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Response
        </Button>
      </CardFooter>
    </Card>
  );
}
