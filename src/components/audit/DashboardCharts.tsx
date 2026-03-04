
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
  ResponsiveContainer,
} from 'recharts';
import type { AuditFinding } from '@/types';

type DashboardChartsProps = {
  findings: AuditFinding[];
};

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

export function DashboardCharts({ findings }: DashboardChartsProps) {
  // Process data for Risk Level Bar Chart
  const riskData = [
    { name: 'High', count: findings.filter((f) => f.riskLevel === 'High').length, fill: 'hsl(var(--destructive))' },
    { name: 'Medium', count: findings.filter((f) => f.riskLevel === 'Medium').length, fill: 'hsl(var(--accent))' },
    { name: 'Low', count: findings.filter((f) => f.riskLevel === 'Low').length, fill: 'hsl(var(--chart-2))' },
  ];

  const riskConfig = {
    count: {
      label: 'Findings',
      color: 'hsl(var(--primary))',
    },
  } satisfies ChartConfig;

  // Process data for Status Pie Chart
  const statusCounts = findings.reduce((acc: Record<string, number>, finding) => {
    acc[finding.status] = (acc[finding.status] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(statusCounts).map(([name, value], index) => ({
    name,
    value,
    fill: COLORS[index % COLORS.length],
  }));

  const statusConfig = Object.keys(statusCounts).reduce((acc, key, index) => {
    acc[key] = {
      label: key,
      color: COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Findings by Risk Level</CardTitle>
          <CardDescription>Frequency of risks categorized by severity.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={riskConfig} className="h-[300px] w-full">
            <BarChart data={riskData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Findings by Status</CardTitle>
          <CardDescription>Current workflow distribution of all findings.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={statusConfig} className="h-[300px] w-full">
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
