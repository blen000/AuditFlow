'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import PageHeader from '@/components/layout/PageHeader';
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
import { Printer, ShieldCheck, Loader2, Info } from 'lucide-react';
import type { AuditFinding, AuditHierarchyNode } from '@/types';
import { cn } from '@/lib/utils';
import { getConsolidatedReportData } from '@/app/actions/reports';

export default function ConsolidatedReportPage() {
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [hierarchy, setHierarchy] = useState<AuditHierarchyNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getConsolidatedReportData();
        setFindings(data.findings as any);
        setHierarchy(data.hierarchy as any);
      } catch (error) {
        console.error('Error loading consolidated report:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

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

  // Helper to check if a node or any of its children has data
  const nodeHasData = useCallback((nodeId: string): boolean => {
    if (findingsByNode[nodeId] && findingsByNode[nodeId].length > 0) return true;
    
    const children = hierarchy.filter(n => n.parentId === nodeId);
    return children.some(child => nodeHasData(child.id));
  }, [findingsByNode, hierarchy]);

  // Recursively render hierarchy and their tables
  const renderHierarchy = (parentId: string | null = null, depth: number = 0) => {
    const nodes = hierarchy.filter(n => n.parentId === parentId)
      .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));

    if (nodes.length === 0) return null;

    return nodes.map(node => {
      const nodeFindings = findingsByNode[node.id] || [];
      const isVisible = nodeHasData(node.id);

      if (!isVisible) return null;

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
                    <TableHead className="w-16 text-center font-black text-black uppercase text-[10px]">S.N</TableHead>
                    <TableHead className="min-w-[150px] font-black text-black uppercase text-[10px]">Name of branch</TableHead>
                    
                    {/* Render Dynamic Columns for this node */}
                    {node.customFields?.map(cf => (
                      <TableHead key={cf.id} className="text-center font-black text-black uppercase text-[10px]">
                        {cf.name}
                      </TableHead>
                    ))}

                    <TableHead className="min-w-[300px] font-black text-black uppercase text-[10px]">Findings, Root Cause & Recommendation</TableHead>
                    <TableHead className="w-32 text-center font-black text-black uppercase text-[10px]">Branch Response</TableHead>
                    <TableHead className="w-24 text-center font-black text-black uppercase text-[10px]">Status</TableHead>
                    <TableHead className="w-24 text-center font-black text-black uppercase text-[10px]">Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y-2 divide-black">
                  {nodeFindings.map((finding, idx) => (
                    <TableRow key={finding.id} className="hover:bg-muted/30 transition-colors divide-x-2 divide-black">
                      <TableCell className="text-center font-bold text-black align-top py-4">{idx + 1}.</TableCell>
                      <TableCell className="text-black font-bold align-top py-4">{finding.branchOrDepartment}</TableCell>
                      
                      {/* Render Dynamic Cell Values */}
                      {node.customFields?.map(cf => (
                        <TableCell key={cf.id} className="text-center font-medium text-black align-top py-4">
                          {finding.dynamicValues?.[cf.id] ?? '-'}
                        </TableCell>
                      ))}

                      <TableCell className="text-black text-xs leading-relaxed align-top py-4">
                        <div className="space-y-4">
                          <div>
                            <span className="font-black text-[9px] uppercase text-primary block mb-1">Observation:</span>
                            <p className="font-medium">{finding.details}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 border-t pt-2 border-dashed">
                            <div>
                              <span className="font-bold text-[9px] uppercase text-muted-foreground block mb-1">Root Cause:</span>
                              <p className="italic">{finding.auditCause || 'Not specified'}</p>
                            </div>
                            <div>
                              <span className="font-bold text-[9px] uppercase text-muted-foreground block mb-1">Business Effect:</span>
                              <p className="italic">{finding.auditEffect || 'Not specified'}</p>
                            </div>
                          </div>
                          <div className="bg-primary/5 p-2 rounded border border-primary/10">
                            <span className="font-black text-[9px] uppercase text-primary block mb-1">Recommendation:</span>
                            <p className="font-bold text-primary">{finding.recommendation}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center align-top py-4">
                        <div className="space-y-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block",
                            finding.auditeeAgreement === 'Agreed' ? "bg-green-100 text-green-800" : 
                            finding.auditeeAgreement === 'Declined' ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                          )}>
                            {finding.auditeeAgreement}
                          </span>
                          {finding.auditeeResponse && (
                            <p className="text-[9px] italic text-muted-foreground leading-tight px-1 line-clamp-3">
                              "{finding.auditeeResponse}"
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-[10px] font-black uppercase text-black align-top py-4">
                        {finding.status}
                      </TableCell>
                      <TableCell className="text-center align-top py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                          finding.riskLevel === 'High' ? "text-red-600 border border-red-200 bg-red-50" :
                          finding.riskLevel === 'Medium' ? "text-amber-600 border border-amber-200 bg-amber-50" :
                          "text-green-600 border border-green-200 bg-green-50"
                        )}>
                          {finding.riskLevel}
                        </span>
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

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Compiling Hierarchical Consolidated Report...</p>
      </div>
    );
  }

  const totalFindingsCount = findings.length;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="Consolidated Audit Report" 
        description="Hierarchical master activity report reflecting all registered missions and taxonomy levels."
        backHref="/reports"
      >
        <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
          <Printer className="mr-2 h-4 w-4" />
          Print Formal Report
        </Button>
      </PageHeader>
      
      <main className="flex-1 p-4 sm:p-6 md:p-12 print:p-0 bg-white">
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
              <span>Total Findings: {totalFindingsCount}</span>
            </div>
          </div>

          {totalFindingsCount > 0 ? (
            <div className="space-y-4">
              {renderHierarchy()}
            </div>
          ) : (
            <div className="py-24 text-center border-2 border-dashed rounded-3xl bg-muted/5">
              <Info className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-muted-foreground">No Registered Audit Findings</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                The consolidated report only reflects taxonomy levels containing active mission observations.
              </p>
            </div>
          )}

          {/* Report Footer */}
          <div className="mt-24 pt-8 border-t-2 border-black/10 flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Audit Management Platform</p>
              <p className="text-xs font-mono">Reference: CAR-DB-{Date.now()}</p>
              <p className="text-[9px] text-muted-foreground italic">Confidential Internal Document</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Authorization & Approval</p>
              <div className="h-12 w-48 border-b-2 border-dotted border-black mb-1"></div>
              <p className="text-[10px] font-bold uppercase">Chief Audit Executive</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
