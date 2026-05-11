import { authorizeAction, getScopingFilter, AuthenticationError, AuthorizationError } from '../lib/authorization';
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

    it('should scope findings by branch for Auditee (Cross-tenant prevention)', async () => {
      mockGetUserFromCookiesServer.mockResolvedValue({
        id: 'u2',
        email: 'auditee@test.com',
        role: { name: 'Auditee' },
        branch: 'Branch A',
      });

      const filter = await getScopingFilter('finding');
      expect(filter).toEqual({ branchOrDepartment: 'Branch A' });
      // If an auditee from Branch A tries to access Branch B, this filter ensures they only see A
    });

    it('should scope findings by team for Auditor', async () => {
      mockGetUserFromCookiesServer.mockResolvedValue({
        id: 'u3',
        email: 'auditor@test.com',
        fullName: 'John Doe',
        role: { name: 'Auditor' },
      });

      const filter = await getScopingFilter('finding');
      expect(filter).toEqual({
        OR: [
          { teamLeader: 'John Doe' },
          { teamMembers: { path: [], array_contains: 'John Doe' } }
        ]
      });
    });

    it('should return "none" filter for unknown resource types or denied access', async () => {
      mockGetUserFromCookiesServer.mockResolvedValue({
        id: 'u4',
        email: 'guest@test.com',
        role: { name: 'Guest' },
      });

      const filter = await getScopingFilter('finding');
      expect(filter).toEqual({ id: 'none' });
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
