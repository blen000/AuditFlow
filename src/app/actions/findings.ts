'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Fetches all necessary metadata for the audit logging form.
 */
export async function getFindingFormData() {
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
            name: 'Auditee'
          }
        },
        include: {
          role: true
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
        phone: 'N/A',
        role: u.role.name
      }))
    };
  } catch (error) {
    console.error('Failed to fetch finding form data:', error);
    throw new Error('Database connection failed');
  }
}

/**
 * Submits new audit findings to the database.
 */
export async function submitFindings(data: any) {
  try {
    const { hierarchyNodeId, findings } = data;

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
            teamMembers: f.teamMembers,
            assignedDate: f.assignedDate,
            tatDays: parseInt(f.tatDays),
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
