import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminPermissions } from '@/lib/permissions';
import { signToken, setAuthCookies, createSecureSession } from '@/lib/serverAuth';
import { isPasswordExpired, verifyPassword } from '@/lib/passwordUtils';
import { loginSchema } from '@/lib/schemas';
import { logSecurityEvent } from '@/lib/securityLogger';

const GENERIC_ERROR = 'Invalid email or password.';
const LOCKOUT_MSG = 'Account temporarily locked due to too many failed attempts. Please try again in 30 seconds.';

export const maxDuration = 10;

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

export async function POST(req: Request) {
  try {
    // ❗ Request Size Limit
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 2048) {
      return NextResponse.json({ success: false, error: 'Payload too large' }, { status: 413 });
    }

    const loginPromise = async () => {
      const body = await req.json();
    
    // ❗ Strict Input Validation
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      await logSecurityEvent('AUTH_LOGIN_FAILURE', {
        email: body.email || 'unknown',
        action: 'Login failed: invalid input data',
      });
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid input data', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { email, password } = validation.data;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

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
      return NextResponse.json({ success: false, error: LOCKOUT_MSG, lockedUntil }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });

    if (!user) {
      await logSecurityEvent('AUTH_LOGIN_FAILURE', {
        email,
        action: 'Login failed: user not found',
      });
      const ipLocked = await incrementAttempt(ip);
      const emailLocked = await incrementAttempt(email);
      const lockedUntil = ipLocked || emailLocked;
      return NextResponse.json({ success: false, error: GENERIC_ERROR, lockedUntil }, { status: 401 });
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
      return NextResponse.json({ success: false, error: GENERIC_ERROR, lockedUntil }, { status: 401 });
    }

    if (user.status !== 'Active') {
      await logSecurityEvent('AUTH_LOGIN_FAILURE', {
        userId: user.id,
        email,
        action: 'Login failed: account inactive',
      });
      return NextResponse.json({ success: false, error: 'Account is inactive. Contact Admin.' }, { status: 403 });
    }

    // ❗ Enforce strict expiration on temporary credentials (except for Admins)
    const isAdmin = user.role?.name === 'Admin';
    if (user.requirePasswordChange && !isAdmin && isPasswordExpired(user.passwordLastChanged, true)) {
      await logSecurityEvent('AUTH_LOGIN_FAILURE', {
        userId: user.id,
        email,
        action: 'Login failed: temporary password expired',
      });
      return NextResponse.json({ 
        success: false, 
        error: 'Your temporary password has expired. Please contact your administrator to resend the invitation.' 
      }, { status: 401 });
    }

    const needsPasswordChange = user.requirePasswordChange || isPasswordExpired(user.passwordLastChanged, false);

    const safeUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role?.name ?? null,
      permissions: withAdminPermissions(user.role?.name, user.role?.permissions ?? []),
      status: user.status,
      requirePasswordChange: needsPasswordChange,
    };

    const res = NextResponse.json({ success: true, user: safeUser });
    
    // ❗ Reset lockouts on successful login
    await resetAttempt(ip);
    await resetAttempt(email);

    // ❗ Create a secure, bound session in DB and set cookies
    await createSecureSession(user.id, res, { requirePasswordChange: needsPasswordChange });

    await logSecurityEvent('AUTH_LOGIN_SUCCESS', {
      userId: user.id,
      email: user.email,
      action: 'User successfully logged in via API',
    });

    return res;
    };

    // ❗ Connection Timeout
    const timeoutPromise = new Promise<NextResponse>((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 10000)
    );

    return await Promise.race([loginPromise(), timeoutPromise]);
  } catch (error: any) {
    console.error('Auth error:', error);
    if (error.message === 'Connection timeout') {
      return NextResponse.json({ success: false, error: 'Request timed out' }, { status: 408 });
    }
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
