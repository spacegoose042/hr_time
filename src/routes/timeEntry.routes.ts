import { Router, Request, Response, NextFunction } from 'express';
import { RequestHandler } from 'express-serve-static-core';
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
import { Repository } from 'typeorm';
import { createAuditLog } from '../services/auditService';
import { AuditAction } from '../entities/AuditLog';
import { AuditLog } from '../entities/AuditLog';

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

const updateCurrentSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
    clockIn: z.string().datetime().optional(),  // ISO datetime string
    project: z.string().optional(),
    task: z.string().optional(),
    breakMinutes: z.number().min(0).max(480).optional(),  // Max 8 hours
    breakNotes: z.string().optional()
  })
});

const forceCloseSchema = z.object({
  body: z.object({
    timeEntryId: z.string().uuid(),
    clockOut: z.string().datetime().optional(),
    notes: z.string().optional(),
    reason: z.string().min(10).max(500),
    breakMinutes: z.number().min(0).max(480).optional(),
    overrideValidation: z.boolean().optional()
  })
});

const entriesQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => parseInt(val || '1')),
    limit: z.string().optional().transform(val => parseInt(val || '10')),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(['pending', 'approved', 'rejected']).optional()
  })
});

// Add this helper function at the top of the file
const hasOverlappingEntry = async (
  timeEntryRepo: Repository<TimeEntry>,
  employeeId: string,
  clockIn: Date,
  clockOut?: Date
): Promise<boolean> => {
  // For clock-in, we need to check if there are any entries that:
  // 1. Have the same employee
  // 2. Either:
  //    a. Are still open (no clock_out)
  //    b. Have a clock_out time that's after our clock_in time
  const overlappingEntry = await timeEntryRepo.findOne({
    where: [
      {
        employeeId,
        clock_out: IsNull()
      },
      {
        employeeId,
        clock_in: LessThanOrEqual(clockIn),
        clock_out: MoreThanOrEqual(clockIn)
      },
      clockOut ? {
        employeeId,
        clock_in: Between(clockIn, clockOut)
      } : {}
    ]
  });

  return !!overlappingEntry;
};

// Add validation helper functions
const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
};

const isHoliday = (date: Date): boolean => {
  // Add your holiday logic here
  const holidays = [
    '2024-12-25', // Christmas
    '2024-01-01', // New Year
    // Add more holidays
  ];
  return holidays.includes(date.toISOString().split('T')[0]);
};

const validateTimeEntry = async (
  entry: TimeEntry,
  clockOutTime: Date,
  breakMinutes: number | undefined,
  overrideValidation: boolean | undefined,
  timeEntryRepo: Repository<TimeEntry>
): Promise<string[]> => {
  const warnings: string[] = [];

  // Calculate duration
  const durationMs = clockOutTime.getTime() - new Date(entry.clock_in).getTime();
  const durationHours = durationMs / (1000 * 60 * 60);

  // 1. Maximum hours validation (12 hours)
  if (durationHours > 12 && !overrideValidation) {
    throw new ApiError('Time entry exceeds maximum allowed duration (12 hours)', 400);
  } else if (durationHours > 8) {
    warnings.push('Time entry exceeds standard work day (8 hours)');
  }

  // 2. Break time validation
  const totalBreakMinutes = (breakMinutes ?? entry.break_minutes ?? 0);
  if (durationHours >= 6 && totalBreakMinutes < 30 && !overrideValidation) {
    throw new ApiError('Minimum 30-minute break required for shifts over 6 hours', 400);
  }

  // 3. Weekend/Holiday validation
  if (isWeekend(clockOutTime) || isHoliday(clockOutTime)) {
    warnings.push('Time entry includes weekend/holiday hours');
  }

  // 4. Check for overlaps with other entries
  const hasOverlap = await hasOverlappingEntry(
    timeEntryRepo,
    entry.employeeId,
    entry.clock_in,
    clockOutTime
  );

  if (hasOverlap && !overrideValidation) {
    throw new ApiError('This clock-out time would create an overlap with other entries', 400);
  }

  return warnings;
};

