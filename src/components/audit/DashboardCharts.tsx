'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Pie,
  PieChart,
  Cell,
  YAxis,
} from 'recharts';
import type { AuditFinding, SpecialAudit } from '@/types';

type DashboardChartsProps = {
  findings: AuditFinding[];
  specialAudits: SpecialAudit[];
};

const COLORS = ['#253025', '#eab308', '#10b981', '#3b82f6', '#8b5cf6'];

export function DashboardCharts({ findings, specialAudits }: DashboardChartsProps) {
  // 1. Findings by Risk Level
  const riskData = [
    { name: 'High', count: findings.filter((f) => f.riskLevel === 'High').length, fill: 'hsl(var(--destructive))' },
    { name: 'Medium', count: findings.filter((f) => f.riskLevel === 'Medium').length, fill: 'hsl(var(--accent))' },
    { name: 'Low', count: findings.filter((f) => f.riskLevel === 'Low').length, fill: 'hsl(var(--primary))' },
  ];

  // 2. Findings by Branch (Top 5)
  const branchCounts = findings.reduce((acc: Record<string, number>, finding) => {
    acc[finding.branchOrDepartment] = (acc[finding.branchOrDepartment] || 0) + 1;
    return acc;
  }, {});

  const branchData = Object.entries(branchCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 3. Special Audit Monetary Reconciliation
  const monetaryData = specialAudits.map(audit => ({
    name: audit.id,
    involved: audit.amountInvolved,
    recovered: audit.recovered,
    pending: audit.pending
  }));

  const config = {
    count: { label: 'Findings', color: 'hsl(var(--primary))' },
    involved: { label: 'Involved', color: 'hsl(var(--primary))' },
    recovered: { label: 'Recovered', color: 'hsl(var(--accent))' },
    pending: { label: 'Pending', color: 'hsl(var(--destructive))' },
  } satisfies ChartConfig;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
      {/* Risk Distribution */}
      <Card className="shadow-sm border-none bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Severity Distribution</CardTitle>
          <CardDescription>Findings categorized by risk level.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={config} className="h-[250px] w-full">
            <BarChart data={riskData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Branch Performance */}
      <Card className="shadow-sm border-none bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Audited Branches (Top 5)</CardTitle>
          <CardDescription>Frequency of findings per branch.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={config} className="h-[250px] w-full">
            <BarChart layout="vertical" data={branchData}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} fontSize={10} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Special Audit Monetary Analysis */}
      <Card className="md:col-span-2 shadow-sm border-none bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Special Audit Monetary Reconciliation</CardTitle>
          <CardDescription>Analysis of involved vs recovered funds across special reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={config} className="h-[300px] w-full">
            <BarChart data={monetaryData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} />
              <YAxis fontSize={10} tickFormatter={(value) => `$${value/1000}k`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="involved" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="recovered" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
