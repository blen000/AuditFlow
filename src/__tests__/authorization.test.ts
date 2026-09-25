import { authorizeAction, getScopingFilter, isFindingInScope, AuthenticationError, AuthorizationError } from '../lib/authorization';
import { getUserFromCookiesServer } from '../lib/serverAuth';

jest.mock('../lib/serverAuth');
jest.mock('../lib/prisma', () => ({
  prisma: {
    auditFinding: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    specialAudit: {
      findUnique: jest.fn(),
    },
  },
}));

const mockGetUserFromCookiesServer = getUserFromCookiesServer as jest.Mock;

describe('Authorization Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RBAC checks', () => {
    it('should allow access if user has the correct role', async () => {
      mockGetUserFromCookiesServer.mockResolvedValue({
        id: 'u1',
        email: 'admin@test.com',
        role: { name: 'Admin', permissions: [] },
      });

      const user = await authorizeAction({ allowedRoles: ['Admin'] });
      expect(user).toBeDefined();
      expect(user.role.name).toBe('Admin');
    });

    it('should deny access with AuthorizationError if user has the wrong role', async () => {
      mockGetUserFromCookiesServer.mockResolvedValue({
        id: 'u2',
        email: 'user@test.com',
        role: { name: 'Auditee', permissions: [] },
      });

      await expect(authorizeAction({ allowedRoles: ['Admin'] })).rejects.toThrow(AuthorizationError);
    });

    it('should throw AuthenticationError if user is not logged in', async () => {
      mockGetUserFromCookiesServer.mockResolvedValue(null);
      await expect(authorizeAction()).rejects.toThrow(AuthenticationError);
    });

    it('should allow access if user has the correct permission', async () => {
      mockGetUserFromCookiesServer.mockResolvedValue({
        id: 'u3',
        email: 'auditor@test.com',
        role: { name: 'Auditor', permissions: ['findings_new_access'] },
      });

      const user = await authorizeAction({ allowedPermissions: ['findings_new_access'] });
      expect(user).toBeDefined();
    });

    it('should deny access if user is missing permissions', async () => {
      mockGetUserFromCookiesServer.mockResolvedValue({
        id: 'u4',
        email: 'auditor@test.com',
        role: { name: 'Auditor', permissions: [] },
      });

      await expect(authorizeAction({ allowedPermissions: ['findings_new_access'] })).rejects.toThrow(AuthorizationError);
    });

    it('should allow a non-Auditor/Admin role (e.g. Chief Auditor) to submit findings when granted the permission', async () => {
      // Regression test: submitFindings() used to gate on allowedRoles: ['Auditor', 'Admin'],
      // which blocked any other role even when explicitly granted findings_new_access.
      mockGetUserFromCookiesServer.mockResolvedValue({
        id: 'u5',
        email: 'chief.auditor@test.com',
        role: { name: 'Chief Auditor', permissions: ['findings_new_access'] },
      });

      const user = await authorizeAction({ allowedPermissions: ['findings_new_access'] });
      expect(user).toBeDefined();
    });
  });

  describe('Query Scoping & Multi-tenancy', () => {
    it('should return empty filter for Admin', async () => {
      mockGetUserFromCookiesServer.mockResolvedValue({
        id: 'u1',
        email: 'admin@test.com',
        role: { name: 'Admin' },
      });

      const filter = await getScopingFilter('finding');
      expect(filter).toEqual({});
    });

    it('should give org-wide visibility to any role granted auditee_view_all_findings', async () => {
      mockGetUserFromCookiesServer.mockResolvedValue({
        id: 'u9',
        fullName: 'Risk Officer',
        role: { name: 'Risk Officer', permissions: ['auditee_view_access', 'auditee_view_all_findings'] },
      });

      expect(await getScopingFilter('finding')).toEqual({});
    });

    it('should keep org-wide visibility for executive (special) roles', async () => {
      mockGetUserFromCookiesServer.mockResolvedValue({
        id: 'u8',
        role: { name: 'Board Member', isSpecial: true, permissions: ['auditee_view_readonly'] },
      });

      expect(await getScopingFilter('finding')).toEqual({});
    });

    it('should scope a custom role by its unit and assignments instead of denying it (regression)', async () => {
      // Previously any role not literally named Auditee/Auditor/CEO/Chief Auditor got { id: 'none' },
      // leaving Auditee View empty even when the role held every Auditee View permission.
      mockGetUserFromCookiesServer.mockResolvedValue({
        id: 'u7',
        fullName: 'Jane Roe',
        branch: 'Branch A',
        role: { name: 'Branch Manager', permissions: ['auditee_view_access'] },
      });

      const filter: any = await getScopingFilter('finding');
      expect(filter.OR).toEqual(
        expect.arrayContaining([
          { auditorId: 'u7' },
          { auditeeId: 'u7' },
          { teamLeader: 'Jane Roe' },
          { branch: 'Branch A' },
          { branchOrDepartment: 'Branch A' },
        ])
      );
    });

    it('should scope findings by branch for Auditee without leaking other branches', async () => {
      const user = {
        id: 'u2',
        email: 'auditee@test.com',
        role: { name: 'Auditee', permissions: ['auditee_view_access'] },
        branch: 'Branch A',
        district: 'North',
      };
      mockGetUserFromCookiesServer.mockResolvedValue(user);

      const filter: any = await getScopingFilter('finding');
      expect(filter.OR).toContainEqual({ branch: 'Branch A' });
      // Branch users do not inherit their whole district.
      expect(filter.OR).not.toContainEqual({ district: 'North' });

      expect(isFindingInScope(user, { branch: 'Branch A', branchOrDepartment: 'Branch A - Ops' })).toBe(true);
      expect(isFindingInScope(user, { branch: 'Branch B', district: 'North', branchOrDepartment: 'Branch B' })).toBe(false);
    });

    it('should scope findings by team for Auditor', async () => {
      const user = {
        id: 'u3',
        email: 'auditor@test.com',
        fullName: 'John Doe',
        role: { name: 'Auditor', permissions: ['auditee_view_access'] },
      };
      mockGetUserFromCookiesServer.mockResolvedValue(user);

      const filter: any = await getScopingFilter('finding');
      expect(filter.OR).toEqual(
        expect.arrayContaining([
          { teamLeader: 'John Doe' },
          { teamMembers: { array_contains: ['John Doe'] } },
        ])
      );
      expect(isFindingInScope(user, { teamMembers: ['John Doe'] })).toBe(true);
      expect(isFindingInScope(user, { teamLeader: 'Someone Else', teamMembers: [] })).toBe(false);
    });

    it('should scope special audits by permission, not role name', async () => {
      mockGetUserFromCookiesServer.mockResolvedValue({
        id: 'u6',
        role: { name: 'CEO', permissions: ['reports_special_audits_access'] },
      });
      expect(await getScopingFilter('specialAudit')).toEqual({});

      mockGetUserFromCookiesServer.mockResolvedValue({
        id: 'u5',
        role: { name: 'Auditor', permissions: ['dashboard_access'] },
      });
      expect(await getScopingFilter('specialAudit')).toEqual({ id: 'none' });
    });
  });

  describe('Ownership Depth', () => {
    it('should allow user to access their own profile', async () => {
      mockGetUserFromCookiesServer.mockResolvedValue({
        id: 'u1',
        role: { name: 'Auditee' },
      });
      const { prisma } = require('../lib/prisma');
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });

      await expect(authorizeAction({ resourceId: 'u1', resourceType: 'user' })).resolves.toBeDefined();
    });

    it('should deny user from accessing another user profile', async () => {
      mockGetUserFromCookiesServer.mockResolvedValue({
        id: 'u1',
        role: { name: 'Auditee' },
      });
      const { prisma } = require('../lib/prisma');
      prisma.user.findUnique.mockResolvedValue({ id: 'u2' });

      await expect(authorizeAction({ resourceId: 'u2', resourceType: 'user' })).rejects.toThrow(AuthorizationError);
    });
  });
});
