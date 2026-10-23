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
    label: 'Full access to the Normal Auditee View',
    description: 'Grants the Normal Auditee View and every normal-audit action below. Does not grant anything in the Special Auditee View.',
    group: 'Core Actions → Auditee View (Normal)',
    isParent: true,
  },
  {
    key: 'auditee_view_normal',
    label: 'Open Normal Auditee View',
    description: 'Open the Normal Auditee View and read findings from regular audits. Grants no actions on its own.',
    group: 'Core Actions → Auditee View (Normal)',
  },
  {
    key: 'auditee_view_edit_finding',
    label: 'Edit Finding',
    description: 'Edit existing audit finding details.',
    group: 'Core Actions → Auditee View (Normal)',
  },
  {
    key: 'auditee_view_follow_up',
    label: 'Follow Up',
    description: 'Access follow-up management for findings.',
    group: 'Core Actions → Auditee View (Normal)',
  },
  {
    key: 'auditee_view_auditee_response',
    label: 'Auditee Response',
    description: 'Submit or view auditee responses to findings.',
    group: 'Core Actions → Auditee View (Normal)',
  },
  {
    key: 'auditee_view_add_progress',
    label: 'Add Progress',
    description: 'Add progress updates to findings.',
    group: 'Core Actions → Auditee View (Normal)',
  },
  {
    key: 'auditee_view_change_status',
    label: 'Change Status',
    description: 'Modify finding workflow status.',
    group: 'Core Actions → Auditee View (Normal)',
  },
  {
    key: 'auditee_view_delete_finding',
    label: 'Delete',
    description: 'Remove audit findings from the system.',
    group: 'Core Actions → Auditee View (Normal)',
  },
  {
    key: 'auditee_view_special_access',
    label: 'Full access to the Special Auditee View',
    description: 'Grants the Special Auditee View and every special-audit action below. Does not grant anything in the Normal Auditee View.',
    group: 'Core Actions → Auditee View (Special)',
    isParent: true,
  },
  {
    key: 'auditee_view_special',
    label: 'Open Special Auditee View',
    description: 'Open the Special Auditee View (a tab inside Auditee View) and read special audit cases. Grants no actions on its own.',
    group: 'Core Actions → Auditee View (Special)',
  },
  {
    key: 'auditee_special_edit_finding',
    label: 'Edit Finding',
    description: 'Edit the details of existing special audit cases.',
    group: 'Core Actions → Auditee View (Special)',
  },
  {
    key: 'auditee_special_follow_up',
    label: 'Follow Up',
    description: 'Access follow-up management for special audit cases.',
    group: 'Core Actions → Auditee View (Special)',
  },
  {
    key: 'auditee_special_auditee_response',
    label: 'Auditee Response',
    description: 'Record the auditee response to special audit cases.',
    group: 'Core Actions → Auditee View (Special)',
  },
  {
    key: 'auditee_special_add_progress',
    label: 'Add Progress',
    description: 'Add progress updates to special audit cases.',
    group: 'Core Actions → Auditee View (Special)',
  },
  {
    key: 'auditee_special_change_status',
    label: 'Change Status',
    description: 'Modify the workflow status of special audit cases.',
    group: 'Core Actions → Auditee View (Special)',
  },
  {
    key: 'auditee_special_delete',
    label: 'Delete',
    description: 'Remove special audit cases from the system.',
    group: 'Core Actions → Auditee View (Special)',
  },
  {
    key: 'auditee_view_all_findings',
    label: 'View All Findings (Organization-wide)',
    description: 'See findings from every branch, department and district in Auditee View and the Dashboard. Without this, users only see findings for their own assigned unit and findings they logged, lead, or are assigned to.',
    group: 'Core Actions → Finding Visibility',
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
  const meta = PERMISSION_META_BY_KEY[key];
  if (!meta) return key;
  // Normal and Special Auditee View actions share labels ("Follow Up", "Delete", ...),
  // so say which view an action belongs to wherever it is listed on its own.
  const view = /Auditee View \((Normal|Special)\)/.exec(meta.group)?.[1];
  return view && !('isParent' in meta && meta.isParent) && meta.key !== 'auditee_view_normal' && meta.key !== 'auditee_view_special'
    ? `${meta.label} (${view})`
    : meta.label;
}

export function isAdminRole(role?: string | null): boolean {
  return typeof role === 'string' && role.toLowerCase() === 'admin';
}

