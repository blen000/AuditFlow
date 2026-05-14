import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeRoute } from '@/lib/authorization';
import { revalidatePath } from 'next/cache';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  // Enforce authorization and ownership for this route
  const auth = await authorizeRoute(req, { resourceId: id, resourceType: 'finding' });
  if (auth instanceof NextResponse) return auth;

  try {
    // Remove any file attachments linked to this finding to avoid orphaned records.
    await prisma.fileAttachment.deleteMany({ where: { findingId: id } });

    // Delete the finding itself
    await prisma.auditFinding.delete({ where: { id } });

    // Revalidate important paths so the UI updates for server-side rendered pages
    try {
      revalidatePath('/auditee-view');
      revalidatePath('/');
    } catch (e) {
      // revalidation is best-effort; continue even if it fails
      console.warn('Revalidation failed:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete finding:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
