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

type AddProgressUpdateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (updates: { details: string; attachmentFilename?: string }) => void;
};

export function AddProgressUpdateDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddProgressUpdateDialogProps) {
  const [details, setDetails] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  const handleSubmit = () => {
    if (!details) return; // Basic validation
    const updates = {
      details,
      attachmentFilename: attachment?.name,
    };
    onSubmit(updates);
    onOpenChange(false);
    // Reset state
    setDetails('');
    setAttachment(null);
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
