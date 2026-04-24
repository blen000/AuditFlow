export type SidebarGroup = 'core' | 'administration';

export interface SidebarItem {
  id: string;
  label: string;
  group: SidebarGroup;
  description: string;
}

export const sidebarMenuGroups: Record<SidebarGroup, string> = {
  core: 'Core Actions',
  administration: 'Administration',
};

export const sidebarMenuItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', group: 'core', description: 'Overview of audit metrics and activity.' },
  { id: 'auditee-view', label: 'Auditee View', group: 'core', description: 'Mission oversight and finding management.' },
  { id: 'findings-new', label: 'Log New Finding', group: 'core', description: 'Record standard audit observations.' },
  { id: 'special-audits-new', label: 'Log Special Audit', group: 'core', description: 'Record specialized missions and monetary reconciliation.' },
  { id: 'reports', label: 'Audit Reports Hub', group: 'core', description: 'Access to all consolidated and analysis reports.' },
  { id: 'users', label: 'User Management', group: 'administration', description: 'Manage system users and access.' },
  { id: 'roles', label: 'Role Management', group: 'administration', description: 'Configure roles and permissions.' },
  { id: 'register', label: 'Register User', group: 'administration', description: 'Onboard new personnel.' },
  { id: 'special-onboarding', label: 'Special Onboarding', group: 'administration', description: 'Executive account provisioning.' },
  { id: 'settings', label: 'System Settings', group: 'administration', description: 'Configure organizational structure and taxonomy.' },
];
