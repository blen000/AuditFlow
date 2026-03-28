'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { FindingsFrequencyTable } from '@/components/audit/FindingsFrequencyTable';
import { initialFindings } from '@/lib/mock-data';

export default function FindingsFrequencyPage() {
  const [findings] = useState(initialFindings);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="Audit Findings Frequency" 
        description="Consolidated irregularities report with branch prevalence and case density metrics."
        backHref="/reports"
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          <FindingsFrequencyTable findings={findings} />
        </div>
      </main>
    </div>
  );
}
