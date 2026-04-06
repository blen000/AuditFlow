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
import { Printer, ShieldCheck, Loader2, Info, Scale, AlertCircle, CircleDollarSign, CheckCircle2, User } from 'lucide-react';
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

  // Recursive check: does this node or any child have findings?
  const nodeHasFindings = (nodeId: string): boolean => {
    if (findingsByNode[nodeId]?.length > 0) return true;
    const children = hierarchy.filter(n => n.parentId === nodeId);
    return children.some(child => nodeHasFindings(child.id));
  };

  const isRootNode = (node: AuditHierarchyNode) => {
    return !node.parentId || node.parentId === "" || node.parentId === "null";
  };

  const renderHierarchy = (parentId: string | null = null, depth: number = 0) => {
    const nodes = hierarchy.filter(n => {
      if (parentId === null) return isRootNode(n);
      return n.parentId === parentId;
    }).sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));

    if (nodes.length === 0) return null;

    return nodes.map(node => {
      const nodeFindings = findingsByNode[node.id] || [];
      const hasDirectFindings = nodeFindings.length > 0;
      const hasContent = nodeHasFindings(node.id);

      if (!isVisible) return null;

      return (
        <div key={node.id} className="space-y-4">
          {/* Hierarchical Heading */}
          <div className={cn(
            "flex items-baseline gap-2 mb-2",
            depth === 0 ? "mt-10" : depth === 1 ? "mt-6" : "mt-4"
          )}>
            <span className={cn(
              "font-mono font-black text-primary",
              depth === 0 ? "text-xl" : depth === 1 ? "text-lg" : "text-base"
            )}>
              {node.number}
            </span>
            <h3 className={cn(
              "font-bold uppercase tracking-tight",
              depth === 0 ? "text-xl border-b-2 border-black pb-1" : 
              depth === 1 ? "text-lg border-b border-black/20" : 
              "text-base italic"
            )}>
              {node.title}
            </h3>
          </div>

          {/* Table for this specific node */}
          {hasDirectFindings && (
            <div className="rounded-none border-2 border-black overflow-hidden shadow-sm bg-white mb-8">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50 border-b-2 border-black divide-x-2 divide-black">
                    <TableHead className="w-12 text-center font-black text-black uppercase text-[10px] h-12">S.N</TableHead>
                    <TableHead className="min-w-[140px] font-black text-black uppercase text-[10px]">Name of branch</TableHead>
                    
                    {/* Dynamic Columns from Hierarchy Settings */}
                    {node.customFields?.map(cf => (
                      <TableHead key={cf.id} className="text-center font-black text-black uppercase text-[10px] bg-primary/5 min-w-[100px]">
                        {cf.name}
                      </TableHead>
                    ))}

                    <TableHead className="min-w-[200px] font-black text-black uppercase text-[10px]">Findings / Observations</TableHead>
                    <TableHead className="min-w-[220px] font-black text-black uppercase text-[10px]">Impact / Recommendation</TableHead>
                    <TableHead className="w-28 text-center font-black text-black uppercase text-[10px]">Branches Response</TableHead>
                    <TableHead className="w-24 text-center font-black text-black uppercase text-[10px]">Status</TableHead>
                    <TableHead className="w-20 text-center font-black text-black uppercase text-[10px]">Risk Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y-2 divide-black">
                  {nodeFindings.map((finding, idx) => (
                    <TableRow key={finding.id} className="hover:bg-muted/30 transition-colors divide-x-2 divide-black">
                      <TableCell className="text-center font-bold text-black align-top pt-4 text-xs">{idx + 1}.</TableCell>
                      <TableCell className="text-black font-bold align-top pt-4 text-xs uppercase leading-tight">
                        {finding.branchOrDepartment}
                      </TableCell>
                      
                      {/* Dynamic Custom Data Cells */}
                      {node.customFields?.map(cf => (
                        <TableCell key={cf.id} className="text-center font-bold text-primary align-top pt-4 text-xs bg-primary/[0.02]">
                          {finding.dynamicValues?.[cf.id] !== undefined ? (
                            cf.type === 'number' ? 
                              Number(finding.dynamicValues[cf.id]).toLocaleString() : 
                              finding.dynamicValues[cf.id]
                          ) : '-'}
                        </TableCell>
                      ))}

                      <TableCell className="text-black text-[11px] leading-relaxed align-top pt-4">
                        <p className="font-medium">{finding.details}</p>
                      </TableCell>

                      <TableCell className="text-black text-[11px] leading-relaxed align-top pt-4 space-y-4">
                        {finding.auditEffect && (
                          <div className="space-y-1">
                            <span className="font-black uppercase text-[9px] underline">Effect:</span>
                            <p className="italic">{finding.auditEffect}</p>
                          </div>
                        )}
                        {finding.recommendation && (
                          <div className="space-y-1">
                            <span className="font-black uppercase text-[9px] underline">Recommendation:</span>
                            <p className="font-bold">{finding.recommendation}</p>
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-center align-top pt-4">
                        <div className="space-y-2">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-sm border",
                            finding.auditeeAgreement === 'Agreed' ? "bg-green-100 text-green-800 border-green-300" :
                            finding.auditeeAgreement === 'Declined' ? "bg-red-100 text-red-800 border-red-300" :
                            "bg-amber-100 text-amber-800 border-amber-300"
                          )}>
                            {finding.auditeeAgreement}
                          </span>
                          {finding.auditeeResponse && (
                            <p className="text-[9px] text-muted-foreground italic leading-tight px-1">
                              "{finding.auditeeResponse.length > 50 ? finding.auditeeResponse.substring(0, 50) + '...' : finding.auditeeResponse}"
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center align-top pt-4">
                        <span className="text-[10px] font-black uppercase text-black">
                          {finding.status}
                        </span>
                      </TableCell>

                      <TableCell className="text-center align-top pt-4">
                        <span className={cn(
                          "text-[10px] font-black uppercase",
                          finding.riskLevel === 'High' ? "text-red-600" :
                          finding.riskLevel === 'Medium' ? "text-amber-600" :
                          "text-green-600"
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

          {/* Children Recursion */}
          <div className="pl-6 border-l border-dashed border-black/10 space-y-4">
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
        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Generating Consolidated Report...</p>
      </div>
    );
  }

  const totalFindingsCount = findings.length;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="Consolidated Activity Report" 
        description="Hierarchical master activity report grouped by missions and subsections."
        backHref="/reports"
      >
        <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden font-bold border-primary/30">
          <Printer className="mr-2 h-4 w-4" />
          Print Formal Report
        </Button>
      </PageHeader>
      
      <main className="flex-1 p-4 sm:p-6 md:p-12 print:p-0">
        <div className="mx-auto max-w-full space-y-10 bg-white p-8 md:p-16 shadow-2xl print:shadow-none print:p-0">
          
          {/* Institutional Header */}
          <div className="text-center space-y-4 border-b-2 border-black pb-8">
            <div className="flex justify-center mb-2">
              <ShieldCheck className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-primary">Internal Audit Department</h1>
            <h2 className="text-lg font-bold uppercase tracking-tight text-foreground">
              Activity Report for the 2nd quarter ended {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
          </div>

          {/* Hierarchical Content */}
          <div className="space-y-2">
            {hierarchy.length > 0 ? renderHierarchy() : (
              <div className="py-32 text-center border-2 border-dashed rounded-xl bg-muted/5">
                <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-bold text-muted-foreground uppercase">No Audit Data Found</h3>
                <p className="text-muted-foreground text-xs mt-1">Please log findings in the institutional portal to populate this report.</p>
              </div>
            )}
          </div>

          {/* Authorization Footer */}
          <div className="mt-24 pt-8 border-t-2 border-black flex justify-between items-end print:break-inside-avoid">
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Audit Flow platform</p>
              <p className="text-[10px] font-mono">REF: CAR-INT-{Date.now().toString().slice(-6)}</p>
            </div>
            
            <div className="text-right space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest">Authorized Approval</p>
                <div className="h-12 w-48 border-b-2 border-dotted border-black mb-1"></div>
                <p className="text-xs font-black uppercase">Chief Audit Executive</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
