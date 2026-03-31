'use server';

import { prisma } from '@/lib/prisma';

/**
 * Fetches data for the Consolidated Activity Report.
 */
export async function getConsolidatedReportData() {
  try {
    const [findings, hierarchy] = await Promise.all([
      prisma.auditFinding.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditHierarchyNode.findMany({
        orderBy: [{ level: 'asc' }, { number: 'asc' }],
      }),
    ]);

    return {
      findings: findings.map(f => ({
        ...f,
        dynamicValues: f.dynamicValues as Record<string, any> || {},
      })),
      hierarchy: hierarchy.map(node => ({
        ...node,
        customFields: (node.customFields as any[]) || []
      })),
    };
  } catch (error) {
    console.error('Failed to fetch consolidated report data:', error);
    throw new Error('Database connection failed');
  }
}

/**
 * Fetches data for the Findings Frequency Analysis.
 */
export async function getFrequencyReportData() {
  try {
    const [findings, branches, hierarchy] = await Promise.all([
      prisma.auditFinding.findMany(),
      prisma.branch.findMany(),
      prisma.auditHierarchyNode.findMany({ where: { level: 1 } }),
    ]);

    return {
      findings: findings.map(f => ({
        ...f,
        involvedAmounts: (f.involvedAmounts as any[]) || [],
      })),
      totalBranchesCount: branches.length,
      rootCategories: hierarchy.map(h => h.title)
    };
  } catch (error) {
    console.error('Failed to fetch frequency report data:', error);
    throw new Error('Database connection failed');
  }
}

/**
 * Fetches data for Audit Assignments & KPI Tracking.
 */
export async function getAssignmentReportData() {
  try {
    const [findings, auditors] = await Promise.all([
      prisma.auditFinding.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.findMany({
        where: {
          role: {
            name: { in: ['Auditor', 'Admin', 'Chief Auditor'] }
          }
        },
        orderBy: { fullName: 'asc' }
      }),
    ]);

    return {
      findings: findings.map(f => ({
        ...f,
        teamMembers: f.teamMembers as string[] || [],
      })),
      auditors,
    };
  } catch (error) {
    console.error('Failed to fetch assignment report data:', error);
    throw new Error('Database connection failed');
  }
}

/**
 * Fetches data for the Communication Log.
 */
export async function getCommunicationReportData() {
  try {
    const findings = await prisma.auditFinding.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return findings.map(f => ({
      ...f,
      assignedDate: f.assignedDate || null,
      dateCommunicated: f.dateCommunicated || null,
      mitigationDueDate: f.mitigationDueDate || null,
    }));
  } catch (error) {
    console.error('Failed to fetch communication report data:', error);
    throw new Error('Database connection failed');
  }
}
