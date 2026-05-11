'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Settings, 
  FileWarning, 
  FileText,
  Users,
  ShieldCheck,
  UserPlus,
  Star,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AUDIT_REPORTS_HUB_PERMISSIONS,
  SYSTEM_SETTINGS_PERMISSIONS,
  isAdminRole,
} from '@/lib/permissions';

type SidebarNavProps = {
  permissions?: string[];
  role?: string;
};

export function SidebarNav({ permissions = [], role = '' }: SidebarNavProps) {
  const pathname = usePathname();
  const hasPermission = (perm: string) =>
    isAdminRole(role) || permissions.includes(perm);
  const hasAnyPermission = (perms: string[]) =>
    isAdminRole(role) || perms.some((p) => permissions.includes(p));

  return (
    <div className="flex flex-col h-full justify-between pb-4">
      <div>
        <SidebarGroup>
          <SidebarGroupLabel>Core Actions</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              {hasPermission('dashboard_access') && (
                <Link href="/dashboard">
                  <SidebarMenuButton
                    isActive={pathname === '/dashboard'}
                    tooltip="Dashboard"
                  >
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </Link>
              )}
            </SidebarMenuItem>

            {hasPermission('auditee_view_access') && (
              <SidebarMenuItem>
                <Link href="/auditee-view">
                  <SidebarMenuButton
                    isActive={pathname === '/auditee-view'}
                    tooltip="Auditee View"
                  >
                    <Users />
                    <span>Auditee View</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )}
            
            {hasPermission('findings_new_access') && (
              <>
                <SidebarMenuItem>
                  <Link href="/findings/new">
                    <SidebarMenuButton
                      isActive={pathname.startsWith('/findings/new')}
                      tooltip="Log New Finding"
                    >
                      <PlusCircle />
                      <span>Log New Finding</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </>
            )}

            {hasPermission('special_audits_new_access') && (
              <SidebarMenuItem>
                <Link href="/special-audits/new">
                  <SidebarMenuButton
                    isActive={pathname === '/special-audits/new'}
                    tooltip="Log Special Audit"
                  >
                    <FileWarning />
                    <span>Log Special Audit</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )}

            {hasAnyPermission(AUDIT_REPORTS_HUB_PERMISSIONS) && (
              <SidebarMenuItem>
                <Link href="/reports">
                  <SidebarMenuButton
                    isActive={pathname.startsWith('/reports')}
                    tooltip="Audit Reports"
                  >
                    <FileText />
                    <span>Audit Reports Hub</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

        {hasAnyPermission([
          'users_manage_access',
          'roles_manage_access',
          'register_user_access',
          'special_onboarding_access',
          ...SYSTEM_SETTINGS_PERMISSIONS,
        ]) && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarMenu>
              {hasPermission('users_manage_access') && (
                <SidebarMenuItem>
                  <Link href="/users">
                    <SidebarMenuButton
                      isActive={pathname === '/users'}
                      tooltip="User Management"
                    >
                      <Users />
                      <span>User Management</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )}
              {hasPermission('roles_manage_access') && (
                <SidebarMenuItem>
                  <Link href="/roles">
                    <SidebarMenuButton
                      isActive={pathname === '/roles'}
                      tooltip="Role Management"
                    >
                      <ShieldCheck />
                      <span>Role Management</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )}
              {hasPermission('register_user_access') && (
                <SidebarMenuItem>
                  <Link href="/register">
                    <SidebarMenuButton
                      isActive={pathname === '/register'}
                      tooltip="Register User"
                    >
                      <UserPlus />
                      <span>Register User</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )}
              {hasPermission('special_onboarding_access') && (
                <SidebarMenuItem>
                  <Link href="/special-onboarding">
                    <SidebarMenuButton
                      isActive={pathname === '/special-onboarding'}
                      tooltip="Special Onboarding"
                    >
                      <Star className="text-amber-500" />
                      <span>Special Onboarding</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )}
              {hasAnyPermission(SYSTEM_SETTINGS_PERMISSIONS) && (
                <SidebarMenuItem>
                  <Link href="/settings">
                    <SidebarMenuButton
                      isActive={pathname === '/settings'}
                      tooltip="System Settings"
                    >
                      <Settings />
                      <span>System Settings</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )}
              {isAdminRole(role) && (
                <SidebarMenuItem>
                  <Link href="/admin/security-logs">
                    <SidebarMenuButton
                      isActive={pathname === '/admin/security-logs'}
                      tooltip="Security Logs"
                    >
                      <ShieldAlert />
                      <span>Security Logs</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Fallback/General Menus */}
        
      </div>

      {/* Logout removed - available in header profile menu */}
    </div>
  );
}
