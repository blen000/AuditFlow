'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { AuditFinding, FindingCategory } from '@/types';
import { initialBranches } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

type FindingsFrequencyTableProps = {
  findings: AuditFinding[];
};

export function FindingsFrequencyTable({ findings }: FindingsFrequencyTableProps) {
  const totalBranchesCount = initialBranches.length;

  const categories: FindingCategory[] = [
    'Cash', 'Accounts', 'Negotiable Instruments', 'Loans', 'Deposits', 
    'Fixed Assets', 'Card Banking', 'Security', 'Others'
  ];

  const stats = categories.map(cat => {
    const findingsInCategory = findings.filter(f => f.category === cat);
    const uniqueBranches = new Set(findingsInCategory.map(f => f.branchOrDepartment));
    const branchesCount = uniqueBranches.size;
    const casesCount = findingsInCategory.length;
    const percentage = totalBranchesCount > 0 ? (branchesCount / totalBranchesCount) * 100 : 0;

    return {
      name: cat,
      branchesCount,
      casesCount,
      percentage: Math.round(percentage),
    };
  }).filter(s => s.casesCount > 0)
    .sort((a, b) => b.casesCount - a.casesCount);

  return (
    <Card className="shadow-sm border-none bg-card/50 overflow-hidden">
      <CardHeader className="pb-2 border-b bg-muted/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold uppercase tracking-tight">Audit Findings with number of cases and frequencies</CardTitle>
            <CardDescription>Broad category analysis showing branch prevalence and case density across {totalBranchesCount} branches.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Broad Category</TableHead>
              <TableHead className="text-center font-bold uppercase text-[10px] tracking-widest py-4">Branches Affected</TableHead>
              <TableHead className="text-center font-bold uppercase text-[10px] tracking-widest py-4">Total Cases</TableHead>
              <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest py-4">Prevalence & Density</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.length > 0 ? (
              stats.map((stat) => (
                <TableRow key={stat.name} className="hover:bg-muted/20 transition-colors border-b last:border-0">
                  <TableCell className="py-4">
                    <span className="font-bold text-sm text-foreground">{stat.name}</span>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-lg">{stat.branchesCount}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">Branch{stat.branchesCount !== 1 ? 'es' : ''}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <Badge variant="outline" className="h-8 min-w-[40px] justify-center text-sm font-black border-primary/20 bg-primary/5 text-primary">
                      {stat.casesCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{stat.percentage}%</span>
                        <span className="text-[10px] text-muted-foreground uppercase">Frequency</span>
                      </div>
                      <Progress value={stat.percentage} className="h-1.5 w-32" />
                      <p className="text-[9px] text-muted-foreground italic font-medium">Out of total registered branches</p>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  <p className="text-sm font-medium">No findings match the current executive filters.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
