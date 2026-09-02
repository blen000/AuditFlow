'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
} from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import {
  AUDIT_REPORTS_HUB_PERMISSIONS,
  AUDITEE_VIEW_PAGE_PERMISSIONS,
  SYSTEM_SETTINGS_PERMISSIONS,
  isAdminRole,
  type PermissionKey,
  withAdminPermissions,
} from '@/lib/permissions';
import { cn } from '@/lib/utils';

// Pages that render outside the authenticated app shell and must never trigger
// the "redirect to /login" guard (they are their own entry points).
const PUBLIC_PAGES = ['/login', '/forgot-password', '/reset-password'];

function isPublicPage(pathname: string): boolean {
  return PUBLIC_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function getFirstAllowedPathForUser(role: string | undefined, rawPermissions: string[] | undefined) {
  const effectivePermissions = withAdminPermissions(role, rawPermissions || []);
  if (effectivePermissions.includes('dashboard_access')) return '/dashboard';
  if (AUDITEE_VIEW_PAGE_PERMISSIONS.some((p) => effectivePermissions.includes(p))) return '/auditee-view';
  if (AUDIT_REPORTS_HUB_PERMISSIONS.some((p) => effectivePermissions.includes(p))) return '/reports';
  if (effectivePermissions.includes('findings_new_access')) return '/findings/new';
  if (effectivePermissions.includes('special_audits_new_access')) return '/special-audits/new';
  if (effectivePermissions.includes('users_manage_access')) return '/users';
  if (effectivePermissions.includes('roles_manage_access')) return '/roles';
  if (effectivePermissions.includes('register_user_access')) return '/register';
  if (effectivePermissions.includes('special_onboarding_access')) return '/special-onboarding';
  if (SYSTEM_SETTINGS_PERMISSIONS.some((p) => effectivePermissions.includes(p))) return '/settings';
  return '/dashboard';
}

function getRequiredPermissionsForPath(pathname: string): PermissionKey[] {
  if (pathname === '/dashboard') return ['dashboard_access'];
  if (pathname.startsWith('/auditee-view')) return [...AUDITEE_VIEW_PAGE_PERMISSIONS];
  if (pathname.startsWith('/findings/edit')) return ['auditee_view_edit_finding', 'findings_new_access'];
  if (pathname.startsWith('/findings/respond')) return ['auditee_view_auditee_response'];
  if (pathname.startsWith('/findings/new')) return ['findings_new_access'];
  if (pathname.startsWith('/special-audits/new')) return ['special_audits_new_access'];

  if (pathname.startsWith('/reports/consolidated')) return ['reports_consolidated_access'];
  if (pathname.startsWith('/reports/frequency')) return ['reports_frequency_access'];
  if (pathname.startsWith('/assignments')) return ['reports_assignments_access'];
  if (pathname.startsWith('/communications')) return ['reports_communications_access'];
  if (pathname.startsWith('/special-audits')) return ['reports_special_audits_access'];
  if (pathname === '/reports') return AUDIT_REPORTS_HUB_PERMISSIONS;

  if (pathname.startsWith('/users')) return ['users_manage_access'];
  if (pathname.startsWith('/roles')) return ['roles_manage_access'];
  if (pathname.startsWith('/register')) return ['register_user_access'];
  if (pathname.startsWith('/special-onboarding')) return ['special_onboarding_access'];

  if (pathname.startsWith('/settings/audit-structure')) return ['settings_audit_structure_access'];
  if (pathname.startsWith('/branches')) return ['settings_branches_access'];
  if (pathname.startsWith('/districts')) return ['settings_districts_access'];
  if (pathname.startsWith('/departments')) return ['settings_departments_access'];
  if (pathname.startsWith('/risk-levels')) return ['settings_risk_levels_access'];
  if (pathname.startsWith('/statuses')) return ['settings_statuses_access'];
  if (pathname.startsWith('/settings/follow-up-statuses')) return ['settings_follow_up_statuses_access'];
  if (pathname === '/settings') return SYSTEM_SETTINGS_PERMISSIONS;

  return [];
}

function checkUserPermission(
  pathname: string,
  userRole: string | undefined,
  userPermissions: string[] | undefined
): { isAllowed: boolean; requiredPermissions: PermissionKey[]; fallbackPath: string } {
  const effectivePermissions = withAdminPermissions(userRole, userPermissions || []);
  const requiredPermissions = getRequiredPermissionsForPath(pathname);
  const isAllowed =
    requiredPermissions.length === 0 ||
    isAdminRole(userRole) ||
    requiredPermissions.some((p) => effectivePermissions.includes(p));
  const fallbackPath = getFirstAllowedPathForUser(userRole, userPermissions);
  return { isAllowed, requiredPermissions, fallbackPath };
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, permissions, isLoading, isAuthenticated } = useAuth();
  const userRole = user?.role;
  const userPermissions = user?.permissions;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !isPublicPage(pathname)) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && pathname === '/login') {
      router.replace(getFirstAllowedPathForUser(userRole, userPermissions));
      return;
    }

    if (isAuthenticated && userRole) {
      const { isAllowed, requiredPermissions, fallbackPath } = checkUserPermission(
        pathname,
        userRole,
        userPermissions
      );

      if (!isAllowed) {
        console.warn('Unauthorized access attempt', { pathname, requiredPermissions });
        if (fallbackPath !== pathname) router.replace(fallbackPath);
      }
    }
  }, [pathname, router, isLoading, isAuthenticated, userRole, userPermissions]);

  const isAuthPage = isPublicPage(pathname);
  const showShell = !isAuthPage;

  if (isLoading && !isAuthPage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      {showShell && (
        <Sidebar className="sidebar-honeycomb-bg border-r border-sidebar-border">
          <SidebarHeader className="p-3">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <img src="/Logo.png" alt="Nib logo" className="h-7 w-7 object-contain transition-colors group-hover:opacity-90" />
              <span className="text-xl font-bold tracking-tight text-sidebar-foreground transition-colors group-hover:text-sidebar-foreground/90">
                Nib Audit
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav permissions={permissions} role={user?.role} />
          </SidebarContent>
        </Sidebar>
      )}
      <SidebarInset className={cn(!showShell && 'm-0 ml-0 p-0 shadow-none border-none bg-transparent')}>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
    </AuthProvider>
  );
}
