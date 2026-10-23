'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { authorizeAction } from '@/lib/authorization';

import { 
  hierarchyNodeSchema, 
  hierarchyNodeCreateSchema,
  branchSchema, 
  districtSchema, 
  departmentSchema, 
  riskLevelSchema, 
  findingStatusSchema,
  followUpStatusSchema,
  specialFindingCategorySchema
} from '@/lib/schemas';
import { logSecurityEvent } from '@/lib/securityLogger';
import { suggestNextNumber } from '@/lib/hierarchy';

/**
 * Audit Hierarchy Actions
 */
export async function getHierarchy() {
  await authorizeAction({ anyPermissions: ['settings_audit_structure_access'] });

  return await prisma.auditHierarchyNode.findMany({
    orderBy: [{ level: 'asc' }, { number: 'asc' }],
  });
}

/**
 * Creates one node. The level always comes from the parent, and the Ref No. is
 * generated (next free number under the parent) unless one is supplied.
 */
export async function createHierarchyNode(data: any) {
  const user = await authorizeAction({ anyPermissions: ['settings_audit_structure_access'] });
  try {
    const validation = hierarchyNodeCreateSchema.safeParse(data);
    if (!validation.success) return { success: false, error: 'Please enter a title.' };
    const { title, number, parentId, customFields } = validation.data;

    const nodes = await prisma.auditHierarchyNode.findMany({
      select: { id: true, number: true, level: true, parentId: true },
    });
    const parent = parentId ? nodes.find((n) => n.id === parentId) ?? null : null;
    if (parentId && !parent) return { success: false, error: 'The parent level no longer exists.' };

    if (number && nodes.some((n) => n.number === number)) {
      return { success: false, error: `Ref No. ${number} is already used. Leave it blank to number it automatically.` };
    }

    const result = await prisma.auditHierarchyNode.create({
      data: {
        title,
        number: number || suggestNextNumber(nodes, parent),
        level: parent ? parent.level + 1 : 1,
        parentId: parent?.id ?? null,
        ...(customFields ? { customFields } : {}),
      },
    });
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
    return { success: false, error: 'Could not save this level. Please try again.' };
  }
}

/**
 * Creates several sibling nodes in one go (one title per entry), numbering each
 * automatically under `parentId` (or as Level 1 missions when null).
 */
export async function createHierarchyNodes(parentId: string | null, titles: string[]) {
  const user = await authorizeAction({ anyPermissions: ['settings_audit_structure_access'] });
  const clean = (Array.isArray(titles) ? titles : [])
    .map((t) => (typeof t === 'string' ? t.trim() : ''))
    .filter(Boolean);
  if (clean.length === 0) return { success: false, error: 'Enter at least one title.' };
  if (clean.length > 100) return { success: false, error: 'Add at most 100 levels at a time.' };

  try {
    const nodes = await prisma.auditHierarchyNode.findMany({
      select: { id: true, number: true, level: true, parentId: true },
    });
    const parent = parentId ? nodes.find((n) => n.id === parentId) ?? null : null;
    if (parentId && !parent) return { success: false, error: 'The parent level no longer exists.' };

    // Number in memory so each title sees the ones just assigned, then write atomically.
    const rows = clean.map((title) => {
      const number = suggestNextNumber(nodes, parent);
      nodes.push({ id: `pending-${number}`, number, level: parent ? parent.level + 1 : 1, parentId: parent?.id ?? null });
      return { title, number, level: parent ? parent.level + 1 : 1, parentId: parent?.id ?? null };
    });
    await prisma.$transaction(rows.map((data) => prisma.auditHierarchyNode.create({ data })));

    await logSecurityEvent('SENSITIVE_OP', {
      userId: user.id,
      action: `Created ${rows.length} hierarchy nodes${parent ? ` under ${parent.number}` : ''}`,
      resourceType: 'AuditHierarchyNode',
    });
    revalidatePath('/settings/audit-structure');
    return { success: true, created: rows.length };
  } catch (error) {
    console.error('Create Hierarchy Nodes error:', error);
    return { success: false, error: 'Could not save these levels. Please try again.' };
  }
}

