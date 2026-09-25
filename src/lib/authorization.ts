import { getUserFromCookiesServer, getUserFromRequest } from './serverAuth';
import { prisma } from './prisma';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { logSecurityEvent } from './securityLogger';
import { normalizePermissions } from './permissions';

/**
 * Effective permission keys for a user: the raw stored keys expanded by the
 * normalization rules (legacy aliases + parent→child implications, e.g. the
 * Auditee View parent toggle implying every child action). Use this everywhere
 * an authorization decision is made server-side.
 */
export function effectivePermissionsFor(user: any): string[] {
  return normalizePermissions(user?.role?.permissions || []);
}

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
  /** ALL of these permission keys are required (AND). */
  allowedPermissions?: string[];
  /** AT LEAST ONE of these permission keys is required (OR). */
  anyPermissions?: string[];
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
export async function authorizePage(
  permissions: string[] = [],
  mode: 'all' | 'any' = 'all'
) {
  const user = await getUserFromCookiesServer();

  if (!user) {
    redirect('/login?error=session_expired');
  }

  try {
    return await enforce(
      user,
      mode === 'any' ? { anyPermissions: permissions } : { allowedPermissions: permissions }
    );
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

// Executive roles created before `auditee_view_all_findings` existed keep their
// organization-wide oversight without needing their stored permissions migrated.
const LEGACY_ORG_WIDE_ROLES = ['Chief Auditor', 'CEO'];

/**
 * True when the user may see findings from every organizational unit:
 * Admins, executive (special) roles, or any role granted `auditee_view_all_findings`.
 */
export function hasOrgWideFindingAccess(user: any): boolean {
  const role = user?.role;
  if (!role) return false;
  if (role.name === 'Admin') return true;
  if (role.isSpecial || LEGACY_ORG_WIDE_ROLES.includes(role.name)) return true;
  return effectivePermissionsFor(user).includes('auditee_view_all_findings');
}

/**
 * The organizational units a user belongs to, most specific first. Branch and
 * department are both specific; district only applies when neither is set, so a
 * branch user does not inherit visibility over their whole district.
 */
function orgUnitsFor(user: any): { field: 'branch' | 'department' | 'district'; value: string }[] {
  const units: { field: 'branch' | 'department' | 'district'; value: string }[] = [];
  if (user.branch) units.push({ field: 'branch', value: user.branch });
  if (user.department) units.push({ field: 'department', value: user.department });
  if (units.length === 0 && user.district) units.push({ field: 'district', value: user.district });
  return units;
}

/**
 * Prisma `where` clause for the findings a user may see. Permissions decide
 * WHICH actions a user can take; this decides WHICH findings they apply to.
 *
 * Non org-wide users see findings they logged, lead, are a team member of, or are
 * the bound auditee for, plus findings raised against their own branch/department.
 * `isFindingInScope` below must stay in sync with this.
 */
export function findingScopeFor(user: any): Record<string, any> {
  if (hasOrgWideFindingAccess(user)) return {};

  const or: Record<string, any>[] = [{ auditorId: user.id }, { auditeeId: user.id }];
  if (user.fullName) {
    or.push({ teamLeader: user.fullName }, { teamMembers: { array_contains: [user.fullName] } });
  }
  for (const unit of orgUnitsFor(user)) {
    or.push({ [unit.field]: unit.value });
    // Legacy findings may only carry the combined label.
    or.push({ branchOrDepartment: unit.value });
  }
  return { OR: or };
}

/** Human-readable summary of a user's finding visibility, for empty-state messaging. */
export function describeFindingScope(user: any): { orgWide: boolean; units: string[] } {
  if (hasOrgWideFindingAccess(user)) return { orgWide: true, units: [] };
  return { orgWide: false, units: orgUnitsFor(user).map((u) => u.value) };
}

/** In-memory equivalent of `findingScopeFor` for a single loaded finding. */
export function isFindingInScope(user: any, finding: any): boolean {
  if (hasOrgWideFindingAccess(user)) return true;
  if (finding.auditorId && finding.auditorId === user.id) return true;
  if (finding.auditeeId && finding.auditeeId === user.id) return true;
  if (user.fullName) {
    const teamMembers = Array.isArray(finding.teamMembers) ? finding.teamMembers : [];
    if (finding.teamLeader === user.fullName || teamMembers.includes(user.fullName)) return true;
  }
  return orgUnitsFor(user).some(
    (unit) => finding[unit.field] === unit.value || finding.branchOrDepartment === unit.value
  );
}

/**
 * Returns a Prisma 'where' clause for scoping queries based on the user's
 * permissions and organizational assignment.
 * Use this to ensure every query is automatically restricted.
 */
export async function getScopingFilter(resourceType: ResourceType) {
  const user = await getUserFromCookiesServer();
  if (!user) throw new Error('Unauthorized');

  if (user.role.name === 'Admin') return {}; // Admins see everything

  switch (resourceType) {
    case 'finding':
      return findingScopeFor(user);

    case 'user':
      return { id: user.id };

    case 'specialAudit': {
      // Special audits are not tied to an owner; access to the register or its
      // report grants visibility of the whole list.
      const perms = effectivePermissionsFor(user);
      if (perms.includes('reports_special_audits_access') || perms.includes('special_audits_new_access')) return {};
      return { id: 'none' };
    }

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

  // Normalized (effective) permissions: legacy aliases + parent→child implications.
  const userPermissions = effectivePermissionsFor(user);

  // 2. RBAC: Permission check (ALL required)
  if (options.allowedPermissions && options.allowedPermissions.length > 0) {
    const hasPermission = options.allowedPermissions.every(p => userPermissions.includes(p));
    if (!hasPermission) {
      console.warn('Access denied: missing permissions', { userId: user.id, missing: options.allowedPermissions.filter(p => !userPermissions.includes(p)) });
      throw new AuthorizationError();
    }
  }

  // 2b. RBAC: Permission check (ANY of the set is sufficient)
  if (options.anyPermissions && options.anyPermissions.length > 0) {
    const hasAny = options.anyPermissions.some(p => userPermissions.includes(p));
    if (!hasAny) {
      console.warn('Access denied: none of the required permissions present', { userId: user.id, required: options.anyPermissions });
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

    case 'finding':
      if (!isFindingInScope(user, resource)) throw new AuthorizationError();
      break;

    case 'specialAudit': {
      const perms = effectivePermissionsFor(user);
      if (!perms.includes('reports_special_audits_access') && !perms.includes('special_audits_new_access'))
        throw new AuthorizationError();
      break;
    }

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
