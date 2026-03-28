'use client';

import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ClipboardList, 
  FileText,
  ArrowRight,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

const reportModules = [
  {
    title: 'Findings Frequency Analysis',
    description: 'Detailed breakdown of irregularities across branches, including case counts and organizational prevalence percentages.',
    icon: BarChart3,
    href: '/reports/frequency',
    buttonText: 'View Frequency Report'
  },
  {
    title: 'Audit Assignments',
    description: 'Track official roles, team structures, and KPI performance metrics for all active and completed audit cycles.',
    icon: ClipboardList,
    href: '/assignments',
    buttonText: 'View Assignments'
  },
  {
    title: 'Audit Communications',
    description: 'Track responses, interactions, and rectification agreements across Branches, Districts, Departments, and Executive Offices.',
    icon: MessageSquare,
    href: '/communications',
    buttonText: 'View Communications'
  },
  {
    title: 'Special Audit Reports',
    description: 'Review in-depth findings from specialized audit missions, including monetary reconciliations and disciplinary actions.',
    icon: FileText,
    href: '/special-audits',
    buttonText: 'View Special Reports'
  },
];

export default function ReportsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="Audit Reports Hub" 
        description="Analyze audit performance, tracking metrics, and specialized mission results." 
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reportModules.map((module) => (
              <Card key={module.href} className="flex flex-col h-full shadow-sm hover:shadow-md transition-all border-muted/40 group">
                <CardHeader className="pb-4">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <module.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg font-bold tracking-tight mb-1">{module.title}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <div className="flex-grow" />
                <CardFooter className="pt-4 border-t bg-muted/5">
                  <Button asChild variant="ghost" className="w-full justify-between hover:bg-primary hover:text-primary-foreground">
                    <Link href={module.href}>
                      {module.buttonText}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
