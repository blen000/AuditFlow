'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { authorizeAction, enforceBusinessRules } from '@/lib/authorization';
import { submitFindingsSchema } from '@/lib/schemas';

/**
 * Fetches all necessary metadata for the audit logging form.
 */
export async function getFindingFormData() {
  await authorizeAction({ allowedPermissions: ['findings_new_access'] });
  try {
    const [hierarchy, branches, riskLevels, users] = await Promise.all([
      prisma.auditHierarchyNode.findMany({
        orderBy: [
          { level: 'asc' },
          { number: 'asc' }
        ]
      }),
      prisma.branch.findMany({ orderBy: { name: 'asc' } }),
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
 * Fetches a single finding by its ID.
 */
export async function getFindingById(id: string) {
  await authorizeAction();
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

/**
 * Updates an audit finding.
 */
export async function updateFinding(id: string, data: any) {
  const user = await authorizeAction({ allowedPermissions: ['findings_new_access'] });
  
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
  await authorizeAction({ allowedRoles: ['Auditor', 'Admin'] });
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
    await prisma.$transaction(
      findings.map((f: any) => 
        prisma.auditFinding.create({
          data: {
            title: f.title,
            details: f.details,
            riskLevel: f.riskLevel,
            branchOrDepartment: f.branchOrDepartment,
            recommendation: f.recommendation || '',
            status: 'Open',
            auditeeAgreement: 'Pending',
            auditCause: f.auditCause,
            auditEffect: f.auditEffect,
            involvedAmounts: f.involvedAmounts || [],
            teamLeader: f.teamLeader,
            teamMembers: f.teamMembers || [],
            assignedDate: f.assignedDate ? new Date(f.assignedDate) : null,
            tatDays: f.tatDays || 0,
            hierarchyNodeId: hierarchyNodeId,
            dynamicValues: f.dynamicValues || {},
          }
        })
      )
    );

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
  mitigationDueDate?: Date;
  response: string;
  attachmentId?: string;
}) {
  await authorizeAction({ 
    resourceId: findingId, 
    resourceType: 'finding' 
  });

  try {
    await prisma.auditFinding.update({
      where: { id: findingId },
      data: {
        auditeeAgreement: data.agreement,
        mitigationDueDate: data.mitigationDueDate,
        auditeeResponse: data.response,
        // If an attachment was uploaded, it will be linked via FileAttachment model automatically
        // but we can also store the ID if needed. For now, we rely on the relation.
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
