'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { authorizeAction } from '@/lib/authorization';

import { 
  hierarchyNodeSchema, 
  branchSchema, 
  districtSchema, 
  departmentSchema, 
  riskLevelSchema, 
  findingStatusSchema,
  followUpStatusSchema,
  specialFindingCategorySchema
} from '@/lib/schemas';
import { logSecurityEvent } from '@/lib/securityLogger';

/**
 * Audit Hierarchy Actions
 */
export async function getHierarchy() {
  await authorizeAction();

  return await prisma.auditHierarchyNode.findMany({
    orderBy: [{ level: 'asc' }, { number: 'asc' }],
  });
}

export async function createHierarchyNode(data: any) {
  const user = await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const validation = hierarchyNodeSchema.safeParse(data);
    if (!validation.success) return { success: false, error: 'Invalid data' };

    const result = await prisma.auditHierarchyNode.create({ data: validation.data });
    await logSecurityEvent('SENSITIVE_OP', {
      userId: user.id,
      action: `Created hierarchy node: ${result.title}`,
      resourceId: result.id,
      resourceType: 'AuditHierarchyNode',
    });
    revalidatePath('/settings/audit-structure');
    return { success: true };
  } catch (error) {
    console.error('Create Hierarchy Node error:', error);
    return { success: false, error: 'Reference Number must be unique.' };
  }
}

export async function updateHierarchyNode(id: string, data: any) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const validation = hierarchyNodeSchema.partial().safeParse(data);
    if (!validation.success) return { success: false, error: 'Invalid data' };

    await prisma.auditHierarchyNode.update({ where: { id }, data: validation.data });
    revalidatePath('/settings/audit-structure');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Update failed.' };
  }
}

/**
 * Special Finding Category Actions
 */
export async function getSpecialFindingCategories() {
  await authorizeAction();
  return await prisma.specialFindingCategory.findMany({ orderBy: { name: 'asc' } });
}

export async function createSpecialFindingCategory(data: any) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const validation = specialFindingCategorySchema.safeParse(data);
    if (!validation.success) return { success: false, error: 'Invalid data' };

    await prisma.specialFindingCategory.create({ data: validation.data });
    revalidatePath('/settings/special-finding-categories');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Creation failed.' };
  }
}

export async function updateSpecialFindingCategory(id: string, data: any) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const validation = specialFindingCategorySchema.partial().safeParse(data);
    if (!validation.success) return { success: false, error: 'Invalid data' };

    await prisma.specialFindingCategory.update({ where: { id }, data: validation.data });
    revalidatePath('/settings/special-finding-categories');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Update failed.' };
  }
}

export async function deleteSpecialFindingCategory(id: string) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    await prisma.specialFindingCategory.delete({ where: { id } });
    revalidatePath('/settings/special-finding-categories');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Delete failed.' };
  }
}

export async function deleteHierarchyNode(id: string) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    await prisma.auditHierarchyNode.delete({ where: { id } });
    revalidatePath('/settings/audit-structure');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Delete failed.' };
  }
}

/**
 * Branch & District Actions
 */
export async function getDistricts() {
  await authorizeAction();
  return await prisma.district.findMany({ orderBy: { name: 'asc' } });
}

export async function createDistrict(data: any) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const validation = districtSchema.safeParse(data);
    if (!validation.success) return { success: false, error: 'Invalid data' };

    await prisma.district.create({ data: validation.data });
    revalidatePath('/districts');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Creation failed.' };
  }
}

export async function updateDistrict(id: string, data: any) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const validation = districtSchema.partial().safeParse(data);
    if (!validation.success) return { success: false, error: 'Invalid data' };

    await prisma.district.update({ where: { id }, data: validation.data });
    revalidatePath('/districts');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Update failed.' };
  }
}

export async function deleteDistrict(id: string) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    await prisma.district.delete({ where: { id } });
    revalidatePath('/districts');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Delete failed.' };
  }
}

