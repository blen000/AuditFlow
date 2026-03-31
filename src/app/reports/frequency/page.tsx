'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { FindingsFrequencyTable } from '@/components/audit/FindingsFrequencyTable';
import { getFrequencyReportData } from '@/app/actions/reports';
import { Loader2 } from 'lucide-react';

export default function FindingsFrequencyPage() {
  const [findings, setFindings] = useState([]);
  const [totalBranches, setTotalBranches] = useState(0);
  const [rootCategories, setRootCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getFrequencyReportData();
        setFindings(data.findings as any);
        setTotalBranches(data.totalBranchesCount);
        setRootCategories(data.rootCategories);
      } catch (error) {
        console.error('Error loading frequency report:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Calculating Irregularity Frequencies...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="Audit Findings Frequency" 
        description="Consolidated irregularities report with branch prevalence and case density metrics."
        backHref="/reports"
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          <FindingsFrequencyTable 
            findings={findings} 
            totalBranchesCount={totalBranches} 
            categories={rootCategories}
          />
        </div>
      </main>
    </div>
  );
}
