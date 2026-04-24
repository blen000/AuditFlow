'use client';

import { useEffect, useState } from 'react';
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
  Star
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SidebarNav() {
  const pathname = usePathname();
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    // Load permissions from localStorage on mount
    const stored = localStorage.getItem('userPermissions');
    if (stored) {
      try {
        setPermissions(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse user permissions');
      }
    }
  }, []);

  const hasPermission = (p: string) => permissions.includes(p);

  return (
    <SidebarMenu>
      <SidebarGroup>
        <SidebarGroupLabel>Core Actions</SidebarGroupLabel>
        
        {/* Dashboard is public for all logged in users */}
        <SidebarMenuItem>
          <Link href="/">
            <SidebarMenuButton
              isActive={pathname === '/'}
              tooltip="Dashboard"
            >
              <LayoutDashboard />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>

        {hasPermission('audit_read') && (
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
        
        {hasPermission('audit_write') && (
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
        )}

        {hasPermission('audit_write') && (
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

        {hasPermission('reports_read') && (
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
      </SidebarGroup>

      {hasPermission('settings_manage') && (
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
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
        </SidebarGroup>
      )}
    </SidebarMenu>
  );
}