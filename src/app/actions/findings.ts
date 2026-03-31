'use server';

import { prisma } from '@/lib/prisma';

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
          status: 'Active'
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
        phone: 'N/A', // Not stored in User model currently
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

    // In a real implementation, we would use prisma.auditFinding.createMany
    // and correctly map all fields including parent case info.
    // For this prototype context, we simulate the DB write.
    console.log('Server Action: Writing findings to DB', data);
    
    // Example logic for a single write (placeholder)
    /*
    await prisma.auditFinding.create({
      data: { ... }
    });
    */

    return { success: true };
  } catch (error) {
    console.error('Failed to submit findings:', error);
    return { success: false, error: 'Failed to persist audit data.' };
  }
}
