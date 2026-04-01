'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Printer, ShieldCheck, Loader2, Info, Scale, AlertCircle, CircleDollarSign } from 'lucide-react';
import type { AuditFinding, AuditHierarchyNode } from '@/types';
import { cn } from '@/lib/utils';
import { getConsolidatedReportData } from '@/app/actions/reports';
import { Badge } from '@/components/ui/badge';

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

  // Group findings by hierarchy node ID
  const findingsByNode = useMemo(() => {
    const map: Record<string, AuditFinding[]> = {};
    findings.forEach(f => {
      const nodeId = f.hierarchyNodeId;
      if (nodeId) {
        if (!map[nodeId]) map[nodeId] = [];
        map[nodeId].push(f);
      }
    });
    return map;
  }, [findings]);

  // Check if a node or any of its descendants have findings
  const nodeHasFindings = (nodeId: string): boolean => {
    // Check direct findings
    if (findingsByNode[nodeId]?.length > 0) return true;
    
    // Check children recursively
    const children = hierarchy.filter(n => n.parentId === nodeId);
    return children.some(child => nodeHasFindings(child.id));
  };

  // Helper to determine if a node is a root node (Section level)
  const isRootNode = (node: AuditHierarchyNode) => {
    return !node.parentId || node.parentId === "" || node.parentId === "null";
  };

  // Recursive render hierarchy and their tables
  const renderHierarchy = (parentId: string | null = null, depth: number = 0) => {
    // Filter nodes for the current parent level
    const nodes = hierarchy.filter(n => {
      if (parentId === null) return isRootNode(n);
      return n.parentId === parentId;
    }).sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));

    if (nodes.length === 0) return null;

    return nodes.map(node => {
      const nodeFindings = findingsByNode[node.id] || [];
      const hasDirectFindings = nodeFindings.length > 0;
      const hasContent = nodeHasFindings(node.id);

      // Only show this node if it or its children have findings
      if (!hasContent) return null;

      return (
        <div key={node.id} className="space-y-6">
          <div className={cn(
            "flex items-baseline gap-3 mb-4",
            depth === 0 ? "mt-12" : depth === 1 ? "mt-8" : "mt-6"
          )}>
            <span className={cn(
              "font-mono font-black text-primary",
              depth === 0 ? "text-2xl" : depth === 1 ? "text-xl" : "text-lg"
            )}>
              {node.number}
            </span>
            <h3 className={cn(
              "font-bold uppercase tracking-tight",
              depth === 0 ? "text-2xl underline underline-offset-8" : depth === 1 ? "text-xl border-b-2 border-primary/20" : "text-lg border-b border-primary/10"
            )}>
              {node.title}
            </h3>
          </div>

          {hasDirectFindings && (
            <div className="rounded-sm border-2 border-black overflow-hidden shadow-md bg-white mb-10">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="bg-muted/80 hover:bg-muted/80 border-b-2 border-black divide-x-2 divide-black">
                    <TableHead className="w-12 text-center font-black text-black uppercase text-[10px]">S.N</TableHead>
                    <TableHead className="min-w-[140px] font-black text-black uppercase text-[10px]">Branch / Unit</TableHead>
                    
                    {/* Dynamic Columns from Hierarchy Definitions */}
                    {node.customFields?.map(cf => (
                      <TableHead key={cf.id} className="text-center font-black text-black uppercase text-[10px] bg-primary/5">
                        {cf.name}
                      </TableHead>
                    ))}

                    <TableHead className="min-w-[220px] font-black text-black uppercase text-[10px]">Audit Finding & Observation</TableHead>
                    <TableHead className="min-w-[200px] font-black text-black uppercase text-[10px]">Impact & Root Cause</TableHead>
                    <TableHead className="min-w-[200px] font-black text-black uppercase text-[10px]">Recommendation</TableHead>
                    <TableHead className="w-24 text-center font-black text-black uppercase text-[10px]">Status</TableHead>
                    <TableHead className="w-24 text-center font-black text-black uppercase text-[10px]">Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y-2 divide-black">
                  {nodeFindings.map((finding, idx) => {
                    const totalInvolved = finding.involvedAmounts?.reduce((sum, item) => sum + item.amount, 0) || 0;
                    
                    return (
                      <TableRow key={finding.id} className="hover:bg-muted/30 transition-colors divide-x-2 divide-black">
                        <TableCell className="text-center font-bold text-black align-top py-5">{idx + 1}.</TableCell>
                        <TableCell className="text-black font-bold align-top py-5 text-xs uppercase leading-tight">
                          {finding.branchOrDepartment}
                        </TableCell>
                        
                        {/* Dynamic Custom Data Cells */}
                        {node.customFields?.map(cf => (
                          <TableCell key={cf.id} className="text-center font-bold text-primary align-top py-5 text-xs bg-primary/[0.02]">
                            {finding.dynamicValues?.[cf.id] !== undefined ? (
                              cf.type === 'number' ? 
                                Number(finding.dynamicValues[cf.id]).toLocaleString() : 
                                finding.dynamicValues[cf.id]
                            ) : '-'}
                          </TableCell>
                        ))}

                        <TableCell className="text-black text-xs leading-relaxed align-top py-5 space-y-3">
                          <p className="font-semibold text-sm">{finding.details}</p>
                          {totalInvolved > 0 && (
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-primary bg-primary/10 px-2 py-1.5 rounded-sm border border-primary/20 w-fit">
                              <CircleDollarSign className="h-3.5 w-3.5" />
                              INVOLVED: ETB {totalInvolved.toLocaleString()}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="text-black text-xs leading-relaxed align-top py-5 space-y-4">
                          {finding.auditCause && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1 opacity-70">
                                <Info className="h-2.5 w-2.5" /> Root Cause
                              </span>
                              <p className="italic font-medium leading-relaxed">{finding.auditCause}</p>
                            </div>
                          )}
                          {finding.auditEffect && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase text-destructive flex items-center gap-1 opacity-70">
                                <AlertCircle className="h-2.5 w-2.5" /> Business Effect
                              </span>
                              <p className="font-bold text-destructive leading-relaxed">{finding.auditEffect}</p>
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="text-black text-xs leading-relaxed align-top py-5">
                          <div className="space-y-1.5 bg-primary/5 p-3 rounded-sm border border-primary/10">
                            <span className="text-[9px] font-black uppercase text-primary flex items-center gap-1">
                              <Scale className="h-2.5 w-2.5" /> Remedial Measure
                            </span>
                            <p className="font-black leading-normal">{finding.recommendation}</p>
                          </div>
                        </TableCell>

                        <TableCell className="text-center align-top py-5">
                          <Badge variant="outline" className="text-[9px] font-black border-black text-black h-5 uppercase tracking-tighter rounded-none">
                            {finding.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center align-top py-5">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[9px] font-black h-5 uppercase tracking-tighter rounded-none",
                              finding.riskLevel === 'High' ? "bg-red-600 text-white border-red-600 shadow-sm" :
                              finding.riskLevel === 'Medium' ? "bg-amber-500 text-black border-amber-500" :
                              "bg-green-600 text-white border-green-600"
                            )}
                          >
                            {finding.riskLevel}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Recursively render children with indentation */}
          <div className="pl-8 border-l-2 border-dashed border-primary/10 space-y-8">
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
        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Compiling Hierarchical Master Report...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="Consolidated Audit Report" 
        description="Institutional master activity report grouped by hierarchical missions and taxonomy."
        backHref="/reports"
      >
        <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden font-bold border-primary/30">
          <Printer className="mr-2 h-4 w-4" />
          Print Formal Report
        </Button>
      </PageHeader>
      
      <main className="flex-1 p-4 sm:p-6 md:p-12 print:p-0">
        <div className="mx-auto max-w-full space-y-12 bg-white p-8 md:p-16 shadow-2xl print:shadow-none print:p-0">
          
          {/* Official Formal Header */}
          <div className="text-center space-y-6 border-b-4 border-black pb-10">
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <ShieldCheck className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-[0.2em] text-primary">Internal Audit Department</h1>
            <h2 className="text-2xl font-bold uppercase tracking-widest text-foreground">Consolidated Activity Report</h2>
            <div className="flex justify-center items-center gap-10 text-xs font-black uppercase text-muted-foreground tracking-widest pt-2">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] opacity-60">Reporting Period</span>
                <span className="text-black">FY 2024/25</span>
              </div>
              <div className="h-8 w-px bg-muted-foreground/30"></div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] opacity-60">Generation Date</span>
                <span className="text-black">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="h-8 w-px bg-muted-foreground/30"></div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] opacity-60">Classification</span>
                <span className="text-primary">CONFIDENTIAL</span>
              </div>
            </div>
          </div>

          {/* Dynamic Hierarchy Content */}
          <div className="space-y-4">
            {hierarchy.length > 0 ? renderHierarchy() : (
              <div className="py-32 text-center border-2 border-dashed rounded-3xl bg-muted/5">
                <Info className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-2xl font-black uppercase text-muted-foreground">No Registered Audit Data</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mt-2">
                  The consolidated report is empty because no findings have been logged against the institutional hierarchy. 
                  Please log new findings in the "Institutional Audit Log" to populate this report.
                </p>
              </div>
            )}
          </div>

          {/* Report Footer for Print & Authorization */}
          <div className="mt-32 pt-10 border-t-2 border-black flex justify-between items-end print:break-inside-avoid">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Audit Flow Enterprise Platform</p>
              <p className="text-xs font-mono font-bold">SERIAL REF: CAR-SYS-{Date.now()}</p>
              <p className="text-[9px] italic text-muted-foreground">Generated by Authorized Audit System</p>
            </div>
            
            <div className="text-right space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Authorized Review & Approval</p>
                <div className="h-16 w-64 border-b-2 border-dotted border-black mb-2 flex items-end justify-center">
                  <span className="text-[10px] italic opacity-30 uppercase font-bold tracking-tighter">Official Seal / Signature</span>
                </div>
                <p className="text-sm font-black uppercase tracking-tighter">Chief Audit Executive</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
