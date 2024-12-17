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
    await createAuditLog({
      actor: employee,
      target: employee,
      action: AuditAction.FAILED_LOGIN,
      metadata: {
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent']?.toString() || 'unknown',
        attempt: (employee.login_attempts || 0) + 1,
        reason: 'Invalid password'
      },
      notes: 'Failed login attempt',
      req
    });

    // Update login attempts
    await employeeRepo.update(employee.id, {
      login_attempts: () => 'COALESCE(login_attempts, 0) + 1',
      last_login_attempt: new Date()
    });

    next();
  } catch (error) {
    next(error);
  }
}; 