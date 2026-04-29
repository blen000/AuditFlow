import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminPermissions } from '@/lib/permissions';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 });
    }

    // NOTE: passwords are stored in plaintext in this demo seed.
    // In production you MUST hash and verify passwords (bcrypt/scrypt/etc).
    if (user.password !== password) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const safeUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role?.name ?? null,
      permissions: withAdminPermissions(user.role?.name, user.role?.permissions ?? []),
      status: user.status,
    };

    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
