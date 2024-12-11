import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { z } from 'zod';
import AppDataSource from '../db/connection';
import { TimeEntry } from '../entities/TimeEntry';
import { Employee } from '../entities/Employee';
import { ApiError } from '../middleware/errorHandler';
import { IsNull, In, Not, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import { UserRole } from '../auth/roles/roles';
import { TimeReport } from '../types/timeEntry';
import { convertTimeEntriesToCSV } from '../utils/csvExporter';
import { sendTimeEntryStatusUpdate } from '../services/emailService';
import { generateTestWeeklyReport } from '../services/schedulerService';

const router = Router();

const clockInSchema = z.object({
  body: z.object({
    notes: z.string().optional()
  })
});

const clockOutSchema = z.object({
  body: z.object({
    notes: z.string().optional()
  })
});

const approvalSchema = z.object({
  body: z.object({
    timeEntryIds: z.array(z.string().uuid()),
    status: z.enum(['approved', 'rejected']),
    notes: z.string().optional()
  })
});

// Clock in
router.post('/clock-in',
  requireAuth,
  validateRequest(clockInSchema),
  async (req, res, next) => {
    try {
      console.log('Clock in request from user:', req.user);
      const timeEntryRepo = AppDataSource.getRepository(TimeEntry);
      const employee = req.user as Employee;

      // Check if employee already has an open time entry
      console.log('Checking for open time entries');
      const openEntry = await timeEntryRepo.findOne({
        where: {
          employeeId: employee.id,
          clock_out: IsNull()
        }
      });

      if (openEntry) {
        throw new ApiError('You already have an open time entry', 400);
      }

      console.log('Creating new time entry');
      const timeEntry = timeEntryRepo.create({
        employeeId: employee.id,
        employee,
        clock_in: new Date(),
        notes: req.body.notes,
        status: 'pending'
      });

      console.log('Saving time entry');
      const savedEntry = await timeEntryRepo.save(timeEntry);
      console.log('Time entry saved:', savedEntry);

      res.status(201).json(savedEntry);
    } catch (error) {
      console.error('Error in clock-in endpoint:', error);
      next(error);
    }
  }
);

// Clock out
router.post('/clock-out',
  requireAuth,
  validateRequest(clockOutSchema),
  async (req, res, next) => {
    try {
      const timeEntryRepo = AppDataSource.getRepository(TimeEntry);
      const employee = req.user as Employee;

      const openEntry = await timeEntryRepo.findOne({
        where: {
          employee: { id: employee.id },
          clock_out: IsNull()
        }
      });

      if (!openEntry) {
        throw new ApiError('No open time entry found', 400);
      }

      openEntry.clock_out = new Date();
      if (req.body.notes) {
        openEntry.notes = openEntry.notes 
          ? `${openEntry.notes}\n${req.body.notes}`
          : req.body.notes;
      }

      await timeEntryRepo.save(openEntry);
      res.json(openEntry);
    } catch (error) {
      next(error);
    }
  }
);

// Get current user's time entries
router.get('/entries',
  requireAuth,
  async (req, res, next) => {
    try {
      const timeEntryRepo = AppDataSource.getRepository(TimeEntry);
      const employee = req.user as Employee;

      const entries = await timeEntryRepo.find({
        where: { employee: { id: employee.id } },
        order: { clock_in: 'DESC' }
      });

      res.json(entries);
    } catch (error) {
      next(error);
    }
  }
);

// Get pending entries for manager approval
router.get('/pending-approval',
  requireAuth,
  requireRole(UserRole.MANAGER),
  async (req, res, next) => {
    try {
      const timeEntryRepo = AppDataSource.getRepository(TimeEntry);
      const employeeRepo = AppDataSource.getRepository(Employee);

      // Get all employees if admin, or only direct reports if manager
      const manager = req.user as Employee;
      let employeeIds: string[];

      if (manager.role === UserRole.ADMIN) {
        const employees = await employeeRepo.find();
        employeeIds = employees.map(emp => emp.id);
      } else {
        // In a real app, you'd have a direct_reports relationship
        // For now, let managers see all employee entries
        const employees = await employeeRepo.find({
          where: { role: UserRole.EMPLOYEE }
        });
        employeeIds = employees.map(emp => emp.id);
      }

      const entries = await timeEntryRepo.find({
        where: {
          employee: { id: In(employeeIds) },
          status: 'pending',
          clock_out: Not(IsNull()) // Only show completed entries
        },
        relations: ['employee'],
        order: { clock_in: 'DESC' }
      });

      res.json(entries);
    } catch (error) {
      next(error);
    }
  }
);

// Approve/Reject time entries
router.patch('/approve',
  requireAuth,
  requireRole(UserRole.MANAGER),
  validateRequest(approvalSchema),
  async (req, res, next) => {
    try {
      const { timeEntryIds, status, notes } = req.body;
      const timeEntryRepo = AppDataSource.getRepository(TimeEntry);
      const manager = req.user as Employee;

      const entries = await timeEntryRepo.find({
        where: {
          id: In(timeEntryIds),
          status: 'pending'
        },
        relations: ['employee']
      });

      if (entries.length !== timeEntryIds.length) {
        throw new ApiError('One or more time entries not found or already processed', 400);
      }

      const updatedEntries = await Promise.all(entries.map(async entry => {
        entry.status = status;
        if (notes) {
          entry.notes = entry.notes 
            ? `${entry.notes}\nManager Note (${manager.first_name} ${manager.last_name}): ${notes}`
            : `Manager Note (${manager.first_name} ${manager.last_name}): ${notes}`;
        }
        const savedEntry = await timeEntryRepo.save(entry);
        
        // Send email notification
        await sendTimeEntryStatusUpdate(savedEntry, status, notes);
        
        return savedEntry;
      }));

      res.json(updatedEntries);
    } catch (error) {
      next(error);
    }
  }
);

// Get employee time entries with filters
router.get('/report',
  requireAuth,
  requireRole(UserRole.MANAGER),
  async (req, res, next) => {
    try {
      const timeEntryRepo = AppDataSource.getRepository(TimeEntry);
      const { 
        startDate, 
        endDate, 
        employeeId, 
        status,
        format
      } = req.query as { 
        startDate?: string; 
        endDate?: string; 
        employeeId?: string;
        status?: 'pending' | 'approved' | 'rejected';
        format?: 'json' | 'csv';
      };

      const where: any = {};

      if (startDate && endDate) {
        where.clock_in = Between(new Date(startDate), new Date(endDate));
      } else if (startDate) {
        where.clock_in = MoreThanOrEqual(new Date(startDate));
      } else if (endDate) {
        where.clock_in = LessThanOrEqual(new Date(endDate));
      }

      if (employeeId) {
        where.employeeId = employeeId;
      }
      if (status) {
        where.status = status;
      }

      const entries = await timeEntryRepo.find({
        where,
        relations: ['employee'],
        order: { clock_in: 'DESC' }
      });

      if (format === 'csv') {
        const csv = convertTimeEntriesToCSV(entries);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=time-entries.csv');
        return res.send(csv);
      }

      const totalHours = entries.reduce((total, entry) => {
        if (entry.clock_out) {
          const duration = new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime();
          return total + (duration / (1000 * 60 * 60));
        }
        return total;
      }, 0);

      const summary = {
        approved: entries.filter(e => e.status === 'approved').length,
        pending: entries.filter(e => e.status === 'pending').length,
        rejected: entries.filter(e => e.status === 'rejected').length
      };

      const report: TimeReport = {
        totalHours,
        entries,
        summary
      };

      return res.json(report);
    } catch (error) {
      return next(error);
    }
  }
);

router.post('/test-weekly-report',
  requireAuth,
  requireRole(UserRole.MANAGER),
  async (_req, res, next) => {
    try {
      await generateTestWeeklyReport();
      res.json({ message: 'Weekly report test triggered successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router; 