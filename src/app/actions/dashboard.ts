'use server';

import { prisma } from '@/lib/prisma';

export async function getDashboardData() {
  try {
    const [findings, specialAudits, branches, hierarchy] = await Promise.all([
      prisma.auditFinding.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.specialAudit.findMany({
        include: { individuals: true },
        orderBy: { dateCreated: 'desc' },
      }),
      prisma.branch.findMany(),
      prisma.auditHierarchyNode.findMany(),
    ]);

    // Format findings to match frontend types (handling dates and JSON)
    const formattedFindings = findings.map(f => ({
      ...f,
      assignedDate: f.assignedDate || null,
      dateCommunicated: f.dateCommunicated || null,
      finalizationDate: f.finalizationDate || null,
      revalidationDate: f.revalidationDate || null,
      mitigationDueDate: f.mitigationDueDate || null,
      dynamicValues: f.dynamicValues as Record<string, any> || {},
      teamMembers: f.teamMembers as string[] || [],
    }));

    // Format special audits
    const formattedSpecialAudits = specialAudits.map(sa => ({
      ...sa,
      dateCreated: sa.dateCreated.toISOString(),
    }));

    return {
      findings: formattedFindings,
      specialAudits: formattedSpecialAudits,
      branches,
      hierarchy,
    };
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    throw new Error('Database connection failed');
  }
}
