'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { authorizeAction, enforceBusinessRules, effectivePermissionsFor } from '@/lib/authorization';
import { submitFindingsSchema } from '@/lib/schemas';

/**
 * Fetches all necessary metadata for the audit logging form.
 */
export async function getFindingFormData() {
  await authorizeAction({ allowedPermissions: ['findings_new_access'] });
  try {
    const [hierarchy, branches, departments, districts, riskLevels, users] = await Promise.all([
      prisma.auditHierarchyNode.findMany({
        orderBy: [
          { level: 'asc' },
          { number: 'asc' }
        ]
      }),
      prisma.branch.findMany({ orderBy: { name: 'asc' } }),
      prisma.department.findMany({ orderBy: { name: 'asc' } }),
      prisma.district.findMany({ orderBy: { name: 'asc' } }),
      prisma.riskLevel.findMany({ orderBy: { name: 'asc' } }),
      prisma.user.findMany({
        where: {
          status: 'Active',
          role: {
            name: 'Auditor'
          }
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: {
            select: {
              name: true,
            }
          },
        },
        orderBy: { fullName: 'asc' }
      })
    ]);

    return {
      hierarchy: hierarchy.map(node => ({
        ...node,
        customFields: (node.customFields as any[]) || []
      })),
      branches,
      departments,
      districts,
      riskLevels,
      auditors: users.map(u => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role.name
      }))
    };
  } catch (error) {
    console.error('Failed to fetch finding form data:', error);
    throw new Error('Database connection failed');
  }
}

/**
 * Fetches a single finding by its ID (used by the edit screen).
 * Requires the Auditee View "Edit Finding" permission, or legacy findings access.
 */
export async function getFindingById(id: string) {
  const user = await authorizeAction();
  const perms = effectivePermissionsFor(user);
  if (
    user?.role?.name !== 'Admin' &&
    !perms.includes('auditee_view_edit_finding') &&
    !perms.includes('findings_new_access')
  ) {
    throw new Error('Forbidden');
  }
  try {
    const finding = await prisma.auditFinding.findUnique({
      where: { id },
      include: {
        hierarchyNode: true,
      }
    });

    if (!finding) return null;

    return {
      ...finding,
      involvedAmounts: (finding.involvedAmounts as any[]) || [],
      involvedCases: (finding.involvedCases as any[]) || [],
      teamMembers: (finding.teamMembers as string[]) || [],
      progressUpdates: (finding.progressUpdates as any[]) || [],
      dynamicValues: (finding.dynamicValues as Record<string, any>) || {},
    };
  } catch (error) {
    console.error('Failed to fetch finding:', error);
    return null;
  }
}

type UpdateFindingIntent = 'edit' | 'status' | 'progress' | 'follow_up';

const UPDATE_FINDING_INTENT_PERMISSION: Record<UpdateFindingIntent, string> = {
  edit: 'auditee_view_edit_finding',
  status: 'auditee_view_change_status',
  progress: 'auditee_view_add_progress',
  follow_up: 'auditee_view_follow_up',
};

/**
 * Updates an audit finding.
 *
 * `intent` selects which Auditee View permission is required:
 *   - 'edit'      → auditee_view_edit_finding   (full-record edit from the edit form)
 *   - 'status'    → auditee_view_change_status  (workflow status change from a card)
 *   - 'progress'  → auditee_view_add_progress   (progress note from a card)
 *   - 'follow_up' → auditee_view_follow_up      (follow-up status/recommendations)
 * Admins bypass via authorizeAction. Users with `findings_new_access` (Auditors
 * logging findings) also retain access for backwards compatibility.
 */
