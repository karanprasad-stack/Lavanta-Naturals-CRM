import { Request } from 'express';
import { AuditLogModel, AuditAction } from '../models/AuditLog.js';

interface AuditLogOptions {
  action: AuditAction;
  userId?: any;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

/**
 * Sanitizes metadata to strictly ensure no passwords, secrets, or raw credentials ever enter audit logs
 */
export function sanitizeMetadata(data?: Record<string, any>): Record<string, any> {
  if (!data || typeof data !== 'object') return {};

  const clean: Record<string, any> = {};
  const sensitiveKeys = ['password', 'passwordHash', 'token', 'secret', 'authorization', 'apiKey', 'cookie'];

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      clean[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      clean[key] = sanitizeMetadata(value);
    } else {
      clean[key] = value;
    }
  }

  return clean;
}

/**
 * Records a security audit event asynchronously
 */
export async function logAuditEvent(
  req: Request | null,
  options: AuditLogOptions
): Promise<void> {
  try {
    const ipAddress = req
      ? (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || ''
      : 'INTERNAL';

    const userAgent = req ? (req.headers['user-agent'] as string) || '' : 'SYSTEM';

    const resolvedUserId = options.userId || (req as any)?.user?._id;

    await AuditLogModel.create({
      userId: resolvedUserId,
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId,
      ipAddress,
      userAgent,
      metadata: sanitizeMetadata(options.metadata)
    });
  } catch (error) {
    // Non-blocking logging failure
    console.error('⚠️ [AuditLog] Failed to persist audit event:', error);
  }
}