export async function updateHierarchyNode(id: string, data: any) {
  await authorizeAction({ anyPermissions: ['settings_audit_structure_access'] });
  try {
    const validation = hierarchyNodeSchema.partial().safeParse(data);
    if (!validation.success) return { success: false, error: 'Invalid data' };

    await prisma.auditHierarchyNode.update({ where: { id }, data: validation.data });
    revalidatePath('/settings/audit-structure');
    return { success: true };
  } catch (error: any) {
    if (error?.code === 'P2002') return { success: false, error: 'That Ref No. is already used by another level.' };
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
  await authorizeAction({ anyPermissions: ['settings_special_finding_categories_access'] });
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
  await authorizeAction({ anyPermissions: ['settings_special_finding_categories_access'] });
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
  await authorizeAction({ anyPermissions: ['settings_special_finding_categories_access'] });
  try {
    await prisma.specialFindingCategory.delete({ where: { id } });
    revalidatePath('/settings/special-finding-categories');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Delete failed.' };
  }
}

export async function deleteHierarchyNode(id: string) {
  await authorizeAction({ anyPermissions: ['settings_audit_structure_access'] });
  try {
    const nodes = await prisma.auditHierarchyNode.findMany({ select: { id: true, number: true, parentId: true } });
    const target = nodes.find((n) => n.id === id);
    if (!target) return { success: true }; // already gone

    // A level cannot be removed while it has sub-levels, or while findings are logged
    // under it or any sub-level. Deleting would orphan (or destroy) audit records.
    const childrenOf = (parent: string) => nodes.filter((n) => n.parentId === parent);
    if (childrenOf(id).length > 0) {
      return { success: false, error: `Level ${target.number} has sub-levels. Delete or move those first.` };
    }
    const findingCount = await prisma.auditFinding.count({ where: { hierarchyNodeId: id } });
    if (findingCount > 0) {
      return {
        success: false,
        error: `Level ${target.number} cannot be deleted: ${findingCount} finding${findingCount === 1 ? ' is' : 's are'} logged under it. Rename it instead, or remove those findings first.`,
      };
    }

    await prisma.auditHierarchyNode.delete({ where: { id } });
    revalidatePath('/settings/audit-structure');
    return { success: true };
  } catch (error) {
    console.error('Delete Hierarchy Node error:', error);
    return { success: false, error: 'Delete failed. Please try again.' };
  }
}

/**
 * Branch & District Actions
 */
export async function getDistricts() {
  // Also readable by users managing Branches, since branch registration
  // needs the district list to populate its district picker.
  await authorizeAction({ anyPermissions: ['settings_districts_access', 'settings_branches_access'] });
  return await prisma.district.findMany({ orderBy: { name: 'asc' } });
}

export async function createDistrict(data: any) {
  await authorizeAction({ anyPermissions: ['settings_districts_access'] });
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
  await authorizeAction({ anyPermissions: ['settings_districts_access'] });
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
  await authorizeAction({ anyPermissions: ['settings_districts_access'] });
  try {
    await prisma.district.delete({ where: { id } });
    revalidatePath('/districts');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Delete failed.' };
  }
}

export async function getBranches() {
  await authorizeAction({ anyPermissions: ['settings_branches_access'] });
  return await prisma.branch.findMany({ 
    include: { district: true },
    orderBy: { name: 'asc' } 
  });
}

export async function createBranch(data: any) {
  await authorizeAction({ anyPermissions: ['settings_branches_access'] });
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
  await authorizeAction({ anyPermissions: ['settings_branches_access'] });
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
  await authorizeAction({ anyPermissions: ['settings_branches_access'] });
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
  await authorizeAction({ anyPermissions: ['settings_departments_access'] });
  return await prisma.department.findMany({ orderBy: { name: 'asc' } });
}

export async function createDepartment(data: any) {
  await authorizeAction({ anyPermissions: ['settings_departments_access'] });
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
  await authorizeAction({ anyPermissions: ['settings_departments_access'] });
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
  await authorizeAction({ anyPermissions: ['settings_departments_access'] });
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
  await authorizeAction({ anyPermissions: ['settings_risk_levels_access'] });
  return await prisma.riskLevel.findMany({ orderBy: { name: 'asc' } });
}

export async function createRiskLevel(data: any) {
  await authorizeAction({ anyPermissions: ['settings_risk_levels_access'] });
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
  await authorizeAction({ anyPermissions: ['settings_risk_levels_access'] });
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
  await authorizeAction({ anyPermissions: ['settings_risk_levels_access'] });
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
  'Referred',
  'Action Plan',
];

export async function getFindingStatuses() {
  await authorizeAction({ anyPermissions: ['settings_statuses_access'] });
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
  await authorizeAction({ anyPermissions: ['settings_statuses_access'] });
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
  await authorizeAction({ anyPermissions: ['settings_statuses_access'] });
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
  await authorizeAction({ anyPermissions: ['settings_statuses_access'] });
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
  await authorizeAction({ anyPermissions: ['settings_follow_up_statuses_access'] });
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
  await authorizeAction({ anyPermissions: ['settings_follow_up_statuses_access'] });
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
  await authorizeAction({ anyPermissions: ['settings_follow_up_statuses_access'] });
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
  await authorizeAction({ anyPermissions: ['settings_districts_access'] });
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
  const user = await authorizeAction({ anyPermissions: ['settings_branches_access'] });
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
  await authorizeAction({ anyPermissions: ['settings_departments_access'] });
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
