// Add imports
import { Request } from 'express';
import { Repository } from 'typeorm';
import { Employee } from '../entities/Employee';
import { ApiError } from '../middleware/errorHandler';
import { createAuditLog } from '../services/auditService';

// Add type for bulk action handler
interface BulkActionRequest extends Request {
  body: {
    action: 'approve' | 'reject' | 'delete';
    entryIds: string[];
    notes?: string;
  };
  user: Employee;
}

// Fix query parameter handling
const projectsStr = typeof req.query.projects === 'string' ? req.query.projects : '';
const tasksStr = typeof req.query.tasks === 'string' ? req.query.tasks : '';
const projects = projectsStr ? projectsStr.split(',') : [];
const tasks = tasksStr ? tasksStr.split(',') : [];

// Fix pagination params
const page = Number(typeof req.query.page === 'string' ? req.query.page : '1');
const limit = Number(typeof req.query.limit === 'string' ? req.query.limit : '10');
const offset = (page - 1) * limit;

// Add DELETE to AuditAction enum
export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  FORCE_CLOSE = 'force_close',
  OVERRIDE_VALIDATION = 'override_validation'
}

// Fix manager type
const managerEmployee = await employeeRepo.findOne({ where: { id: manager.id } });
if (!managerEmployee) {
  throw new ApiError('Manager not found', 404);
}

await createAuditLog(
  managerEmployee,
  entry,
  action === 'delete' ? AuditAction.DELETE : AuditAction[action.toUpperCase() as keyof typeof AuditAction],
  { before: entry },
  notes || `Bulk ${action} action`,
  req,
  {
    tags: [`bulk-${action}`],
    requiresReview: false
  }
); 