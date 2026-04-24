
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Verifies user credentials and returns full profile with role-based permissions.
 */
export async function loginUser(data: any) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { 
        role: true 
      }
    });

    if (!user) {
      return { success: false, error: 'User record not found.' };
    }

    if (user.password !== data.password) {
      return { success: false, error: 'Invalid security credentials.' };
    }

    if (user.status !== 'Active') {
      return { success: false, error: 'Account is currently inactive. Contact Admin.' };
    }

    // Return serializable user data
    return {
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role.name,
        permissions: user.role.permissions, // e.g. ['audit_read', 'reports_read']
        branch: user.branch,
        district: user.district
      }
    };
  } catch (error) {
    console.error('Login verification error:', error);
    return { success: false, error: 'Database connection failed during authentication.' };
  }
}

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { fullName: 'asc' },
    });
    return users.map(u => ({
      ...u,
      role: u.role.name,
      dateJoined: u.dateJoined.toISOString().split('T')[0],
    }));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw new Error('Database connection failed');
  }
}

export async function getRoles() {
  try {
    return await prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    throw new Error('Database connection failed');
  }
}

export async function createUser(data: any) {
  try {
    const role = await prisma.role.findFirst({
      where: { name: data.role }
    });

    if (!role) throw new Error('Role not found');

    await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        roleId: role.id,
        status: data.status || 'Active',
        branch: data.branch || 'Head Office',
        district: data.district || 'HQ',
      }
    });

    revalidatePath('/users');
    revalidatePath('/register');
    revalidatePath('/special-onboarding');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to create user:', error);
    return { success: false, error: error.message || 'User registration failed' };
  }
}

export async function updateUser(id: string, data: any) {
  try {
    const updateData: any = { ...data };
    
    if (data.role) {
      const role = await prisma.role.findFirst({
        where: { name: data.role }
      });
      if (role) {
        updateData.roleId = role.id;
        delete updateData.role;
      }
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user:', error);
    return { success: false, error: 'User update failed' };
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath('/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete user:', error);
    return { success: false, error: 'User removal failed' };
  }
}

export async function createRole(data: any) {
  try {
    await prisma.role.create({ data });
    revalidatePath('/roles');
    return { success: true };
  } catch (error) {
    console.error('Failed to create role:', error);
    return { success: false, error: 'Role creation failed' };
  }
}

export async function updateRole(id: string, data: any) {
  try {
    await prisma.role.update({
      where: { id },
      data,
    });
    revalidatePath('/roles');
    return { success: true };
  } catch (error) {
    console.error('Failed to update role:', error);
    return { success: false, error: 'Role update failed' };
  }
}

export async function deleteRole(id: string) {
  try {
    await prisma.role.delete({ where: { id } });
    revalidatePath('/roles');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete role:', error);
    return { success: false, error: 'Role removal failed' };
  }
}