'use server';

import { prisma } from '@/lib/prisma';
import { securePrisma } from '@/lib/securePrisma';
import { revalidatePath } from 'next/cache';
import { authorizeAction } from '@/lib/authorization';
import { specialAuditSchema } from '@/lib/schemas';

/**
 * Fetches all metadata needed for the special audit form.
 */
export async function getSpecialAuditFormData() {
  await authorizeAction();
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
  await authorizeAction({ allowedRoles: ['Admin', 'Auditor'] });
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
  await authorizeAction({ allowedRoles: ['Admin', 'Auditor'] });
  try {
    const validation = specialAuditSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: 'Invalid special audit data' };
    }
    const { individuals, ...rest } = validation.data;

    await prisma.specialAudit.create({
      data: {
        ...rest,
        dateCreated: new Date(),
        individuals: {
          create: individuals.map((ind: any) => ({
            name: ind.name,
            position: ind.position,
            tenure: ind.tenure,
            age: ind.age,
            sex: ind.sex
          }))
        }
      }
    });

    revalidatePath('/special-audits');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to submit special audit:', error);
    return { success: false, error: 'Failed to persist special audit data.' };
  }
}

/**
 * Removes a special audit report.
 */
export async function deleteSpecialAudit(id: string) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    await prisma.specialAudit.delete({
      where: { id }
    });
    revalidatePath('/special-audits');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete special audit:', error);
    return { success: false, error: 'Failed to remove special audit record.' };
  }
}
