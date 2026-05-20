/**
 * Granular permission model.
 *
 * NOTE: Roles store these string keys in `Role.permissions` (Postgres `TEXT[]`).
 */
export const PERMISSION_DEFINITIONS = [
  // Core Actions (sidebar)
  {
    key: 'dashboard_access',
    label: 'Dashboard',
    description: 'Main operational overview and KPIs.',
    group: 'Core Actions',
  },
  {
    key: 'auditee_view_access',
    label: 'Auditee View',
    description: 'Specialized view for auditees to respond to findings.',
    group: 'Core Actions',
  },
  {
    key: 'auditee_view_edit_finding',
    label: 'Edit Finding',
    description: 'Edit existing audit finding details.',
    group: 'Core Actions → Auditee View',
  },
  {
    key: 'auditee_view_follow_up',
    label: 'Follow Up',
    description: 'Access follow-up management for findings.',
    group: 'Core Actions → Auditee View',
  },
  {
    key: 'auditee_view_auditee_response',
    label: 'Auditee Response',
    description: 'Submit or view auditee responses to findings.',
    group: 'Core Actions → Auditee View',
  },
  {
    key: 'auditee_view_add_progress',
    label: 'Add Progress',
    description: 'Add progress updates to findings.',
    group: 'Core Actions → Auditee View',
  },
  {
    key: 'auditee_view_change_status',
    label: 'Change Status',
    description: 'Modify finding workflow status.',
    group: 'Core Actions → Auditee View',
  },
  {
    key: 'auditee_view_delete_finding',
    label: 'Delete',
    description: 'Remove audit findings from the system.',
    group: 'Core Actions → Auditee View',
  },
  {
    key: 'findings_new_access',
    label: 'Log New Finding',
    description: 'Create a new audit finding record.',
    group: 'Core Actions',
  },
  {
    key: 'special_audits_new_access',
    label: 'Log Special Audit',
    description: 'Initiate a special audit investigation.',
    group: 'Core Actions',
  },

  // Administration (sidebar)
  {
    key: 'users_manage_access',
    label: 'User Management',
    description: 'Manage system users and their profiles.',
    group: 'Administration',
  },
  {
    key: 'roles_manage_access',
    label: 'Role Management',
    description: 'Configure roles and system permissions.',
    group: 'Administration',
  },
  {
    key: 'register_user_access',
    label: 'Register User',
    description: 'Onboard new system users.',
    group: 'Administration',
  },
  {
    key: 'special_onboarding_access',
    label: 'Special Onboarding',
    description: 'Configure executive level access.',
    group: 'Administration',
  },

  // Audit Reports Hub (sub-features under /reports)
  {
    key: 'reports_consolidated_access',
    label: 'Consolidated Activity Report',
    description: 'Hierarchical master report grouping all findings by organization structure.',
    group: 'Audit Reports Hub',
  },
  {
    key: 'reports_frequency_access',
    label: 'Findings Frequency Analysis',
    description: 'Detailed breakdown of irregularities across branches with prevalence metrics.',
    group: 'Audit Reports Hub',
  },
  {
    key: 'reports_assignments_access',
    label: 'Audit Assignments',
    description: 'Track official roles, team structures, and KPI performance across audit cycles.',
    group: 'Audit Reports Hub',
  },
  {
    key: 'reports_communications_access',
    label: 'Audit Communications',
    description: 'Track responses and rectification agreements across organizational levels.',
    group: 'Audit Reports Hub',
  },
  {
    key: 'reports_special_audits_access',
    label: 'Special Audit Reports',
    description: 'Review specialized audit missions including monetary reconciliation and discipline actions.',
    group: 'Audit Reports Hub',
  },

  // System Settings (sub-features under /settings)
  {
    key: 'settings_audit_structure_access',
    label: 'Audit Structure',
    description: 'Predefine audit case numbers and hierarchical titles for logging.',
    group: 'System Settings',
  },
  {
    key: 'settings_branches_access',
    label: 'Branch Registration',
    description: 'Add and manage bank branch information.',
    group: 'System Settings',
  },
  {
    key: 'settings_districts_access',
    label: 'District Management',
    description: 'Define and organize organizational districts.',
    group: 'System Settings',
  },
  {
    key: 'settings_departments_access',
    label: 'Department Setup',
    description: 'Manage departments subject to internal audit units.',
    group: 'System Settings',
  },
  {
    key: 'settings_risk_levels_access',
    label: 'Risk Level Configuration',
    description: 'Define risk severity scales used across findings.',
    group: 'System Settings',
  },
  {
    key: 'settings_statuses_access',
    label: 'Workflow Statuses',
    description: 'Manage finding lifecycle stages (Open -> Mitigated -> Closed, etc.).',
    group: 'System Settings',
  },
  {
    key: 'settings_follow_up_statuses_access',
    label: 'Follow-up Lifecycle Status',
    description: 'Manage lifecycle stages used in audit follow-up management.',
    group: 'System Settings',
  },
  {
    key: 'settings_special_finding_categories_access',
    label: 'Special Finding Categories',
    description: 'Manage classification categories for special audit reports.',
    group: 'System Settings',
  },
] as const;

