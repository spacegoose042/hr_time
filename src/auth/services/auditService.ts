import { Request } from 'express';
import AppDataSource from '../../db/connection';
import { AuditLog, AuditAction } from '../../entities/AuditLog';
import { In, MoreThanOrEqual } from 'typeorm';
import { Employee } from '../../entities/Employee';

interface GetLogsOptions {
  startDate?: Date;
  endDate?: Date;
  action?: string;
  searchTerm?: string;
}

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
        action: In([AuditAction.PASSWORD_RESET, AuditAction.PASSWORD_CHANGE])
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

  static async getLogs(options: GetLogsOptions): Promise<AuditLog[]> {
    const auditRepo = AppDataSource.getRepository(AuditLog);
    const where: any = {};
    
    if (options.startDate) {
      where.created_at = MoreThanOrEqual(options.startDate);
    }
    if (options.action) {
      where.action = options.action;
    }
    
    return auditRepo.find({
      where,
      relations: ['employee'],
      order: { created_at: 'DESC' }
    });
  }

  static async getPasswordHistory(employeeId: string): Promise<AuditLog[]> {
    const auditLogRepo = AppDataSource.getRepository(AuditLog);
    
    return await auditLogRepo.find({
      where: {
        target_type: 'employee',
        target_id: employeeId,
        action: In([AuditAction.PASSWORD_RESET])
      },
      order: {
        created_at: 'DESC'
      },
      take: 5
    });
  }

  static async getLoginHistory(employeeId: string): Promise<AuditLog[]> {
    const auditLogRepo = AppDataSource.getRepository(AuditLog);
    
    return await auditLogRepo.find({
      where: {
        target_type: 'employee',
        target_id: employeeId,
        action: In([AuditAction.SUCCESSFUL_LOGIN, AuditAction.FAILED_LOGIN])
      },
      order: {
        created_at: 'DESC'
      },
      take: 10
    });
  }
} 