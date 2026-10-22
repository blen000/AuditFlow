import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { resetPasswordSchema } from '@/lib/schemas';
import {
  validatePasswordComplexity,
  hashPassword,
  isSameAsCurrent,
  isInPasswordHistory,
  buildUpdatedPasswordHistory,
} from '@/lib/passwordUtils';
import { invalidateAllUserSessions } from '@/lib/serverAuth';
import { sendPasswordChangeNotification } from '@/lib/emailTemplates';
import { logSecurityEvent } from '@/lib/securityLogger';

export const maxDuration = 10;

const INVALID_TOKEN_ERROR = 'This reset link is invalid or has expired. Please request a new one.';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: validation.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { token, newPassword } = validation.data;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date() || resetToken.user.status !== 'Active') {
      await logSecurityEvent('PASSWORD_RESET_FAILURE', {
        userId: resetToken?.userId,
        action: 'Password reset failed: invalid, used, or expired token',
      });
      return NextResponse.json({ success: false, error: INVALID_TOKEN_ERROR }, { status: 400 });
    }

    const { user } = resetToken;

    const complexityCheck = validatePasswordComplexity(newPassword);
    if (!complexityCheck.isValid) {
      return NextResponse.json({ success: false, error: complexityCheck.error }, { status: 400 });
    }

    if (await isSameAsCurrent(newPassword, user.password)) {
      return NextResponse.json({
        success: false,
        error: 'New password must be different from your current password.',
      }, { status: 400 });
    }

    const history: string[] = user.passwordHistory ?? [];
    if (await isInPasswordHistory(newPassword, history)) {
      return NextResponse.json({
        success: false,
        error: 'You cannot reuse any of your last 8 passwords.',
      }, { status: 400 });
    }

    const hashedPassword = await hashPassword(newPassword);
    const updatedHistory = buildUpdatedPasswordHistory(user.password, history);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordHistory: updatedHistory,
          requirePasswordChange: false,
          passwordLastChanged: new Date(),
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await invalidateAllUserSessions(user.id);

    await logSecurityEvent('PASSWORD_RESET_SUCCESS', {
      userId: user.id,
      email: user.email,
      action: 'User reset their password via emailed link',
    });

    sendPasswordChangeNotification(user.email, user.fullName).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
