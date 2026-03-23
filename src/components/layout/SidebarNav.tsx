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
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SidebarNav() {
  const pathname = usePathname();
  
  return (
    <SidebarMenu>
      <SidebarGroup>
        <SidebarGroupLabel>Core Actions</SidebarGroupLabel>
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
      </SidebarGroup>

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
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Reporting</SidebarGroupLabel>
        <SidebarMenuItem>
          <Link href="/reports">
            <SidebarMenuButton
              isActive={pathname.startsWith('/reports')}
              tooltip="Audit Reports"
            >
              <FileText />
              <span>Audit Reports</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      </SidebarGroup>

      <SidebarGroup className="mt-auto">
        <SidebarGroupLabel>System</SidebarGroupLabel>
        <SidebarMenuItem>
          <Link href="/settings">
            <SidebarMenuButton
              isActive={pathname.startsWith('/settings')}
              tooltip="Settings"
            >
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      </SidebarGroup>
    </SidebarMenu>
  );
}
