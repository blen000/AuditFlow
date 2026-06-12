'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { authorizeAction } from '@/lib/authorization';

/**
 * Fetches notifications for the current user.
 */
export async function getUserNotifications() {
  const user = await authorizeAction();
  if (!user) return [];

  try {
    return await prisma.notification.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Keep the last 50 notifications
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return [];
  }
}

/**
 * Marks a specific notification as read.
 */
export async function markAsRead(id: string) {
  const user = await authorizeAction();
  if (!user) return { success: false };

  try {
    await prisma.notification.update({
      where: {
        id,
        userId: user.id,
      },
      data: {
        read: true,
      },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return { success: false };
  }
}

/**
 * Marks all notifications for the user as read.
 */
export async function markAllAsRead() {
  const user = await authorizeAction();
  if (!user) return { success: false };

  try {
    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return { success: false };
  }
}

async function getFindingsWithUpcomingDeadlines(today: Date) {
  const targetDateStart = new Date(today);
  const targetDateEnd = new Date(today);
  targetDateEnd.setDate(today.getDate() + 3);

  return prisma.auditFinding.findMany({
    where: {
      rectificationDate: {
        gte: targetDateStart,
        lte: targetDateEnd,
      },
      status: {
        notIn: ['Closed', 'Resolved'],
      },
    },
    include: {
      auditee: true,
      auditor: true,
    },
  });
}

async function getRecipientIds(finding: any) {
  const admins = await prisma.user.findMany({
    where: { role: { name: 'Admin' }, status: 'Active' },
    select: { id: true },
  });

  const recipientIds = new Set([
    ...admins.map(a => a.id),
    finding.auditorId,
    finding.auditeeId,
  ].filter(Boolean) as string[]);

  if (!finding.auditorId || !finding.auditeeId) {
    const fallbackUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: { name: 'Auditor' }, branch: finding.branch || undefined },
          { role: { name: 'Auditee' }, branch: finding.branch || undefined },
        ],
        status: 'Active'
      },
      select: { id: true }
    });
    fallbackUsers.forEach(u => recipientIds.add(u.id));
  }

  return recipientIds;
}

async function checkExistingNotification(userId: string, findingId: string, today: Date) {
  return prisma.notification.findFirst({
    where: {
      userId,
      findingId,
      createdAt: {
        gte: today,
      },
      message: {
        contains: 'rectification deadline',
      },
    },
  });
}

function createNotificationData(userId: string, finding: any, diffDays: number, dueDate: Date) {
  const message = `Reminder: The rectification deadline for Finding #${finding.referenceNumber || finding.id.slice(0, 8)} is approaching. The due date is ${dueDate.toDateString()}.`;
  
  return {
    userId,
    findingId: finding.id,
    title: 'Rectification Deadline Approaching',
    message,
    type: diffDays <= 1 ? 'alert' : 'warning',
    metadata: {
      remainingDays: diffDays,
      dueDate: dueDate.toISOString(),
    },
  };
}

/**
 * Background job / Helper function to generate rectification deadline notifications.
 * This should be called by a cron job or at a specific trigger point.
 */
export async function processRectificationDeadlines() {
  // ❗ We are not authorizing here because this is intended as a system-level background job
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const findings = await getFindingsWithUpcomingDeadlines(today);
    const notificationsToCreate = [];

    for (const finding of findings) {
      if (!finding.rectificationDate) continue;

      const dueDate = new Date(finding.rectificationDate);
      dueDate.setHours(0, 0, 0, 0);
      
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const recipientIds = await getRecipientIds(finding);

      for (const userId of recipientIds) {
        const existing = await checkExistingNotification(userId, finding.id, today);
        if (!existing) {
          notificationsToCreate.push(createNotificationData(userId, finding, diffDays, dueDate));
        }
      }
    }

    if (notificationsToCreate.length > 0) {
      await prisma.notification.createMany({
        data: notificationsToCreate,
      });
      console.log(`[NOTIFICATIONS] Created ${notificationsToCreate.length} deadline reminders.`);
    }

    return { success: true, count: notificationsToCreate.length };
  } catch (error) {
    console.error('Failed to process rectification deadlines:', error);
    return { success: false, error: 'Processing failed' };
  }
}
