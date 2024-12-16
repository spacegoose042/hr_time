import { Router, Request, Response, NextFunction } from 'express';
import { Repository } from 'typeorm';
import { Employee } from '../entities/Employee';
import { ApiError } from '../middleware/errorHandler';
import { createAuditLog } from '../services/auditService';
import AppDataSource from '../db/connection';
import { TimeEntry } from '../entities/TimeEntry';
import { ParsedQs } from 'qs';
import { In } from 'typeorm';

// Add type for bulk action handler
interface BulkActionRequest extends Request {
  body: {
    action: 'approve' | 'reject' | 'delete';
    entryIds: string[];
    notes?: string;
  };
  user: Employee;
}

const router = Router();

// Move query handling into route handler
router.get('/entries', async (req: Request, res: Response) => {
  const employeeRepo = AppDataSource.getRepository(Employee);
  const timeEntryRepo = AppDataSource.getRepository(TimeEntry);

  // Type-safe query parameter handling
  const projectsStr = typeof req.query.projects === 'string' ? req.query.projects : '';
  const tasksStr = typeof req.query.tasks === 'string' ? req.query.tasks : '';
  const projects = projectsStr ? projectsStr.split(',') : [];
  const tasks = tasksStr ? tasksStr.split(',') : [];

  const page = Number(typeof req.query.page === 'string' ? req.query.page : '1');
  const limit = Number(typeof req.query.limit === 'string' ? req.query.limit : '10');
  const offset = (page - 1) * limit;

  // ... rest of the route handler
});

// Add bulk action handler
router.post('/bulk-action', async (req: BulkActionRequest, res: Response) => {
  const { action, entryIds, notes } = req.body;
  const employeeRepo = AppDataSource.getRepository(Employee);
  const timeEntryRepo = AppDataSource.getRepository(TimeEntry);

  const managerEmployee = await employeeRepo.findOne({ where: { id: req.user.id } });
  if (!managerEmployee) {
    throw new ApiError('Manager not found', 404);
  }

  const entries = await timeEntryRepo.find({
    where: { id: In(entryIds) },
    relations: ['employee']
  });

  // ... rest of the handler
});

export default router; 
