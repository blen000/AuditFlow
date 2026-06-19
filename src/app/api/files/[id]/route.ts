import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFileBuffer } from '@/lib/file-service';
import { getUserFromRequest } from '@/lib/serverAuth';
import { enforceDefaultOwnership } from '@/lib/authorization';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const attachment = await prisma.fileAttachment.findUnique({
      where: { id },
      include: { finding: true }
    });

    if (!attachment) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // ❗ Authorization check: Ensure user can access the associated finding
    if (attachment.findingId && attachment.finding) {
      try {
        // Reuse existing ownership enforcement logic
        enforceDefaultOwnership(user, 'finding', attachment.finding);
      } catch (error) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (attachment.uploaderId !== user.id && user.role.name !== 'Admin') {
      // If no finding associated, only uploader or admin can access
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const buffer = await getFileBuffer(attachment.filename);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Disposition': `attachment; filename="${attachment.originalName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
