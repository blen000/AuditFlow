'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { LayoutDashboard, PlusCircle, Users, Settings, ClipboardList, UserRoundSearch, FileWarning } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <SidebarMenu>
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
      <SidebarGroup>
        <SidebarGroupLabel>Management</SidebarGroupLabel>
        <SidebarMenuItem>
          <Link href="/special-audits">
            <SidebarMenuButton
              isActive={pathname.startsWith('/special-audits')}
              tooltip="Special Audit"
            >
              <FileWarning />
              <span>Special Audit</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <Link href="/assignments">
            <SidebarMenuButton
              isActive={pathname.startsWith('/assignments')}
              tooltip="Audit Assignments"
            >
              <ClipboardList />
              <span>Audit Assignments</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <Link href="/auditors">
            <SidebarMenuButton
              isActive={pathname.startsWith('/auditors')}
              tooltip="Auditors"
            >
              <UserRoundSearch />
              <span>Auditors</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Views</SidebarGroupLabel>
        <SidebarMenuItem>
          <Link href="/auditee-view">
            <SidebarMenuButton
              isActive={pathname.startsWith('/auditee-view')}
              tooltip="Auditee View"
            >
              <Users />
              <span>Auditee View</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      </SidebarGroup>
      <SidebarGroup>
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