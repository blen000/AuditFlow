'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Building, LayoutDashboard, PlusCircle, Users, ShieldAlert, Tags, Settings, ClipboardList } from 'lucide-react';
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
          <Link href="/branches">
            <SidebarMenuButton
              isActive={pathname.startsWith('/branches')}
              tooltip="Branches"
            >
              <Building />
              <span>Branches</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <Link href="/districts">
            <SidebarMenuButton
              isActive={pathname.startsWith('/districts')}
              tooltip="Districts"
            >
              <Building />
              <span>Districts</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <Link href="/risk-levels">
            <SidebarMenuButton
              isActive={pathname.startsWith('/risk-levels')}
              tooltip="Risk Levels"
            >
              <ShieldAlert />
              <span>Risk Levels</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <Link href="/statuses">
            <SidebarMenuButton
              isActive={pathname.startsWith('/statuses')}
              tooltip="Statuses"
            >
              <Tags />
              <span>Statuses</span>
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
