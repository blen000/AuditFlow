'use client';

import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { AuditFinding } from '@/types';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

type FindingsFrequencyTableProps = {
  findings: AuditFinding[];
  totalBranchesCount: number;
  categories?: string[];
};

const defaultCategories = [
  'Deposits', 'Card Banking', 'Accounts', 'Cash', 'Negotiable Instruments', 
  'Loans', 'Fixed Assets', 'Security', 'Others'
];

export function FindingsFrequencyTable({ findings, totalBranchesCount, categories }: FindingsFrequencyTableProps) {
  const activeCategories = categories || defaultCategories;

  const groupedData = useMemo(() => {
    return activeCategories.map((cat, catIdx) => {
      // In this version, we map categories to Level 1 hierarchy titles
      const findingsInCategory = findings.filter(f => f.parentSummary === cat);
      if (findingsInCategory.length === 0) return null;

      // Group unique irregularities (titles) within this category
      const uniqueIrregularities = Array.from(new Set(findingsInCategory.map(f => f.title)));
      
      const rows = uniqueIrregularities.map(title => {
        const matches = findingsInCategory.filter(f => f.title === title);
        const uniqueBranches = new Set(matches.map(f => f.branchOrDepartment)).size;
        const totalCases = matches.length;
        const percentage = totalBranchesCount > 0 ? (uniqueBranches / totalBranchesCount) * 100 : 0;
        
        // Sum any involved amounts for the "Difference" column
        const totalDifference = matches.reduce((sum, f) => {
          const findingTotal = f.involvedAmounts?.reduce((s, a) => s + a.amount, 0) || 0;
          return sum + findingTotal;
        }, 0);

        return {
          irregularity: title,
          noOfBranches: uniqueBranches,
          noOfCases: totalCases,
          percentage: percentage.toFixed(0),
          difference: totalDifference,
        };
      });

      return {
        id: `5.1.${catIdx + 1}`,
        name: cat,
        rows
      };
    }).filter(Boolean);
  }, [findings, totalBranchesCount, activeCategories]);

  return (
    <Card className="shadow-xl border-none overflow-hidden bg-white print:shadow-none">
      <CardHeader className="pb-6 border-b bg-muted/5 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold uppercase tracking-tight">Audit Findings with number of cases and frequencies</CardTitle>
          <CardDescription className="font-semibold text-muted-foreground">Consolidated Organizational Irregularity Matrix</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-10 p-8">
          {groupedData.length > 0 ? (
            groupedData.map((group: any) => (
              <div key={group.id} className="space-y-3">
                <h3 className="text-lg font-bold underline flex items-center gap-2">
                  <span className="font-mono text-primary">{group.id}</span>
                  {group.name}
                </h3>
                
                <div className="rounded-sm border-2 border-black overflow-hidden shadow-sm">
                  <Table className="border-collapse">
                    <TableHeader>
                      <TableRow className="bg-muted/80 hover:bg-muted/80 border-b-2 border-black divide-x-2 divide-black">
                        <TableHead className="w-16 text-center font-black text-black uppercase text-xs">S.R</TableHead>
                        <TableHead className="font-black text-black uppercase text-xs">Irregularities</TableHead>
                        <TableHead className="w-40 text-center font-black text-black uppercase text-xs">Difference/ long outstanding</TableHead>
                        <TableHead className="w-32 text-center font-black text-black uppercase text-xs">No of Branches</TableHead>
                        <TableHead className="w-32 text-center font-black text-black uppercase text-xs">No of cases</TableHead>
                        <TableHead className="w-40 text-center font-black text-black uppercase text-xs">(%) out of {totalBranchesCount} Branches</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y-2 divide-black">
                      {group.rows.map((row: any, idx: number) => (
                        <TableRow key={idx} className="hover:bg-transparent divide-x-2 divide-black">
                          <TableCell className="text-center font-bold text-black border-r-2 border-black">{idx + 1}.</TableCell>
                          <TableCell className="text-black leading-snug font-medium pr-4">{row.irregularity}</TableCell>
                          <TableCell className="text-center font-bold text-black">
                            {row.difference > 0 ? `ETB ${row.difference.toLocaleString()}` : ''}
                          </TableCell>
                          <TableCell className="text-center font-bold text-black">{row.noOfBranches}</TableCell>
                          <TableCell className="text-center font-bold text-black">{row.noOfCases}</TableCell>
                          <TableCell className="text-center font-bold text-black">{row.percentage}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))
          ) : (
            <div className="py-24 text-center border-2 border-dashed rounded-xl bg-muted/5">
              <p className="text-muted-foreground font-bold uppercase tracking-widest">No irregularity frequencies found in current mission data.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