// Clock in
router.post('/clock-in',
  requireAuth,
  validateRequest(clockInSchema),
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Clock in request from user:', req.user);
      const timeEntryRepo = AppDataSource.getRepository(TimeEntry);
      const employee = req.user as Employee;
      const clockIn = new Date();

      // Check for overlapping entries
      const hasOverlap = await hasOverlappingEntry(
        timeEntryRepo,
        employee.id,
        clockIn
      );

      if (hasOverlap) {
        throw new ApiError('You have an overlapping time entry', 400);
      }

      console.log('Creating new time entry');
      const timeEntry = timeEntryRepo.create({
        employeeId: employee.id,
        employee,
        clock_in: clockIn,
        notes: req.body.notes,
        status: 'pending'
      });

      console.log('Saving time entry');
      const savedEntry = await timeEntryRepo.save(timeEntry);
      console.log('Time entry saved:', savedEntry);

      res.json({
        status: 'success',
        data: savedEntry
      });
      return;
    } catch (error) {
      console.error('Error in clock-in endpoint:', error);
      next(error);
      return;
    }
  }) as RequestHandler
);

// Clock out
router.post('/clock-out',
  requireAuth,
  validateRequest(clockOutSchema),
  async (req, res, next) => {
    try {
      const timeEntryRepo = AppDataSource.getRepository(TimeEntry);
      const employee = req.user as Employee;
      const clockOut = new Date();

      const openEntry = await timeEntryRepo.findOne({
        where: {
          employeeId: employee.id,
          clock_out: IsNull()
        }
      });

      if (!openEntry) {
        throw new ApiError('No open time entry found', 400);
      }

      // Check if clock-out time would create an overlap
      const hasOverlap = await hasOverlappingEntry(
        timeEntryRepo,
        employee.id,
        openEntry.clock_in,
        clockOut
      );

      if (hasOverlap) {
        throw new ApiError('This clock-out time would create an overlapping entry', 400);
      }

      openEntry.clock_out = clockOut;
      if (req.body.notes) {
        openEntry.notes = openEntry.notes 
          ? `${openEntry.notes}\n${req.body.notes}`
          : req.body.notes;
      }

      const savedEntry = await timeEntryRepo.save(openEntry);
      res.json(savedEntry);
    } catch (error) {
      next(error);
    }
  }
);

