import { Router, Request, Response, NextFunction } from 'express';
import { RequestHandler } from 'express-serve-static-core';
import { AuthController } from '../controllers/authController';
import { AuthService } from '../services/authService';
import { validateRequest } from '../../middleware/validateRequest';
import { loginSchema, registerSchema } from '../validators/authValidators';
import { z } from 'zod';
import { ApiError } from '../../middleware/errorHandler';
import { Employee } from '../../entities/Employee';
import AppDataSource from '../../db/connection';
import { hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { sendPasswordResetEmail } from '../services/emailService';
import rateLimit from 'express-rate-limit';
import { PasswordValidationService } from '../services/passwordValidationService';
import { PasswordHistoryService } from '../services/passwordHistoryService';
import { AuthAuditService } from '../services/auditService';
import { AuditAction } from '../../entities/AuditLog';
import { MoreThanOrEqual } from 'typeorm';
import { verify } from 'jsonwebtoken';
import { validateBulkAction, validatePagination } from '../../middleware/validateRequest';

const router = Router();
const authService = new AuthService();
const authController = new AuthController(authService);

router.post('/register', 
  validateRequest(registerSchema),
  authController.register
);

router.post('/login',
  validateBulkAction,
  authController.login
);

// Rate limiter for password reset requests
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: 'Too many password reset attempts, please try again after 15 minutes'
});

// Schema for forgot password request
const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address')
  })
});

// Schema for password reset
const resetPasswordSchema = z.object({
  body: z.object({
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password cannot be longer than 128 characters')
      .refine((password) => {
        const validation = PasswordValidationService.validate(password);
        if (!validation.isValid) {
          throw new Error(validation.errors.join('. '));
        }
        return true;
      }, {
        message: 'Password does not meet complexity requirements'
      })
  })
});

// Forgot password endpoint
router.post(
  '/forgot-password',
  resetLimiter,
  validateRequest(forgotPasswordSchema),
  (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      const employeeRepo = AppDataSource.getRepository(Employee);

      // Find employee by email
      const employee = await employeeRepo.findOne({ where: { email } });

      // Don't reveal if user exists or not
      if (!employee) {
        res.json({ 
          status: 'success',
          message: 'If an account exists with this email, you will receive password reset instructions.'
        });
        return;
      }

      // Generate reset token
      const resetToken = sign(
        { id: employee.id },
        process.env.JWT_SECRET + employee.password_hash, // Use password hash as part of secret
        { expiresIn: '1h' }
      );

      // Store hashed token and expiry in database
      employee.reset_token = await hash(resetToken, 10);
      employee.reset_token_expires = new Date(Date.now() + 3600000); // 1 hour
      await employeeRepo.save(employee);

      // Send reset email
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      await sendPasswordResetEmail(employee.email, resetUrl);

      res.json({
        status: 'success',
        message: 'Password reset instructions sent to your email'
      });
    } catch (error) {
      next(error);
      return;
    }
  }) as RequestHandler
);

// Verify reset token
router.get(
  '/verify-reset-token/:token',
  async (req, res, next) => {
    try {
      const { token } = req.params;
      const employeeRepo = AppDataSource.getRepository(Employee);

      // Find employee with non-expired reset token
      const employee = await employeeRepo.findOne({
        where: {
          reset_token_expires: MoreThanOrEqual(new Date())
        }
      });

      if (!employee) {
        throw new ApiError('Invalid or expired reset token', 400);
      }

      // Verify token
      try {
        verify(token, process.env.JWT_SECRET + employee.password_hash);
      } catch {
        throw new ApiError('Invalid or expired reset token', 400);
      }

      res.json({ status: 'success' });
    } catch (error) {
      next(error);
    }
  }
);

// Reset password
router.post(
  '/reset-password/:token',
  validateRequest(resetPasswordSchema),
  async (req, res, next) => {
    let employee: Employee | null = null;
    try {
      const { token } = req.params;
      const { password } = req.body;

      // Validate password strength
      const validation = PasswordValidationService.validate(password);
      if (!validation.isValid) {
        throw new ApiError('Invalid password: ' + validation.errors.join('. '), 400);
      }

      // If password is weak but valid, warn the user
      if (validation.strength === 'weak') {
        console.warn(`Weak password set for reset request. Score: ${validation.score}`);
      }

      const employeeRepo = AppDataSource.getRepository(Employee);

      // Find employee with non-expired reset token
      employee = await employeeRepo.findOne({
        where: {
          reset_token_expires: MoreThanOrEqual(new Date())
        }
      });

      if (!employee) {
        throw new ApiError('Invalid or expired reset token', 400);
      }

      // Verify token
      try {
        verify(token, process.env.JWT_SECRET + employee.password_hash);
      } catch {
        throw new ApiError('Invalid or expired reset token', 400);
      }

      // Check if password was recently used
      const isReused = await PasswordHistoryService.isPasswordReused(
        employee.id,
        password
      );

      if (isReused) {
        throw new ApiError(
          'This password has been used recently. Please choose a different password.',
          400
        );
      }

      // Update password
      const newPasswordHash = await hash(password, 10);
      employee.password_hash = newPasswordHash;
      employee.reset_token = null;
      employee.reset_token_expires = null;
      await employeeRepo.save(employee);

      // Add to password history
      await PasswordHistoryService.addToHistory(
        employee.id,
        newPasswordHash
      );

      // Log the password reset
      await AuthAuditService.log(
        employee,
        AuditAction.PASSWORD_RESET,
        {
          method: 'reset-token',
          passwordStrength: validation.strength,
          wasReused: false
        },
        req
      );

      res.json({
        status: 'success',
        message: 'Password has been reset successfully',
        passwordStrength: validation.strength
      });
    } catch (error) {
      // Log failed attempts
      if (error instanceof ApiError && employee) {
        await AuthAuditService.log(
          employee,
          AuditAction.FAILED_PASSWORD_ATTEMPT,
          {
            method: 'reset-token',
            error: error.message
          },
          req
        );
      }
      next(error);
    }
  }
);

export default router; 
