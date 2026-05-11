import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminPermissions } from '@/lib/permissions';
import { signToken, setAuthCookies, createSecureSession } from '@/lib/serverAuth';
import { isPasswordExpired, verifyPassword } from '@/lib/passwordUtils';
import { loginSchema } from '@/lib/schemas';
import { logSecurityEvent } from '@/lib/securityLogger';

const GENERIC_ERROR = 'Invalid email or password.';

export async function POST(req: Request) {
  try {
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

    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });

    if (!user) {
      await logSecurityEvent('AUTH_LOGIN_FAILURE', {
        email,
        action: 'Login failed: user not found',
      });
      return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 401 });
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      await logSecurityEvent('AUTH_LOGIN_FAILURE', {
        userId: user.id,
        email,
        action: 'Login failed: incorrect password',
      });
      return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 401 });
    }

    if (user.status !== 'Active') {
      await logSecurityEvent('AUTH_LOGIN_FAILURE', {
        userId: user.id,
        email,
        action: 'Login failed: account inactive',
      });
      return NextResponse.json({ success: false, error: 'Account is inactive. Contact Admin.' }, { status: 403 });
    }

    const needsPasswordChange = user.requirePasswordChange || isPasswordExpired(user.passwordLastChanged);

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
    
    // ❗ Create a secure, bound session in DB and set cookies
    await createSecureSession(user.id, res);

    await logSecurityEvent('AUTH_LOGIN_SUCCESS', {
      userId: user.id,
      email: user.email,
      action: 'User successfully logged in via API',
    });

    return res;
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
