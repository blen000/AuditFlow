import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, verifyToken, clearAuthCookies } from '@/lib/serverAuth';

const ACCESS_COOKIE_NAME = '__Secure-auth_access';

function getCurrentSessionId(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie') || '';
  const tokenValue = cookieHeader
    .split(';')
    .map(s => s.trim())
    .find(c => c.startsWith(`${ACCESS_COOKIE_NAME}=`))
    ?.slice(ACCESS_COOKIE_NAME.length + 1);
  const payload = tokenValue ? verifyToken(tokenValue) : null;
  return payload?.sessionId ?? null;
}

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      lastActiveAt: true,
    },
    orderBy: { lastActiveAt: 'desc' },
  });

  const currentSessionId = getCurrentSessionId(req);

  return NextResponse.json({
    success: true,
    sessions: sessions.map(s => ({ ...s, isCurrent: s.id === currentSessionId })),
  });
}

export async function DELETE(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  await prisma.session.deleteMany({ where: { userId: user.id } });

  const res = NextResponse.json({ success: true });
  clearAuthCookies(res);
  return res;
}
