'use server';

import { prisma } from '@/lib/prisma';
import { securePrisma } from '@/lib/securePrisma';
import { revalidatePath } from 'next/cache';
import { authorizeAction, effectivePermissionsFor } from '@/lib/authorization';
import { SPECIAL_AUDITEE_VIEW_PERMISSION } from '@/lib/permissions';
import { ensureFollowUpStatuses } from '@/app/actions/settings';
import { specialAuditSchema } from '@/lib/schemas';

/**
 * Fetches all metadata needed for the special audit form.
 */
export async function getSpecialAuditFormData() {
  await authorizeAction({ anyPermissions: ['special_audits_new_access', 'reports_special_audits_access'] });
  try {
    const [branches, districts, departments, categories] = await Promise.all([
      prisma.branch.findMany({ orderBy: { name: 'asc' } }),
      prisma.district.findMany({ orderBy: { name: 'asc' } }),
      prisma.department.findMany({ orderBy: { name: 'asc' } }),
      prisma.specialFindingCategory.findMany({ orderBy: { name: 'asc' } }),
    ]);

    return { branches, districts, departments, categories };
  } catch (error) {
    console.error('Failed to fetch special audit metadata:', error);
    throw new Error('Database connection failed');
  }
}

/**
 * Retrieves the full list of special audit reports.
 */
export async function getSpecialAudits() {
  // The /special-audits register is the "Special Audit Reports" page; loggers can see it too.
  await authorizeAction({ anyPermissions: ['reports_special_audits_access', 'special_audits_new_access'] });
  try {
    const audits = await securePrisma.specialAudit.findMany({
      include: { 
        individuals: true,
        category: true 
      },
      orderBy: { dateCreated: 'desc' },
    });

    return audits.map(a => ({
      ...a,
      individuals: Array.isArray(a.individuals) ? a.individuals : [],
      category: a.category?.name || 'Uncategorized',
      dateCreated: a.dateCreated.toISOString()
    }));
  } catch (error) {
    console.error('Failed to fetch special audits:', error);
    throw new Error('Database connection failed');
  }
}

/**
 * Persists a new special audit report to the database.
 */
export async function submitSpecialAudit(data: any) {
  await authorizeAction({ allowedPermissions: ['special_audits_new_access'] });
  try {
    const validation = specialAuditSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: 'Please correct the highlighted fields.',
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const { individuals, categoryId, dateCreated: requestedDate, ...rest } = validation.data;

    // Default to today; accept an earlier date so previous-period cases can be recorded.
    let dateCreated = new Date();
    if (requestedDate) {
      const parsed = new Date(requestedDate);
      if (isNaN(parsed.getTime())) {
        return { success: false, error: 'Report date is invalid.', fieldErrors: { dateCreated: ['Report date is invalid.'] } };
      }
      if (parsed.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
        return { success: false, error: 'Report date cannot be in the future.', fieldErrors: { dateCreated: ['Report date cannot be in the future.'] } };
      }
      dateCreated = parsed;
    }

    await prisma.specialAudit.create({
      data: {
        ...rest,
        // Only connect category when a valid id is supplied
        ...(categoryId ? { categoryId } : {}),
        dateCreated,
        individuals: {
          create: individuals.map((ind: any) => ({
            name: ind.name,
            position: ind.position,
            tenure: ind.tenure,
            age: ind.age,
            sex: ind.sex,
          })),
        },
      },
    });

    revalidatePath('/special-audits');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to submit special audit:', error);
    return { success: false, error: 'Failed to save the report. Please try again.' };
  }
}

/**
 * Removes a special audit report.
 */
export async function deleteSpecialAudit(id: string) {
  // Admins, or roles holding both the Special Auditee View and the Delete permission.
  await authorizeAction({ allowedPermissions: [SPECIAL_AUDITEE_VIEW_PERMISSION, 'auditee_view_delete_finding'] });
  try {
    await prisma.specialAudit.delete({
      where: { id }
    });
    revalidatePath('/special-audits');
    revalidatePath('/auditee-view');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete special audit:', error);
    return { success: false, error: 'Failed to remove special audit record.' };
  }
}

// ---------------------------------------------------------------------------
// Special audit case management (status, follow-up, progress, auditee response)
// ---------------------------------------------------------------------------

type SpecialAuditCaseIntent = 'status' | 'follow_up' | 'progress' | 'response';

const CASE_INTENT_PERMISSION: Record<SpecialAuditCaseIntent, string> = {
  status: 'auditee_view_change_status',
  follow_up: 'auditee_view_follow_up',
  progress: 'auditee_view_add_progress',
  response: 'auditee_view_auditee_response',
};

