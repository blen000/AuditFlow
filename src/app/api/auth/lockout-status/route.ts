import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    
    const ipAttempt = await (prisma as any).loginAttempt.findUnique({ where: { identifier: ip } });
    
    const now = new Date();
    if (ipAttempt && ipAttempt.attempts >= 5 && ipAttempt.lockedUntil && ipAttempt.lockedUntil > now) {
      return NextResponse.json({ 
        locked: true, 
        lockedUntil: ipAttempt.lockedUntil.toISOString() 
      });
    }

    return NextResponse.json({ locked: false });
  } catch (error) {
    console.error('Error fetching lockout status:', error);
    return NextResponse.json({ locked: false }, { status: 500 });
  }
}
