'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Fetches all metadata needed for the special audit form.
 */
export async function getSpecialAuditFormData() {
  try {
    const [branches, districts, departments] = await Promise.all([
      prisma.branch.findMany({ orderBy: { name: 'asc' } }),
      prisma.district.findMany({ orderBy: { name: 'asc' } }),
      prisma.department.findMany({ orderBy: { name: 'asc' } }),
    ]);

    return { branches, districts, departments };
  } catch (error) {
    console.error('Failed to fetch special audit metadata:', error);
    throw new Error('Database connection failed');
  }
}

/**
 * Retrieves the full list of special audit reports.
 */
export async function getSpecialAudits() {
  try {
    const audits = await prisma.specialAudit.findMany({
      include: { individuals: true },
      orderBy: { dateCreated: 'desc' },
    });

    return audits.map(a => ({
      ...a,
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
  try {
    const { individuals, ...rest } = data;

    await prisma.specialAudit.create({
      data: {
        ...rest,
        dateCreated: new Date(),
        individuals: {
          create: individuals.map((ind: any) => ({
            name: ind.name,
            position: ind.position,
            tenure: ind.tenure,
            age: parseInt(ind.age),
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
