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

    // Format findings to match frontend types and ensure JSON fields are arrays
    const formattedFindings = findings.map(f => ({
      ...f,
      assignedDate: f.assignedDate ? f.assignedDate.toISOString() : null,
      dateCommunicated: f.dateCommunicated ? f.dateCommunicated.toISOString() : null,
      finalizationDate: f.finalizationDate ? f.finalizationDate.toISOString() : null,
      revalidationDate: f.revalidationDate ? f.revalidationDate.toISOString() : null,
      mitigationDueDate: f.mitigationDueDate ? f.mitigationDueDate.toISOString() : null,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
      dynamicValues: f.dynamicValues as Record<string, any> || {},
      teamMembers: Array.isArray(f.teamMembers) ? f.teamMembers : [],
      progressUpdates: Array.isArray(f.progressUpdates) ? f.progressUpdates : [],
      involvedAmounts: Array.isArray(f.involvedAmounts) ? f.involvedAmounts : [],
      involvedCases: Array.isArray(f.involvedCases) ? f.involvedCases : [],
      findingAttachments: Array.isArray(f.findingAttachments) ? f.findingAttachments : [],
      recommendationAttachments: Array.isArray(f.recommendationAttachments) ? f.recommendationAttachments : [],
      auditCauseAttachments: Array.isArray(f.auditCauseAttachments) ? f.auditCauseAttachments : [],
      auditEffectAttachments: Array.isArray(f.auditEffectAttachments) ? f.auditEffectAttachments : [],
      verbalComm: Array.isArray(f.verbalComm) ? f.verbalComm : [],
      writtenComm: Array.isArray(f.writtenComm) ? f.writtenComm : [],
      esc1: Array.isArray(f.esc1) ? f.esc1 : [],
      esc2: Array.isArray(f.esc2) ? f.esc2 : [],
      forwardingHistory: Array.isArray(f.forwardingHistory) ? f.forwardingHistory : [],
    }));

    return {
      findings: formattedFindings,
      hierarchy: hierarchy.map(h => ({ ...h, customFields: Array.isArray(h.customFields) ? h.customFields : [] })),
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