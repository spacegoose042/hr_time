import { Router, Request, Response } from 'express';
import { Repository, In } from 'typeorm';
import { Employee } from '../entities/Employee';
import { ApiError } from '../middleware/errorHandler';
import { createAuditLog } from '../services/auditService';
import AppDataSource from '../db/connection';
import { TimeEntry } from '../entities/TimeEntry';
import { AuditAction } from '../entities/AuditLog';
import { UserRole } from '../auth/roles/roles';
import { wrapAsync } from '../utils/asyncHandler';

interface AuthenticatedRequest extends Request {
  user: Employee;
}

const router = Router();

router.get('/entries', wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const timeEntryRepo = AppDataSource.getRepository(TimeEntry);
  // ... rest of the handler
}));

router.post('/bulk-action', wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { action, entryIds, notes } = req.body;
  const timeEntryRepo = AppDataSource.getRepository(TimeEntry);
  const employeeRepo = AppDataSource.getRepository(Employee);

  const manager = await employeeRepo.findOne({
    where: { 
      id: req.user.id,
      role: In([UserRole.MANAGER, UserRole.ADMIN])
    }
  });

  if (!manager) {
    throw new ApiError('Unauthorized - Manager access required', 403);
  }

  // ... rest of the handler
}));

export default router; 