// Child action permissions under the "Core Actions → Auditee View" group.
// The parent `auditee_view_access` toggle implies all of these. They apply to
// whichever Auditee View (normal or special) the role can open.
export const AUDITEE_VIEW_CHILD_PERMISSIONS: PermissionKey[] = [
  'auditee_view_edit_finding',
  'auditee_view_follow_up',
  'auditee_view_auditee_response',
  'auditee_view_add_progress',
  'auditee_view_change_status',
  'auditee_view_delete_finding',
];

export const NORMAL_AUDITEE_VIEW_PERMISSION: PermissionKey = 'auditee_view_normal';
export const SPECIAL_AUDITEE_VIEW_PERMISSION: PermissionKey = 'auditee_view_special';

// Special Auditee View actions. Separate keys from the normal ones, so a role can
// act on normal findings without acting on special audit cases, and vice versa.
export const SPECIAL_AUDITEE_VIEW_CHILD_PERMISSIONS: PermissionKey[] = [
  'auditee_special_edit_finding',
  'auditee_special_follow_up',
  'auditee_special_auditee_response',
  'auditee_special_add_progress',
  'auditee_special_change_status',
  'auditee_special_delete',
];

// Everything the parent `auditee_view_access` toggle grants. Deliberately excludes
// the Special Auditee View, which has its own parent toggle.
export const AUDITEE_VIEW_PARENT_GRANTS: PermissionKey[] = [
  NORMAL_AUDITEE_VIEW_PERMISSION,
  ...AUDITEE_VIEW_CHILD_PERMISSIONS,
];

// Everything the parent `auditee_view_special_access` toggle grants.
export const SPECIAL_AUDITEE_VIEW_PARENT_GRANTS: PermissionKey[] = [
  SPECIAL_AUDITEE_VIEW_PERMISSION,
  ...SPECIAL_AUDITEE_VIEW_CHILD_PERMISSIONS,
];

/** Parent toggle -> the permissions it grants, for the Role Management page. */
export const PARENT_PERMISSION_GRANTS: Record<string, PermissionKey[]> = {
  auditee_view_access: AUDITEE_VIEW_PARENT_GRANTS,
  auditee_view_special_access: SPECIAL_AUDITEE_VIEW_PARENT_GRANTS,
};

// Any of these (effective) keys is sufficient to OPEN the /auditee-view page.
// Which view the user lands in, and which data it may load, is decided per view.
export const AUDITEE_VIEW_PAGE_PERMISSIONS: PermissionKey[] = [
  NORMAL_AUDITEE_VIEW_PERMISSION,
  SPECIAL_AUDITEE_VIEW_PERMISSION,
];

// Backwards compatibility for legacy roles stored with:
// - audit_read, audit_write, reports_read, settings_manage
// - auditee_view_readonly (now `auditee_view_normal`)
const LEGACY_PERMISSION_MAP: Record<string, PermissionKey[]> = {
  auditee_view_readonly: ['auditee_view_normal'],
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

  // Parent implies the Normal Auditee View and every child action. This runs on
  // both the client (AuthContext) and the server (effectivePermissionsFor) so UI
  // and API stay in sync, and roles saved with only the parent key keep working.
  // The Special Auditee View is never implied by the parent.
  if (out.has('auditee_view_access')) {
    AUDITEE_VIEW_PARENT_GRANTS.forEach((k) => out.add(k));
  }
  // The Special Auditee View parent likewise grants its view and its own actions only.
  if (out.has('auditee_view_special_access')) {
    SPECIAL_AUDITEE_VIEW_PARENT_GRANTS.forEach((k) => out.add(k));
  }

  // Roles saved before the normal/special split hold child actions without either
  // view key; they could only ever open the (normal) Auditee View. Once a role
  // names a view explicitly that choice is respected as-is, so a role can be
  // special-only.
  const hasExplicitView = out.has(NORMAL_AUDITEE_VIEW_PERMISSION) || out.has(SPECIAL_AUDITEE_VIEW_PERMISSION);
  if (!hasExplicitView && AUDITEE_VIEW_CHILD_PERMISSIONS.some((k) => out.has(k))) {
    out.add(NORMAL_AUDITEE_VIEW_PERMISSION);
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

/**
 * Permissions to store for a role given what the admin ticked. A parent key implies
 * its whole group at runtime, so it is stored only when everything in that group is
 * ticked; otherwise it would silently re-grant whatever the admin unticked.
 */
export function storedPermissionsFromSelection(selected: string[]): string[] {
  return selected.filter((k) => {
    const grants = PARENT_PERMISSION_GRANTS[k];
    return !grants || grants.every((g) => selected.includes(g));
  });
}
