import { getUserFromCookiesServer, getUserFromRequest } from './serverAuth';
import { prisma } from './prisma';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { logSecurityEvent } from './securityLogger';

export class AuthenticationError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export type ResourceType = 'finding' | 'user' | 'role' | 'specialAudit' | 'hierarchyNode';

export class BusinessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}

export interface AuthOptions {
  allowedRoles?: string[];
  allowedPermissions?: string[];
  resourceId?: string;
  resourceType?: ResourceType;
  /**
   * Optional custom ownership check. 
   * If provided, it overrides the default ownership logic.
   */
  checkOwnership?: (user: any, resource: any) => boolean;
  /**
   * If true, returns the Prisma 'where' clause for the current user's visibility.
   */
  getWhereClause?: boolean;
}

/**
 * Centrally enforces authorization for Server Actions.
 * Redirects to login if unauthorized (401).
 * Throws an error if forbidden (403).
 */
export async function authorizeAction(options: AuthOptions = {}) {
  const user = await getUserFromCookiesServer();
  
  if (!user) {
    redirect('/login?error=session_expired');
  }

  try {
    return await enforce(user, options);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      await logSecurityEvent('AUTHZ_FAILURE', {
        userId: user.id,
        email: user.email,
        action: `Authorization failed for ${options.resourceType || 'action'}`,
        resourceId: options.resourceId,
        resourceType: options.resourceType,
        severity: 'WARN',
      });
      // For server actions, we might want to redirect to a forbidden page
      // or just re-throw and let the action handle it.
      // Re-throwing for now as actions often have their own error UI.
      throw error;
    }
    throw error;
  }
}

/**
 * Centrally enforces authorization for Pages and Layouts (Server Components).
 * Redirects to login if unauthorized (401).
 * Throws an error if forbidden (403).
 */
export async function authorizePage(allowedPermissions: string[] = []) {
  const user = await getUserFromCookiesServer();
  
  if (!user) {
    redirect('/login?error=session_expired');
  }

  try {
    return await enforce(user, { allowedPermissions });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      await logSecurityEvent('AUTHZ_FAILURE', {
        userId: user.id,
        email: user.email,
        action: 'Authorization failed for page access',
        severity: 'WARN',
      });
    }
    throw error;
  }
}

/**
 * Returns a Prisma 'where' clause for scoping queries based on user role and ownership.
 * Use this to ensure every query is automatically restricted.
 */
export async function getScopingFilter(resourceType: ResourceType) {
  const user = await getUserFromCookiesServer();
  if (!user) throw new Error('Unauthorized');
  
  if (user.role.name === 'Admin') return {}; // Admins see everything

  switch (resourceType) {
    case 'finding':
      if (user.role.name === 'Auditee') {
        // User.branch is nullable in the schema; if it's not set, deny access safely.
        if (!user.branch) return { id: 'none' };
        return { branchOrDepartment: user.branch };
      }
      if (user.role.name === 'Auditor') {
        return {
          OR: [
            { teamLeader: user.fullName },
            { teamMembers: { path: [], array_contains: user.fullName } }
          ]
        };
      }
      return { id: 'none' }; // Deny by default

    case 'user':
      return { id: user.id };

    case 'specialAudit':
      if (user.role.name === 'Auditor') return {}; // Auditors can see all special audits
      return { id: 'none' };

    default:
      return { id: 'none' };
  }
}

/**
 * Centrally enforces authorization for API Routes.
 * Returns the user or a NextResponse.
 */
