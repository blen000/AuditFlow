'use client';

import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building, 
  MapPin, 
  Briefcase, 
  UserRound, 
  UserCog, 
  ShieldCheck, 
  ShieldAlert, 
  Tags,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

const settingsModules = [
  {
    title: 'Branch Registration',
    description: 'Add and manage physical bank branch information. Configure locations and regional mapping for field audit missions.',
    icon: Building,
    href: '/branches',
    buttonText: 'Go to Branch Registration'
  },
  {
    title: 'District Management',
    description: 'Define and organize organizational districts. This data helps in categorizing branches and regional oversight reports.',
    icon: MapPin,
    href: '/districts',
    buttonText: 'Go to District Management'
  },
  {
    title: 'Department Setup',
    description: 'Manage headquarters and support departments. Configure internal units that are subject to specialized audits.',
    icon: Briefcase,
    href: '/departments',
    buttonText: 'Go to Department Setup'
  },
  {
    title: 'Chief Office Management',
    description: 'Register and manage organizational Chief positions. Assign executive oversight parameters for high-level reporting.',
    icon: UserRound,
    href: '/chiefs',
    buttonText: 'Go to Chief Management'
  },
  {
    title: 'CEO Office Registration',
    description: 'Manage high-level executive offices and leadership positions within the organizational hierarchy.',
    icon: UserCog,
    href: '/ceos',
    buttonText: 'Go to CEO Registration'
  },
  {
    title: 'Board & Committee Setup',
    description: 'Configure Board of Directors and specialized Audit Committees. Manage oversight bodies for audit finalization.',
    icon: ShieldCheck,
    href: '/boards',
    buttonText: 'Go to Board Management'
  },
  {
    title: 'Risk Level Configuration',
    description: 'Define risk severity scales used across findings. Customize levels like High, Medium, and Low for better prioritization.',
    icon: ShieldAlert,
    href: '/risk-levels',
    buttonText: 'Go to Risk Levels'
  },
  {
    title: 'Workflow Statuses',
    description: 'Manage the lifecycle stages of audit findings. Define statuses from "Open" to "Mitigated" and "Closed".',
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
        description="Manage organizational structure, parameters, and application configurations." 
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {settingsModules.map((module) => (
              <Card key={module.href} className="flex flex-col h-full shadow-sm hover:shadow-md transition-all border-muted/40">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold tracking-tight mb-2">{module.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <div className="flex-grow" />
                <CardFooter className="pt-4 border-t bg-muted/5">
                  <Button asChild className="w-full bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-bold gap-2 shadow-sm border-none">
                    <Link href={module.href}>
                      <ArrowRight className="h-4 w-4" />
                      {module.buttonText}
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