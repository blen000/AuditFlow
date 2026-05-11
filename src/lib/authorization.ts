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
    return enforce(user, options);
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
    return enforce(user, options);
  } catch (error: any) {
    const status = error instanceof AuthenticationError ? 401 : 403;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

function enforce(user: any, options: AuthOptions) {
  if (!user) {
    throw new AuthenticationError();
  }

  // 1. RBAC: Role check
  if (options.allowedRoles && options.allowedRoles.length > 0) {
    if (!options.allowedRoles.includes(user.role.name)) {
      console.warn(`User ${user.id} with role ${user.role.name} denied access (Role mismatch)`);
      throw new AuthorizationError();
    }
  }

  // 2. RBAC: Permission check
  if (options.allowedPermissions && options.allowedPermissions.length > 0) {
    const userPermissions = user.role.permissions || [];
    const hasPermission = options.allowedPermissions.every(p => userPermissions.includes(p));
    if (!hasPermission) {
      console.warn(`User ${user.id} denied access (Missing permissions: ${options.allowedPermissions.filter(p => !userPermissions.includes(p)).join(', ')})`);
      throw new AuthorizationError();
    }
  }

  // 3. Ownership check
  if (options.resourceId && options.resourceType) {
    return handleOwnership(user, options);
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
      console.warn(`User ${user.id} denied access (Custom ownership check failed for ${options.resourceType}:${options.resourceId})`);
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
  // Admins bypass ownership checks for most resources
  if (user.role.name === 'Admin') return;

  switch (type) {
    case 'user':
      // Users can only access their own profile
      if (resource.id !== user.id) {
        throw new AuthorizationError();
      }
      break;

    case 'finding':
      const isAuditor = user.role.name === 'Auditor';
      const isAuditee = user.role.name === 'Auditee';
      const isChief = user.role.name === 'Chief';
      const isCEO = user.role.name === 'CEO';

      if (isAuditor) {
        // Auditors can only access findings where they are team leader or member
        const teamMembers = (resource.teamMembers as string[]) || [];
        if (resource.teamLeader !== user.fullName && !teamMembers.includes(user.fullName)) {
          throw new AuthorizationError();
        }
      } else if (isAuditee) {
        // Auditees can only access findings in their branch/department
        if (resource.branchOrDepartment !== user.branch) {
          throw new AuthorizationError();
        }
      } else if (isChief || isCEO) {
        // Chiefs and CEOs might have broader access, but for now let's say they can see everything if they have the role
        // This can be refined further based on business logic
        return;
      } else {
        throw new AuthorizationError();
      }
      break;

    case 'specialAudit':
      // For now, only Admin and Auditors might have access to special audits
      // Auditor access might need further refinement
      if (user.role.name !== 'Auditor' && user.role.name !== 'Admin') {
        throw new AuthorizationError();
      }
      break;

    default:
      // Deny by default for other resource types if no custom ownership check provided
      throw new AuthorizationError();
  }
}