export type PermissionKey = (typeof PERMISSION_DEFINITIONS)[number]['key'];

export const ALL_PERMISSIONS: PermissionKey[] = PERMISSION_DEFINITIONS.map(
  (p) => p.key
) as PermissionKey[];

const PERMISSION_META_BY_KEY = Object.fromEntries(
  PERMISSION_DEFINITIONS.map((p) => [p.key, p])
) as Record<PermissionKey, (typeof PERMISSION_DEFINITIONS)[number]>;

export function getPermissionLabel(key: PermissionKey): string {
  return PERMISSION_META_BY_KEY[key]?.label ?? key;
}

export function isAdminRole(role?: string | null): boolean {
  return typeof role === 'string' && role.toLowerCase() === 'admin';
}

// Backwards compatibility for legacy roles stored with:
// - audit_read, audit_write, reports_read, settings_manage
const LEGACY_PERMISSION_MAP: Record<string, PermissionKey[]> = {
  audit_read: ['dashboard_access', 'auditee_view_access'],
  audit_write: ['findings_new_access', 'special_audits_new_access'],
  reports_read: [
    'reports_consolidated_access',
    'reports_frequency_access',
    'reports_assignments_access',
    'reports_communications_access',
    'reports_special_audits_access',
  ],
  settings_manage: [
    // Administration pages
    'users_manage_access',
    'roles_manage_access',
    'register_user_access',
    'special_onboarding_access',
    // Settings sub-pages
    'settings_audit_structure_access',
    'settings_branches_access',
    'settings_districts_access',
    'settings_departments_access',
    'settings_risk_levels_access',
    'settings_statuses_access',
    'settings_follow_up_statuses_access',
    'settings_special_finding_categories_access',
  ],
};

export function normalizePermissions(permissions: string[] = []): PermissionKey[] {
  const out = new Set<PermissionKey>();

  const validKeys = new Set<PermissionKey>(ALL_PERMISSIONS);
  for (const p of permissions) {
    if (validKeys.has(p as PermissionKey)) out.add(p as PermissionKey);

    const legacy = LEGACY_PERMISSION_MAP[p];
    if (legacy) legacy.forEach((k) => out.add(k));
  }

  return Array.from(out);
}

export function withAdminPermissions(
  role?: string | null,
  permissions: string[] = []
): PermissionKey[] {
  if (!isAdminRole(role)) {
    return normalizePermissions(permissions);
  }

  // Admin always has every permission (and remains resilient to legacy role values).
  return Array.from(new Set([...ALL_PERMISSIONS]));
}

export const AUDIT_REPORTS_HUB_PERMISSIONS: PermissionKey[] = [
  'reports_consolidated_access',
  'reports_frequency_access',
  'reports_assignments_access',
  'reports_communications_access',
  'reports_special_audits_access',
];

export const SYSTEM_SETTINGS_PERMISSIONS: PermissionKey[] = [
  'settings_audit_structure_access',
  'settings_branches_access',
  'settings_districts_access',
  'settings_departments_access',
  'settings_risk_levels_access',
  'settings_statuses_access',
  'settings_follow_up_statuses_access',
  'settings_special_finding_categories_access',
];
