import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from './errorHandler';

export const validateRequest = (schema: AnyZodObject) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ApiError('Validation failed', 400, error.errors));
      } else {
        next(new ApiError('Invalid request', 400));
      }
    }
  };

export const validateBulkAction = (req: Request, res: Response, next: NextFunction) => {
  const { action, entryIds } = req.body;

  if (!action || !['approve', 'reject', 'delete'].includes(action)) {
    throw new ApiError('Invalid action specified', 400);
  }

  if (!Array.isArray(entryIds) || !entryIds.length) {
    throw new ApiError('No entries specified', 400);
  }

  next();
};

export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const page = Number(req.query.page);
  const limit = Number(req.query.limit);

  if (page && (isNaN(page) || page < 1)) {
    throw new ApiError('Invalid page number', 400);
  }

  if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
    throw new ApiError('Invalid limit value', 400);
  }

  next();
}; 