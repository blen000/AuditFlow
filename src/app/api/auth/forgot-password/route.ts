import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { forgotPasswordSchema } from '@/lib/schemas';
import { sendPasswordResetEmail } from '@/lib/emailTemplates';
import { logSecurityEvent } from '@/lib/securityLogger';

export const maxDuration = 10;

const RESET_TOKEN_TTL_MINUTES = 30;
const RESEND_COOLDOWN_MS = 60 * 1000;
const GENERIC_MESSAGE = 'If an account exists for that email, a password reset link has been sent.';

// Per-IP rate limit so the endpoint can't be hammered to probe for valid
// accounts or to mass-trigger emails. Matches the in-memory pattern used by
// /api/auth/change-password.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: 'Invalid input data' }, { status: 400 });
    }

    const { email } = validation.data;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    // Rate-limited requests still get the generic response so the limit itself
    // doesn't leak whether the account exists.
    if (checkRateLimit(ip)) {
      const user = await prisma.user.findUnique({ where: { email } });

      if (user && user.status === 'Active') {
        const recentToken = await prisma.passwordResetToken.findFirst({
          where: { userId: user.id, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
          orderBy: { createdAt: 'desc' },
        });

        // Silently skip re-sending if a link was just issued (double submit, etc).
        if (!recentToken) {
          const rawToken = crypto.randomBytes(32).toString('hex');
          const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

          // Only the newest link should work.
          await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
          await prisma.passwordResetToken.create({
            data: {
              userId: user.id,
              tokenHash,
              expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000),
            },
          });

          const resetUrl = `${new URL(req.url).origin}/reset-password?token=${rawToken}`;

          try {
            await sendPasswordResetEmail(user.email, user.fullName, resetUrl, RESET_TOKEN_TTL_MINUTES);
          } catch (emailError) {
            console.error('Failed to send password reset email:', emailError);
          }

          await logSecurityEvent('PASSWORD_RESET_REQUESTED', {
            userId: user.id,
            email: user.email,
            action: 'User requested a password reset link',
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
