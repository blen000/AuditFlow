'use server';

import { prisma } from '@/lib/prisma';
import { securePrisma } from '@/lib/securePrisma';
import { authorizeAction } from '@/lib/authorization';
import { ensureFollowUpStatuses } from '@/app/actions/settings';
import { AUDITEE_VIEW_PAGE_PERMISSIONS } from '@/lib/permissions';

function formatDate(date: Date | null | undefined) {
  return date ? date.toISOString() : null;
}

function ensureArray(value: any) {
  return Array.isArray(value) ? value : [];
}

function formatFinding(finding: any) {
  return {
    ...finding,
    assignedDate: formatDate(finding.assignedDate),
    dateCommunicated: formatDate(finding.dateCommunicated),
    finalizationDate: formatDate(finding.finalizationDate),
    revalidationDate: formatDate(finding.revalidationDate),
    mitigationDueDate: formatDate(finding.mitigationDueDate),
    createdAt: finding.createdAt.toISOString(),
    updatedAt: finding.updatedAt.toISOString(),
    dynamicValues: (finding.dynamicValues as Record<string, any>) || {},
    teamMembers: ensureArray(finding.teamMembers),
    progressUpdates: ensureArray(finding.progressUpdates),
    involvedAmounts: ensureArray(finding.involvedAmounts),
    involvedCases: ensureArray(finding.involvedCases),
    findingAttachments: ensureArray(finding.findingAttachments),
    recommendationAttachments: ensureArray(finding.recommendationAttachments),
    auditCauseAttachments: ensureArray(finding.auditCauseAttachments),
    auditEffectAttachments: ensureArray(finding.auditEffectAttachments),
    verbalComm: ensureArray(finding.verbalComm),
    writtenComm: ensureArray(finding.writtenComm),
    esc1: ensureArray(finding.esc1),
    esc2: ensureArray(finding.esc2),
    forwardingHistory: ensureArray(finding.forwardingHistory),
    followUpRecommendations: finding.followUpRecommendations || '',
    collaboratingWith: finding.collaboratingWith || '',
  };
}

function formatHierarchyNode(node: any) {
  return {
    ...node,
    customFields: ensureArray(node.customFields),
  };
}

export async function getAuditeeViewData() {
  // Any Auditee View permission (parent, view-only, or an individual child action)
  // is sufficient to load the page and its finding list.
  await authorizeAction({ anyPermissions: [...AUDITEE_VIEW_PAGE_PERMISSIONS] });
  try {
    const [findings, hierarchy, branches, departments, riskLevels, statuses, followUpStatuses] = await Promise.all([
      securePrisma.finding.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditHierarchyNode.findMany({
        orderBy: [{ level: 'asc' }, { number: 'asc' }],
      }),
      prisma.branch.findMany({ orderBy: { name: 'asc' } }),
      prisma.department.findMany({ orderBy: { name: 'asc' } }),
      prisma.riskLevel.findMany({ orderBy: { name: 'asc' } }),
      prisma.findingStatus.findMany({ orderBy: { name: 'asc' } }),
      ensureFollowUpStatuses(),
    ]);

    const formattedFindings = findings.map(formatFinding);
    const formattedHierarchy = hierarchy.map(formatHierarchyNode);

    return {
      findings: formattedFindings,
      hierarchy: formattedHierarchy,
      branches,
      departments,
      riskLevels,
      statuses,
      followUpStatuses,
    };
  } catch (error) {
    console.error('Failed to fetch auditee view data:', error);
    throw new Error('Database connection failed');
  }
}