// Get current user's time entries
router.get('/entries',
  requireAuth,
  validateRequest(entriesQuerySchema),
  async (req, res, next) => {
    try {
      const timeEntryRepo = AppDataSource.getRepository(TimeEntry);
      const employee = req.user as Employee;
      const { page, limit, startDate, endDate, status } = req.query;

      // Parse pagination params with defaults
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const whereClause: any = {
        employeeId: employee.id
      };

      if (startDate) {
        whereClause.clock_in = MoreThanOrEqual(new Date(startDate as string));
      }

      if (endDate) {
        whereClause.clock_in = LessThanOrEqual(new Date(endDate as string));
      }

      if (status) {
        whereClause.status = status;
      }

      // Get total count with filters
      const total = await timeEntryRepo.count({
        where: whereClause
      });

      // Get paginated entries with filters
      const entries = await timeEntryRepo.find({
        where: whereClause,
        order: { clock_in: 'DESC' },
        skip,
        take: limitNum,
        relations: ['employee']
      });

      // Calculate duration for each entry
      const entriesWithDuration = entries.map(entry => {
        if (entry.clock_out) {
          const duration = new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime();
          const hours = Math.floor(duration / (1000 * 60 * 60));
          const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
          return {
            ...entry,
            duration: `${hours}:${minutes.toString().padStart(2, '0')}`
          };
        }
        return entry;
      });

      res.json({
        entries: entriesWithDuration,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get pending entries for manager approval
router.get('/pending-approval',
  requireAuth,
  requireRole(UserRole.MANAGER),
  (async (req: Request, res: Response, next: NextFunction) => {
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
      return;
    } catch (error) {
      next(error);
      return;
    }
  }) as RequestHandler
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

// Add this near your other routes
router.get('/current',
  requireAuth,
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const timeEntryRepo = AppDataSource.getRepository(TimeEntry);
      const employee = req.user as Employee;

      const openEntry = await timeEntryRepo.findOne({
        where: {
          employeeId: employee.id,
          clock_out: IsNull()
        },
        relations: ['employee'],
        order: { clock_in: 'DESC' }
      });

      if (!openEntry) {
        res.json({ 
          status: 'not_clocked_in',
          message: 'No open time entry found',
          lastEntry: await timeEntryRepo.findOne({
            where: { employeeId: employee.id },
            order: { clock_in: 'DESC' },
            relations: ['employee']
          })
        });
        return;
      }

      // Calculate duration so far
      const now = new Date();
      const durationMs = now.getTime() - new Date(openEntry.clock_in).getTime();
      const durationHours = durationMs / (1000 * 60 * 60);

      res.json({
        status: 'clocked_in',
        timeEntry: openEntry,
        duration: {
          hours: Number(durationHours.toFixed(2)),
          minutes: Math.floor((durationMs / (1000 * 60)) % 60),
          seconds: Math.floor((durationMs / 1000) % 60)
        }
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }) as RequestHandler
);

router.patch('/current',
  requireAuth,
  validateRequest(updateCurrentSchema),
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const timeEntryRepo = AppDataSource.getRepository(TimeEntry);
      const employee = req.user as Employee;

      const openEntry = await timeEntryRepo.findOne({
        where: {
          employeeId: employee.id,
          clock_out: IsNull()
        },
        relations: ['employee']
      });

      if (!openEntry) {
        throw new ApiError('No open time entry found', 404);
      }

      // Update notes if provided
      if (req.body.notes) {
        openEntry.notes = openEntry.notes
          ? `${openEntry.notes}\nUpdate: ${req.body.notes}`
          : req.body.notes;
      }

      // Update clock-in time if provided (with validation)
      if (req.body.clockIn) {
        const newClockIn = new Date(req.body.clockIn);
        const now = new Date();
        
        // Validate new clock-in time
        if (newClockIn > now) {
          throw new ApiError('Clock-in time cannot be in the future', 400);
        }

        // Check for overlaps with the new time
        const hasOverlap = await hasOverlappingEntry(
          timeEntryRepo,
          employee.id,
          newClockIn
        );

        if (hasOverlap) {
          throw new ApiError('This clock-in time would create an overlap', 400);
        }

        openEntry.clock_in = newClockIn;
      }

      // Update project/task if provided
      if (req.body.project) {
        openEntry.project = req.body.project;
      }
      if (req.body.task) {
        openEntry.task = req.body.task;
      }

      // Update break time if provided
      if (req.body.breakMinutes !== undefined) {
        openEntry.break_minutes = req.body.breakMinutes;
        if (req.body.breakNotes) {
          openEntry.break_notes = req.body.breakNotes;
        }
      }

      const updatedEntry = await timeEntryRepo.save(openEntry);

      // Calculate duration (excluding break time)
      const now = new Date();
      const durationMs = now.getTime() - new Date(updatedEntry.clock_in).getTime();
      const breakMs = (updatedEntry.break_minutes || 0) * 60 * 1000;
      const netDurationMs = durationMs - breakMs;
      const durationHours = netDurationMs / (1000 * 60 * 60);

      res.json({
        status: 'success',
        data: updatedEntry,
        duration: {
          hours: Number(durationHours.toFixed(2)),
          minutes: Math.floor((netDurationMs / (1000 * 60)) % 60),
          seconds: Math.floor((netDurationMs / 1000) % 60),
          breakMinutes: updatedEntry.break_minutes || 0
        }
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }) as RequestHandler
);

router.post('/force-close',
  requireAuth,
  requireRole(UserRole.MANAGER),
  validateRequest(forceCloseSchema),
  async (req, res, next) => {
    try {
      const timeEntryRepo = AppDataSource.getRepository(TimeEntry);
      const manager = req.user as Employee;
      const { timeEntryId, clockOut, notes, reason, breakMinutes, overrideValidation } = req.body;

      const entry = await timeEntryRepo.findOne({
        where: { id: timeEntryId },
        relations: ['employee']
      });

      if (!entry) {
        throw new ApiError('Time entry not found', 404);
      }

      if (entry.clock_out) {
        throw new ApiError('Time entry is already closed', 400);
      }

      // Set clock-out time (use provided time or current time)
      const clockOutTime = clockOut ? new Date(clockOut) : new Date();
      const now = new Date();

      console.log('Current time:', now.toISOString());
      console.log('Requested clock-out time:', clockOutTime.toISOString());

      // Basic time validation
      if (clockOutTime > now) {
        console.log('Clock-out time is in future by:', 
          (clockOutTime.getTime() - now.getTime()) / 1000, 'seconds');
        throw new ApiError('Clock-out time cannot be in the future', 400);
      }

      // Run all validations
      const warnings = await validateTimeEntry(
        entry,
        clockOutTime,
        breakMinutes,
        overrideValidation,
        timeEntryRepo
      );

      // Capture original state for audit
      const originalState = { ...entry };

      // Update the entry
      entry.clock_out = clockOutTime;
      if (breakMinutes !== undefined) {
        entry.break_minutes = breakMinutes;
      }

      // Add warnings to notes if any
      const warningNotes = warnings.length > 0 
        ? `\nWarnings:\n${warnings.join('\n')}`
        : '';

      entry.notes = entry.notes
        ? `${entry.notes}\nForce closed by ${manager.first_name} ${manager.last_name}\nReason: ${reason}${notes ? `\nNotes: ${notes}` : ''}${warningNotes}`
        : `Force closed by ${manager.first_name} ${manager.last_name}\nReason: ${reason}${notes ? `\nNotes: ${notes}` : ''}${warningNotes}`;

      const savedEntry = await timeEntryRepo.save(entry);

      // Create audit log with new signature
      await createAuditLog(
        manager,
        savedEntry,
        overrideValidation ? AuditAction.OVERRIDE_VALIDATION : AuditAction.FORCE_CLOSE,
        {
          before: originalState,
          after: savedEntry
        },
        reason,
        req,  // Pass the request object
        {     // Pass options as an object
          overrideDetails: overrideValidation ? {
            warnings,
            overrideReason: reason
          } : undefined,
          tags: ['force-close', overrideValidation ? 'validation-override' : ''],
          requiresReview: warnings.length > 0
        }
      );

      // Send notification with warnings
      await sendTimeEntryStatusUpdate(
        savedEntry,
        'force_closed' as any,
        `Force closed by ${manager.first_name} ${manager.last_name}. Reason: ${reason}${warningNotes}`
      );

      // Calculate duration
      const durationMs = clockOutTime.getTime() - new Date(entry.clock_in).getTime();
      const breakMs = (savedEntry.break_minutes || 0) * 60 * 1000;
      const netDurationMs = durationMs - breakMs;
      const durationHours = netDurationMs / (1000 * 60 * 60);

      return res.json({
        status: 'force_closed',
        timeEntry: savedEntry,
        duration: {
          hours: Number(durationHours.toFixed(2)),
          minutes: Math.floor((netDurationMs / (1000 * 60)) % 60),
          seconds: Math.floor((netDurationMs / 1000) % 60),
          breakMinutes: savedEntry.break_minutes || 0
        },
        warnings
      });
    } catch (error) {
      console.error('Error in force-close:', error);
      return next(error);
    }
  }
);

// Add an endpoint to view audit logs
router.get('/audit-logs',
  requireAuth,
  requireRole(UserRole.MANAGER),
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auditRepo = AppDataSource.getRepository(AuditLog);
      const { timeEntryId } = req.query;

      console.log('Fetching audit logs for timeEntryId:', timeEntryId);

      const query = auditRepo.createQueryBuilder('audit')
        .leftJoinAndSelect('audit.actor', 'actor')
        .leftJoinAndSelect('audit.timeEntry', 'timeEntry')
        .orderBy('audit.created_at', 'DESC');

      if (timeEntryId) {
        query.where('audit.time_entry_id = :timeEntryId', { timeEntryId });
      }

      const logs = await query.getMany();
      console.log('Found audit logs:', logs);

      res.json({
        status: 'success',
        data: logs
      });
      return;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      next(error);
      return;
    }
  }) as RequestHandler
);

export default router; 
