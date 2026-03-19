'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { LayoutDashboard, PlusCircle, Settings, FileWarning } from 'lucide-react';
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

      <SidebarMenuItem>
        <Link href="/special-audits">
          <SidebarMenuButton
            isActive={pathname.startsWith('/special-audits')}
            tooltip="Log Special Audit"
          >
            <FileWarning />
            <span>Log Special Audit</span>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>

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
