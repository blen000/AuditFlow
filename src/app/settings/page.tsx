'use client';

import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building, 
  MapPin, 
  Briefcase, 
  ShieldAlert, 
  Tags,
  ArrowRight,
  Layers
} from 'lucide-react';
import Link from 'next/link';

const settingsModules = [
  {
    title: 'Hierarchy & Titles',
    description: 'Predefine Audit Case Numbers, Main Mission Summaries, and Subsection Titles for hierarchical logging.',
    icon: Layers,
    href: '/settings/audit-structure',
    buttonText: 'Manage Structure'
  },
  {
    title: 'Branch Registration',
    description: 'Add and manage physical bank branch information. Configure locations and regional mapping.',
    icon: Building,
    href: '/branches',
    buttonText: 'Go to Branches'
  },
  {
    title: 'District Management',
    description: 'Define and organize organizational districts for regional oversight and reporting categorization.',
    icon: MapPin,
    href: '/districts',
    buttonText: 'Go to Districts'
  },
  {
    title: 'Department Setup',
    description: 'Manage headquarters and support departments subject to specialized internal audit units.',
    icon: Briefcase,
    href: '/departments',
    buttonText: 'Go to Departments'
  },
  {
    title: 'Risk Level Configuration',
    description: 'Define risk severity scales used across findings to prioritize mitigation efforts.',
    icon: ShieldAlert,
    href: '/risk-levels',
    buttonText: 'Go to Risk Levels'
  },
  {
    title: 'Workflow Statuses',
    description: 'Manage the lifecycle stages of findings from "Open" to "Mitigated" and "Closed".',
    icon: Tags,
    href: '/statuses',
    buttonText: 'Go to Statuses'
  },
];

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="Application Settings" 
        description="Centralized configuration and organizational management hub." 
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {settingsModules.map((module) => (
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
