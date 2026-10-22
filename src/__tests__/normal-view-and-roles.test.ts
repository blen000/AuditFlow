const prismaMock: any = {
  auditFinding: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  auditHierarchyNode: { findMany: jest.fn() },
  branch: { findMany: jest.fn() },
  department: { findMany: jest.fn() },
  riskLevel: { findMany: jest.fn() },
  findingStatus: { findMany: jest.fn() },
};
const secureMock: any = { finding: { findMany: jest.fn() } };

jest.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
jest.mock('@/lib/securePrisma', () => ({ securePrisma: secureMock }));
jest.mock('@/lib/serverAuth');
jest.mock('@/lib/securityLogger', () => ({ logSecurityEvent: jest.fn() }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/app/actions/settings', () => ({ ensureFollowUpStatuses: jest.fn().mockResolvedValue([]) }));

import { getAuditeeViewData } from '@/app/actions/auditee-view';
import { respondToFinding, updateFinding } from '@/app/actions/findings';
import { getUserFromCookiesServer } from '@/lib/serverAuth';
import {
  ALL_PERMISSIONS,
  AUDITEE_VIEW_PAGE_PERMISSIONS,
  SYSTEM_SETTINGS_PERMISSIONS,
  AUDIT_REPORTS_HUB_PERMISSIONS,
  normalizePermissions,
  storedPermissionsFromSelection,
  withAdminPermissions,
} from '@/lib/permissions';
import { initialRoles } from '@/lib/mock-data';

const mockUser = getUserFromCookiesServer as jest.Mock;
const asRole = (permissions: string[], name = 'Custom', extra: object = {}) =>
  mockUser.mockResolvedValue({ id: 'u1', email: 'u@test.com', fullName: 'Test User', role: { name, permissions }, ...extra });

beforeEach(() => {
  jest.clearAllMocks();
  prismaMock.auditHierarchyNode.findMany.mockResolvedValue([]);
  prismaMock.branch.findMany.mockResolvedValue([]);
  prismaMock.department.findMany.mockResolvedValue([]);
  prismaMock.riskLevel.findMany.mockResolvedValue([]);
  prismaMock.findingStatus.findMany.mockResolvedValue([]);
  secureMock.finding.findMany.mockResolvedValue([]);
});

describe('Normal Auditee View data', () => {
  it('loads for roles with the normal view (including legacy parent / view-only / action-only roles)', async () => {
    for (const perms of [['auditee_view_normal'], ['auditee_view_access'], ['auditee_view_readonly'], ['auditee_view_follow_up']]) {
      asRole(perms);
      await expect(getAuditeeViewData()).resolves.toBeDefined();
    }
  });

  it('is denied to a special-only role, and to roles with no Auditee View permission', async () => {
    for (const perms of [['auditee_view_special'], ['auditee_view_special', 'auditee_view_follow_up'], ['reports_special_audits_access'], []]) {
      asRole(perms);
      await expect(getAuditeeViewData()).rejects.toThrow();
    }
    expect(secureMock.finding.findMany).not.toHaveBeenCalled();
  });
});

describe('updateFinding intents require the Normal Auditee View', () => {
  const denied = { success: false, error: 'You do not have permission to perform this action.' };
  beforeEach(() => {
    prismaMock.auditFinding.findFirst.mockResolvedValue({ id: 'F1', teamLeader: 'Someone Else' });
    prismaMock.auditFinding.update.mockResolvedValue({});
  });

  it.each([
    ['status', 'auditee_view_change_status', { status: 'Open' }],
    ['progress', 'auditee_view_add_progress', { progressUpdates: [] }],
    ['follow_up', 'auditee_view_follow_up', { followUpStatus: 'Rectified' }],
    ['edit', 'auditee_view_edit_finding', { title: 'x' }],
  ] as const)('%s: allowed with normal view + action, denied for a special-only role', async (intent, action, data) => {
    asRole(['auditee_view_normal', action]);
    expect((await updateFinding('F1', data, intent)).success).toBe(true);

    asRole(['auditee_view_special', action]); // the action alone must not reach normal findings
    expect(await updateFinding('F1', data, intent)).toEqual(denied);
  });

  it('keeps legacy roles working: action-only roles are normal-view roles', async () => {
    asRole(['auditee_view_follow_up']);
    expect((await updateFinding('F1', { followUpStatus: 'Rectified' }, 'follow_up')).success).toBe(true);
  });

  it('still lets findings loggers edit (findings_new_access) without the Auditee View', async () => {
    asRole(['findings_new_access']);
    expect((await updateFinding('F1', { title: 'x' }, 'edit')).success).toBe(true);
    expect(await updateFinding('F1', { status: 'Open' }, 'status')).toEqual(denied);
  });

  it('persists the follow-up status (what the generated reports display)', async () => {
    asRole(['auditee_view_normal', 'auditee_view_follow_up']);
    await updateFinding('F1', { followUpStatus: 'Partially Rectified' }, 'follow_up');
    expect(prismaMock.auditFinding.update.mock.calls[0][0].data.followUpStatus).toBe('Partially Rectified');
  });
});

describe('respondToFinding', () => {
  beforeEach(() => {
    prismaMock.auditFinding.findUnique.mockResolvedValue({ id: 'F1', auditorId: 'u1' });
    prismaMock.auditFinding.update.mockResolvedValue({});
  });
  const body = { agreement: 'Agreed', response: 'ok' };

  it('requires normal view + auditee response', async () => {
    asRole(['auditee_view_normal', 'auditee_view_auditee_response']);
    await expect(respondToFinding('F1', body)).resolves.toMatchObject({ success: true });
    asRole(['auditee_view_special', 'auditee_view_auditee_response']);
    await expect(respondToFinding('F1', body)).rejects.toThrow();
    asRole(['auditee_view_normal']);
    await expect(respondToFinding('F1', body)).rejects.toThrow();
  });
});

describe('Role Management save logic', () => {
  const PARENT = 'auditee_view_access';

  it('stores the parent key only when every grant is ticked', () => {
    const full = [PARENT, 'auditee_view_normal', 'auditee_view_edit_finding', 'auditee_view_follow_up', 'auditee_view_auditee_response', 'auditee_view_add_progress', 'auditee_view_change_status', 'auditee_view_delete_finding'];
    expect(storedPermissionsFromSelection(full)).toContain(PARENT);
    const minusDelete = full.filter((k) => k !== 'auditee_view_delete_finding');
    const stored = storedPermissionsFromSelection(minusDelete);
    expect(stored).not.toContain(PARENT);
    // ...so the unticked action does not come back after normalisation
    expect(normalizePermissions(stored)).not.toContain('auditee_view_delete_finding');
  });

  it('round-trips a special-only role without gaining the normal view', () => {
    const stored = storedPermissionsFromSelection(['dashboard_access', 'auditee_view_special', 'auditee_view_follow_up']);
    const eff = normalizePermissions(stored);
    expect(eff).toContain('auditee_view_special');
    expect(eff).not.toContain('auditee_view_normal');
  });

  it('round-trips a normal-only role without gaining the special view', () => {
    const eff = normalizePermissions(storedPermissionsFromSelection(['auditee_view_normal']));
    expect(eff).toContain('auditee_view_normal');
    expect(eff).not.toContain('auditee_view_special');
  });

  it('is idempotent: normalising twice changes nothing', () => {
    for (const r of initialRoles) {
      const once = normalizePermissions(r.permissions).sort();
      expect(normalizePermissions(once).sort()).toEqual(once);
    }
  });

  it('only exposes known permission keys, with separate keys for the two views', () => {
    expect(ALL_PERMISSIONS).toContain('auditee_view_normal');
    expect(ALL_PERMISSIONS).toContain('auditee_view_special');
    expect(new Set(ALL_PERMISSIONS).size).toBe(ALL_PERMISSIONS.length);
  });
});

describe('Role x page access matrix (default roles)', () => {
  const ROUTES: [string, readonly string[]][] = [
    ['dashboard', ['dashboard_access']],
    ['auditee-view page', AUDITEE_VIEW_PAGE_PERMISSIONS],
    ['normal view', ['auditee_view_normal']],
    ['special view', ['auditee_view_special']],
    ['special respond', ['auditee_view_special']],
    ['log finding', ['findings_new_access']],
    ['log special audit', ['special_audits_new_access']],
    ['special audit report', ['reports_special_audits_access', 'special_audits_new_access']],
    ['consolidated report', ['reports_consolidated_access']],
    ['users', ['users_manage_access']],
    ['roles', ['roles_manage_access']],
    ['settings', SYSTEM_SETTINGS_PERMISSIONS],
    ['reports hub', AUDIT_REPORTS_HUB_PERMISSIONS],
  ];
  const canOpen = (role: string, route: string) => {
    const r = initialRoles.find((x) => x.name === role)!;
    const eff = withAdminPermissions(r.name, r.permissions);
    return ROUTES.find(([n]) => n === route)![1].some((p) => eff.includes(p));
  };

  const expectations: Record<string, { open: string[]; closed: string[] }> = {
    Admin: { open: ROUTES.map(([n]) => n), closed: [] },
    'Chief Auditor': { open: ROUTES.map(([n]) => n), closed: [] },
    Auditor: {
      open: ['dashboard', 'auditee-view page', 'normal view', 'special view', 'special respond', 'log finding', 'log special audit', 'special audit report', 'consolidated report', 'reports hub'],
      closed: ['users', 'roles', 'settings'],
    },
    Auditee: {
      open: ['dashboard', 'auditee-view page', 'normal view'],
      closed: ['special view', 'special respond', 'special audit report', 'log finding', 'consolidated report', 'users', 'roles', 'settings', 'reports hub'],
    },
    Management: {
      open: ['dashboard', 'auditee-view page', 'normal view', 'special view', 'special audit report', 'consolidated report', 'reports hub'],
      closed: ['log finding', 'log special audit', 'users', 'roles', 'settings'],
    },
    CEO: {
      open: ['dashboard', 'auditee-view page', 'normal view', 'special view', 'special audit report', 'consolidated report'],
      closed: ['log finding', 'log special audit', 'users', 'roles', 'settings'],
    },
  };

  for (const [role, { open, closed }] of Object.entries(expectations)) {
    it(`${role}: opens its pages and is blocked from the rest`, () => {
      for (const route of open) expect([role, route, canOpen(role, route)]).toEqual([role, route, true]);
      for (const route of closed) expect([role, route, canOpen(role, route)]).toEqual([role, route, false]);
    });
  }
});
