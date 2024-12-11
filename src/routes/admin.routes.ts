import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { UserRole } from '../auth/roles/roles';
import { validateRequest } from '../middleware/validateRequest';
import { z } from 'zod';
import AppDataSource from '../db/connection';
import { Employee } from '../entities/Employee';
import { ApiError } from '../middleware/errorHandler';

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
  requireRole(UserRole.MANAGER), 
  async (req, res) => {
    const employeeRepo = AppDataSource.getRepository(Employee);
    const employees = await employeeRepo.find();
    res.json(employees.map(emp => {
      const { password_hash, ...rest } = emp;
      return rest;
    }));
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

export default router; 