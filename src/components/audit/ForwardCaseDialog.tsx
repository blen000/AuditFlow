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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { initialBranches, initialDepartments } from '@/lib/mock-data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Share2, Building2, MessageSquare } from 'lucide-react';

type ForwardCaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onForward: (target: string, comments: string) => void;
  currentOwner: string;
};

export function ForwardCaseDialog({ open, onOpenChange, onForward, currentOwner }: ForwardCaseDialogProps) {
  const [target, setTarget] = useState<string>('');
  const [comments, setComments] = useState<string>('');

  const handleConfirm = () => {
    if (!target) return;
    onForward(target, comments);
    onOpenChange(false);
    setTarget('');
    setComments('');
  };

  const allTargets = [
    ...initialBranches.map(b => ({ id: `BR-${b.id}`, name: b.name, type: 'Branch' })),
    ...initialDepartments.map(d => ({ id: `DEPT-${d.id}`, name: d.name, type: 'Department' })),
  ].filter(t => t.name !== currentOwner);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Forward Audit Case
          </DialogTitle>
          <DialogDescription>
            Transfer or share the responsibility of this audit finding with another organizational unit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Building2 className="h-3 w-3" /> Target Department or Branch
            </Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination..." />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-64">
                  {allTargets.map((item) => (
                    <SelectItem key={item.id} value={item.name}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{item.type}</span>
                      </div>
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MessageSquare className="h-3 w-3" /> Forwarding Comments / Rationale
            </Label>
            <Textarea
              placeholder="Explain why this case is being forwarded..."
              className="min-h-[100px]"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!target}>
            Confirm Forwarding
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
