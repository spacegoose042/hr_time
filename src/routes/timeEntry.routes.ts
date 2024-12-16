import { Router, Request, Response, NextFunction } from 'express';
import { Repository, In } from 'typeorm';
import { Employee } from '../entities/Employee';
import { ApiError } from '../middleware/errorHandler';
import { createAuditLog } from '../services/auditService';
import AppDataSource from '../db/connection';
import { TimeEntry } from '../entities/TimeEntry';
import { AuditAction } from '../entities/AuditLog';

interface AuthenticatedRequest extends Request {
  user: Employee;
}

const router = Router();

// Add type-safe query parameter handling
const getQueryParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

router.get('/entries', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const timeEntryRepo = AppDataSource.getRepository(TimeEntry);

    // Type-safe query parameter handling
    const projectsStr = getQueryParam(req.query.projects as string);
    const tasksStr = getQueryParam(req.query.tasks as string);
    const projects = projectsStr ? projectsStr.split(',') : [];
    const tasks = tasksStr ? tasksStr.split(',') : [];

    const page = Math.max(1, Number(getQueryParam(req.query.page)) || 1);
    const limit = Math.max(1, Number(getQueryParam(req.query.limit)) || 10);
    const offset = (page - 1) * limit;

    const queryBuilder = timeEntryRepo.createQueryBuilder('time_entry')
      .where('time_entry.employee_id = :employeeId', { employeeId: req.user.id })
      .skip(offset)
      .take(limit);

    if (projects.length) {
      queryBuilder.andWhere('time_entry.project IN (:...projects)', { projects });
    }

    if (tasks.length) {
      queryBuilder.andWhere('time_entry.task IN (:...tasks)', { tasks });
    }

    const [entries, total] = await queryBuilder.getManyAndCount();

    res.json({
      entries,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('Error fetching time entries:', error);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
});

router.post('/bulk-action', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, entryIds, notes } = req.body;
    const timeEntryRepo = AppDataSource.getRepository(TimeEntry);
    const employeeRepo = AppDataSource.getRepository(Employee);

    const manager = await employeeRepo.findOneOrFail({ where: { id: req.user.id } });
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
        notes || `Bulk ${action} action`
      )
    );

    await Promise.all(auditPromises);
    res.json({ status: 'success', count: entries.length });
  } catch (error) {
    console.error('Error in bulk action:', error);
    res.status(500).json({ error: 'Failed to perform bulk action' });
  }
});

export default router; 
