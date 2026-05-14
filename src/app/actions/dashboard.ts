 'use server';

import { prisma } from '@/lib/prisma';
import { securePrisma } from '@/lib/securePrisma';
import { authorizeAction } from '@/lib/authorization';
import { ensureFollowUpStatuses } from '@/app/actions/settings';

export async function getDashboardData() {
  await authorizeAction({ allowedPermissions: ['dashboard_access'] });
  try {
    const [findings, specialAudits, branches, hierarchy] = await Promise.all([
      (prisma as any).auditFinding.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      (prisma as any).specialAudit.findMany({
        include: { category: true },
        orderBy: { dateCreated: 'desc' },
      }),
      prisma.branch.findMany(),
      prisma.auditHierarchyNode.findMany(),
    ]);

    const followUpStatuses = await ensureFollowUpStatuses();

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
      category: sa.category?.name || 'Uncategorized',
      dateCreated: sa.dateCreated.toISOString(),
    }));

    return {
      findings: formattedFindings,
      specialAudits: formattedSpecialAudits,
      branches,
      hierarchy,
      followUpStatuses,
    };
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    throw new Error('Database connection failed');
  }
}
