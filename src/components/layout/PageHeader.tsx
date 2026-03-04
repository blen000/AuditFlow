'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationBell } from './NotificationBell';

type PageHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export default function PageHeader({
  title,
  description,
  children,
}: PageHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm md:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
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
