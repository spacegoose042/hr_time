import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { z } from 'zod';
import AppDataSource from '../db/connection';
import { TimeEntry } from '../entities/TimeEntry';
import { Employee } from '../entities/Employee';
import { ApiError } from '../middleware/errorHandler';
import { IsNull } from 'typeorm';

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

// Clock in
router.post('/clock-in',
  requireAuth,
  validateRequest(clockInSchema),
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

      if (openEntry) {
        throw new ApiError('You already have an open time entry', 400);
      }

      const timeEntry = timeEntryRepo.create({
        employee,
        clock_in: new Date(),
        notes: req.body.notes
      });

      await timeEntryRepo.save(timeEntry);
      res.status(201).json(timeEntry);
    } catch (error) {
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

export default router; 