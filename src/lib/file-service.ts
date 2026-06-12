import { prisma } from './prisma';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

// Configuration
export const UPLOAD_DIR = path.join(process.cwd(), 'secure-uploads');
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg'];
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg'
];

/**
 * Validates a file based on size, extension, and MIME type.
 */
export async function validateFile(file: File) {
  // 1. Size validation
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  // 2. Extension validation
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`File extension ${ext} is not allowed`);
  }

  // 3. MIME type validation
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`MIME type ${file.type} is not allowed`);
  }

  // 4. Basic "Malicious Content" check
  // In a real-world scenario, you would use a library like 'clamscan' or an external API.
  // For this exercise, we'll perform a basic check for suspicious headers/content.
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Example: Check for common script tags in text-based files if they were allowed
  if (file.type.startsWith('text/') || file.type === 'image/svg+xml') {
    const content = buffer.toString('utf-8');
    if (/<script|javascript:|onload=/i.test(content)) {
      throw new Error('Suspicious content detected in file');
    }
  }

  return true;
}

/**
 * Saves a file securely to the disk and records it in the database.
 */
export async function saveFileSecurely(file: File, uploaderId: string, findingId?: string, category?: string) {
  await validateFile(file);

  // Ensure upload directory exists
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  // Generate a secure, unique filename
  const ext = path.extname(file.name).toLowerCase();
  const secureFilename = `${crypto.randomBytes(16).toString('hex')}${ext}`;
  const filePath = path.join(UPLOAD_DIR, secureFilename);

  // Write file to secure storage (outside public)
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  // Record in database
  const attachment = await prisma.fileAttachment.create({
    data: {
      filename: secureFilename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      uploaderId,
      findingId,
      category,
    }
  });

  return attachment;
}

/**
 * Rejects any filename that would escape UPLOAD_DIR after path resolution.
 * Allows only the basename (no path separators, no traversal sequences).
 */
export function sanitizeFilename(filename: string): string {
  // Strip any directory components — only the leaf name is valid
  const base = path.basename(filename);

  // Reject names that are empty or consist only of dots (e.g. ".", "..")
  if (!base || /^\.+$/.test(base)) {
    throw new Error('Invalid filename');
  }

  // Confirm the resolved path stays inside UPLOAD_DIR
  const resolved = path.resolve(UPLOAD_DIR, base);
  if (!resolved.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) {
    throw new Error('Invalid filename');
  }

  return base;
}

/**
 * Retrieves a file's buffer if the user is authorized.
 * Auth checks should be performed before calling this.
 */
export async function getFileBuffer(filename: string) {
  const safe = sanitizeFilename(filename);
  const filePath = path.join(UPLOAD_DIR, safe);
  try {
    return await fs.readFile(filePath);
  } catch (error) {
    throw new Error('File not found');
  }
}
