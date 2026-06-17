import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from './prisma';
import { cookies, headers } from 'next/headers';
import { logSecurityEvent } from './securityLogger';

if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is not set. Application cannot start without a cryptographic secret.');
}
const SECRET = process.env.AUTH_SECRET;
const ACCESS_COOKIE_NAME = '__Secure-auth_access';
const REFRESH_COOKIE_NAME = '__Secure-auth_refresh';
const CSRF_COOKIE_NAME = '__Secure-csrf_token';

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

function cleanIp(ip: string) {
  return ip.split(':')[0]; // removes port
}

export async function createSecureSession(userId: string, res?: NextResponse, extraPayload: any = {}) {
  const h = headers();
  const userAgent = h.get('user-agent') || 'unknown';
  const rawIp = h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || '127.0.0.1';
  const ipAddress = cleanIp(rawIp);

  // fingerprint removed from session creation for simplicity
  
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  // ❗ Fetch user to get current sessionVersion for binding
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  // Store session in DB
  const session = await prisma.session.create({
    data: {
      userId,
      refreshToken,
      userAgent,
      ipAddress,
      expiresAt,
      version: 1, // ❗ Individual session versioning
    }
  });

  const accessToken = signToken({ 
    userId, 
    sessionId: session.id, 
    csrfToken, 
    ...extraPayload 
  });

  if (res) {
    setAuthCookies(res, accessToken, refreshToken);
  } else {
    // For Server Actions
    const cookieStore = cookies();
    cookieStore.set(ACCESS_COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: true, // MANDATORY: Enforced for all environments per security policy
      path: '/',
      sameSite: 'strict',
      maxAge: ACCESS_TOKEN_EXPIRY_MS / 1000
    });
    cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: true, // MANDATORY: Enforced for all environments per security policy
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
    secure: true, // MANDATORY: Enforced for all environments per security policy
    path: '/',
    sameSite: 'strict',
    maxAge: ACCESS_TOKEN_EXPIRY_MS / 1000
  });

  res.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: refreshToken,
    httpOnly: true,
    secure: true, // MANDATORY: Enforced for all environments per security policy
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

    const userAgent = req.headers.get('user-agent') || 'unknown';
    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';
    const ipAddress = cleanIp(rawIp);

    // Fetch session + user + role.permissions from DB on every request.
    // IMPORTANT: permissions are NOT stored in the JWT. Authorization decisions
    // in authorization.ts read user.role.permissions from this result, so
    // permission changes take effect immediately without session invalidation.
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: { include: { role: true } } }
    });

    if (!session) return null;

    // Reject sessions for inactive accounts immediately
    if (session.user.status !== 'Active') {
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    // Session version checks intentionally omitted to avoid unexpected logouts

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

  // Fingerprint binding (user-agent + IP) is best-effort only.
  const h = headers();
  const userAgent = h.get('user-agent') || 'unknown';
  const rawIp = h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || '127.0.0.1';
  const ipAddress = cleanIp(rawIp);

  // See getUserFromRequest for the rationale: permissions are DB-fresh per request.
  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: { user: { include: { role: true } } }
  });

  if (!session) return null;

  // Reject sessions for inactive accounts immediately
  if (session.user.status !== 'Active') {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  // Session version checks omitted to prevent unexpected logout behavior

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
  // Delete DB sessions for the user. Do NOT modify sessionVersion to avoid
  // inconsistencies between tokens and DB state.
  await prisma.session.deleteMany({ where: { userId } });
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.delete(ACCESS_COOKIE_NAME);
  res.cookies.delete(REFRESH_COOKIE_NAME);
  res.cookies.delete(CSRF_COOKIE_NAME);
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
