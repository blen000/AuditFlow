'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  CircleDollarSign, 
  UserPlus, 
  ShieldAlert, 
  BadgeInfo, 
  MapPin,
  Clock,
  User,
  Briefcase,
  Hash
} from 'lucide-react';
import type { SpecialAudit } from '@/types';
import { Badge } from '@/components/ui/badge';

type ViewSpecialAuditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audit: SpecialAudit | null;
};

export function ViewSpecialAuditDialog({
  open,
  onOpenChange,
  audit,
}: ViewSpecialAuditDialogProps) {
  if (!audit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl gap-0">
        <DialogHeader className="px-8 py-6 border-b shrink-0 bg-primary text-primary-foreground">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                {audit.shortSummary}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/70 font-mono text-xs uppercase tracking-widest">
                Mission Report ID: {audit.id} • Logged on {new Date(audit.dateCreated).toLocaleDateString()}
              </DialogDescription>
            </div>
            <Badge variant="outline" className="h-fit py-1 px-3 border-primary-foreground/30 text-primary-foreground font-bold">
              {audit.placement}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 bg-background">
          <div className="p-8 space-y-10">
            {/* Location & Summary Section */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> Placement & Scope
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Placement Detail</p>
                  <p className="text-lg font-bold">{audit.placementValue}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Placement Category</p>
                  <p className="text-lg font-bold">{audit.placement}</p>
                </div>
              </div>
            </section>

            {/* Monetary Reconciliation */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2">
                <CircleDollarSign className="h-3.5 w-3.5" /> Monetary Reconciliation
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/30 p-4 rounded-xl border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Involved</p>
                  <p className="text-2xl font-bold">${audit.amountInvolved.toLocaleString()}</p>
                </div>
                <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/20">
                  <p className="text-[10px] font-bold text-green-600 uppercase">Recovered Amount</p>
                  <p className="text-2xl font-bold text-green-600">${audit.recovered.toLocaleString()}</p>
                </div>
                <div className="bg-destructive/5 p-4 rounded-xl border border-destructive/20">
                  <p className="text-[10px] font-bold text-destructive uppercase">Pending Balance</p>
                  <p className="text-2xl font-bold text-destructive">${audit.pending.toLocaleString()}</p>
                </div>
              </div>
            </section>

            {/* Involved Individuals */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2">
                <UserPlus className="h-3.5 w-3.5" /> Involved Personnel
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {audit.individuals.map((person, idx) => (
                  <div key={idx} className="p-4 rounded-xl border bg-muted/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-base">{person.name}</p>
                      <Badge variant="secondary" className="text-[10px]">{person.sex}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                      <div className="space-y-1">
                        <p className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> Position</p>
                        <p className="text-foreground normal-case">{person.position}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="flex items-center gap-1"><Hash className="h-3 w-3" /> Age</p>
                        <p className="text-foreground">{person.age} Years</p>
                      </div>
                      <div className="space-y-1">
                        <p className="flex items-center gap-1"><Clock className="h-3 w-3" /> Tenure</p>
                        <p className="text-foreground">{person.tenure}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Analysis & Actions */}
            <section className="space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5" /> Analysis & Corrective Measures
              </h4>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-destructive font-bold uppercase text-[10px] tracking-widest">
                    <ShieldAlert className="h-3.5 w-3.5" /> Disciplinary Action
                  </div>
                  <p className="text-sm leading-relaxed bg-destructive/5 p-4 rounded-lg border border-destructive/10">
                    {audit.actionDisciplinary}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                    <BadgeInfo className="h-3.5 w-3.5" /> Control Gap Witnessed
                  </div>
                  <p className="text-sm leading-relaxed bg-muted/30 p-4 rounded-lg border">
                    {audit.gapWitnessed}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-orange-600 font-bold uppercase text-[10px] tracking-widest">
                    <BadgeInfo className="h-3.5 w-3.5" /> Corrective Action Taken
                  </div>
                  <p className="text-sm leading-relaxed bg-orange-500/5 p-4 rounded-lg border border-orange-500/10">
                    {audit.correctiveActionTaken}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-muted/20 shrink-0">
          <Button type="button" variant="outline" className="font-bold h-10" onClick={() => onOpenChange(false)}>
            Close Report
          </Button>
          <Button type="button" className="font-bold h-10" onClick={() => window.print()}>
            Print Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
