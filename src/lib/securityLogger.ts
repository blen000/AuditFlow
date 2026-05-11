import { prisma } from './prisma';
import { headers } from 'next/headers';

export type SecurityEventType = 
  | 'AUTH_LOGIN_SUCCESS' 
  | 'AUTH_LOGIN_FAILURE' 
  | 'AUTH_LOGOUT'
  | 'AUTHZ_FAILURE' 
  | 'ROLE_CHANGE' 
  | 'SENSITIVE_OP'
  | 'DATA_EXPORT'
  | 'DATA_IMPORT';

export type SecuritySeverity = 'INFO' | 'WARN' | 'HIGH_RISK';

interface LogOptions {
  userId?: string;
  email?: string;
  action: string;
  details?: string;
  resourceId?: string;
  resourceType?: string;
  severity?: SecuritySeverity;
}

/**
 * Centrally logs security-relevant events to the database.
 * Automatically captures IP and User-Agent from headers if available.
 */
export async function logSecurityEvent(
  eventType: SecurityEventType,
  options: LogOptions
) {
  let userAgent = 'unknown';
  let ipAddress = '127.0.0.1';

  try {
    const h = headers();
    userAgent = h.get('user-agent') || 'unknown';
    ipAddress = h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || '127.0.0.1';
  } catch (headerError) {
    // headers() can fail in certain contexts (like during build or specific edge cases)
    console.warn('Could not access headers for security log:', eventType);
  }

  const severity = options.severity || (
    eventType === 'AUTH_LOGIN_FAILURE' || eventType === 'AUTHZ_FAILURE' ? 'WARN' : 
    eventType === 'ROLE_CHANGE' || eventType === 'SENSITIVE_OP' ? 'HIGH_RISK' : 'INFO'
  );

  try {
    console.log(`[SECURITY_LOG_ATTEMPT] ${eventType}: ${options.action}`);
    const log = await prisma.securityAuditLog.create({
      data: {
        eventType,
        severity,
        userId: options.userId,
        email: options.email,
        action: options.action,
        details: options.details,
        ipAddress,
        userAgent,
        resourceId: options.resourceId,
        resourceType: options.resourceType,
      },
    });
    console.log(`[SECURITY_LOG_SUCCESS] Entry created with ID: ${log.id}`);

    // Simple alerting for HIGH_RISK activities
    if (severity === 'HIGH_RISK') {
      console.warn(`[SECURITY ALERT] High-risk activity detected: ${options.action}`, {
        eventType,
        userId: options.userId,
        resourceId: options.resourceId,
      });
    }

    // Revalidate security logs page
    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/admin/security-logs');
    } catch (revalidateError) {
      // Revalidate might fail if not in a request context
    }

    return log;
  } catch (error) {
    console.error('CRITICAL ERROR: Failed to write security audit log to database:', error);
    // Log more details about the error if possible
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}
