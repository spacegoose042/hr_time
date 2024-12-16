import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../auth/services/auditService';
import { AuditAction } from '../entities/AuditLog';
import { ApiError } from './errorHandler';

export const trackFailedLogins = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    const employeeRepo = AppDataSource.getRepository(Employee);
    const employee = await employeeRepo.findOne({ where: { email } });

    if (employee) {
      const failedAttempts = await AuditService.getFailedAttempts(employee.id);
      
      if (failedAttempts >= 5) {
        // Lock account
        employee.status = 'locked';
        await employeeRepo.save(employee);
        
        await AuditService.log(
          employee.id,
          AuditAction.ACCOUNT_LOCKED,
          { reason: 'Too many failed attempts' },
          req
        );

        throw new ApiError('Account locked due to too many failed attempts', 403);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}; 