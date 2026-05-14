import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeRoute } from '@/lib/authorization';
import { validatePasswordComplexity, verifyPassword, hashPassword } from '@/lib/passwordUtils';
import { signToken, setAuthCookies, createSecureSession, invalidateAllUserSessions } from '@/lib/serverAuth';
import { changePasswordSchema } from '@/lib/schemas';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ❗ Strict Input Validation
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid password format', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { email, currentPassword, newPassword } = validation.data;

    // Server must not trust client-supplied email for authorization.
    // Fetch the target user first to get their ID for the ownership check.
    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Authenticate and authorize the request centrally.
    const authResult = await authorizeRoute(req, {
      resourceId: targetUser.id,
      resourceType: 'user'
    });
    if (authResult instanceof NextResponse) return authResult;
    const authUser = authResult;
    
    if (!email || !currentPassword || !newPassword) {
       return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
     }

     const isMatch = await verifyPassword(currentPassword, targetUser.password);
     if (!isMatch) {
       return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 401 });
     }

     const hashedPassword = await hashPassword(newPassword);

     // Update the password.
      // ❗ Reset security flags upon successful password change
      const updatedUser = await prisma.user.update({ 
        where: { email }, 
        data: { 
          password: hashedPassword,
          requirePasswordChange: false,
          passwordLastChanged: new Date()
        } 
      });

     const response = NextResponse.json({ success: true });

    // ❗ Invalidate all existing sessions on password change
    await invalidateAllUserSessions(updatedUser.id);
    
    // ❗ Create a new secure session for the current context
    await createSecureSession(updatedUser.id, response, { requirePasswordChange: false });

    return response;
  } catch (err) {
    console.error('Change password error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
