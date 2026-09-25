 'use server';

import { prisma } from '@/lib/prisma';
import { securePrisma } from '@/lib/securePrisma';
import { authorizeAction, effectivePermissionsFor } from '@/lib/authorization';
import { ensureFollowUpStatuses } from '@/app/actions/settings';

export async function getDashboardData() {
  const user = await authorizeAction({ allowedPermissions: ['dashboard_access'] });
  // Special audit KPIs are only shown to users who can open the special audit register or report.
  const perms = effectivePermissionsFor(user);
  const canSeeSpecialAudits =
    user.role?.name === 'Admin' ||
    perms.includes('reports_special_audits_access') ||
    perms.includes('special_audits_new_access');
  try {
    const [findings, specialAudits, branches, hierarchy] = await Promise.all([
      // Same visibility scope as Auditee View, so dashboard KPIs match the findings the user can open.
      securePrisma.finding.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      canSeeSpecialAudits
        ? securePrisma.specialAudit.findMany({
            include: { category: true },
            orderBy: { dateCreated: 'desc' },
          })
        : Promise.resolve([]),
      prisma.branch.findMany(),
      prisma.auditHierarchyNode.findMany(),
    ]);

    const followUpStatuses = await ensureFollowUpStatuses();

    // Format findings to match frontend types (handling dates and JSON)
    const formattedFindings = findings.map((f: any) => ({
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
    const formattedSpecialAudits = specialAudits.map((sa: any) => ({
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
