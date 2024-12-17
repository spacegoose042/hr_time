import { Request, Response, NextFunction } from 'express';
import { Employee } from '../entities/Employee';
import { AuditAction } from '../entities/AuditLog';
import { createAuditLog } from '../services/auditService';
import AppDataSource from '../db/connection';

export const trackFailedLogins = async (
  employee: Employee,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeRepo = AppDataSource.getRepository(Employee);
    
    // Create audit log for failed attempt
    await createAuditLog(
      employee,
      null,
      AuditAction.FAILED_LOGIN,
      {
        attempt: employee.failed_login_attempts + 1,
        reason: 'Invalid password'
      },
      'Failed login attempt',
      req
    );

    // Update failed login attempts
    await employeeRepo.update(employee.id, {
      failed_login_attempts: () => 'failed_login_attempts + 1',
      last_failed_login: new Date()
    });

    next();
  } catch (error) {
    next(error);
  }
}; 