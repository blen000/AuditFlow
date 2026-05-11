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
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { uploadFileAction } from '@/app/actions/file-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type AddProgressUpdateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (updates: { details: string; attachmentFilename?: string; attachmentId?: string }) => void;
  findingId: string;
};

export function AddProgressUpdateDialog({
  open,
  onOpenChange,
  onSubmit,
  findingId,
}: AddProgressUpdateDialogProps) {
  const { toast } = useToast();
  const [details, setDetails] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!details) return;
    setIsSubmitting(true);
    
    try {
      let attachmentId: string | undefined;
      let attachmentFilename: string | undefined;

      if (attachment) {
        const formData = new FormData();
        formData.append('file', attachment);
        const uploadRes = await uploadFileAction(formData, findingId, 'progress_update');
        
        if (!uploadRes.success) {
          toast({ variant: 'destructive', title: 'Upload Failed', description: uploadRes.error });
          setIsSubmitting(false);
          return;
        }
        
        attachmentId = uploadRes.attachment?.id;
        attachmentFilename = uploadRes.attachment?.originalName;
      }

      const updates = {
        details,
        attachmentFilename,
        attachmentId,
      };
      
      onSubmit(updates);
      onOpenChange(false);
      // Reset state
      setDetails('');
      setAttachment(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add progress update' });
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Progress Update</DialogTitle>
          <DialogDescription>
            Provide an update on the mitigation progress for this finding.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="progress-details">Progress Details</Label>
            <Textarea
              id="progress-details"
              placeholder="Describe the steps taken and the current status..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="h-24"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attachment">Attach Supporting File (Optional)</Label>
            <Input id="attachment" type="file" onChange={handleFileChange} />
            {attachment && (
              <p className="text-xs text-muted-foreground">
                Selected: {attachment.name}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
