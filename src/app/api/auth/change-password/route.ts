import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, currentPassword, newPassword } = body;

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // NOTE: this demo stores passwords in plaintext (see login route).
    // Verify the provided current password matches the DB value.
    if (user.password !== currentPassword) {
      return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 401 });
    }

    // Update the password (plaintext in demo).
    await prisma.user.update({ where: { email }, data: { password: newPassword } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Change password error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
