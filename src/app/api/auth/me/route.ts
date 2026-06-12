import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/serverAuth';

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false }, { status: 401 });

    return NextResponse.json({ success: true, user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role?.name,
      permissions: user.role?.permissions ?? [],
      status: user.status,
      requirePasswordChange: user.requirePasswordChange,
    }});
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
