'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationBell } from './NotificationBell';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type PageHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
  backHref?: string;
};

export default function PageHeader({
  title,
  description,
  children,
  backHref,
}: PageHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm md:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        {backHref && (
          <Button variant="ghost" size="icon" asChild className="h-9 w-9">
            <Link href={backHref}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {children && <div className="flex items-center gap-2">{children}</div>}
        <NotificationBell />
      </div>
    </header>
  );
}
