import { Request } from 'express';
import AppDataSource from '../../db/connection';
import { AuditLog, AuditAction } from '../../entities/AuditLog';
import { In, MoreThanOrEqual } from 'typeorm';
import { Employee } from '../../entities/Employee';
import { createAuditLog } from '../../services/auditService';

interface GetLogsOptions {
  startDate?: Date;
  endDate?: Date;
  action?: string;
  searchTerm?: string;
}

export class AuthAuditService {
  static async log(
    employee: Employee,
    action: AuditAction,
    metadata: Record<string, any> = {},
    req?: Request
  ): Promise<void> {
    await createAuditLog({
      actor: employee,
      target: employee,
      action,
      metadata,
      req
    });
  }

  static async getPasswordHistory(employeeId: string): Promise<AuditLog[]> {
    const auditLogRepo = AppDataSource.getRepository(AuditLog);
    
    return await auditLogRepo.find({
      where: {
        target_type: 'employee',
        target_id: employeeId,
        action: AuditAction.PASSWORD_RESET
      },
      order: {
        created_at: 'DESC'
      },
      take: 5
    });
  }

  static async getFailedAttempts(
    employeeId: string,
    minutes: number = 30
  ): Promise<number> {
    const auditLogRepo = AppDataSource.getRepository(AuditLog);
    const minDate = new Date();
    minDate.setMinutes(minDate.getMinutes() - minutes);

    const attempts = await auditLogRepo.count({
      where: {
        target_type: 'employee',
        target_id: employeeId,
        action: AuditAction.FAILED_LOGIN,
        created_at: MoreThanOrEqual(minDate)
      }
    });

    return attempts;
  }

  static async getLogs(options: GetLogsOptions): Promise<AuditLog[]> {
    const auditRepo = AppDataSource.getRepository(AuditLog);
    const queryBuilder = auditRepo.createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.actor', 'actor')
      .orderBy('audit_log.created_at', 'DESC');
    
    if (options.startDate) {
      queryBuilder.andWhere('audit_log.created_at >= :startDate', { 
        startDate: options.startDate 
      });
    }
    
    if (options.endDate) {
      queryBuilder.andWhere('audit_log.created_at <= :endDate', { 
        endDate: options.endDate 
      });
    }
    
    if (options.action) {
      queryBuilder.andWhere('audit_log.action = :action', { 
        action: options.action 
      });
    }

    if (options.searchTerm) {
      queryBuilder.andWhere(
        '(actor.first_name ILIKE :search OR actor.last_name ILIKE :search OR audit_log.notes ILIKE :search)',
        { search: `%${options.searchTerm}%` }
      );
    }

    return await queryBuilder.getMany();
  }
} 