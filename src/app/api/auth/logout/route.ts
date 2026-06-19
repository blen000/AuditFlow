import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, invalidateSession, clearAuthCookies } from '@/lib/serverAuth';
import { logSecurityEvent } from '@/lib/securityLogger';

export async function POST(req: Request) {
  try {
    const ck = await cookies();
    const accessToken = ck.get('__Secure-auth_access')?.value;
    
    if (accessToken) {
      const payload = verifyToken(accessToken);
      if (payload?.sessionId) {
        // ❗ Server-side refresh token revocation: Delete session from DB
        await invalidateSession(payload.sessionId);
        
        await logSecurityEvent('AUTH_LOGOUT', {
          userId: payload.userId,
          action: 'User logged out via API',
        });
      }
    }

    const response = NextResponse.json({ success: true });
    
    // ❗ Clear all security-bound cookies
    clearAuthCookies(response);
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
