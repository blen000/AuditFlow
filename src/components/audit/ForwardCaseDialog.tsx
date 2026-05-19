'use client';

import { useState, useEffect } from 'react';
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
import { getFindingFormData } from '@/app/actions/findings';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Share2, Building2, MessageSquare, Loader2 } from 'lucide-react';
import type { Branch, Department, District } from '@/types';

type ForwardCaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onForward: (target: string, comments: string) => void;
  currentOwner: string;
};

export function ForwardCaseDialog({ open, onOpenChange, onForward, currentOwner }: ForwardCaseDialogProps) {
  const [target, setTarget] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      async function loadData() {
        setIsLoading(true);
        try {
          const data = await getFindingFormData();
          setBranches(data.branches as any);
          setDepartments(data.departments as any);
          setDistricts(data.districts as any);
        } catch (error) {
          console.error('Failed to load data for forward dialog:', error);
        } finally {
          setIsLoading(false);
        }
      }
      loadData();
    }
  }, [open]);

  const handleConfirm = () => {
    if (!target) return;
    onForward(target, comments);
    onOpenChange(false);
    setTarget('');
    setComments('');
    setCategory('');
  };

  const getCurrentItems = () => {
    let items: any[] = [];
    if (category === 'Branch') {
      items = branches.map(b => ({ id: `BR-${b.id}`, name: b.name, type: 'Branch' }));
    } else if (category === 'Department') {
      items = departments.map(d => ({ id: `DEPT-${d.id}`, name: d.name, type: 'Department' }));
    } else if (category === 'District') {
      items = districts.map(d => ({ id: `DIST-${d.id}`, name: d.name, type: 'District' }));
    }
    return items.filter(t => t.name !== currentOwner);
  };

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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Building2 className="h-3 w-3" /> Category
              </Label>
              <Select value={category} onValueChange={(val) => { setCategory(val); setTarget(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Branch">Branch</SelectItem>
                  <SelectItem value="District">District</SelectItem>
                  <SelectItem value="Department">Department</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {category && (
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-3 w-3" /> Target {category}
                </Label>
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <Select value={target} onValueChange={setTarget}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${category.toLowerCase()}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-64">
                        {getCurrentItems().map((item) => (
                          <SelectItem key={item.id} value={item.name}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
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
