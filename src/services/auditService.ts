import { AuditLog, AuditAction } from '../entities/AuditLog';
import { Employee } from '../entities/Employee';
import { TimeEntry } from '../entities/TimeEntry';
import AppDataSource from '../db/connection';

export const createAuditLog = async (
  actor: Employee,
  timeEntry: TimeEntry,
  action: AuditAction,
  changes: any,
  reason: string,
  overrideDetails?: any
) => {
  const auditRepo = AppDataSource.getRepository(AuditLog);
  
  const auditLog = auditRepo.create({
    actorId: actor.id,
    timeEntryId: timeEntry.id,
    action,
    changes,
    reason,
    overrideDetails
  });

  return auditRepo.save(auditLog);
}; 