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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CalendarIcon, 
  MessageSquare, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Plus, 
  X 
} from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { AuditFinding, FollowUpStatus, CommunicationEntry } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type FollowUpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finding: AuditFinding;
  onUpdate: (id: string, updates: Partial<AuditFinding>) => void;
};

export function FollowUpDialog({ open, onOpenChange, finding, onUpdate }: FollowUpDialogProps) {
  const [status, setStatus] = useState<FollowUpStatus>(finding.followUpStatus || 'Pending');
  const [verbal, setVerbal] = useState<CommunicationEntry[]>(finding.verbalComm || []);
  const [written, setWritten] = useState<CommunicationEntry[]>(finding.writtenComm || []);
  const [esc1, setEsc1] = useState<CommunicationEntry[]>(finding.esc1 || []);
  const [esc2, setEsc2] = useState<CommunicationEntry[]>(finding.esc2 || []);
  const [recommendations, setRecommendations] = useState(finding.followUpRecommendations || '');
  const [isClosed, setIsClosed] = useState(finding.isClosed || false);

  useEffect(() => {
    if (open) {
      setStatus(finding.followUpStatus || 'Pending');
      setVerbal(finding.verbalComm || []);
      setWritten(finding.writtenComm || []);
      setEsc1(finding.esc1 || []);
      setEsc2(finding.esc2 || []);
      setRecommendations(finding.followUpRecommendations || '');
      setIsClosed(finding.isClosed || false);
    }
  }, [open, finding]);

  const handleSave = () => {
    onUpdate(finding.id, {
      followUpStatus: status,
      verbalComm: verbal,
      writtenComm: written,
      esc1: esc1,
      esc2: esc2,
      followUpRecommendations: recommendations,
      isClosed: isClosed,
    });
    onOpenChange(false);
  };

  const updateEntry = (
    setter: React.Dispatch<React.SetStateAction<CommunicationEntry[]>>,
    index: number,
    field: keyof CommunicationEntry,
    value: any
  ) => {
    setter((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addEntry = (setter: React.Dispatch<React.SetStateAction<CommunicationEntry[]>>) => {
    setter((prev) => [...prev, {}]);
  };

  const removeEntry = (setter: React.Dispatch<React.SetStateAction<CommunicationEntry[]>>, index: number) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const CommSection = ({
    title,
    entries,
    setter,
    icon: Icon,
    metaLabel,
    metaPlaceholder,
  }: {
    title: string;
    entries: CommunicationEntry[];
    setter: React.Dispatch<React.SetStateAction<CommunicationEntry[]>>;
    icon: any;
    metaLabel: string;
    metaPlaceholder: string;
  }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-bold uppercase tracking-wider">{title}</h4>
        </div>
        <Button 
          type="button"
          variant="outline" 
          size="sm" 
          className="h-7 text-[10px] font-bold" 
          onClick={() => addEntry(setter)}
          disabled={entries.length >= 3}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Instance
        </Button>
      </div>
      <div className="space-y-4">
        {entries.map((entry, i) => (
          <div key={i} className="relative grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg border bg-muted/20">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm z-10"
              onClick={() => removeEntry(setter, i)}
            >
              <X className="h-3 w-3" />
            </Button>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">{i + 1}st Instance Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-8 justify-start text-left font-normal px-2 text-xs",
                      !entry.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {entry.date ? format(entry.date as Date, 'PPP') : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={entry.date as Date}
                    onSelect={(date) => updateEntry(setter, i, 'date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">{metaLabel}</Label>
              <Input
                className="h-8 text-xs"
                placeholder={metaPlaceholder}
                value={entry.meta || ''}
                onChange={(e) => updateEntry(setter, i, 'meta', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border-none">
        <DialogHeader className="p-6 pb-2 shrink-0 border-b bg-background">
          <DialogTitle className="text-xl flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Audit Follow-up Management
          </DialogTitle>
          <DialogDescription>
            Record communication serials, escalations, and track final closure for Case No: {finding.id}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-6 space-y-8">
            {/* Status & Closure Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end bg-primary/5 p-4 rounded-xl border border-primary/20">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-primary tracking-widest">Follow-up Lifecycle Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as FollowUpStatus)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Partially Rectified">Partially Rectified</SelectItem>
                    <SelectItem value="Rectified">Rectified</SelectItem>
                    <SelectItem value="Refereed">Refereed</SelectItem>
                    <SelectItem value="Action Plan">Action Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-4 h-10 px-4 rounded-md bg-background border">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={cn("h-4 w-4", isClosed ? "text-green-600" : "text-muted-foreground")} />
                  <Label className="text-sm font-semibold">Audit Closure</Label>
                </div>
                <Switch checked={isClosed} onCheckedChange={setIsClosed} />
              </div>
            </div>

            <Tabs defaultValue="comm" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="comm">Communications</TabsTrigger>
                <TabsTrigger value="esc">Escalations</TabsTrigger>
                <TabsTrigger value="notes">Final Recs</TabsTrigger>
              </TabsList>

              <TabsContent value="comm" className="space-y-8 pt-4">
                <CommSection
                  title="Verbal Communication"
                  icon={MessageSquare}
                  entries={verbal}
                  setter={setVerbal}
                  metaLabel="Involved Individuals"
                  metaPlaceholder="Names of staff spoken to..."
                />
                <CommSection
                  title="Written Communication"
                  icon={MessageSquare}
                  entries={written}
                  setter={setWritten}
                  metaLabel="Address / Reference"
                  metaPlaceholder="Letter Ref No or Memo Address..."
                />
              </TabsContent>

              <TabsContent value="esc" className="space-y-8 pt-4">
                <CommSection
                  title="1st Escalation"
                  icon={AlertTriangle}
                  entries={esc1}
                  setter={setEsc1}
                  metaLabel="Escalated To (Address)"
                  metaPlaceholder="Supervisor / Dept Head..."
                />
                <CommSection
                  title="2nd Escalation"
                  icon={AlertTriangle}
                  entries={esc2}
                  setter={setEsc2}
                  metaLabel="Escalated To (Address)"
                  metaPlaceholder="Executive / Internal Audit HQ..."
                />
              </TabsContent>

              <TabsContent value="notes" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="font-bold">Follow up Recommendations</Label>
                  <Textarea
                    placeholder="Enter detailed follow-up recommendations and next steps..."
                    className="min-h-[250px] resize-none"
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-muted/30 shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleSave}>Save Follow-up Data</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
