'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Clock, 
  TrendingUp, 
  Building2, 
  DollarSign,
  ShieldAlert
} from 'lucide-react';
import type { AuditFinding, SpecialAudit } from '@/types';

type DashboardStatsProps = {
  findings: AuditFinding[];
  specialAudits: SpecialAudit[];
};

export function DashboardStats({ findings, specialAudits }: DashboardStatsProps) {
  const total = findings.length;
  const highRisk = findings.filter((f) => f.riskLevel === 'High').length;
  const active = findings.filter((f) => f.status !== 'Closed').length;
  
  // New Enhanced Metrics
  const uniqueBranches = new Set(findings.map(f => f.branchOrDepartment)).size;
  const totalSpecial = specialAudits.length;
  const totalRecovered = specialAudits.reduce((acc, curr) => acc + curr.recovered, 0);
  const totalInvolved = specialAudits.reduce((acc, curr) => acc + curr.amountInvolved, 0);
  const totalPending = specialAudits.reduce((acc, curr) => acc + curr.pending, 0);
  const recoveryRate = totalInvolved > 0 ? (totalRecovered / totalInvolved) * 100 : 0;
  const pendingRate = totalInvolved > 0 ? (totalPending / totalInvolved) * 100 : 0;

  const stats = [
    {
      title: 'Total Findings',
      value: total,
      icon: FileText,
      description: 'Logged in current cycle',
      color: 'text-primary',
    },
    {
      title: 'Critical Risks',
      value: highRisk,
      icon: ShieldAlert,
      description: 'Requiring immediate action',
      color: 'text-destructive',
    },
    {
      title: 'Special Audits',
      value: totalSpecial,
      icon: TrendingUp,
      description: 'Specialized missions',
      color: 'text-accent',
    },
    {
      title: 'Branch Coverage',
      value: uniqueBranches,
      icon: Building2,
      description: 'Active branch oversight',
      color: 'text-blue-500',
    },
    {
      title: 'Monetary Pending',
      value: `ETB ${(totalPending / 1000).toFixed(1)}k`,
      icon: DollarSign,
      description: `${pendingRate.toFixed(0)}% Outstanding Rate`,
      color: 'text-destructive',
    },
    {
      title: 'Active Issues',
      value: active,
      icon: Clock,
      description: 'In-progress workflows',
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat, index) => (
        <Card key={index} className="overflow-hidden border-t-2 border-t-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-[10px] text-muted-foreground font-medium">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
