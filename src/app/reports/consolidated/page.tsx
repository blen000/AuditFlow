'use client';

import { useState, useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { initialFindings, initialHierarchy } from '@/lib/mock-data';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, ShieldCheck, ChevronRight, Layers } from 'lucide-react';
import type { AuditFinding, AuditHierarchyNode } from '@/types';
import { cn } from '@/lib/utils';

export default function ConsolidatedReportPage() {
  const [findings] = useState<AuditFinding[]>(initialFindings);
  const [hierarchy] = useState<AuditHierarchyNode[]>(initialHierarchy);

  // Group findings by hierarchy node
  const findingsByNode = useMemo(() => {
    const map: Record<string, AuditFinding[]> = {};
    findings.forEach(f => {
      if (f.hierarchyNodeId) {
        if (!map[f.hierarchyNodeId]) map[f.hierarchyNodeId] = [];
        map[f.hierarchyNodeId].push(f);
      }
    });
    return map;
  }, [findings]);

  // Recursively render hierarchy and their tables
  const renderHierarchy = (parentId: string | null = null, depth: number = 0) => {
    const nodes = hierarchy.filter(n => n.parentId === parentId)
      .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));

    if (nodes.length === 0) return null;

    return nodes.map(node => {
      const nodeFindings = findingsByNode[node.id] || [];
      const hasContent = nodeFindings.length > 0 || hierarchy.some(n => n.parentId === node.id);

      if (!hasContent) return null;

      return (
        <div key={node.id} className="space-y-6">
          <div className={cn(
            "flex items-baseline gap-3 mb-2",
            depth === 0 ? "mt-12" : "mt-8"
          )}>
            <span className={cn(
              "font-mono font-black text-primary",
              depth === 0 ? "text-2xl" : depth === 1 ? "text-xl" : "text-lg"
            )}>
              {node.number}
            </span>
            <h3 className={cn(
              "font-bold uppercase tracking-tight underline underline-offset-4",
              depth === 0 ? "text-2xl" : depth === 1 ? "text-xl" : "text-lg"
            )}>
              {node.title}
            </h3>
          </div>

          {nodeFindings.length > 0 && (
            <div className="rounded-sm border-2 border-black overflow-hidden shadow-sm bg-white mb-8">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="bg-muted/80 hover:bg-muted/80 border-b-2 border-black divide-x-2 divide-black">
                    <TableHead className="w-16 text-center font-black text-black uppercase text-xs">S.N</TableHead>
                    <TableHead className="min-w-[150px] font-black text-black uppercase text-xs">Name of branch</TableHead>
                    
                    {/* Render Dynamic Columns for this node */}
                    {node.customFields?.map(cf => (
                      <TableHead key={cf.id} className="text-center font-black text-black uppercase text-xs">
                        {cf.name}
                      </TableHead>
                    ))}

                    <TableHead className="min-w-[250px] font-black text-black uppercase text-xs">Impact / Recommendation</TableHead>
                    <TableHead className="w-32 text-center font-black text-black uppercase text-xs">Branches Response</TableHead>
                    <TableHead className="w-32 text-center font-black text-black uppercase text-xs">Status</TableHead>
                    <TableHead className="w-24 text-center font-black text-black uppercase text-xs">Risk Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y-2 divide-black">
                  {nodeFindings.map((finding, idx) => (
                    <TableRow key={finding.id} className="hover:bg-muted/30 transition-colors divide-x-2 divide-black">
                      <TableCell className="text-center font-bold text-black align-top">{idx + 1}.</TableCell>
                      <TableCell className="text-black font-bold align-top py-4">{finding.branchOrDepartment}</TableCell>
                      
                      {/* Render Dynamic Cell Values */}
                      {node.customFields?.map(cf => (
                        <TableCell key={cf.id} className="text-center font-medium text-black align-top py-4">
                          {finding.dynamicValues?.[cf.id] ?? '-'}
                        </TableCell>
                      ))}

                      <TableCell className="text-black text-xs leading-relaxed align-top py-4 space-y-3">
                        {finding.auditEffect && (
                          <div>
                            <span className="font-bold underline block mb-1">Effect:</span>
                            <p className="italic">{finding.auditEffect}</p>
                          </div>
                        )}
                        <div>
                          <span className="font-bold underline block mb-1">Recommendation:</span>
                          <p>{finding.recommendation}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-xs font-bold text-black align-top py-4">
                        {finding.auditeeAgreement}
                      </TableCell>
                      <TableCell className="text-center text-xs font-bold text-black align-top py-4">
                        {finding.status}
                      </TableCell>
                      <TableCell className="text-center text-xs font-bold text-black align-top py-4">
                        {finding.riskLevel}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="pl-6 border-l-2 border-muted-foreground/10">
            {renderHierarchy(node.id, depth + 1)}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="Consolidated Audit Report" 
        description="Institutional master activity report grouped by hierarchical missions and taxonomy."
        backHref="/reports"
      >
        <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
          <Printer className="mr-2 h-4 w-4" />
          Print Formal Report
        </Button>
      </PageHeader>
      
      <main className="flex-1 p-4 sm:p-6 md:p-12 print:p-0">
        <div className="mx-auto max-w-7xl space-y-12">
          
          {/* Official Memo Header */}
          <div className="text-center space-y-4 border-b-2 border-black pb-8">
            <div className="flex justify-center mb-4">
              <ShieldCheck className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-widest text-primary">Internal Audit Department</h1>
            <h2 className="text-xl font-bold uppercase tracking-tight">Consolidated Activity Report</h2>
            <div className="flex justify-center gap-8 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              <span>Period: FY 2024/25</span>
              <span>•</span>
              <span>Generated: {new Date().toLocaleDateString()}</span>
              <span>•</span>
              <span>Confidential / Internal Use Only</span>
            </div>
          </div>

          <div className="space-y-4">
            {renderHierarchy()}
          </div>

          {/* Report Footer */}
          <div className="mt-24 pt-8 border-t-2 border-black/10 flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Audit Management System</p>
              <p className="text-xs font-mono">Ref: CAR-SYS-{Date.now()}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Review & Approval</p>
              <div className="h-12 w-48 border-b-2 border-dotted border-black mb-1"></div>
              <p className="text-[10px] font-bold uppercase">Chief Audit Executive</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
