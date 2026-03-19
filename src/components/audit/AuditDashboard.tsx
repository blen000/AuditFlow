'use client';
import { useState } from 'react';
import type { AuditFinding, SpecialAudit } from '@/types';
import { initialFindings, initialSpecialAudits } from '@/lib/mock-data';
import { DashboardStats } from './DashboardStats';
import { DashboardCharts } from './DashboardCharts';

export default function AuditDashboard() {
  const [findings] = useState<AuditFinding[]>(initialFindings);
  const [specialAudits] = useState<SpecialAudit[]>(initialSpecialAudits);

  return (
    <div className="space-y-8">
      {/* 1. Statistics Row */}
      <DashboardStats findings={findings} specialAudits={specialAudits} />

      {/* 2. Charts Row */}
      <DashboardCharts findings={findings} specialAudits={specialAudits} />
      
      <div className="rounded-lg border bg-muted/30 p-8 text-center border-dashed border-primary/20">
        <p className="text-muted-foreground text-sm">
          Detailed case management, individual branch findings, and follow-up tracking are available in the 
          <a href="/auditee-view" className="ml-1 font-bold text-primary hover:underline">Auditee Mission Control</a>.
        </p>
      </div>
    </div>
  );
}
