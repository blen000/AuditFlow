'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Printer, ShieldCheck, Users, Info, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { AuditFinding } from '@/types';
import { useMemo } from 'react';
import { RiskBadge } from './RiskBadge';
import { StatusBadge } from './StatusBadge';

type CaseReportDialogProps = {
  caseNum: string;
  caseSummary: string;
  findings: AuditFinding[];
};

export function CaseReportDialog({ caseNum, caseSummary, findings }: CaseReportDialogProps) {
  const groupedBySubsection = useMemo(() => {
    const groups: Record<string, { title: string; findings: AuditFinding[] }> = {};
    findings.forEach((f) => {
      const subKey = f.subsectionId || 'default';
      const subTitle = f.subsectionTitle || 'General Findings';
      if (!groups[subKey]) {
        groups[subKey] = { title: subTitle, findings: [] };
      }
      groups[subKey].findings.push(f);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [findings]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-background border-primary/30 hover:bg-primary/5">
          <FileText className="mr-2 h-4 w-4 text-primary" />
          Case Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 border-none shadow-2xl overflow-hidden">
        <DialogHeader className="p-8 border-b shrink-0 bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="h-12 w-16 flex justify-center text-2xl font-bold border-primary-foreground/30 text-primary-foreground">
              {caseNum}
            </Badge>
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">{caseSummary}</DialogTitle>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1">
                Formal Internal Audit Report • Mission #{caseNum}
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 bg-background">
          <div className="p-8 space-y-12">
            {/* Mission Overview */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2">
                <Info className="h-3 w-3" /> Mission Scope & Summary
              </h4>
              <p className="text-sm leading-relaxed text-muted-foreground italic">
                This report consolidates all identified risks, control gaps, and recommendations observed during the audit mission "{caseSummary}". The findings are organized by their respective organizational units and functional subsections.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Findings</p>
                  <p className="text-2xl font-bold">{findings.length}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">High Risk Items</p>
                  <p className="text-2xl font-bold text-destructive">
                    {findings.filter(f => f.riskLevel === 'High').length}
                  </p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Resolution Rate</p>
                  <p className="text-2xl font-bold">
                    {Math.round((findings.filter(f => f.status === 'Closed' || f.status === 'Mitigated').length / findings.length) * 100)}%
                  </p>
                </div>
              </div>
            </section>

            {/* Subsections Content */}
            <div className="space-y-10">
              {groupedBySubsection.map(([subId, subGroup]) => (
                <section key={subId} className="space-y-6 pl-4 border-l-2 border-primary/20">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="h-6 px-2 text-[10px] font-bold">
                      {subId === 'default' ? `${caseNum}.X` : subId}
                    </Badge>
                    <h5 className="text-lg font-bold text-foreground uppercase tracking-tight">{subGroup.title}</h5>
                  </div>

                  <div className="space-y-6">
                    {subGroup.findings.map((finding) => (
                      <div key={finding.id} className="bg-muted/10 p-6 rounded-xl border border-muted-foreground/10 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h6 className="font-bold text-base leading-tight">{finding.title}</h6>
                            <p className="text-[10px] font-mono text-muted-foreground">ID: {finding.id} • {finding.branchOrDepartment}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <RiskBadge riskLevel={finding.riskLevel} />
                            <StatusBadge status={finding.status} />
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                          <div className="space-y-2">
                            <p className="font-bold text-[10px] uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                              <Scale className="h-3 w-3" /> Finding & Observation
                            </p>
                            <p className="text-muted-foreground leading-relaxed">{finding.details}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-bold text-[10px] uppercase text-primary tracking-wider flex items-center gap-1.5">
                              <ShieldCheck className="h-3 w-3" /> Proposed Recommendation
                            </p>
                            <p className="text-muted-foreground leading-relaxed">{finding.recommendation}</p>
                          </div>
                        </div>

                        <div className="pt-4 flex flex-wrap items-center gap-6 border-t border-dashed">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-bold uppercase">Lead: <span className="font-normal">{finding.teamLeader}</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-bold uppercase text-muted-foreground">Team: <span className="font-normal">{finding.teamMembers.join(', ')}</span></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 border-t bg-muted/20 flex justify-between items-center shrink-0">
          <p className="text-[10px] text-muted-foreground font-mono uppercase">Generated by AuditFlow Platform • {new Date().toLocaleString()}</p>
          <Button variant="ghost" size="sm" className="font-bold h-9" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}