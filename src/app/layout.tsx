
'use client';

import { useEffect, useState } from 'react';
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  useEffect(() => {
    // Check authentication state from localStorage
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    const userJson = localStorage.getItem('currentUser');
    const user = userJson ? JSON.parse(userJson) : null;
    
    setIsAuthenticated(authStatus);
    if (user) {
      setUserPermissions(user.permissions || []);
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
        '/users': 'settings_manage',
        '/roles': 'settings_manage',
        '/register': 'settings_manage',
        '/special-onboarding': 'settings_manage',
        '/settings': 'settings_manage',
        '/reports': 'reports_read',
      };

      // Check if current path matches any restricted patterns
      for (const [path, permission] of Object.entries(restrictions)) {
        if (pathname.startsWith(path) && !permissions.includes(permission)) {
          console.warn(`Unauthorized access attempt to ${path} by user ${user.email}`);
          router.push('/');
          return;
        }
      }
    }
  }, [pathname, router]);

  const isLoginPage = pathname === '/login';
  const showShell = isAuthenticated && !isLoginPage;

  if (isAuthenticated === null) {
    return (
      <html lang="en">
        <body className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </body>
      </html>
    );
  }

  return (
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
                <SidebarNav permissions={userPermissions} />
              </SidebarContent>
            </Sidebar>
          )}
          <SidebarInset className={cn(!showShell && "m-0 ml-0 p-0 shadow-none border-none bg-transparent")}>
            {children}
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
