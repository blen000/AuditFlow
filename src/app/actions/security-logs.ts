'use server';

import { prisma } from '@/lib/prisma';
import { authorizeAction } from '@/lib/authorization';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export type LogFilterOptions = {
  severity?: string;
  eventType?: string;
  email?: string;
  ipAddress?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
};

/**
 * Fetches filtered security audit logs with pagination.
 */
export async function getSecurityLogs(filters: LogFilterOptions = {}) {
  await authorizeAction({ allowedRoles: ['Admin'] });

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const skip = (page - 1) * pageSize;

  const where: any = {};
  
  if (filters.severity && filters.severity !== 'all') {
    where.severity = filters.severity;
  }

  if (filters.eventType && filters.eventType !== 'all') {
    where.eventType = filters.eventType;
  }

  if (filters.email) {
    where.email = { contains: filters.email, mode: 'insensitive' };
  }

  if (filters.ipAddress) {
    where.ipAddress = { contains: filters.ipAddress };
  }

  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) {
      where.timestamp.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.timestamp.lte = new Date(filters.endDate);
    }
  }

  const [logs, totalCount] = await Promise.all([
    prisma.securityAuditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.securityAuditLog.count({ where })
  ]);

  return {
    logs,
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize
    }
  };
}

/**
 * Fetches security analytics data for the dashboard.
 */
export async function getSecurityAnalytics() {
  await authorizeAction({ allowedRoles: ['Admin'] });

  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);
  const sevenDaysAgo = startOfDay(subDays(today, 7));

  const [
    failedLoginsToday,
    highRiskEventsToday,
    dataExportsToday,
    logsLast7Days,
    mostTargetedAccounts,
    eventDistribution
  ] = await Promise.all([
    // Counts for today
    prisma.securityAuditLog.count({
      where: {
        eventType: 'AUTH_LOGIN_FAILURE',
        timestamp: { gte: startOfToday, lte: endOfToday }
      }
    }),
    prisma.securityAuditLog.count({
      where: {
        severity: 'HIGH_RISK',
        timestamp: { gte: startOfToday, lte: endOfToday }
      }
    }),
    prisma.securityAuditLog.count({
      where: {
        eventType: 'DATA_EXPORT',
        timestamp: { gte: startOfToday, lte: endOfToday }
      }
    }),
    // Logs for trend chart
    prisma.securityAuditLog.findMany({
      where: {
        timestamp: { gte: sevenDaysAgo }
      },
      select: { timestamp: true, eventType: true, severity: true }
    }),
    // Most targeted accounts (failed logins)
    prisma.securityAuditLog.groupBy({
      by: ['email'],
      where: { eventType: 'AUTH_LOGIN_FAILURE' },
      _count: { email: true },
      orderBy: { _count: { email: 'desc' } },
      take: 5
    }),
    // Event type distribution
    prisma.securityAuditLog.groupBy({
      by: ['eventType'],
      _count: { eventType: true },
      orderBy: { _count: { eventType: 'desc' } },
    })
  ]);

  return {
    stats: {
      failedLoginsToday,
      highRiskEventsToday,
      dataExportsToday,
    },
    logsLast7Days,
    mostTargetedAccounts: mostTargetedAccounts.map(a => ({
      email: a.email || 'unknown',
      count: a._count.email
    })),
    eventDistribution: eventDistribution.map(e => ({
      type: e.eventType,
      count: e._count.eventType
    }))
  };
}