export async function authorizeRoute(req: Request, options: AuthOptions = {}) {
  const user = await getUserFromRequest(req);
  try {
    return await enforce(user, options);
  } catch (error: any) {
    const status = error instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

async function enforce(user: any, options: AuthOptions) {
  if (!user) {
    throw new AuthenticationError();
  }

  // ❗ Admins bypass RBAC and permission checks centrally
  if (user.role.name === 'Admin') return user;

  // 1. RBAC: Role check
  if (options.allowedRoles && options.allowedRoles.length > 0) {
    if (!options.allowedRoles.includes(user.role.name)) {
      console.warn('Access denied: role mismatch', { userId: user.id, role: user.role.name });
      throw new AuthorizationError();
    }
  }

  // 2. RBAC: Permission check
  if (options.allowedPermissions && options.allowedPermissions.length > 0) {
    const userPermissions = user.role.permissions || [];
    const hasPermission = options.allowedPermissions.every(p => userPermissions.includes(p));
    if (!hasPermission) {
      console.warn('Access denied: missing permissions', { userId: user.id, missing: options.allowedPermissions.filter(p => !userPermissions.includes(p)) });
      throw new AuthorizationError();
    }
  }

  // 3. Ownership check
  if (options.resourceId && options.resourceType) {
    return await handleOwnership(user, options);
  }

  return user;
}

async function handleOwnership(user: any, options: AuthOptions) {
  const resource = await fetchResource(options.resourceType!, options.resourceId!);
  if (!resource) {
    throw new Error('Resource not found');
  }

  if (options.checkOwnership) {
    if (!options.checkOwnership(user, resource)) {
      console.warn('Access denied: ownership check failed', { userId: user.id, resourceType: options.resourceType, resourceId: options.resourceId });
      throw new AuthorizationError();
    }
  } else {
    enforceDefaultOwnership(user, options.resourceType!, resource);
  }
  
  return user;
}

async function fetchResource(type: ResourceType, id: string) {
  switch (type) {
    case 'finding':
      return prisma.auditFinding.findUnique({ where: { id } });
    case 'user':
      return prisma.user.findUnique({ where: { id } });
    case 'specialAudit':
      return prisma.specialAudit.findUnique({ where: { id } });
    case 'hierarchyNode':
      return prisma.auditHierarchyNode.findUnique({ where: { id } });
    default:
      return null;
  }
}

export function enforceDefaultOwnership(user: any, type: ResourceType, resource: any) {
  if (user.role.name === 'Admin') return;

  switch (type) {
    case 'user':
      if (resource.id !== user.id) throw new AuthorizationError();
      break;

    case 'finding': {
      const roleName = user.role.name;
      if (roleName === 'Chief' || roleName === 'CEO') return;
      if (roleName === 'Auditor') {
        const teamMembers = (resource.teamMembers as string[]) || [];
        if (resource.teamLeader !== user.fullName && !teamMembers.includes(user.fullName))
          throw new AuthorizationError();
        break;
      }
      if (roleName === 'Auditee') {
        if (resource.branchOrDepartment !== user.branch) throw new AuthorizationError();
        break;
      }
      throw new AuthorizationError();
    }

    case 'specialAudit':
      if (user.role.name !== 'Auditor') throw new AuthorizationError();
      break;

    default:
      throw new AuthorizationError();
  }
}

/**
 * Enforces server-side business rules including maker-checker (role separation)
 * and workflow state validation.
 */
export async function enforceBusinessRules(action: 'update' | 'close' | 'approve', user: any, resource: any) {
  if (user.role.name === 'Admin') return; // Admin can override for emergency fixes

  if (action === 'update' || action === 'close') {
    if (resource.teamLeader === user.fullName) {
      // In a strict maker-checker, the team leader who logs a finding 
      // should not be the one to mark it as 'Closed' or 'Mitigated'.
      // This requires another Auditor or a Chief to verify.
      return {
        isMaker: true,
        message: 'Maker-Checker violation: Actions on this finding must be verified by a different authorized user.'
      };
    }
  }

  // 2. Workflow Validation
  if (action === 'close') {
    // Ensure finding has an auditee response before it can be closed
    if (!resource.auditeeResponse || resource.auditeeAgreement === 'Pending') {
      throw new BusinessRuleError('Finding cannot be closed without an auditee response and agreement status.');
    }
  }

  return { isMaker: false };
}
