
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { normalizePermissions } from '@/lib/permissions';
import { signToken, verifyToken, getUserFromCookiesServer, createSecureSession, clearAuthCookies, invalidateAllUserSessions, invalidateSession } from '@/lib/serverAuth';
import { sendTemporaryPasswordEmail } from '@/lib/mailer';
import crypto from 'crypto';
import { authorizeAction, AuthorizationError } from '@/lib/authorization';
import { isPasswordExpired, verifyPassword, hashPassword } from '@/lib/passwordUtils';
import { createUserSchema, updateUserSchema, loginSchema, roleSchema } from '@/lib/schemas';
import { logSecurityEvent } from '@/lib/securityLogger';

const LOCKOUT_MSG = 'Account temporarily locked due to too many failed attempts. Please try again in 30 seconds.';

async function incrementAttempt(identifier: string) {
  const existing = await (prisma as any).loginAttempt.findUnique({ where: { identifier } });
  const now = new Date();

  if (existing && existing.lockedUntil && existing.lockedUntil < now) {
    // Lock has expired. Reset attempts to 1 for this new cycle.
    await (prisma as any).loginAttempt.update({
      where: { identifier },
      data: { attempts: 1, lastAttemptAt: now, lockedUntil: null }
    });
    return null;
  }

  const record = await (prisma as any).loginAttempt.upsert({
    where: { identifier },
    update: { attempts: { increment: 1 }, lastAttemptAt: now },
    create: { identifier, attempts: 1 }
  });

  if (record.attempts >= 5) {
    const updated = await (prisma as any).loginAttempt.update({
      where: { identifier },
      data: { lockedUntil: new Date(now.getTime() + 30 * 1000) }
    });
    return updated.lockedUntil;
  }
  return null;
}

async function resetAttempt(identifier: string) {
  await (prisma as any).loginAttempt.updateMany({
    where: { identifier },
    data: { attempts: 0, lockedUntil: null }
  });
}

/**
 * Verifies user credentials and returns full profile with role-based permissions.
 */
