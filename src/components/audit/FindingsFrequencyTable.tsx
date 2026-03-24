'use client';

import React, { useState } from 'react';
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
import { ChevronDown, Building2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type FindingsFrequencyTableProps = {
  findings: AuditFinding[];
};

export function FindingsFrequencyTable({ findings }: FindingsFrequencyTableProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const totalBranchesCount = initialBranches.length;

  const categories: FindingCategory[] = [
    'Cash', 'Accounts', 'Negotiable Instruments', 'Loans', 'Deposits', 
    'Fixed Assets', 'Card Banking', 'Security', 'Others'
  ];

  const stats = categories.map(cat => {
    const findingsInCategory = findings.filter(f => f.category === cat);
    const uniqueBranchesSet = new Set(findingsInCategory.map(f => f.branchOrDepartment));
    const branchesNames = Array.from(uniqueBranchesSet).sort();
    const branchesCount = branchesNames.length;
    const casesCount = findingsInCategory.length;
    const percentage = totalBranchesCount > 0 ? (branchesCount / totalBranchesCount) * 100 : 0;

    return {
      name: cat,
      branchesCount,
      branchesNames,
      casesCount,
      percentage: Math.round(percentage),
    };
  }).filter(s => s.casesCount > 0)
    .sort((a, b) => b.casesCount - a.casesCount);

  const toggleCategory = (name: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(name)) {
      newSet.delete(name);
    } else {
      newSet.add(name);
    }
    setExpandedCategories(newSet);
  };

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
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Broad Category</TableHead>
              <TableHead className="text-center font-bold uppercase text-[10px] tracking-widest py-4">Branches Affected</TableHead>
              <TableHead className="text-center font-bold uppercase text-[10px] tracking-widest py-4">Total Cases</TableHead>
              <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest py-4">Prevalence & Density</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.length > 0 ? (
              stats.map((stat) => (
                <React.Fragment key={stat.name}>
                  <TableRow 
                    className={cn(
                      "hover:bg-muted/20 transition-colors cursor-pointer group border-b",
                      expandedCategories.has(stat.name) && "bg-muted/10 border-b-0"
                    )}
                    onClick={() => toggleCategory(stat.name)}
                  >
                    <TableCell className="text-center">
                      <ChevronDown className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        expandedCategories.has(stat.name) && "rotate-180 text-primary"
                      )} />
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{stat.name}</span>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{stat.branchesCount}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" title="View Branch Names">
                            <Info className="h-3 w-3" />
                          </Button>
                        </div>
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
                  {expandedCategories.has(stat.name) && (
                    <TableRow className="bg-muted/10 hover:bg-muted/10 border-b">
                      <TableCell colSpan={5} className="p-0">
                        <div className="p-6 pt-2 pb-8 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest border-b pb-2">
                            <Building2 className="h-3 w-3" />
                            Affected Organizational Units
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {stat.branchesNames.map((branchName) => (
                              <Badge 
                                key={branchName} 
                                variant="secondary" 
                                className="bg-background border px-3 py-1 text-xs font-semibold shadow-sm flex items-center gap-2"
                              >
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                {branchName}
                              </Badge>
                            ))}
                          </div>
                          {stat.branchesNames.length === 0 && (
                            <p className="text-xs text-muted-foreground italic">No branch data available for this category.</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
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
