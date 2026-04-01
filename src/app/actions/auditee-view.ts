'use server';

import { prisma } from '@/lib/prisma';

export async function getAuditeeViewData() {
  try {
    const [findings, hierarchy, branches, departments, riskLevels, statuses] = await Promise.all([
      prisma.auditFinding.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditHierarchyNode.findMany({
        orderBy: [{ level: 'asc' }, { number: 'asc' }],
      }),
      prisma.branch.findMany({ orderBy: { name: 'asc' } }),
      prisma.department.findMany({ orderBy: { name: 'asc' } }),
      prisma.riskLevel.findMany({ orderBy: { name: 'asc' } }),
      prisma.findingStatus.findMany({ orderBy: { name: 'asc' } }),
    ]);

    // Format findings to match frontend types
    const formattedFindings = findings.map(f => ({
      ...f,
      assignedDate: f.assignedDate || null,
      dateCommunicated: f.dateCommunicated || null,
      finalizationDate: f.finalizationDate || null,
      revalidationDate: f.revalidationDate || null,
      mitigationDueDate: f.mitigationDueDate || null,
      dynamicValues: f.dynamicValues as Record<string, any> || {},
      teamMembers: f.teamMembers as string[] || [],
      progressUpdates: (f.progressUpdates as any[]) || [],
      involvedAmounts: (f.involvedAmounts as any[]) || [],
      involvedCases: (f.involvedCases as any[]) || [],
    }));

    return {
      findings: formattedFindings,
      hierarchy: hierarchy.map(h => ({ ...h, customFields: (h.customFields as any[]) || [] })),
      branches,
      departments,
      riskLevels,
      statuses,
    };
  } catch (error) {
    console.error('Failed to fetch auditee view data:', error);
    throw new Error('Database connection failed');
  }
}