function formatCase(a: any) {
  return {
    ...a,
    individuals: Array.isArray(a.individuals) ? a.individuals : [],
    category: a.category?.name || 'Uncategorized',
    dateCreated: a.dateCreated.toISOString(),
    auditeeResponseDate: a.auditeeResponseDate ? a.auditeeResponseDate.toISOString() : null,
    progressUpdates: Array.isArray(a.progressUpdates) ? a.progressUpdates : [],
    auditeeResponse: a.auditeeResponse || '',
  };
}

/**
 * Data for the Special Auditee View (a tab of /auditee-view): special audit cases
 * plus the status lists used by its action menu. Requires the Special Auditee View
 * permission; the Special Audit Reports permission alone is not enough.
 */
export async function getSpecialAuditeeViewData() {
  await authorizeAction({ allowedPermissions: [SPECIAL_AUDITEE_VIEW_PERMISSION] });
  try {
    const [audits, statuses, followUpStatuses] = await Promise.all([
      securePrisma.specialAudit.findMany({
        include: { individuals: true, category: true },
        orderBy: { dateCreated: 'desc' },
      }),
      prisma.findingStatus.findMany({ orderBy: { name: 'asc' } }),
      ensureFollowUpStatuses(),
    ]);
    return { audits: audits.map(formatCase), statuses, followUpStatuses };
  } catch (error) {
    console.error('Failed to fetch special auditee view data:', error);
    throw new Error('Database connection failed');
  }
}

/**
 * Updates the workflow status, follow-up status, progress notes or auditee
 * response of a special audit case. Only the fields belonging to `intent` are written.
 */
export async function updateSpecialAuditCase(id: string, data: any, intent: SpecialAuditCaseIntent) {
  // Case actions belong to the Special Auditee View: the view permission AND the
  // action permission are both required (Admins bypass).
  const user = await authorizeAction();
  const perms = effectivePermissionsFor(user);
  const allowed =
    user?.role?.name === 'Admin' ||
    (perms.includes(SPECIAL_AUDITEE_VIEW_PERMISSION) && perms.includes(CASE_INTENT_PERMISSION[intent]));
  if (!allowed) {
    return { success: false, error: 'You do not have permission to perform this action.' };
  }

  try {
    const visible = await securePrisma.specialAudit.findMany({ where: { id }, select: { id: true } });
    if (visible.length === 0) return { success: false, error: 'Case not found' };

    let update: Record<string, any>;
    switch (intent) {
      case 'status':
        if (typeof data.status !== 'string' || !data.status.trim()) return { success: false, error: 'Status is required.' };
        update = { status: data.status.trim() };
        break;
      case 'follow_up':
        if (typeof data.followUpStatus !== 'string' || !data.followUpStatus.trim()) return { success: false, error: 'Follow-up status is required.' };
        {
          const list = (v: any) => (Array.isArray(v) ? v : undefined);
          update = {
            followUpStatus: data.followUpStatus.trim(),
            verbalComm: list(data.verbalComm),
            writtenComm: list(data.writtenComm),
            esc1: list(data.esc1),
            esc2: list(data.esc2),
            forwardingHistory: list(data.forwardingHistory),
            followUpRecommendations: typeof data.followUpRecommendations === 'string' ? data.followUpRecommendations : undefined,
            isClosed: typeof data.isClosed === 'boolean' ? data.isClosed : undefined,
            collaboratingWith: typeof data.collaboratingWith === 'string' ? data.collaboratingWith : undefined,
          };
        }
        break;
      case 'progress':
        if (!Array.isArray(data.progressUpdates)) return { success: false, error: 'Invalid progress updates.' };
        update = {
          progressUpdates: data.progressUpdates.map((p: any) => ({
            id: String(p.id),
            date: p.date,
            details: String(p.details ?? ''),
          })),
        };
        break;
      case 'response':
      {
        const agreement = data.auditeeAgreement;
        if (!['Agreed', 'Partially Agreed', 'Declined'].includes(agreement)) {
          return { success: false, error: 'Select whether you agree with this case.' };
        }
        const reason = typeof data.auditeeResponse === 'string' ? data.auditeeResponse.trim() : '';
        if (agreement !== 'Agreed' && !reason) {
          return { success: false, error: 'Please give the reason for your response.' };
        }
        const due = agreement !== 'Declined' && data.mitigationDueDate ? new Date(data.mitigationDueDate) : null;
        if (due && isNaN(due.getTime())) return { success: false, error: 'Invalid mitigation due date.' };
        update = {
          auditeeAgreement: agreement,
          auditeeResponse: agreement === 'Agreed' ? '' : reason,
          mitigationDueDate: due,
          auditeeResponseDate: new Date(),
        };
        break;
      }
    }

    await prisma.specialAudit.update({ where: { id }, data: update });
    revalidatePath('/auditee-view');
    revalidatePath('/special-audits');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to update special audit case:', error);
    return { success: false, error: 'Update failed' };
  }
}
