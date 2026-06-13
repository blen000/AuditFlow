import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/serverAuth';

const ACCESS_COOKIE_NAME = '__Secure-auth_access';

export async function GET() {
  const ck = cookies();
  const accessToken = ck.get(ACCESS_COOKIE_NAME)?.value;
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // verifyToken checks HMAC signature + expiry. csrfToken is always embedded at
  // session creation in createSecureSession() (serverAuth.ts) and rotated on
  // every token refresh. A null csrfToken here means the token is expired or forged.
  const payload = verifyToken(accessToken);
  if (!payload?.csrfToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ csrfToken: payload.csrfToken });
}
