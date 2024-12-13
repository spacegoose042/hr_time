import AppDataSource from '../db/connection';
import { AuditLog, AuditAction } from '../entities/AuditLog';
import { Employee } from '../entities/Employee';
import { TimeEntry } from '../entities/TimeEntry';
import { Request } from 'express';
import { Session } from 'express-session';

// Extend Express Request to include session
declare module 'express-session' {
  interface SessionData {
    id: string;
  }
}

interface AuditMetadata {
  browser?: string;
  os?: string;
  device?: string;
  location?: {
    city?: string;
    country?: string;
  };
}

export const createAuditLog = async (
  actor: Employee,
  timeEntry: TimeEntry,
  action: AuditAction,
  changes: any,
  reason: string,
  req: Request,
  options?: {
    overrideDetails?: any;
    metadata?: AuditMetadata;
    tags?: string[];
    requiresReview?: boolean;
  }
): Promise<AuditLog> => {
  const auditRepo = AppDataSource.getRepository(AuditLog);

  // Get IP address (handle proxies)
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  const auditLog = auditRepo.create({
    actor_id: actor.id,
    actor: actor,
    time_entry_id: timeEntry.id,
    timeEntry: timeEntry,
    action,
    changes,
    reason,
    override_details: options?.overrideDetails,
    ip_address: typeof ip === 'string' ? ip : ip?.[0],
    user_agent: req.headers['user-agent'],
    metadata: options?.metadata || {
      browser: getBrowser(req.headers['user-agent']),
      os: getOS(req.headers['user-agent']),
      device: getDevice(req.headers['user-agent'])
    },
    session_id: (req.session as Session & { id: string })?.id || 'unknown',
    requires_review: options?.requiresReview || false,
    tags: options?.tags || []
  });

  // Save with relations
  const savedLog = await auditRepo.save(auditLog);

  // Return with populated relations
  return await auditRepo.findOne({
    where: { id: savedLog.id },
    relations: ['actor', 'timeEntry']
  }) as AuditLog;
};

// Helper functions to parse user agent
const getBrowser = (userAgent?: string): string => {
  if (!userAgent) return 'unknown';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'unknown';
};

const getOS = (userAgent?: string): string => {
  if (!userAgent) return 'unknown';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS')) return 'MacOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('iOS')) return 'iOS';
  if (userAgent.includes('Android')) return 'Android';
  return 'unknown';
};

const getDevice = (userAgent?: string): string => {
  if (!userAgent) return 'unknown';
  if (userAgent.includes('Mobile')) return 'Mobile';
  if (userAgent.includes('Tablet')) return 'Tablet';
  return 'Desktop';
}; 