export async function getBranches() {
  await authorizeAction();
  return await prisma.branch.findMany({ 
    include: { district: true },
    orderBy: { name: 'asc' } 
  });
}

export async function createBranch(data: any) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const validation = branchSchema.safeParse(data);
    if (!validation.success) return { success: false, error: 'Invalid data' };

    const district = await prisma.district.findFirst({ where: { name: validation.data.district } });
    if (!district) return { success: false, error: 'District not found' };
    
    await prisma.branch.create({ 
      data: { 
        name: validation.data.name,
        districtId: district.id
      } 
    });
    revalidatePath('/branches');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Creation failed.' };
  }
}

export async function updateBranch(id: string, data: any) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const validation = branchSchema.partial().safeParse(data);
    if (!validation.success) return { success: false, error: 'Invalid data' };

    const district = await prisma.district.findFirst({ where: { name: validation.data.district } });
    if (!district) return { success: false, error: 'District not found' };

    await prisma.branch.update({ 
      where: { id }, 
      data: { 
        name: validation.data.name,
        districtId: district.id
      } 
    });
    revalidatePath('/branches');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Update failed.' };
  }
}

export async function deleteBranch(id: string) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    await prisma.branch.delete({ where: { id } });
    revalidatePath('/branches');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Delete failed.' };
  }
}

/**
 * Department Actions
 */
export async function getDepartments() {
  await authorizeAction();
  return await prisma.department.findMany({ orderBy: { name: 'asc' } });
}

export async function createDepartment(data: any) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const validation = departmentSchema.safeParse(data);
    if (!validation.success) return { success: false, error: 'Invalid data' };

    await prisma.department.create({ data: validation.data });
    revalidatePath('/departments');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Creation failed.' };
  }
}

export async function updateDepartment(id: string, data: any) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const validation = departmentSchema.partial().safeParse(data);
    if (!validation.success) return { success: false, error: 'Invalid data' };

    await prisma.department.update({ where: { id }, data: validation.data });
    revalidatePath('/departments');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Update failed.' };
  }
}

export async function deleteDepartment(id: string) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    await prisma.department.delete({ where: { id } });
    revalidatePath('/departments');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Delete failed.' };
  }
}

/**
 * Risk Level Actions
 */
export async function getRiskLevels() {
  await authorizeAction();
  return await prisma.riskLevel.findMany({ orderBy: { name: 'asc' } });
}

export async function createRiskLevel(data: any) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const validation = riskLevelSchema.safeParse(data);
    if (!validation.success) return { success: false, error: 'Invalid data' };

    await prisma.riskLevel.create({ data: validation.data });
    revalidatePath('/risk-levels');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Creation failed.' };
  }
}

export async function updateRiskLevel(id: string, data: any) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const validation = riskLevelSchema.partial().safeParse(data);
    if (!validation.success) return { success: false, error: 'Invalid data' };

    await prisma.riskLevel.update({ where: { id }, data: validation.data });
    revalidatePath('/risk-levels');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Update failed.' };
  }
}

export async function deleteRiskLevel(id: string) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    await prisma.riskLevel.delete({ where: { id } });
    revalidatePath('/risk-levels');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Delete failed.' };
  }
}

/**
 * Finding Status Actions
 */
const DEFAULT_FOLLOW_UP_STATUSES = [
  'Pending',
  'Rectified',
  'Partially Rectified',
  'Refereed',
  'Action Plan',
];

export async function getFindingStatuses() {
  await authorizeAction();
  return await prisma.findingStatus.findMany({ orderBy: { name: 'asc' } });
}

export async function ensureFollowUpStatuses() {
  const existing = await prisma.followUpStatus.findMany({ orderBy: { name: 'asc' } });
  if (existing.length > 0) return existing;

  const created = await prisma.$transaction(
    DEFAULT_FOLLOW_UP_STATUSES.map((name) => prisma.followUpStatus.create({ data: { name } }))
  );

  return created;
}

