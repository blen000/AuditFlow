import { authorizeAction, getScopingFilter, AuthorizationError } from '../lib/authorization';
import { getUserFromCookiesServer } from '../lib/serverAuth';
import {
  normalizePermissions,
  withAdminPermissions,
  AUDITEE_VIEW_PAGE_PERMISSIONS,
} from '../lib/permissions';

jest.mock('../lib/serverAuth');
jest.mock('../lib/prisma', () => ({ prisma: {} }));

const mockUser = getUserFromCookiesServer as jest.Mock;
const asRole = (permissions: string[], name = 'Custom') =>
  mockUser.mockResolvedValue({ id: 'u1', email: 'u@test.com', role: { name, permissions } });

describe('Normal / Special Auditee View permissions', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('normalizePermissions', () => {
    it('does not grant the special view to the parent toggle', () => {
      const perms = normalizePermissions(['auditee_view_access']);
      expect(perms).toContain('auditee_view_normal');
      expect(perms).toContain('auditee_view_follow_up');
      expect(perms).not.toContain('auditee_view_special');
    });

    it('keeps legacy view-only roles working as the normal view', () => {
      const perms = normalizePermissions(['auditee_view_readonly']);
      expect(perms).toContain('auditee_view_normal');
      expect(perms).not.toContain('auditee_view_special');
    });

    it('treats legacy roles holding only child actions as normal-view roles', () => {
      expect(normalizePermissions(['auditee_view_follow_up'])).toContain('auditee_view_normal');
    });

    it('lets a role be special-only: child actions do not imply the normal view once a view is chosen', () => {
      const perms = normalizePermissions(['auditee_view_special', 'auditee_view_follow_up']);
      expect(perms).toContain('auditee_view_special');
      expect(perms).not.toContain('auditee_view_normal');
    });

    it('lets a role be normal-only', () => {
      const perms = normalizePermissions(['auditee_view_normal']);
      expect(perms).toContain('auditee_view_normal');
      expect(perms).not.toContain('auditee_view_special');
    });

    it('gives admins both views', () => {
      const perms = withAdminPermissions('Admin', []);
      expect(perms).toContain('auditee_view_normal');
      expect(perms).toContain('auditee_view_special');
    });

    it('does not make the special view a separate sidebar permission: the page opens for either view', () => {
      expect([...AUDITEE_VIEW_PAGE_PERMISSIONS].sort()).toEqual(['auditee_view_normal', 'auditee_view_special']);
    });
  });

  describe('server-side enforcement', () => {
    it('denies a special-only role the normal view permission', async () => {
      asRole(['auditee_view_special']);
      await expect(authorizeAction({ allowedPermissions: ['auditee_view_normal'] })).rejects.toThrow(AuthorizationError);
      await expect(authorizeAction({ allowedPermissions: ['auditee_view_special'] })).resolves.toBeDefined();
    });

    it('denies a normal-only role the special view permission', async () => {
      asRole(['auditee_view_access']);
      await expect(authorizeAction({ allowedPermissions: ['auditee_view_special'] })).rejects.toThrow(AuthorizationError);
      await expect(authorizeAction({ allowedPermissions: ['auditee_view_normal'] })).resolves.toBeDefined();
    });

    it('lets a role with only action permissions through the page guard as a normal-view role', async () => {
      asRole(['auditee_view_follow_up']);
      await expect(authorizeAction({ anyPermissions: [...AUDITEE_VIEW_PAGE_PERMISSIONS] })).resolves.toBeDefined();
    });

    it('denies a role with no auditee view permission at the page guard', async () => {
      asRole(['reports_special_audits_access']);
      await expect(authorizeAction({ anyPermissions: [...AUDITEE_VIEW_PAGE_PERMISSIONS] })).rejects.toThrow(AuthorizationError);
    });

    it('scopes special audit records to the special view permission too', async () => {
      asRole(['auditee_view_special']);
      expect(await getScopingFilter('specialAudit')).toEqual({});

      asRole(['auditee_view_access']);
      expect(await getScopingFilter('specialAudit')).toEqual({ id: 'none' });
    });
  });
});

