'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Audit Hierarchy Actions
 */
export async function getHierarchy() {
  return await prisma.auditHierarchyNode.findMany({
    orderBy: [{ level: 'asc' }, { number: 'asc' }],
  });
}

export async function createHierarchyNode(data: any) {
  try {
    await prisma.auditHierarchyNode.create({ data });
    revalidatePath('/settings/audit-structure');
    return { success: true };
  } catch (error) {
    console.error('Create Hierarchy Node error:', error);
    return { success: false, error: 'Reference Number must be unique.' };
  }
}

export async function updateHierarchyNode(id: string, data: any) {
  try {
    await prisma.auditHierarchyNode.update({ where: { id }, data });
    revalidatePath('/settings/audit-structure');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Update failed.' };
  }
}

export async function deleteHierarchyNode(id: string) {
  try {
    // Note: In a production environment, you should handle recursive deletion 
    // or cascading deletes at the DB level.
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
  return await prisma.district.findMany({ orderBy: { name: 'asc' } });
}

export async function createDistrict(data: any) {
  await prisma.district.create({ data });
  revalidatePath('/districts');
  return { success: true };
}

export async function updateDistrict(id: string, data: any) {
  await prisma.district.update({ where: { id }, data });
  revalidatePath('/districts');
  return { success: true };
}

export async function getBranches() {
  return await prisma.branch.findMany({ 
    include: { district: true },
    orderBy: { name: 'asc' } 
  });
}

export async function createBranch(data: any) {
  const district = await prisma.district.findFirst({ where: { name: data.district } });
  if (!district) throw new Error('District not found');
  
  await prisma.branch.create({ 
    data: { 
      name: data.name,
      districtId: district.id
    } 
  });
  revalidatePath('/branches');
  return { success: true };
}

export async function updateBranch(id: string, data: any) {
  const district = await prisma.district.findFirst({ where: { name: data.district } });
  if (!district) throw new Error('District not found');

  await prisma.branch.update({ 
    where: { id }, 
    data: { 
      name: data.name,
      districtId: district.id
    } 
  });
  revalidatePath('/branches');
  return { success: true };
}

export async function deleteBranch(id: string) {
  await prisma.branch.delete({ where: { id } });
  revalidatePath('/branches');
  return { success: true };
}

/**
 * Department Actions
 */
export async function getDepartments() {
  return await prisma.department.findMany({ orderBy: { name: 'asc' } });
}

export async function createDepartment(data: any) {
  await prisma.department.create({ data });
  revalidatePath('/departments');
  return { success: true };
}

export async function updateDepartment(id: string, data: any) {
  await prisma.department.update({ where: { id }, data });
  revalidatePath('/departments');
  return { success: true };
}

export async function deleteDepartment(id: string) {
  await prisma.department.delete({ where: { id } });
  revalidatePath('/departments');
  return { success: true };
}

/**
 * Risk Level Actions
 */
export async function getRiskLevels() {
  return await prisma.riskLevel.findMany({ orderBy: { name: 'asc' } });
}

export async function createRiskLevel(data: any) {
  await prisma.riskLevel.create({ data });
  revalidatePath('/risk-levels');
  return { success: true };
}

export async function updateRiskLevel(id: string, data: any) {
  await prisma.riskLevel.update({ where: { id }, data });
  revalidatePath('/risk-levels');
  return { success: true };
}

/**
 * Finding Status Actions
 */
export async function getFindingStatuses() {
  return await prisma.findingStatus.findMany({ orderBy: { name: 'asc' } });
}

export async function createFindingStatus(data: any) {
  await prisma.findingStatus.create({ data });
  revalidatePath('/statuses');
  return { success: true };
}

export async function updateFindingStatus(id: string, data: any) {
  await prisma.findingStatus.update({ where: { id }, data });
  revalidatePath('/statuses');
  return { success: true };
}
