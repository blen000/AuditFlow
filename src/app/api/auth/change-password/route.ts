import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeRoute } from '@/lib/authorization';
import {
  validatePasswordComplexity,
  verifyPassword,
  hashPassword,
  isSameAsCurrent,
  isInPasswordHistory,
  buildUpdatedPasswordHistory,
} from '@/lib/passwordUtils';
import { createSecureSession, invalidateAllUserSessions } from '@/lib/serverAuth';
import { changePasswordSchema } from '@/lib/schemas';
import { sendPasswordChangeNotification } from '@/lib/emailTemplates';
import { logSecurityEvent } from '@/lib/securityLogger';

// 5 attempts per hour per user (keyed by userId, reset after WINDOW_MS).
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid password format',
        details: validation.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { email, currentPassword, newPassword } = validation.data;

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const authResult = await authorizeRoute(req, { resourceId: targetUser.id, resourceType: 'user' });
    if (authResult instanceof NextResponse) return authResult;

    // Rate limit: max 5 password change attempts per hour per account.
    if (!checkRateLimit(targetUser.id)) {
      await logSecurityEvent('PASSWORD_CHANGE_RATE_LIMITED', {
        userId: targetUser.id,
        email: targetUser.email,
        action: 'Password change rate limit exceeded',
      });
      return NextResponse.json({
        success: false,
        error: 'Too many password change attempts. Please try again later.',
      }, { status: 429 });
    }

    const isMatch = await verifyPassword(currentPassword, targetUser.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 401 });
    }

    // Complexity check (includes blocklist).
    const complexityCheck = validatePasswordComplexity(newPassword);
    if (!complexityCheck.isValid) {
      return NextResponse.json({ success: false, error: complexityCheck.error }, { status: 400 });
    }

    // Reject same-as-current password.
    if (await isSameAsCurrent(newPassword, targetUser.password)) {
      return NextResponse.json({
        success: false,
        error: 'New password must be different from your current password.',
      }, { status: 400 });
    }

    // Reject passwords reused from the last 8 passwords.
    const history: string[] = (targetUser as any).passwordHistory ?? [];
    if (await isInPasswordHistory(newPassword, history)) {
      return NextResponse.json({
        success: false,
        error: 'You cannot reuse any of your last 8 passwords.',
      }, { status: 400 });
    }

    const hashedPassword = await hashPassword(newPassword);
    const updatedHistory = buildUpdatedPasswordHistory(targetUser.password, history);

    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        passwordHistory: updatedHistory,
        requirePasswordChange: false,
        passwordLastChanged: new Date(),
      },
    });

    await logSecurityEvent('PASSWORD_CHANGED', {
      userId: updatedUser.id,
      email: updatedUser.email,
      action: 'User changed their password',
    });

    // Notify the user that their password was changed.
    sendPasswordChangeNotification(updatedUser.email, updatedUser.fullName).catch(() => {});

    const response = NextResponse.json({ success: true });
    await invalidateAllUserSessions(updatedUser.id);
    await createSecureSession(updatedUser.id, response, { requirePasswordChange: false });

    return response;
  } catch (err) {
    console.error('Change password error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