describe('Separate action permissions per Auditee View', () => {
  const { PARENT_PERMISSION_GRANTS, storedPermissionsFromSelection, PERMISSION_DEFINITIONS } = require('../lib/permissions');

  it('Normal parent grants normal actions only; Special parent grants special actions only', () => {
    const normal = normalizePermissions(['auditee_view_access']);
    expect(normal).toContain('auditee_view_follow_up');
    expect(normal.filter((k) => k.startsWith('auditee_special_') || k === 'auditee_view_special')).toEqual([]);

    const special = normalizePermissions(['auditee_view_special_access']);
    expect(special).toEqual(expect.arrayContaining(['auditee_view_special', 'auditee_special_follow_up', 'auditee_special_delete']));
    expect(special).not.toContain('auditee_view_normal');
    expect(special).not.toContain('auditee_view_follow_up');
  });

  it('a role can follow up on normal findings but only view special cases', () => {
    const eff = normalizePermissions(['auditee_view_access', 'auditee_view_special']);
    expect(eff).toContain('auditee_view_follow_up');
    expect(eff).toContain('auditee_view_special');
    expect(eff).not.toContain('auditee_special_follow_up');
  });

  it('each parent is stored only when its own group is fully ticked', () => {
    const normalAll = ['auditee_view_access', ...PARENT_PERMISSION_GRANTS.auditee_view_access];
    const specialPartial = ['auditee_view_special_access', 'auditee_view_special', 'auditee_special_follow_up'];
    const stored = storedPermissionsFromSelection([...normalAll, ...specialPartial]);
    expect(stored).toContain('auditee_view_access'); // normal group complete
    expect(stored).not.toContain('auditee_view_special_access'); // special group incomplete
    expect(normalizePermissions(stored)).not.toContain('auditee_special_delete');
  });

  it('Role Management lists two groups, each with a parent toggle and its own actions', () => {
    const groups = (g: string) => PERMISSION_DEFINITIONS.filter((p: any) => p.group === g).map((p: any) => p.key);
    expect(groups('Core Actions → Auditee View (Normal)')).toEqual(expect.arrayContaining(['auditee_view_access', 'auditee_view_normal', 'auditee_view_follow_up']));
    expect(groups('Core Actions → Auditee View (Special)')).toEqual(
      expect.arrayContaining(['auditee_view_special_access', 'auditee_view_special', 'auditee_special_follow_up', 'auditee_special_delete'])
    );
    expect(PERMISSION_DEFINITIONS.filter((p: any) => p.isParent).map((p: any) => p.key).sort()).toEqual(['auditee_view_access', 'auditee_view_special_access']);
  });
});

describe('special Edit Finding permission', () => {
  const { PARENT_PERMISSION_GRANTS, PERMISSION_DEFINITIONS, getPermissionLabel, storedPermissionsFromSelection } = require('../lib/permissions');
  const ids = (g: string) => PERMISSION_DEFINITIONS.filter((p: any) => p.group === g).map((p: any) => p.key);

  it('is listed in the special group and granted by the special parent only', () => {
    expect(ids('Core Actions → Auditee View (Special)')).toContain('auditee_special_edit_finding');
    expect(PARENT_PERMISSION_GRANTS.auditee_view_special_access).toContain('auditee_special_edit_finding');
    expect(normalizePermissions(['auditee_view_special_access'])).toContain('auditee_special_edit_finding');
    expect(normalizePermissions(['auditee_view_access'])).not.toContain('auditee_special_edit_finding');
    expect(normalizePermissions(['auditee_view_special_access'])).not.toContain('auditee_view_edit_finding');
  });

  it('is not implied by the view alone, and unticking it survives a save', () => {
    expect(normalizePermissions(['auditee_view_special'])).not.toContain('auditee_special_edit_finding');
    const all = normalizePermissions(['auditee_view_special_access']);
    const stored = storedPermissionsFromSelection(all.filter((k: string) => k !== 'auditee_special_edit_finding'));
    expect(normalizePermissions(stored)).not.toContain('auditee_special_edit_finding');
  });

  it('tells Normal and Special actions apart in role listings', () => {
    expect(getPermissionLabel('auditee_special_delete')).toBe('Delete (Special)');
    expect(getPermissionLabel('auditee_view_delete_finding')).toBe('Delete (Normal)');
    expect(getPermissionLabel('auditee_special_edit_finding')).toBe('Edit Finding (Special)');
    expect(getPermissionLabel('auditee_view_special_access')).toBe('Full access to the Special Auditee View');
    expect(getPermissionLabel('dashboard_access')).toBe(PERMISSION_DEFINITIONS[0].label);
  });
});
