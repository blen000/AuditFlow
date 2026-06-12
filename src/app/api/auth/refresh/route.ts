import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { cookies, headers } from 'next/headers';
import { signToken, setAuthCookies, verifyToken } from '@/lib/serverAuth';
import { logSecurityEvent } from '@/lib/securityLogger';
import { isPasswordExpired } from '@/lib/passwordUtils';

export async function POST(req: Request) {
  try {
    const ck = cookies();
    const refreshToken = ck.get('__Secure-auth_refresh')?.value;
    
    if (!refreshToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Find session in DB
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true }
    });

    if (!session || Date.now() > session.expiresAt.getTime()) {
      return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 });
    }

    // Context validation - fingerprint removed to avoid false rejections
    const h = headers();
    const userAgent = h.get('user-agent') || 'unknown';
    const rawIp = h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || '127.0.0.1';
    console.log('RAW IP:', h.get('x-forwarded-for'), h.get('x-real-ip'));
    const ipAddress = rawIp.split(':')[0];

    // Rotate tokens
    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    const newCsrfToken = crypto.randomBytes(32).toString('hex');
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updatedSession = await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
        lastActiveAt: new Date(),
        // version increment removed to avoid JWT/session mismatch
      }
    });

    const needsPasswordChange = session.user.requirePasswordChange || isPasswordExpired(session.user.passwordLastChanged);

    const accessToken = signToken({ 
      userId: session.userId, 
      sessionId: updatedSession.id, 
      csrfToken: newCsrfToken,
      requirePasswordChange: needsPasswordChange
    });

    const res = NextResponse.json({ success: true });
    setAuthCookies(res, accessToken, newRefreshToken);
    
    // Optional: Log token refresh for high-security environments
    /*
    await logSecurityEvent('SENSITIVE_OP', {
      userId: session.userId,
      email: session.user.email,
      action: 'Session token refreshed',
    });
    */
    
    return res;
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
