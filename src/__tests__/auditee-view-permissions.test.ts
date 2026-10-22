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
