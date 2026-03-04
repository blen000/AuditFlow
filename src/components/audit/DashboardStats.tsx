
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, FileText, Clock } from 'lucide-react';
import type { AuditFinding } from '@/types';

type DashboardStatsProps = {
  findings: AuditFinding[];
};

export function DashboardStats({ findings }: DashboardStatsProps) {
  const total = findings.length;
  const highRisk = findings.filter((f) => f.riskLevel === 'High').length;
  const active = findings.filter((f) => f.status !== 'Closed').length;
  const pendingRevalidation = findings.filter((f) => f.revalidationDate).length;

  const stats = [
    {
      title: 'Total Findings',
      value: total,
      icon: FileText,
      description: 'Logged in current cycle',
      color: 'text-primary',
    },
    {
      title: 'High Risk',
      value: highRisk,
      icon: AlertCircle,
      description: 'Requires urgent action',
      color: 'text-destructive',
    },
    {
      title: 'Active Issues',
      value: active,
      icon: Clock,
      description: 'Not yet closed',
      color: 'text-orange-500',
    },
    {
      title: 'Pending Re-validation',
      value: pendingRevalidation,
      icon: CheckCircle2,
      description: 'Awaiting final check',
      color: 'text-green-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
