import AppDataSource from '../db/connection';
import { AuditLog, AuditAction } from '../entities/AuditLog';
import { Employee } from '../entities/Employee';
import { TimeEntry } from '../entities/TimeEntry';

export const createAuditLog = async (
  actor: Employee,
  timeEntry: TimeEntry,
  action: AuditAction,
  changes: any,
  reason: string,
  overrideDetails?: any
): Promise<AuditLog> => {
  const auditRepo = AppDataSource.getRepository(AuditLog);

  const auditLog = auditRepo.create({
    actor_id: actor.id,
    time_entry_id: timeEntry.id,
    action,
    changes,
    reason,
    override_details: overrideDetails
  });

  return await auditRepo.save(auditLog);
}; 