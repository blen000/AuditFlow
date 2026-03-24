'use client';

import { useRouter } from 'next/navigation';
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
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { AuditFinding, SpecialAudit, FindingCategory, FollowUpStatus } from '@/types';
import { cn } from '@/lib/utils';

type DashboardChartsProps = {
  findings: AuditFinding[];
  specialAudits: SpecialAudit[];
};

const CATEGORY_COLORS: Record<FindingCategory, string> = {
  'Cash': '#1e3a8a', // Dark Blue
  'Accounts': '#b91c1c', // Dark Red
  'Negotiable Instruments': '#4d7c0f', // Olive Green
  'Loans': '#5b21b6', // Deep Purple
  'Deposits': '#0e7490', // Teal
  'Fixed Assets': '#9a3412', // Rust Orange
  'Card Banking': '#334155', // Slate
  'Security': '#be123c', // Crimson
  'Others': '#15803d', // Forest Green
};

const STATUS_COLORS: Record<string, string> = {
  'Pending': '#94a3b8', // Slate
  'Rectified': '#16a34a', // Green
  'Partially Rectified': '#f59e0b', // Amber
  'Refereed': '#2563eb', // Blue
  'Action Plan': '#7c3aed', // Violet
};

export function DashboardCharts({ findings, specialAudits }: DashboardChartsProps) {
  const router = useRouter();
  const totalFindings = findings.length;
  
  // 1. Findings per Category (Pie Chart)
  const categoryCounts = findings.reduce((acc: Record<string, number>, finding) => {
    acc[finding.category] = (acc[finding.category] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    count,
    percentage: totalFindings > 0 ? Math.round((count / totalFindings) * 100) : 0,
    fill: CATEGORY_COLORS[name as FindingCategory] || '#888888',
  })).sort((a, b) => b.count - a.count);

  // 2. Findings Status Overview (Lifecycle Donut)
  const statusCounts = findings.reduce((acc: Record<string, number>, finding) => {
    const s = finding.followUpStatus || 'Pending';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const statusData = [
    'Pending', 'Rectified', 'Partially Rectified', 'Refereed', 'Action Plan'
  ].map(status => {
    const count = statusCounts[status] || 0;
    return {
      name: status === 'Refereed' ? 'Referred' : status,
      count,
      percentage: totalFindings > 0 ? Math.round((count / totalFindings) * 100) : 0,
      fill: STATUS_COLORS[status] || '#888888',
    };
  });

  // 3. Findings by Risk Level
  const riskData = [
    { name: 'High', count: findings.filter((f) => f.riskLevel === 'High').length, fill: 'hsl(var(--destructive))' },
    { name: 'Medium', count: findings.filter((f) => f.riskLevel === 'Medium').length, fill: 'hsl(var(--accent))' },
    { name: 'Low', count: findings.filter((f) => f.riskLevel === 'Low').length, fill: 'hsl(var(--primary))' },
  ];

  // 4. Special Audit Monetary Reconciliation
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

  const handleSliceClick = (data: any) => {
    router.push(`/auditee-view?category=${encodeURIComponent(data.name)}`);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Findings per Category - PIE CHART */}
      <Card className="shadow-sm border-none bg-card/50 overflow-hidden">
        <CardHeader className="pb-2 border-b bg-muted/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold uppercase tracking-tight">Findings per Category</CardTitle>
              <CardDescription>Classification by operational banking units.</CardDescription>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-primary">{totalFindings}</span>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Active</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[350px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  onClick={handleSliceClick}
                  className="cursor-pointer outline-none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-xl space-y-1">
                          <p className="font-bold text-sm" style={{ color: data.fill }}>{data.name}</p>
                          <p className="text-xs font-mono">
                            {data.percentage}% ({data.count} of {totalFindings})
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  layout="vertical" 
                  align="right" 
                  verticalAlign="middle"
                  content={({ payload }) => (
                    <ul className="flex flex-col gap-2 ml-4">
                      {payload?.map((entry: any, index: number) => (
                        <li key={index} className="flex items-center gap-2 group cursor-pointer hover:opacity-80" onClick={() => handleSliceClick(entry.payload)}>
                          <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                          <div className="flex flex-col -space-y-0.5">
                            <span className="text-[11px] font-bold truncate max-w-[120px]">{entry.value}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {entry.payload.percentage}% ({entry.payload.count})
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Findings Status Overview - DONUT CHART */}
      <Card className="shadow-sm border-none bg-card/50 overflow-hidden">
        <CardHeader className="pb-2 border-b bg-muted/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold uppercase tracking-tight">Findings Status Overview</CardTitle>
              <CardDescription>Remediation lifecycle distribution (Period-wise).</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[350px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="count"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-status-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border-2 rounded-xl p-4 shadow-2xl space-y-1 border-primary/10">
                          <p className="font-black text-xs uppercase tracking-widest text-muted-foreground">{data.name}</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black" style={{ color: data.fill }}>{data.count}</span>
                            <span className="text-xs font-bold text-muted-foreground">Cases</span>
                          </div>
                          <p className="text-[10px] font-bold text-primary bg-primary/5 py-1 px-2 rounded-md">
                            {data.percentage}% of total period findings
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  layout="horizontal" 
                  align="center" 
                  verticalAlign="bottom"
                  content={({ payload }) => (
                    <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4">
                      {payload?.map((entry: any, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                            {entry.value} ({entry.payload.count})
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Severity Distribution */}
      <Card className="shadow-sm border-none bg-card/50">
        <CardHeader className="pb-2 border-b bg-muted/10">
          <CardTitle className="text-lg font-bold uppercase tracking-tight">Severity Distribution</CardTitle>
          <CardDescription>Categorized by mission risk level.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ChartContainer config={config} className="h-[280px] w-full">
            <BarChart data={riskData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} fontVariant="bold" />
              <YAxis tickLine={false} axisLine={false} fontSize={10} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Special Audit Monetary Analysis */}
      <Card className="md:col-span-2 shadow-sm border-none bg-card/50">
        <CardHeader className="pb-2 border-b bg-muted/10">
          <CardTitle className="text-lg font-bold uppercase tracking-tight">Special Audit Monetary Reconciliation</CardTitle>
          <CardDescription>Analysis of involved vs recovered funds across special reports.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ChartContainer config={config} className="h-[300px] w-full">
            <BarChart data={monetaryData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} fontVariant="mono" />
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
