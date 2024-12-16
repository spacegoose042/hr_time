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
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  const queryBuilder = timeEntryRepo.createQueryBuilder('time_entry')
    .where('time_entry.employee_id = :employeeId', { employeeId: req.user.id })
    .skip(offset)
    .take(limit);

  // Handle project filter
  if (typeof req.query.projects === 'string') {
    const projects = req.query.projects.split(',');
    if (projects.length) {
      queryBuilder.andWhere('time_entry.project IN (:...projects)', { projects });
    }
  }

  // Handle task filter
  if (typeof req.query.tasks === 'string') {
    const tasks = req.query.tasks.split(',');
    if (tasks.length) {
      queryBuilder.andWhere('time_entry.task IN (:...tasks)', { tasks });
    }
  }

  const [entries, total] = await queryBuilder.getManyAndCount();

  res.json({
    entries,
    total,
    page,
    limit
  });
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

  const entries = await timeEntryRepo.find({
    where: { id: In(entryIds) },
    relations: ['employee']
  });

  if (entries.length !== entryIds.length) {
    throw new ApiError('One or more entries not found', 400);
  }

  // Create audit logs for each action
  const auditPromises = entries.map(entry => 
    createAuditLog(
      manager,
      entry,
      action === 'delete' ? AuditAction.DELETE : AuditAction[action.toUpperCase() as keyof typeof AuditAction],
      { before: entry },
      notes || `Bulk ${action} action`,
      req
    )
  );

  await Promise.all(auditPromises);
  res.json({ status: 'success', count: entries.length });
}));

export default router; 