export async function loginUser(data: any) {
  try {
    const h = headers();
    const contentLength = h.get('content-length');
    if (contentLength && parseInt(contentLength) > 2048) {
      return { success: false, error: 'Payload too large' };
    }

    const loginPromise = async () => {
      // ❗ Strict Input Validation
      const validation = loginSchema.safeParse(data);
      if (!validation.success) {
        await logSecurityEvent('AUTH_LOGIN_FAILURE', {
          email: data.email || 'unknown',
          action: 'Invalid login input validation failed',
        });
        return { success: false, error: 'Invalid input data' };
      }
      const { email, password } = validation.data;
      const ip = h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || '127.0.0.1';

      // ❗ Failed Login Attempt Lockout Check
      const [ipAttempt, emailAttempt] = await Promise.all([
        (prisma as any).loginAttempt.findUnique({ where: { identifier: ip } }),
        (prisma as any).loginAttempt.findUnique({ where: { identifier: email } })
      ]);

      const now = new Date();
      if ((ipAttempt && ipAttempt.attempts >= 5 && ipAttempt.lockedUntil && ipAttempt.lockedUntil > now) ||
          (emailAttempt && emailAttempt.attempts >= 5 && emailAttempt.lockedUntil && emailAttempt.lockedUntil > now)) {
        const lockedUntil = (ipAttempt && ipAttempt.lockedUntil && ipAttempt.lockedUntil > now) 
          ? ipAttempt.lockedUntil 
          : emailAttempt.lockedUntil;
        return { success: false, error: LOCKOUT_MSG, lockedUntil };
      }

      const user = await prisma.user.findUnique({
        where: { email },
        include: { 
          role: true 
        }
      });

      // ❗ Generic error message to prevent user enumeration
      const GENERIC_ERROR = 'Invalid email or password.';

      if (!user) {
        await logSecurityEvent('AUTH_LOGIN_FAILURE', {
          email,
          action: 'Login failed: user not found',
        });
        const ipLocked = await incrementAttempt(ip);
        const emailLocked = await incrementAttempt(email);
        const lockedUntil = ipLocked || emailLocked;
        return { success: false, error: GENERIC_ERROR, lockedUntil };
      }

      const isMatch = await verifyPassword(password, user.password);
      if (!isMatch) {
        await logSecurityEvent('AUTH_LOGIN_FAILURE', {
          userId: user.id,
          email,
          action: 'Login failed: incorrect password',
        });
        const ipLocked = await incrementAttempt(ip);
        const emailLocked = await incrementAttempt(email);
        const lockedUntil = ipLocked || emailLocked;
        return { success: false, error: GENERIC_ERROR, lockedUntil };
      }

      if (user.status !== 'Active') {
        await logSecurityEvent('AUTH_LOGIN_FAILURE', {
          userId: user.id,
          email,
          action: 'Login failed: account inactive',
        });
        return { success: false, error: 'Account is currently inactive. Contact Admin.' };
      }

      const needsPasswordChange = user.requirePasswordChange || isPasswordExpired(user.passwordLastChanged);

      // Return sanitized user object with permissions
      const userData = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role.name,
        permissions: user.role.permissions,
        branch: user.branch,
        district: user.district,
        dateJoined: user.dateJoined.toISOString().split('T')[0],
        requirePasswordChange: needsPasswordChange, // Include this for the frontend
      };

      // ❗ Reset lockouts on successful login
      await resetAttempt(ip);
      await resetAttempt(email);

      // ❗ Create a secure, bound session in DB and set cookies
      await createSecureSession(user.id, undefined, { requirePasswordChange: needsPasswordChange });

      await logSecurityEvent('AUTH_LOGIN_SUCCESS', {
        userId: user.id,
        email: user.email,
        action: 'User successfully logged in',
      });

      return {
        success: true,
        user: userData
      };
    };

    // ❗ Connection Timeout
    const timeoutPromise = new Promise<any>((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 10000)
    );

    return await Promise.race([loginPromise(), timeoutPromise]);
  } catch (error: any) {
    console.error('Login verification error:', error);
    if (error.message === 'Connection timeout') {
      return { success: false, error: 'Request timed out' };
    }
    return { success: false, error: 'Authentication failed. Please try again later.' };
  }
}

export async function logoutUser() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('auth_access')?.value;
  
  if (accessToken) {
    const payload = verifyToken(accessToken);
    if (payload?.sessionId) {
      await invalidateSession(payload.sessionId);
      await logSecurityEvent('AUTH_LOGOUT', {
        userId: payload.userId,
        action: 'User logged out',
      });
    }
  }

  cookieStore.delete('auth_access');
  cookieStore.delete('auth_refresh');
  return { success: true };
}

export async function getCurrentUser() {
  try {
    const user = await getUserFromCookiesServer();
    if (!user) return null;
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role?.name,
      branch: user.branch,
      district: user.district,
      dateJoined: user.dateJoined.toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('Error fetching session user:', error);
    return null;
  }
}

export async function getUsers() {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        branch: true,
        district: true,
        dateJoined: true,
        role: {
          select: {
            name: true,
          }
        },
      },
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
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    });

    // Normalize legacy role permission keys to the current granular permission model.
    return roles.map((r) => ({
      ...r,
      permissions: normalizePermissions(r.permissions as unknown as string[]),
    }));
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    throw new Error('Database connection failed');
  }
}

