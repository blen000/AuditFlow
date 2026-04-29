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
    // Check authentication state from localStorage
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    const userJson = localStorage.getItem('currentUser');
    const parsedUser = userJson ? JSON.parse(userJson) : null;

    setIsAuthenticated(authStatus);
    if (parsedUser) {
      setUserPermissions(withAdminPermissions(parsedUser.role, parsedUser.permissions || []));
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
    if (authStatus && parsedUser) {
      const effectivePermissions = withAdminPermissions(parsedUser.role, parsedUser.permissions || []);

      const requiredPermissions: PermissionKey[] = (() => {
        // Core pages
        if (pathname === '/') return ['dashboard_access'];
        if (pathname.startsWith('/auditee-view')) return ['auditee_view_access'];
        if (pathname.startsWith('/findings/new')) return ['findings_new_access'];
        if (pathname.startsWith('/special-audits/new')) return ['special_audits_new_access'];

        // Reports hub containers + sub-features
        if (pathname.startsWith('/reports/consolidated')) return ['reports_consolidated_access'];
        if (pathname.startsWith('/reports/frequency')) return ['reports_frequency_access'];
        if (pathname.startsWith('/assignments')) return ['reports_assignments_access'];
        if (pathname.startsWith('/communications')) return ['reports_communications_access'];
        if (pathname.startsWith('/special-audits')) return ['reports_special_audits_access']; // must be AFTER '/special-audits/new'
        if (pathname === '/reports') return AUDIT_REPORTS_HUB_PERMISSIONS;

        // Administration pages
        if (pathname.startsWith('/users')) return ['users_manage_access'];
        if (pathname.startsWith('/roles')) return ['roles_manage_access'];
        if (pathname.startsWith('/register')) return ['register_user_access'];
        if (pathname.startsWith('/special-onboarding')) return ['special_onboarding_access'];

        // System settings container + sub-features
        if (pathname.startsWith('/settings/audit-structure')) return ['settings_audit_structure_access'];
        if (pathname.startsWith('/branches')) return ['settings_branches_access'];
        if (pathname.startsWith('/districts')) return ['settings_districts_access'];
        if (pathname.startsWith('/departments')) return ['settings_departments_access'];
        if (pathname.startsWith('/risk-levels')) return ['settings_risk_levels_access'];
        if (pathname.startsWith('/statuses')) return ['settings_statuses_access'];
        if (pathname === '/settings') return SYSTEM_SETTINGS_PERMISSIONS;

        return [];
      })();

      const isAllowed =
        requiredPermissions.length === 0 ||
        isAdminRole(parsedUser.role) ||
        requiredPermissions.some((p) => effectivePermissions.includes(p));

      if (!isAllowed) {
        const getFallbackPath = () => {
          if (effectivePermissions.includes('dashboard_access')) return '/';
          if (effectivePermissions.includes('auditee_view_access')) return '/auditee-view';
          if (AUDIT_REPORTS_HUB_PERMISSIONS.some((p) => effectivePermissions.includes(p))) return '/reports';
          if (effectivePermissions.includes('findings_new_access')) return '/findings/new';
          if (effectivePermissions.includes('special_audits_new_access')) return '/special-audits/new';
          if (effectivePermissions.includes('users_manage_access')) return '/users';
          if (effectivePermissions.includes('roles_manage_access')) return '/roles';
          if (effectivePermissions.includes('register_user_access')) return '/register';
          if (effectivePermissions.includes('special_onboarding_access')) return '/special-onboarding';
          if (SYSTEM_SETTINGS_PERMISSIONS.some((p) => effectivePermissions.includes(p))) return '/settings';
          return '/';
        };

        console.warn(
          `Unauthorized access attempt to ${pathname}. Required one of: ${requiredPermissions.join(', ')}`
        );
        const fallbackPath = getFallbackPath();
        if (fallbackPath !== pathname) router.push(fallbackPath);
      }
    } else if (authStatus === false && pathname !== '/login') {
      router.push('/login');
    }
  }, [pathname, router, setIsAuthenticated, setUserPermissions]);

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