export async function updateFinding(
  id: string,
  data: any,
  intent: UpdateFindingIntent = 'edit'
) {
  const INTENT_PERMISSION = UPDATE_FINDING_INTENT_PERMISSION;

  // Authenticate first (no specific permission), then authorize against either
  // the intent-specific Auditee View permission or the legacy findings_new_access.
  const user = await authorizeAction();
  const perms = effectivePermissionsFor(user);
  const allowed =
    user?.role?.name === 'Admin' ||
    perms.includes(INTENT_PERMISSION[intent]) ||
    perms.includes('findings_new_access');
  if (!allowed) {
    return { success: false, error: 'You do not have permission to perform this action.' };
  }

  try {
    const existing = await prisma.auditFinding.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Finding not found' };

    // ❗ Enforce Maker-Checker if trying to close a finding
    if (data.status === 'Closed' || data.status === 'Mitigated') {
      const rules = await enforceBusinessRules('close', user, existing);
      if (rules?.isMaker) {
        return { success: false, error: rules.message };
      }
    }

    await prisma.auditFinding.update({
      where: { id },
      data: {
        ...data,
        involvedAmounts: data.involvedAmounts || undefined,
        involvedCases: data.involvedCases || undefined,
        teamMembers: data.teamMembers || undefined,
        progressUpdates: data.progressUpdates || undefined,
        dynamicValues: data.dynamicValues || undefined,
        rectificationDate: data.rectificationDate ? new Date(data.rectificationDate) : undefined,
        mitigationDueDate: data.rectificationDate ? new Date(data.rectificationDate) : undefined,
        updatedAt: new Date(),
      }
    });

    revalidatePath('/auditee-view');
    revalidatePath('/dashboard');
    revalidatePath(`/findings/edit/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update finding:', error);
    return { success: false, error: 'Update failed' };
  }
}

/**
 * Submits new audit findings to the database.
 */
export async function submitFindings(data: any) {
  const user = await authorizeAction({ allowedRoles: ['Auditor', 'Admin'] });
  try {
    const validation = submitFindingsSchema.safeParse(data);
    if (!validation.success) {
      console.error('Validation failed:', validation.error.format());
      return { success: false, error: 'Invalid audit finding data. Please check all required fields.' };
    }
    const { hierarchyNodeId, findings } = validation.data;

    // Ensure the selected node is a leaf (has no children)
    const childCount = await prisma.auditHierarchyNode.count({ where: { parentId: hierarchyNodeId } });
    if (childCount > 0) {
      return { success: false, error: 'Selected hierarchy node is not a final taxonomy node.' };
    }

    // Persist all findings within a transaction
    const createdFindings = await prisma.$transaction(
      findings.map((f: any) => {
        const branchOrDepartment = [f.branch, f.department, f.district].filter(Boolean).join(' - ');
        return prisma.auditFinding.create({
          data: {
            title: f.title,
            details: f.details,
            riskLevel: f.riskLevel,
            branch: f.branch,
            department: f.department,
            district: f.district,
            branchOrDepartment,
            recommendation: f.recommendation || '',
            status: 'Open',
            auditeeAgreement: 'Pending',
            auditCause: f.auditCause,
            auditEffect: f.auditEffect,
            involvedAmounts: f.involvedAmounts || [],
            teamLeader: f.teamLeader,
            teamMembers: f.teamMembers || [],
            assignedDate: f.assignedDate ? new Date(f.assignedDate) : new Date(),
            rectificationDate: f.rectificationDate ? new Date(f.rectificationDate) : null,
            tatDays: f.tatDays || 15,
            hierarchyNodeId: hierarchyNodeId,
            dynamicValues: f.dynamicValues || {},
            auditorId: user.id, // ❗ Bind current user as the Auditor
            auditeeId: f.auditeeId, // ❗ Explicitly bound if provided
          }
        });
      })
    );

    // ❗ Trigger notifications for newly registered findings
    for (const finding of createdFindings) {
      const deadline = new Date(finding.assignedDate || new Date());
      deadline.setDate(deadline.getDate() + (finding.tatDays || 15));

      const branchName = finding.branch || finding.department || finding.district || 'your unit';
      const message = `A new audit finding has been registered for ${branchName}. Please review and submit your response within ${finding.tatDays || 15} days (by ${deadline.toDateString()}).`;

      // Identify recipients:
      // 1. Explicitly assigned auditee
      // 2. All active users in the same branch/department/district with 'Auditee' role
      const auditeeUsers = await prisma.user.findMany({
        where: {
          OR: [
            { id: finding.auditeeId || undefined },
            {
              status: 'Active',
              role: { name: 'Auditee' },
              OR: [
                { branch: finding.branch || undefined },
                { department: finding.department || undefined },
                { district: finding.district || undefined }
              ].filter(v => v.OR !== undefined)
            }
          ]
        },
        select: { id: true }
      });

      const recipientIds = Array.from(new Set(auditeeUsers.map(u => u.id)));

      if (recipientIds.length > 0) {
        await prisma.notification.createMany({
          data: recipientIds.map(userId => ({
            userId,
            findingId: finding.id,
            title: 'New Audit Finding Registered',
            message,
            type: 'info',
            metadata: {
              branchName,
              deadline: deadline.toISOString(),
              reference: finding.id.slice(0, 8).toUpperCase()
            }
          }))
        });
      }
    }

    revalidatePath('/auditee-view');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to submit findings:', error);
    return { success: false, error: 'Failed to persist audit data.' };
  }
}

/**
 * Updates an audit finding with an auditee's response.
 */
export async function respondToFinding(findingId: string, data: {
  agreement: string;
  rectificationDate?: Date;
  response: string;
  attachmentId?: string;
}) {
  const user = await authorizeAction({
    allowedPermissions: ['auditee_view_auditee_response'],
    resourceId: findingId,
    resourceType: 'finding',
  });

  try {
    await prisma.auditFinding.update({
      where: { id: findingId },
      data: {
        auditeeAgreement: data.agreement,
        rectificationDate: data.rectificationDate,
        mitigationDueDate: data.rectificationDate, // Keep in sync for legacy compatibility
        auditeeResponse: data.response,
        auditeeId: user.id, // ❗ Bind current user as the Auditee who responded
      }
    });

    revalidatePath('/auditee-view');
    revalidatePath(`/findings/respond/${findingId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to respond to finding:', error);
    return { success: false, error: 'Failed to save response' };
  }
}
