import { Request } from 'express';
import AppDataSource from '../../db/connection';
import { AuditLog, AuditAction } from '../../entities/AuditLog';

export class AuditService {
  static async log(
    employeeId: string,
    action: AuditAction,
    metadata: Record<string, any> = {},
    req?: Request
  ): Promise<void> {
    const auditRepo = AppDataSource.getRepository(AuditLog);

    await auditRepo.save({
      employeeId,
      action,
      metadata,
      ip_address: req?.ip,
      user_agent: req?.headers['user-agent']
    });
  }

  static async getPasswordChangeHistory(
    employeeId: string,
    limit: number = 10
  ): Promise<AuditLog[]> {
    const auditRepo = AppDataSource.getRepository(AuditLog);

    return auditRepo.find({
      where: {
        employeeId,
        action: [AuditAction.PASSWORD_RESET, AuditAction.PASSWORD_CHANGE]
      },
      order: { created_at: 'DESC' },
      take: limit
    });
  }

  static async getFailedAttempts(
    employeeId: string,
    minutes: number = 30
  ): Promise<number> {
    const auditRepo = AppDataSource.getRepository(AuditLog);
    const minDate = new Date();
    minDate.setMinutes(minDate.getMinutes() - minutes);

    const attempts = await auditRepo.count({
      where: {
        employeeId,
        action: AuditAction.FAILED_PASSWORD_ATTEMPT,
        created_at: MoreThanOrEqual(minDate)
      }
    });

    return attempts;
  }
} 