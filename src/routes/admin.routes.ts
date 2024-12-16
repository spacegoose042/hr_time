import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { UserRole } from '../auth/roles/roles';
import { validateRequest } from '../middleware/validateRequest';
import { z } from 'zod';
import AppDataSource from '../db/connection';
import { Employee } from '../entities/Employee';
import { ApiError } from '../middleware/errorHandler';
import { AuditService } from '../auth/services/auditService';
import { createObjectCsvStringifier } from 'csv-writer';
import { format as dateFormat } from 'date-fns';
import { AuditLog } from '../entities/AuditLog';

const router = Router();

// Validation schema for role update
const updateRoleSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    role: z.enum([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE])
  })
});

router.get('/employees', 
  requireAuth,
  requireRole(UserRole.ADMIN),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const employees = await AppDataSource.getRepository(Employee).find();
      res.json(employees);
    } catch (error) {
      next(error);
    }
  }
);

router.patch('/employees/role',
  requireAuth,
  requireRole(UserRole.ADMIN),
  validateRequest(updateRoleSchema),
  async (req, res, next) => {
    try {
      const { email, role } = req.body;
      const employeeRepo = AppDataSource.getRepository(Employee);
      
      const employee = await employeeRepo.findOne({ where: { email } });
      if (!employee) {
        throw new ApiError('Employee not found', 404);
      }

      employee.role = role;
      await employeeRepo.save(employee);

      const { password_hash, ...result } = employee;
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

const exportSchema = z.object({
  query: z.object({
    format: z.enum(['csv', 'json']),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    action: z.string().optional(),
    search: z.string().optional()
  })
});

router.get(
  '/audit-logs/export',
  validateRequest(exportSchema),
  async (req, res, next) => {
    try {
      const { format, startDate, endDate, action, search } = req.query as {
        format: 'csv' | 'json';
        startDate?: string;
        endDate?: string;
        action?: string;
        search?: string;
      };

      const logs = await AuditService.getLogs({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        action,
        searchTerm: search
      });

      if (format === 'json') {
        res.json(logs);
      } else {
        // CSV format
        const csvStringifier = createObjectCsvStringifier({
          header: [
            { id: 'created_at', title: 'Timestamp' },
            { id: 'action', title: 'Action' },
            { id: 'employee_name', title: 'User' },
            { id: 'employee_email', title: 'Email' },
            { id: 'ip_address', title: 'IP Address' },
            { id: 'metadata', title: 'Details' }
          ]
        });

        const records = logs.map((log: AuditLog) => ({
          created_at: dateFormat(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
          action: log.action,
          employee_name: `${log.employee.first_name} ${log.employee.last_name}`,
          employee_email: log.employee.email,
          ip_address: log.ip_address,
          metadata: JSON.stringify(log.metadata)
        }));

        const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
        res.send(csvString);
      }
    } catch (error) {
      next(error);
    }
  }
);

export default router; 