export async function createFindingStatus(data: any) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const validation = findingStatusSchema.safeParse(data);
    if (!validation.success) return { success: false, error: 'Invalid data' };

    await prisma.findingStatus.create({ data: validation.data });
    revalidatePath('/statuses');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Creation failed.' };
  }
}

export async function updateFindingStatus(id: string, data: any) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const validation = findingStatusSchema.partial().safeParse(data);
    if (!validation.success) return { success: false, error: 'Invalid data' };

    await prisma.findingStatus.update({ where: { id }, data: validation.data });
    revalidatePath('/statuses');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Update failed.' };
  }
}

export async function deleteFindingStatus(id: string) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    await prisma.findingStatus.delete({ where: { id } });
    revalidatePath('/statuses');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Delete failed.' };
  }
}

export async function getFollowUpStatuses() {
  await authorizeAction();
  return await ensureFollowUpStatuses();
}

export async function createFollowUpStatus(data: any) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const validation = followUpStatusSchema.safeParse(data);
    if (!validation.success) return { success: false, error: 'Invalid data' };

    await prisma.followUpStatus.create({ data: validation.data });
    revalidatePath('/settings/follow-up-statuses');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Creation failed.' };
  }
}

export async function updateFollowUpStatus(id: string, data: any) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const validation = followUpStatusSchema.partial().safeParse(data);
    if (!validation.success) return { success: false, error: 'Invalid data' };

    await prisma.followUpStatus.update({ where: { id }, data: validation.data });
    revalidatePath('/settings/follow-up-statuses');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Update failed.' };
  }
}

export async function deleteFollowUpStatus(id: string) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    await prisma.followUpStatus.delete({ where: { id } });
    revalidatePath('/settings/follow-up-statuses');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Delete failed.' };
  }
}

/**
 * Bulk Import Actions
 */
export async function bulkImportDistricts(districts: { name: string }[]) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const results = await prisma.$transaction(
      districts.map(d => prisma.district.upsert({
        where: { name: d.name },
        update: {},
        create: { name: d.name }
      }))
    );
    revalidatePath('/districts');
    return { success: true, count: results.length };
  } catch (error) {
    console.error('Bulk Import Districts error:', error);
    return { success: false, error: 'Bulk import failed.' };
  }
}

export async function bulkImportBranches(branches: { name: string, districtName: string }[]) {
  const user = await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    // 1. Get all unique district names from the input
    const districtNames = Array.from(new Set(branches.map(b => b.districtName)));
    
    // 2. Ensure all districts exist (upsert)
    const districtResults = await Promise.all(
      districtNames.map(name => prisma.district.upsert({
        where: { name },
        update: {},
        create: { name }
      }))
    );
    
    // Create a map for quick lookup
    const districtMap = new Map(districtResults.map(d => [d.name, d.id]));

    // 3. Import branches
    const results = await prisma.$transaction(
      branches.map(b => {
        const districtId = districtMap.get(b.districtName);
        if (!districtId) throw new Error(`District ${b.districtName} not found`);
        return prisma.branch.upsert({
          where: { name: b.name },
          update: { districtId },
          create: { name: b.name, districtId }
        });
      })
    );
    
    await logSecurityEvent('DATA_IMPORT', {
      userId: user.id,
      action: `Bulk imported ${results.length} branches`,
    });
    
    revalidatePath('/branches');
    return { success: true, count: results.length };
  } catch (error) {
    console.error('Bulk Import Branches error:', error);
    return { success: false, error: 'Bulk import failed.' };
  }
}

export async function bulkImportDepartments(departments: { name: string }[]) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const results = await prisma.$transaction(
      departments.map(d => prisma.department.upsert({
        where: { name: d.name },
        update: {},
        create: { name: d.name }
      }))
    );
    revalidatePath('/departments');
    return { success: true, count: results.length };
  } catch (error) {
    console.error('Bulk Import Departments error:', error);
    return { success: false, error: 'Bulk import failed.' };
  }
}
