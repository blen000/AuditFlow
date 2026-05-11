'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
} from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import {
  AUDIT_REPORTS_HUB_PERMISSIONS,
  SYSTEM_SETTINGS_PERMISSIONS,
  isAdminRole,
  type PermissionKey,
  withAdminPermissions,
} from '@/lib/permissions';

function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, permissions, isLoading, setUserPermissions, setIsAuthenticated } = useAuth();

  useEffect(() => {
    // Check authentication state from localStorage for UI consistency only.
    // Routing is handled by Middleware and Server Actions.
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    const userJson = localStorage.getItem('currentUser');
    const parsedUser = userJson ? JSON.parse(userJson) : null;

    setIsAuthenticated(authStatus);
    if (parsedUser) {
      setUserPermissions(withAdminPermissions(parsedUser.role, parsedUser.permissions || []));
    }
  }, [pathname, setIsAuthenticated, setUserPermissions]);

  const isLoginPage = pathname === '/login';
  const showShell = !isLoginPage; // Always show shell unless it's login page

  if (isLoading && pathname !== '/login') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      {showShell && (
        <Sidebar>
          <SidebarHeader>
            <Button variant="ghost" className="h-fit w-full justify-start p-0 hover:bg-transparent">
              <Link href="/dashboard" className="flex items-center gap-3 p-2 group">
                <img src="/nib-logo.png" alt="Nib logo" className="h-7 w-7 object-contain transition-colors group-hover:opacity-90" />
                <span className="text-2xl font-bold tracking-tight text-accent transition-colors group-hover:text-accent/80">
                  Nib Audit
                </span>
              </Link>
            </Button>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav permissions={permissions} role={user?.role} />
          </SidebarContent>
        </Sidebar>
      )}
      <SidebarInset className={cn(!showShell && "m-0 ml-0 p-0 shadow-none border-none bg-transparent")}>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <title>Nib Audit </title>
          <meta name="description" content="Secure Internal Audit Platform" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body
          className={cn('font-body antialiased', 'min-h-screen bg-background')}
          suppressHydrationWarning
        >
          <LayoutContent>{children}</LayoutContent>
          <Toaster />
        </body>
      </html>
    </AuthProvider>
  );
}
