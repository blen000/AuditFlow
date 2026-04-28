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

function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, permissions, isAuthenticated, isLoading, setUserPermissions, setIsAuthenticated } = useAuth();

  useEffect(() => {
    // Check authentication state from localStorage
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    const userJson = localStorage.getItem('currentUser');
    const parsedUser = userJson ? JSON.parse(userJson) : null;

    setIsAuthenticated(authStatus);
    if (parsedUser) {
      setUserPermissions(parsedUser.permissions || []);
    }

    // Redirect to login if not authenticated and trying to access protected pages
    if (!authStatus && pathname !== '/login') {
      router.push('/login');
      return;
    }
    
    // Redirect to home if authenticated and trying to access login page
    if (authStatus && pathname === '/login') {
      router.push('/');
      return;
    }

    // Role-Based Route Guard
    if (authStatus && user) {
      const permissions = user.permissions || [];
      
      // Define restricted paths and their required permissions
      const restrictions: Record<string, string> = {
        '/findings/new': 'audit_write',
        '/special-audits/new': 'audit_write',
        '/reports': 'reports_read',
        '/assignments': 'reports_read',
        '/communications': 'reports_read',
        '/users': 'settings_manage',
        '/roles': 'settings_manage',
        '/register': 'settings_manage',
        '/special-onboarding': 'settings_manage',
        '/settings': 'settings_manage',
        '/branches': 'settings_manage',
        '/districts': 'settings_manage',
        '/departments': 'settings_manage',
        '/risk-levels': 'settings_manage',
        '/statuses': 'settings_manage'
      };

      const requiredPermission = Object.entries(restrictions).find(([route]) => 
        pathname.startsWith(route)
      )?.[1];

      if (requiredPermission && !user.permissions?.includes(requiredPermission)) {
        console.warn(`Unauthorized access attempt to ${pathname}. Required: ${requiredPermission}`);
        router.push('/');
      }
    } else if (authStatus === false && pathname !== '/login') {
      router.push('/login');
    }
  }, [pathname, router, isAuthenticated, isLoading, user, permissions]);

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
              <Link href="/" className="flex items-center gap-3 p-2 group">
                <ShieldCheck className="h-7 w-7 text-accent transition-colors group-hover:text-accent/80" />
                <span className="text-2xl font-bold tracking-tight text-accent transition-colors group-hover:text-accent/80">
                  Nib Audit
                </span>
              </Link>
            </Button>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav permissions={permissions} />
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
          <title>Nib Audit | AuditFlow</title>
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
