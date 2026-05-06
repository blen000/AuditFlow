'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationBell } from './NotificationBell';
import { UserNav } from './UserNav';
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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm md:px-6">
      <div className="flex items-center gap-4 overflow-hidden">
        <SidebarTrigger />
        {backHref && (
          <Button variant="ghost" size="icon" asChild className="h-9 w-9 shrink-0">
            <Link href={backHref}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        )}
        <div className="flex flex-col truncate">
          <h1 className="truncate text-lg font-bold tracking-tight text-foreground md:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 md:gap-4">
        {children && <div className="hidden items-center gap-2 lg:flex">{children}</div>}
        <NotificationBell />
        <UserNav />
      </div>
    </header>
  );
}
