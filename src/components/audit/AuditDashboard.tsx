
'use client';
import { useState } from 'react';
import type { AuditFinding } from '@/types';
import { initialFindings } from '@/lib/mock-data';
import { DashboardStats } from './DashboardStats';
import { DashboardCharts } from './DashboardCharts';

export default function AuditDashboard() {
  const [findings] = useState<AuditFinding[]>(initialFindings);

  return (
    <div className="space-y-8">
      {/* 1. Statistics Row */}
      <DashboardStats findings={findings} />

      {/* 2. Charts Row */}
      <DashboardCharts findings={findings} />
      
      <div className="rounded-lg border bg-muted/30 p-8 text-center">
        <p className="text-muted-foreground">
          For detailed case management and branch-specific findings, please visit the 
          <a href="/auditee-view" className="ml-1 font-semibold text-primary hover:underline">Auditee View</a>.
        </p>
      </div>
    </div>
  );
}
