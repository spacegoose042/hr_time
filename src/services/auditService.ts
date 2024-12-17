import { Request } from 'express';
import { Employee } from '../entities/Employee';
import { TimeEntry } from '../entities/TimeEntry';
import { AuditLog, AuditAction } from '../entities/AuditLog';
import AppDataSource from '../db/connection';

interface AuditMetadata {
  before?: any;
  after?: any;
  ip?: string;
  userAgent?: string;
}

export const createAuditLog = async (
  actor: Employee,
  target: TimeEntry,
  action: AuditAction,
  metadata: AuditMetadata = {},
  notes?: string,
  req?: Request
) => {
  try {
    const auditLogRepo = AppDataSource.getRepository(AuditLog);

    // Extract IP and user agent from request if available
    const ip = req?.ip || metadata.ip || 'unknown';
    const userAgent = req?.headers['user-agent'] || metadata.userAgent || 'unknown';

    // Create the audit log entry
    const auditLog = auditLogRepo.create({
      actor: actor,
      action: action,
      target_type: 'time_entry',
      target_id: target.id,
      metadata: {
        ...metadata,
        ip,
        userAgent
      },
      notes: notes || ''
    });

    // Save the audit log
    const savedLog = await auditLogRepo.save(auditLog);

    // Fetch the complete log with relations
    const completeLog = await auditLogRepo.findOne({
      where: { id: savedLog.id },
      relations: ['actor']
    });

    if (!completeLog) {
      throw new Error('Failed to create audit log');
    }

    return completeLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    throw error;
  }
};

export const getAuditLogs = async (
  page = 1,
  limit = 10,
  filters: Partial<{
    action: AuditAction;
    actor_id: string;
    target_id: string;
    startDate: Date;
    endDate: Date;
  }> = {}
) => {
  const auditLogRepo = AppDataSource.getRepository(AuditLog);
  const queryBuilder = auditLogRepo.createQueryBuilder('audit_log')
    .leftJoinAndSelect('audit_log.actor', 'actor')
    .orderBy('audit_log.created_at', 'DESC');

  // Apply filters
  if (filters.action) {
    queryBuilder.andWhere('audit_log.action = :action', { action: filters.action });
  }
  if (filters.actor_id) {
    queryBuilder.andWhere('actor.id = :actorId', { actorId: filters.actor_id });
  }
  if (filters.target_id) {
    queryBuilder.andWhere('audit_log.target_id = :targetId', { targetId: filters.target_id });
  }
  if (filters.startDate) {
    queryBuilder.andWhere('audit_log.created_at >= :startDate', { startDate: filters.startDate });
  }
  if (filters.endDate) {
    queryBuilder.andWhere('audit_log.created_at <= :endDate', { endDate: filters.endDate });
  }

  // Add pagination
  const skip = (page - 1) * limit;
  queryBuilder.skip(skip).take(limit);

  // Get results and count
  const [logs, total] = await queryBuilder.getManyAndCount();

  return {
    logs,
    total,
    page,
    limit
  };
}; 