export async function createUser(data: any) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const validation = createUserSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: 'Invalid user data provided' };
    }
    const validatedData = validation.data;

    const role = await prisma.role.findFirst({
      where: { name: validatedData.role }
    });

    if (!role) throw new Error('Role not found');

    // Generate a secure temporary password
    const tempPassword = crypto.randomBytes(9).toString('base64').replace(/\+/g, 'A').replace(/\//g, 'B').slice(0, 12);
    const hashedPassword = await hashPassword(tempPassword);

    // Persist the user with the generated temporary password.
    const created = await prisma.user.create({
      data: {
        fullName: validatedData.fullName,
        email: validatedData.email,
        password: hashedPassword,
        roleId: role.id,
        status: validatedData.status || 'Active',
        branch: validatedData.branch || 'Head Office',
        district: validatedData.district || 'HQ',
        requirePasswordChange: true, // ❗ Mandatory change on first login
        passwordLastChanged: new Date(),
      }
    });

    // Attempt to email the temporary password. If email fails, we still created the account but log a warning.
    try {
      await sendTemporaryPasswordEmail(created.email, tempPassword);
    } catch (e) {
      console.warn('Failed to send temporary password email:', e);
    }

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
  const authUser = await authorizeAction({ 
    allowedRoles: ['Admin'],
    resourceId: id,
    resourceType: 'user'
  });

  try {
    const validation = updateUserSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: 'Invalid update data provided' };
    }
    const validatedData = validation.data;

    // ❗ Prevent self-role escalation or role modification by non-admins
    if (validatedData.role && authUser.role !== 'Admin') {
      console.warn(`User ${authUser.email} attempted to modify role to ${validatedData.role} without Admin privileges`);
      return { success: false, error: 'Forbidden: Role escalation attempt detected' };
    }

    // ❗ Even Admins should be careful about changing their own role to something else
    if (authUser.id === id && validatedData.role && validatedData.role !== authUser.role) {
      return { success: false, error: 'Cannot change your own role' };
    }

    const updateData: any = { ...validatedData };
    
    if (validatedData.password) {
      updateData.password = await hashPassword(validatedData.password);
    }

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

    // ❗ If role was updated, invalidate all sessions for this user to enforce new permissions
    if (data.role) {
      await logSecurityEvent('ROLE_CHANGE', {
        userId: id,
        action: `User role changed to ${data.role}`,
        resourceId: id,
        resourceType: 'User',
      });
      await invalidateAllUserSessions(id);
    }

    revalidatePath('/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user:', error);
    return { success: false, error: 'User update failed' };
  }
}

export async function deleteUser(id: string) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    // ❗ Prevent self-deletion
    const authUser = await getUserFromCookiesServer();
    if (authUser?.id === id) {
      return { success: false, error: 'Cannot delete your own account' };
    }

    await prisma.user.delete({ where: { id } });
    revalidatePath('/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete user:', error);
    return { success: false, error: 'User removal failed' };
  }
}

export async function resendInvitationEmail(id: string) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const tempPassword = crypto.randomBytes(9).toString('base64').replace(/\+/g, 'A').replace(/\//g, 'B').slice(0, 12);
    const hashedPassword = await hashPassword(tempPassword);

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        requirePasswordChange: true,
        passwordLastChanged: new Date(),
      },
    });

    await sendTemporaryPasswordEmail(user.email, tempPassword);
    await logSecurityEvent('EMAIL_RESEND', {
      userId: id,
      action: 'Resent user invitation/reset email',
      resourceId: id,
      resourceType: 'User',
    });

    revalidatePath('/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to resend invitation email:', error);
    return { success: false, error: 'Unable to resend email' };
  }
}

export async function createRole(data: any) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const validation = roleSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: 'Invalid role data' };
    }
    await prisma.role.create({ data: validation.data });
    revalidatePath('/roles');
    return { success: true };
  } catch (error) {
    console.error('Failed to create role:', error);
    return { success: false, error: 'Role creation failed.' };
  }
}

export async function updateRole(id: string, data: any) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    const validation = roleSchema.partial().safeParse(data);
    if (!validation.success) {
      return { success: false, error: 'Invalid role update data' };
    }
    await prisma.role.update({
      where: { id },
      data: validation.data,
    });
    revalidatePath('/roles');
    return { success: true };
  } catch (error) {
    console.error('Failed to update role:', error);
    return { success: false, error: 'Role update failed.' };
  }
}

export async function deleteRole(id: string) {
  await authorizeAction({ allowedRoles: ['Admin'] });
  try {
    await prisma.role.delete({ where: { id } });
    revalidatePath('/roles');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete role:', error);
    return { success: false, error: 'Role removal failed' };
  }
}