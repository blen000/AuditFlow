'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Building, LayoutDashboard, PlusCircle, Users, ShieldAlert, Tags, Settings, ClipboardList, UserRoundSearch, Briefcase, UserRound, UserCog, ShieldCheck, FileWarning } from 'lucide-react';
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
          <Link href="/departments">
            <SidebarMenuButton
              isActive={pathname.startsWith('/departments')}
              tooltip="Departments"
            >
              <Briefcase />
              <span>Departments</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <Link href="/chiefs">
            <SidebarMenuButton
              isActive={pathname.startsWith('/chiefs')}
              tooltip="Chiefs"
            >
              <UserRound />
              <span>Chiefs</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <Link href="/ceos">
            <SidebarMenuButton
              isActive={pathname.startsWith('/ceos')}
              tooltip="CEOs"
            >
              <UserCog />
              <span>CEOs</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <Link href="/boards">
            <SidebarMenuButton
              isActive={pathname.startsWith('/boards')}
              tooltip="Boards"
            >
              <ShieldCheck />
              <span>Boards</span>
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
