import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { cookies, headers } from 'next/headers';
import { signToken, setAuthCookies, verifyToken } from '@/lib/serverAuth';
import { logSecurityEvent } from '@/lib/securityLogger';

export async function POST(req: Request) {
  try {
    const ck = cookies();
    const refreshToken = ck.get('auth_refresh')?.value;
    
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

    // Context validation
    const h = headers();
    const userAgent = h.get('user-agent') || 'unknown';
    const ipAddress = h.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const currentFingerprint = crypto.createHash('sha256').update(`${userAgent}${ipAddress}`).digest('hex');

    if (session.fingerprint !== currentFingerprint) {
      // Potential session theft - invalidate all user sessions
      await prisma.session.deleteMany({ where: { userId: session.userId } });
      
      await logSecurityEvent('AUTHZ_FAILURE', {
        userId: session.userId,
        email: session.user.email,
        action: 'Security breach detected: Fingerprint mismatch during token refresh',
        severity: 'HIGH_RISK',
        details: `IP: ${ipAddress}, UA: ${userAgent}`
      });

      return NextResponse.json({ success: false, error: 'Security breach detected' }, { status: 401 });
    }

    // Rotate refresh token
    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updatedSession = await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
        lastActiveAt: new Date()
      }
    });

    const accessToken = signToken({ 
      userId: session.userId, 
      sessionId: updatedSession.id, 
      fingerprint: currentFingerprint 
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
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
