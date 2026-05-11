'use server';

import { saveFileSecurely } from '@/lib/file-service';
import { authorizeAction } from '@/lib/authorization';
import { revalidatePath } from 'next/cache';

export async function uploadFileAction(formData: FormData, findingId?: string, category?: string) {
  const user = await authorizeAction(); // Enforce authentication

  const file = formData.get('file') as File;
  if (!file) {
    return { success: false, error: 'No file provided' };
  }

  try {
    const attachment = await saveFileSecurely(file, user.id, findingId, category);
    
    if (findingId) {
      revalidatePath(`/findings/respond/${findingId}`);
    }
    
    return { 
      success: true, 
      attachment: {
        id: attachment.id,
        originalName: attachment.originalName,
        createdAt: attachment.createdAt.toISOString()
      } 
    };
  } catch (error: any) {
    console.error('File upload error:', error);
    return { success: false, error: error.message || 'File upload failed' };
  }
}
