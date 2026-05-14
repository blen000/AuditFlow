'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
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
} from 'recharts';
import { Tooltip, Legend } from 'recharts';
import type { AuditFinding, SpecialAudit, AuditHierarchyNode } from '@/types';
import { 
  format, 
  startOfMonth, 
  startOfQuarter, 
  startOfYear, 
  isWithinInterval, 
  subMonths,
  getQuarter
} from 'date-fns';

type DashboardChartsProps = {
  findings: AuditFinding[];
  specialAudits: SpecialAudit[];
  hierarchy: AuditHierarchyNode[];
  selectedPeriod: string;
  followUpStatuses: { id?: string; name: string }[];
};

const CATEGORY_COLORS = [
  '#1e3a8a', '#b91c1c', '#4d7c0f', '#5b21b6', '#0e7490', 
  '#9a3412', '#334155', '#be123c', '#15803d'
];

const STATUS_COLORS: Record<string, string> = {
  'Pending': '#94a3b8',
  'Rectified': '#16a34a',
  'Partially Rectified': '#f59e0b',
  'Refereed': '#2563eb',
  'Action Plan': '#7c3aed',
};

export function DashboardCharts({ findings, specialAudits, hierarchy, selectedPeriod, followUpStatuses = [] }: DashboardChartsProps) {
  const router = useRouter();
  const totalFindings = findings.length;
  
  // Dynamic Categories from Level 1 Hierarchy
  const rootMissions = hierarchy.filter(n => n.parentId === null);
  
  const categoryCounts = findings.reduce((acc: Record<string, number>, finding) => {
    // Traverse up to find root mission title
    let currentNode = hierarchy.find(n => n.id === finding.hierarchyNodeId);
    while (currentNode && currentNode.parentId) {
      currentNode = hierarchy.find(n => n.id === currentNode?.parentId);
    }
    const rootTitle = currentNode?.title || 'Uncategorized';
    acc[rootTitle] = (acc[rootTitle] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.entries(categoryCounts).map(([name, count], index) => ({
    name,
    count,
    percentage: totalFindings > 0 ? Math.round((count / totalFindings) * 100) : 0,
    fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  })).sort((a, b) => b.count - a.count);

  // Status Lifecycle
  const statusCounts = findings.reduce((acc: Record<string, number>, finding) => {
    const statusKey = finding.followUpStatus || followUpStatuses[0]?.name || 'Pending';
    acc[statusKey] = (acc[statusKey] || 0) + 1;
    return acc;
  }, {});

  const followUpStatusNames = followUpStatuses.length > 0
    ? followUpStatuses.map((item) => item.name)
    : ['Pending', 'Rectified', 'Partially Rectified', 'Refereed', 'Action Plan'];

  const fallbackColors = ['#94a3b8', '#16a34a', '#f59e0b', '#2563eb', '#7c3aed', '#0f766e', '#b45309'];

  const statusData = followUpStatusNames.map((status, index) => {
    const count = statusCounts[status] || 0;
    return {
      name: status,
      count,
      percentage: totalFindings > 0 ? Math.round((count / totalFindings) * 100) : 0,
      fill: STATUS_COLORS[status] || fallbackColors[index % fallbackColors.length],
    };
  });

  const riskData = [
    { name: 'High', count: findings.filter((f) => f.riskLevel === 'High').length, fill: 'hsl(var(--destructive))' },
    { name: 'Medium', count: findings.filter((f) => f.riskLevel === 'Medium').length, fill: 'hsl(var(--accent))' },
    { name: 'Low', count: findings.filter((f) => f.riskLevel === 'Low').length, fill: 'hsl(var(--primary))' },
  ];

  // Filter and Aggregate Special Audit Data
  const filteredSpecialAudits = useMemo(() => {
    if (selectedPeriod === 'all') return specialAudits;
    
    const today = new Date();
    let start;
    if (selectedPeriod === '1m') start = subMonths(today, 1);
    else if (selectedPeriod === '3m') start = subMonths(today, 3);
    else if (selectedPeriod === '6m') start = subMonths(today, 6);
    else if (selectedPeriod === '1y') start = subMonths(today, 12);
    else return specialAudits;

    return specialAudits.filter(audit => 
      isWithinInterval(new Date(audit.dateCreated), { start, end: today })
    );
  }, [specialAudits, selectedPeriod]);

  const monetaryData = useMemo(() => {
    const groups: Record<string, { involved: number, recovered: number, pending: number, sortKey: string }> = {};

    filteredSpecialAudits.forEach(audit => {
      const date = new Date(audit.dateCreated);
      let key = '';
      let sortKey = '';
      
      if (selectedPeriod === '1m' || selectedPeriod === 'all') {
        // Group by Month
        key = format(startOfMonth(date), 'MMM yyyy');
        sortKey = format(startOfMonth(date), 'yyyy-MM');
      } else if (selectedPeriod === '3m' || selectedPeriod === '6m') {
        // Group by Quarter
        const q = getQuarter(date);
        key = `Q${q} ${format(date, 'yyyy')}`;
        sortKey = `${format(date, 'yyyy')}-Q${q}`;
      } else if (selectedPeriod === '1y') {
        // Group by Year
        key = format(startOfYear(date), 'yyyy');
        sortKey = format(startOfYear(date), 'yyyy');
      }

      if (!groups[key]) {
        groups[key] = { involved: 0, recovered: 0, pending: 0, sortKey };
      }
      groups[key].involved += audit.amountInvolved;
      groups[key].recovered += audit.recovered;
      groups[key].pending += audit.pending;
    });

    return Object.entries(groups)
      .map(([name, data]) => ({
        name,
        ...data
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [filteredSpecialAudits, selectedPeriod]);

  // Special Audit Category Pie Chart Data
  const specialCategoryCounts = filteredSpecialAudits.reduce((acc: Record<string, number>, audit) => {
    const cat = audit.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const specialCategoryData = Object.entries(specialCategoryCounts).map(([name, count], index) => ({
    name,
    count,
    percentage: specialAudits.length > 0 ? Math.round((count / specialAudits.length) * 100) : 0,
    fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  })).sort((a, b) => b.count - a.count);

  const config = {
    count: { label: 'Findings', color: 'hsl(var(--primary))' },
    involved: { label: 'Involved (ETB)', color: 'hsl(var(--primary))' },
    recovered: { label: 'Recovered (ETB)', color: 'hsl(var(--accent))' },
    pending: { label: 'Pending (ETB)', color: 'hsl(var(--destructive))' },
  } satisfies ChartConfig;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="shadow-sm border-none bg-card/50 overflow-hidden">
        <CardHeader className="pb-2 border-b bg-muted/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold uppercase tracking-tight">Findings per Category</CardTitle>
              <CardDescription>Dynamic mapping from official hierarchy missions.</CardDescription>
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
                  className="outline-none"
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
                        <li key={index} className="flex items-center gap-2 group">
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

      <Card className="shadow-sm border-none bg-card/50 overflow-hidden">
        <CardHeader className="pb-2 border-b bg-muted/10">
          <CardTitle className="text-lg font-bold uppercase tracking-tight">Findings Status Overview</CardTitle>
          <CardDescription>Remediation lifecycle distribution (Live Database).</CardDescription>
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

      <Card className="shadow-sm border-none bg-card/50">
        <CardHeader className="pb-2 border-b bg-muted/10">
          <CardTitle className="text-lg font-bold uppercase tracking-tight">Severity Distribution</CardTitle>
          <CardDescription>Categorized by mission risk level.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ChartContainer config={config} className="h-[300px] w-full">
            <BarChart data={riskData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} />
              <YAxis tickLine={false} axisLine={false} fontSize={10} />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-none bg-card/50 overflow-hidden">
        <CardHeader className="pb-2 border-b bg-muted/10">
          <CardTitle className="text-lg font-bold uppercase tracking-tight">Special Audit Classification</CardTitle>
          <CardDescription>Distribution by Special Finding Category.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[350px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={specialCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {specialCategoryData.map((entry, index) => (
                    <Cell key={`cell-special-${index}`} fill={entry.fill} />
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
                            {data.percentage}% ({data.count} of {specialAudits.length})
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
                        <li key={index} className="flex items-center gap-2 group">
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

      <Card className="shadow-sm border-none bg-card/50">
        <CardHeader className="pb-2 border-b bg-muted/10">
          <CardTitle className="text-lg font-bold uppercase tracking-tight">Special Audit Monetary Reconciliation</CardTitle>
          <CardDescription>Analysis of involved vs recovered funds (ETB).</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ChartContainer config={config} className="h-[300px] w-full">
            <BarChart data={monetaryData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} />
              <YAxis fontSize={10} tickFormatter={(value) => `ETB ${value/1000}k`} />
              <Tooltip content={<ChartTooltipContent />} />
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
