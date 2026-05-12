import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from './prisma';
import { cookies, headers } from 'next/headers';
import { logSecurityEvent } from './securityLogger';

const SECRET = process.env.AUTH_SECRET || 'dev-secret-change-me';
const ACCESS_COOKIE_NAME = 'auth_access';
const REFRESH_COOKIE_NAME = 'auth_refresh';

// Session constraints
const ACCESS_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour for development stability
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour idle timeout

function base64url(buf: Buffer) {
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function signToken(payload: Record<string, any>, expiryMs: number = ACCESS_TOKEN_EXPIRY_MS) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = Math.floor((Date.now() + expiryMs) / 1000);
  
  const header = base64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = base64url(Buffer.from(JSON.stringify({ ...payload, iat, exp })));
  const sig = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest();
  return `${header}.${body}.${base64url(sig)}`;
}

export function verifyToken(token: string) {
  try {
    const [header, body, sig] = token.split('.');
    if (!header || !body || !sig) return null;
    const expected = base64url(crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest());
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
    
    const payload = JSON.parse(Buffer.from(body, 'base64').toString());
    
    // Check expiration
    if (payload.exp && Date.now() > payload.exp * 1000) {
      return null;
    }
    
    return payload;
  } catch (e) {
    return null;
  }
}

function getFingerprint(userAgent: string, ipAddress: string) {
  // In local development, IP addresses can switch between ::1 and 127.0.0.1
  // We normalize localhost IPs to keep the fingerprint stable.
  const normalizedIp = (ipAddress === '::1' || ipAddress === '127.0.0.1') ? 'localhost' : ipAddress;
  return crypto.createHash('sha256').update(`${userAgent}${normalizedIp}`).digest('hex');
}

export async function createSecureSession(userId: string, res?: NextResponse) {
  const h = headers();
  const userAgent = h.get('user-agent') || 'unknown';
  const ipAddress = h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || '127.0.0.1';
  
  const fingerprint = getFingerprint(userAgent, ipAddress);
  
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  // Store session in DB
  const session = await prisma.session.create({
    data: {
      userId,
      refreshToken,
      userAgent,
      ipAddress,
      fingerprint,
      expiresAt,
    }
  });

  const accessToken = signToken({ userId, sessionId: session.id, fingerprint });

  if (res) {
    setAuthCookies(res, accessToken, refreshToken);
  } else {
    // For Server Actions
    const cookieStore = cookies();
    cookieStore.set(ACCESS_COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
      maxAge: ACCESS_TOKEN_EXPIRY_MS / 1000
    });
    cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60
    });
  }
  
  return session;
}

export function setAuthCookies(res: NextResponse, accessToken: string, refreshToken: string) {
  res.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'strict',
    maxAge: ACCESS_TOKEN_EXPIRY_MS / 1000
  });

  res.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: refreshToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60
  });
}

export async function getUserFromRequest(req: Request) {
  try {
    const cookiesList = req.headers.get('cookie')?.split(';').map(s => s.trim()) || [];
    const accessToken = cookiesList.find(c => c.startsWith(`${ACCESS_COOKIE_NAME}=`))?.split('=')[1];
    
    if (!accessToken) return null;
    
    const payload = verifyToken(accessToken);
    if (!payload || !payload.userId || !payload.sessionId) return null;

    // Validate binding (fingerprint)
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';
    const currentFingerprint = getFingerprint(userAgent, ipAddress);
    
    if (payload.fingerprint !== currentFingerprint) {
      console.warn(`[AUTH] Fingerprint mismatch for user ${payload.userId}. Expected: ${payload.fingerprint}, Got: ${currentFingerprint} (UA: ${userAgent}, IP: ${ipAddress})`);
      return null;
    }

    // Check DB session status and idle timeout
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: { include: { role: true } } }
    });

    if (!session) return null;
  
  if (Date.now() > session.expiresAt.getTime()) {
    await prisma.session.delete({ where: { id: session.id } });
    await logSecurityEvent('AUTH_LOGOUT', {
      userId: session.userId,
      email: session.user.email,
      action: 'Session expired (refresh token lifetime exceeded)',
    });
    return null;
  }
    
    // Idle timeout check
    if (Date.now() - session.lastActiveAt.getTime() > IDLE_TIMEOUT_MS) {
      await prisma.session.delete({ where: { id: session.id } });
      await logSecurityEvent('AUTH_LOGOUT', {
        userId: session.userId,
        email: session.user.email,
        action: 'Session expired due to inactivity',
      });
      return null;
    }

    // Update last activity
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() }
    });

    return session.user;
  } catch (e) {
    return null;
  }
}

export async function getUserFromCookiesServer() {
  const ck = cookies();
  const accessToken = ck.get(ACCESS_COOKIE_NAME)?.value;
  if (!accessToken) return null;

  const payload = verifyToken(accessToken);
  if (!payload || !payload.userId || !payload.sessionId) return null;

  // Binding check
  const h = headers();
  const userAgent = h.get('user-agent') || 'unknown';
  const ipAddress = h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || '127.0.0.1';
  const currentFingerprint = getFingerprint(userAgent, ipAddress);

  if (payload.fingerprint !== currentFingerprint) {
    console.warn(`[AUTH] Fingerprint mismatch (Server) for user ${payload.userId}. Expected: ${payload.fingerprint}, Got: ${currentFingerprint} (UA: ${userAgent}, IP: ${ipAddress})`);
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: { user: { include: { role: true } } }
  });

  if (!session) return null;
  
  if (Date.now() > session.expiresAt.getTime()) {
    await prisma.session.delete({ where: { id: session.id } });
    await logSecurityEvent('AUTH_LOGOUT', {
      userId: session.userId,
      email: session.user.email,
      action: 'Session expired (refresh token lifetime exceeded)',
    });
    return null;
  }
  
  if (Date.now() - session.lastActiveAt.getTime() > IDLE_TIMEOUT_MS) {
    await prisma.session.delete({ where: { id: session.id } });
    await logSecurityEvent('AUTH_LOGOUT', {
      userId: session.userId,
      email: session.user.email,
      action: 'Session expired due to inactivity',
    });
    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastActiveAt: new Date() }
  });

  return session.user;
}

export async function invalidateSession(sessionId: string) {
  await prisma.session.deleteMany({ where: { id: sessionId } });
}

export async function invalidateAllUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.delete(ACCESS_COOKIE_NAME);
  res.cookies.delete(REFRESH_COOKIE_NAME);
}

export function requireUserApi(user: any) {
  if (!user) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  return null;
}

export function requireUserServer(user: any) {
  if (!user) throw new Error('Forbidden');
}

export function ensureRole(user: any, allowedRoles: string[] = []) {
  if (!user) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  const roleName = user.role?.name ?? null;
  return allowedRoles.includes(roleName);
}
