import { Request } from 'express';
import { Employee } from '../entities/Employee';
import { TimeEntry } from '../entities/TimeEntry';
import { AuditLog, AuditAction, AuditMetadata, AuditTargetType } from '../entities/AuditLog';
import AppDataSource from '../db/connection';

interface CreateAuditLogParams {
    actor: Employee;
    target: TimeEntry | Employee | null;
    action: AuditAction;
    metadata?: AuditMetadata;
    notes?: string;
    req?: Request;
}

export const createAuditLog = async ({
    actor,
    target,
    action,
    metadata = {},
    notes = '',
    req
}: CreateAuditLogParams): Promise<AuditLog> => {
    const auditLogRepo = AppDataSource.getRepository(AuditLog);

    const targetType: AuditTargetType = target instanceof TimeEntry ? 'time_entry' : 'employee';
    const targetId = target?.id || 'system';

    const auditLog = auditLogRepo.create({
        actor,
        action,
        target_type: targetType,
        target_id: targetId,
        metadata: {
            ...metadata,
            ip: req?.ip || 'unknown',
            userAgent: req?.headers['user-agent'] || 'unknown'
        },
        notes
    });

    return await auditLogRepo.save(auditLog);
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